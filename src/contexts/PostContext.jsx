import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { postsAPI } from '../services/api.jsx';
import { adminAPI } from '../services/adminAPI.jsx';
import { extractMentionsFromText, processCommentData } from '../utils/htmlUtils';

const PostContext = createContext();

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};

export const PostProvider = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // Disabled by default
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastLoadUser, setLastLoadUser] = useState(null);
  const [isDashboardManaged, setIsDashboardManaged] = useState(false); // Track if Dashboard is managing posts
  const [userReactions, setUserReactions] = useState(() => {
    // Load user reactions from localStorage on initialization
    try {
      const stored = localStorage.getItem('userReactions');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      
      return {};
    }
  }); // Track user's reactions locally
  const [tags] = useState([
    'Announcements',
    'Achievements',
    'General Discussion',
    'Policy Updates',
    'Ideas & Suggestions',
    'Training Materials'
  ]);

  // Helper function to normalize reactions from various backend formats to frontend object format
  const normalizeReactions = (reactionsArray) => {
    try {
      if (!Array.isArray(reactionsArray)) {
        // If it's already an object, validate and return
        if (reactionsArray && typeof reactionsArray === 'object') {
          const validatedReactions = {};
          Object.entries(reactionsArray).forEach(([type, reaction]) => {
            if (reaction && typeof reaction === 'object') {
              validatedReactions[type] = {
                users: Array.isArray(reaction.users) ? reaction.users : [],
                count: typeof reaction.count === 'number' ? reaction.count : 0
              };
            }
          });
          return validatedReactions;
        }
        return {};
      }
      
      if (reactionsArray.length === 0) {
        return {};
      }
      
      const reactionsObject = {};
      
      // Group reactions by type
      reactionsArray.forEach((reaction, index) => {
        try {
          const reactionType = reaction.reaction_type;
          const userId = reaction.user_id;
          
          if (!reactionType || !userId) {
            console.warn(`⚠️ Invalid reaction at index ${index}:`, reaction);
            return;
          }

          if (!reactionsObject[reactionType]) {
            reactionsObject[reactionType] = {
              users: [],
              count: 0
            };
          }
          
          // Add user if not already in the list
          if (!reactionsObject[reactionType].users.includes(userId)) {
            reactionsObject[reactionType].users.push(userId);
            reactionsObject[reactionType].count++;
          }
        } catch (error) {
          console.warn(`⚠️ Error processing reaction at index ${index}:`, error);
        }
      });

      return reactionsObject;
    } catch (error) {
      console.warn('⚠️ Error in normalizeReactions:', error);
      return {};
    }
  };

  // Helper function to normalize reaction_counts format to frontend object format
  const normalizeReactionCounts = (reactionCounts) => {
    try {
      if (!reactionCounts || typeof reactionCounts !== 'object') {
        return {};
      }
      
      const reactionsObject = {};
      
      // Convert reaction_counts format (e.g., {like: 1, love: 2}) to frontend format
      Object.entries(reactionCounts).forEach(([reactionType, count]) => {
        if (typeof count === 'number' && count > 0) {
          reactionsObject[reactionType] = {
            users: [], // We don't have user list in reaction_counts format, will be populated from other sources
            count: count
          };
        }
      });
      
      return reactionsObject;
    } catch (error) {
      console.warn('⚠️ Error in normalizeReactionCounts:', error);
      return {};
    }
  };

  // Normalize post data to ensure consistent format
  const normalizePost = (rawPost) => {
    let normalizedReactions = {};
    
    try {
      // Handle new reaction_counts format first (takes priority)
      if (rawPost.reaction_counts && typeof rawPost.reaction_counts === 'object') {
        normalizedReactions = normalizeReactionCounts(rawPost.reaction_counts);
      } 
      // Fallback to old reactions array format
      else if (rawPost.reactions) {
        if (Array.isArray(rawPost.reactions)) {
          normalizedReactions = normalizeReactions(rawPost.reactions);
        } else if (typeof rawPost.reactions === 'object') {
          // Validate existing object format
          Object.entries(rawPost.reactions).forEach(([type, reaction]) => {
            if (reaction && typeof reaction === 'object') {
              normalizedReactions[type] = {
                users: Array.isArray(reaction.users) ? reaction.users : [],
                count: typeof reaction.count === 'number' ? reaction.count : 0
              };
            }
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error normalizing post reactions:', error);
      normalizedReactions = {};
    }
    
    // Extract author information from backend format with better fallbacks
    const authorName = rawPost.author?.username || 
                      rawPost.author?.name || 
                      rawPost.author?.employee_name || 
                      rawPost.authorName || 
                      rawPost.author_name || 
                      user?.name || 
                      (user?.is_admin ? 'Admin' : 'Employee User');
    const authorAvatar = rawPost.author?.profile_picture_link || rawPost.profile_picture_link || rawPost.profile_picture_link;
    
    // Normalize comments to handle backend format
    const normalizedComments = rawPost.comments?.map(comment => {
      const commentAuthorName = comment.author?.username || 
                               comment.author?.name || 
                               comment.author?.employee_name || 
                               comment.authorName || 
                               user?.name || 
                               (user?.is_admin ? 'Admin' : 'Employee User');
      const commentAuthorAvatar = comment.author?.avatar || comment.authorAvatar || 
                                 'https://ui-avatars.com/api/?name=' + encodeURIComponent(commentAuthorName) + '&background=random';
      
      return {
        ...comment,
        id: comment.comment_id || comment.id, // Use comment_id as the primary id
        comment_id: comment.comment_id || comment.id, // Keep the backend comment_id
        authorName: commentAuthorName,
        authorAvatar: commentAuthorAvatar,
        timestamp: comment.created_at || comment.timestamp,
        content: comment.content,
        reactions: (() => {
          // Normalize comment reactions from array to object format with better error handling
          try {
            if (Array.isArray(comment.reactions)) {
              const reactionsObj = {};
              comment.reactions.forEach(reaction => {
                const type = reaction.reaction_type || reaction.type;
                const userId = reaction.user_id || reaction.userId || reaction.employee_id;
                
                if (type && userId) {
                  if (!reactionsObj[type]) {
                    reactionsObj[type] = { users: [], count: 0 };
                  }
                  if (!reactionsObj[type].users.includes(userId)) {
                    reactionsObj[type].users.push(userId);
                    reactionsObj[type].count++;
                  }
                }
              });
              return reactionsObj;
            } else if (comment.reactions && typeof comment.reactions === 'object' && comment.reactions !== null) {
              // Validate object format reactions
              const validatedReactions = {};
              Object.entries(comment.reactions).forEach(([type, reaction]) => {
                if (reaction && typeof reaction === 'object') {
                  validatedReactions[type] = {
                    users: Array.isArray(reaction.users) ? reaction.users : [],
                    count: typeof reaction.count === 'number' ? reaction.count : 0
                  };
                }
              });
              return validatedReactions;
            } else {
              return {};
            }
          } catch (error) {
            console.warn('⚠️ Error normalizing comment reactions:', error);
            return {};
          }
        })(),
        replies: (comment.replies || []).map(reply => ({
          ...reply,
          // Normalize reply reactions the same way as comment reactions
          reactions: (() => {
            try {
              if (Array.isArray(reply.reactions)) {
                const reactionsObj = {};
                reply.reactions.forEach(reaction => {
                  const type = reaction.reaction_type || reaction.type;
                  const userId = reaction.user_id || reaction.userId || reaction.employee_id;
                  
                  if (type && userId) {
                    if (!reactionsObj[type]) {
                      reactionsObj[type] = { users: [], count: 0 };
                    }
                    if (!reactionsObj[type].users.includes(userId)) {
                      reactionsObj[type].users.push(userId);
                      reactionsObj[type].count++;
                    }
                  }
                });
                return reactionsObj;
              } else if (reply.reactions && typeof reply.reactions === 'object' && reply.reactions !== null) {
                // Validate object format reactions
                const validatedReactions = {};
                Object.entries(reply.reactions).forEach(([type, reaction]) => {
                  if (reaction && typeof reaction === 'object') {
                    validatedReactions[type] = {
                      users: Array.isArray(reaction.users) ? reaction.users : [],
                      count: typeof reaction.count === 'number' ? reaction.count : 0
                    };
                  }
                });
                return validatedReactions;
              } else {
                return {};
              }
            } catch (error) {
              console.warn('⚠️ Error normalizing reply reactions:', error);
              return {};
            }
          })()
        }))
      };
    }) || [];

    const normalized = {
      ...rawPost,
      // Ensure consistent post ID fields
      id: rawPost.post_id || rawPost.id,
      post_id: rawPost.post_id || rawPost.id,
      // Ensure consistent author name fields
      authorName: authorName,
      author_name: authorName,
      username: authorName,
      // Ensure consistent author avatar fields
      authorAvatar: authorAvatar,
      author_avatar: authorAvatar,
      avatar: authorAvatar,
      // Ensure consistent author position fields
      authorPosition: rawPost.author?.position || 
                     rawPost.author?.job_title || 
                     rawPost.authorPosition || 
                     rawPost.author_position || 
                     user?.position || 
                     user?.job_title || 
                     (user?.is_admin ? 'Administrator' : 'Employee'),
      // Normalize reactions
      reactions: normalizedReactions || {},
      likes: rawPost.likes || [],
      // Normalize comments
      comments: normalizedComments,
      // Preserve important post fields
      is_pinned: rawPost.is_pinned || false,
      is_comments_allowed: rawPost.is_comments_allowed !== false && rawPost.is_comments_allowed !== "false",
      is_broadcast: rawPost.is_broadcast || false,
      // Convert media array back to separate arrays for frontend compatibility
      ...(rawPost.media && Array.isArray(rawPost.media) ? (() => {
        const mediaArrays = { images: [], videos: [], documents: [], links: [] };
        rawPost.media.forEach((mediaItem, index) => {
          if (mediaItem && mediaItem.link) {
            let url = mediaItem.link;
            
            // Handle case where URL might be stringified object
            if (typeof url === 'string' && url.trim().startsWith("{'link'")) {
              try {
                const fixed = url.replace(/'/g, '"');
                const parsed = JSON.parse(fixed);
                url = parsed.link || url;
              } catch (e) {
                console.warn('🔍 Could not parse stringified URL object:', url);
              }
            }
            
            // Create a proper media object with id for removal functionality
            // Extract filename from URL and clean up CDN prefixes
            let fileName = url.split('/').pop() || 'Media file';
            
            // Clean up CDN prefixes like "wal-GKde7DuB0ojK-" from filename
            if (fileName.includes('-') && fileName.match(/^wal-[A-Za-z0-9]+-/)) {
              // Remove the CDN prefix pattern: wal-[random_string]-
              fileName = fileName.replace(/^wal-[A-Za-z0-9]+-/, '');
            }
            
            const mediaObj = {
              id: `media-${index}-${Date.now()}`,
              url: url,
              name: fileName,
              type: mediaItem.type || 'unknown'
            };
            
            // Simplified image detection - just check for common image extensions
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(url) ||
                           url.includes('cdn.gofloww.co') && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i.test(url);
                           
            const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)(\?.*)?$/i.test(url);
                           
            const isDocument = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)(\?.*)?$/i.test(url);
            
            if (isImage) {
              mediaArrays.images.push(mediaObj);
            } else if (isVideo) {
              mediaArrays.videos.push(mediaObj);
            } else if (isDocument) {
              mediaObj.isPDF = /\.pdf(\?.*)?$/i.test(url);
              mediaArrays.documents.push(mediaObj);
            } else {
              // Only add to links if it's not categorized as image, video, or document
              // This prevents duplicates
              mediaArrays.links.push(mediaObj);
            }
          }
        });
        
        return mediaArrays;
      })() : {
        // Keep existing arrays if no media array
        images: rawPost.images || [],
        videos: rawPost.videos || [],
        documents: rawPost.documents || [],
        links: rawPost.links || []
      })
    };
  
    return normalized;
  };

  // Helper function to check if current user has reacted to a post
  const hasUserReacted = (postId, reactionType) => {
    const postReactions = userReactions[postId];
    if (postReactions && postReactions[reactionType]) {
      return true;
    }
    return false;
  };

  // Helper function to add user reaction to local state
  const addUserReaction = (postId, reactionType) => {
    setUserReactions(prev => {
      const updated = {
        ...prev,
        [postId]: {
          ...prev[postId],
          [reactionType]: true
        }
      };
      
      // Persist to localStorage
      try {
        localStorage.setItem('userReactions', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save user reactions to localStorage:', error);
      }
      
      return updated;
    });
  };

  // Helper function to remove user reaction from local state
  const removeUserReaction = (postId, reactionType) => {
    setUserReactions(prev => {
      const updated = { ...prev };
      if (updated[postId]) {
        delete updated[postId][reactionType];
        // Clean up empty post entry
        if (Object.keys(updated[postId]).length === 0) {
          delete updated[postId];
        }
      }
      
      // Persist to localStorage
      try {
        localStorage.setItem('userReactions', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save user reactions to localStorage:', error);
      }
      
      return updated;
    });
  };

  // Helper functions for comment reactions
  const hasUserReactedToComment = (commentId, reactionType) => {
    const commentKey = `comment_${commentId}`;
    const commentReactions = userReactions[commentKey];
    if (commentReactions && commentReactions[reactionType]) {
      return true;
    }
    return false;
  };

  const addUserCommentReaction = (commentId, reactionType) => {
    const commentKey = `comment_${commentId}`;
    setUserReactions(prev => {
      const updated = {
        ...prev,
        [commentKey]: {
          ...prev[commentKey],
          [reactionType]: true
        }
      };
      
      // Persist to localStorage
      try {
        localStorage.setItem('userReactions', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save user reactions to localStorage:', error);
      }
      
      return updated;
    });
  };

  const removeUserCommentReaction = (commentId, reactionType) => {
    const commentKey = `comment_${commentId}`;
    setUserReactions(prev => {
      const updated = { ...prev };
      if (updated[commentKey]) {
        delete updated[commentKey][reactionType];
        // Clean up empty comment entry
        if (Object.keys(updated[commentKey]).length === 0) {
          delete updated[commentKey];
        }
      }
      
      // Persist to localStorage
      try {
        localStorage.setItem('userReactions', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save user reactions to localStorage:', error);
      }
      
      return updated;
    });
  };

  // Sync user reactions from posts data when available
  useEffect(() => {
    if (!user) return;
    
    posts.forEach(post => {
      const postId = post.post_id || post.id;
      if (!postId) return;
      
      // Since we're using token-based auth, we can't easily track user reactions
      // without userId. This functionality can be added later if needed.
    });
  }, [posts, user]);

  // Load posts from backend API on mount
  useEffect(() => {
    const loadPosts = async () => {
      // Prevent multiple loads for the same user or if already loading
      // Also prevent if Dashboard is managing posts
      if (!user || loading || isDashboardManaged || (isInitialized && lastLoadUser === user?.employee_id)) {
        return;
      }

      if (!user) {
        setPosts([]);
        setNextCursor(null);
        setHasMorePosts(true);
        setLoading(false);
        setIsInitialized(true);
        return;
      }
      
      // Admin users don't have personal posts, skip loading
      if (user?.is_admin) {
        setPosts([]);
        setNextCursor(null);
        setHasMorePosts(true);
        setLoading(false);
        setIsInitialized(true);
        setLastLoadUser(user?.employee_id);
        return;
      }
      
      try {
        setLoading(true);
        
        const backendPosts = await postsAPI.getMyPosts();
        
        let postsData = [];

        // Check the new nested structure (same as loadAllPosts)
        if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
          postsData = backendPosts.data.posts;
        } else if (Array.isArray(backendPosts.data)) {
          // Fallback to old structure if present
          postsData = backendPosts.data;
        } else {
          postsData = [];
        }

        // Normalize all posts to ensure consistent format
        const normalizedPosts = postsData.map(post => {
          const normalized = normalizePost(post);
          return normalized;
        });
        
        setPosts(normalizedPosts);
        // Reset pagination state
        setNextCursor(null);
        setHasMorePosts(true);
        setIsInitialized(true);
        setLastLoadUser(user?.employee_id);
      } catch (error) {
        console.error('❌ PostContext - Failed to load user posts from backend:', error.message);
        setPosts([]);
        setNextCursor(null);
        setHasMorePosts(false);
        setIsInitialized(true);
        setLastLoadUser(user?.employee_id);
      } finally {
        setLoading(false);
      }
    };

    // Call the loadPosts function
    if (!isInitialized || lastLoadUser !== user?.employee_id) {
      loadPosts();
    }
  }, [user?.employee_id, isInitialized, lastLoadUser, isDashboardManaged]);

  // Auto-refresh reactions every 60 seconds (reduced frequency)
  useEffect(() => {
    if (!autoRefreshEnabled || !user || posts.length === 0) return;

    const intervalId = setInterval(() => {
      refreshReactions();
    }, 60000); // 60 seconds instead of 30

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, user?.employee_id]); // Removed posts.length dependency

  // Standalone function to reload posts (can be called after edit/delete)
  const reloadPosts = async () => {
    // Admin users don't have personal posts, skip reloading
    if (user?.is_admin) {
      setPosts([]);
      return;
    }
    
    // If Dashboard is managing posts, use loadAllPosts instead
    if (isDashboardManaged) {
      return loadAllPosts(true);
    }
    
    try {
      const backendPosts = await postsAPI.getMyPosts();
      let postsData = [];

      // Check the new nested structure (same as loadAllPosts)
      if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
        postsData = backendPosts.data.posts;
      } else if (Array.isArray(backendPosts.data)) {
        // Fallback to old structure if present
        postsData = backendPosts.data;
      } else {
        postsData = [];
      }
        
      // Normalize all posts to ensure consistent format
      const normalizedPosts = postsData.map(normalizePost);
      setPosts(normalizedPosts);
    } catch (error) {
      console.error('❌ Failed to reload user posts from backend:', error.message);
      setPosts([]);
    }
  };

  // Function to load all posts for home feed with pagination support
  const loadAllPosts = async (resetPagination = false) => {
    try {
      setLoading(true);
      setIsDashboardManaged(true); // Mark as being managed by Dashboard
      const cursor = resetPagination ? null : nextCursor;
    
      let pinnedPosts = [];
      
      // Load pinned posts first on initial load (sequential loading for better UX)
      if (resetPagination) {
        try {
          const pinnedPostsResponse = user?.is_admin 
            ? await adminAPI.getPinnedPosts() 
            : await postsAPI.getPinnedPosts();
          
          // Process pinned posts with different response structures
          let pinnedPostsData = [];
          if (pinnedPostsResponse.data && Array.isArray(pinnedPostsResponse.data)) {
            pinnedPostsData = pinnedPostsResponse.data;
          } else if (pinnedPostsResponse.posts && Array.isArray(pinnedPostsResponse.posts)) {
            pinnedPostsData = pinnedPostsResponse.posts;
          } else if (Array.isArray(pinnedPostsResponse)) {
            pinnedPostsData = pinnedPostsResponse;
          }
          
          pinnedPosts = pinnedPostsData.map(post => ({
            ...post,
            is_pinned: true
          }));
          
        } catch (pinnedError) {

          pinnedPosts = [];
        }
      }
      
      // Then load regular posts
      const backendPosts = user?.is_admin 
        ? await adminAPI.getAllPosts(cursor)
        : await postsAPI.getPosts(1, 10, cursor);
    
      
      // Process regular posts
      let postsData = [];
      if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
        postsData = backendPosts.data.posts;
      } else if (Array.isArray(backendPosts.data)) {
        postsData = backendPosts.data;
      } else if (Array.isArray(backendPosts.posts)) {
        postsData = backendPosts.posts;
      } else {
      
        postsData = [];
      }

      // Combine and deduplicate posts
      let allPosts = [];
      if (resetPagination) {
        // For initial load, combine pinned and regular posts, removing duplicates
        const pinnedPostIds = new Set(pinnedPosts.map(p => p.post_id));
        const regularPostsFiltered = postsData.filter(p => !pinnedPostIds.has(p.post_id));
        allPosts = [...pinnedPosts, ...regularPostsFiltered];
    
      } else {
        // For pagination, just add new regular posts
        allPosts = postsData;
      }

      // Update pagination state
      const newNextCursor = backendPosts.data?.nextCursor || backendPosts.data?.lastPostId || 
                           backendPosts.nextCursor || backendPosts.lastPostId || null;
      setNextCursor(newNextCursor);
      
      const hasMore = newNextCursor !== null && allPosts.length > 0;
      setHasMorePosts(hasMore);

      // Normalize and set posts
      const normalizedPosts = allPosts.map(normalizePost);
      
      // Additional deduplication check
      const seenPostIds = new Set();
      const uniqueNormalizedPosts = normalizedPosts.filter(post => {
        const postId = post.post_id || post.id;
        if (seenPostIds.has(postId)) {
          return false;
        }
        seenPostIds.add(postId);
        return true;
      });
      
      if (resetPagination) {
        setPosts(uniqueNormalizedPosts);
      } else {
        // Append new posts for pagination
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p.post_id || p.id));
          const newUniquePosts = uniqueNormalizedPosts.filter(p => !existingIds.has(p.post_id || p.id));
          return [...prevPosts, ...newUniquePosts];
        });
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      setHasMorePosts(false);
    } finally {
      setLoading(false);
    }
  };

  // Function to load more posts (pagination)
  const loadMorePosts = async () => {
    if (!hasMorePosts || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await loadAllPosts(false); // Don't reset pagination
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Function to refresh reactions for all posts in real-time
  const refreshReactions = async () => {
    if (!autoRefreshEnabled || posts.length === 0) return;

    try {
      // Get updated posts data using appropriate API based on user type
      const backendPosts = user?.is_admin 
        ? await adminAPI.getAllPosts()
        : await postsAPI.getPosts(1, 10);
        
      let postsData = [];

      if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
        postsData = backendPosts.data.posts;
      } else if (Array.isArray(backendPosts.data)) {
        postsData = backendPosts.data;
      } else if (Array.isArray(backendPosts.posts)) {
        // Handle adminAPI response structure
        postsData = backendPosts.posts;
      }

      if (postsData.length === 0) return;

      // Update only reactions and comments for existing posts
      setPosts(prevPosts => {
        return prevPosts.map(prevPost => {
          const updatedPost = postsData.find(p => 
            (p.post_id === prevPost.post_id) || (p.id === prevPost.id)
          );
          
          if (updatedPost) {
            // Only update reaction-related fields to avoid overwriting user interactions
            return {
              ...prevPost,
              reactions: updatedPost.reaction_counts || updatedPost.reactions || prevPost.reactions,
              reaction_counts: updatedPost.reaction_counts || prevPost.reaction_counts,
              comments: updatedPost.comments || prevPost.comments
            };
          }
          
          return prevPost;
        });
      });

      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('❌ Failed to refresh reactions:', error.message);
    }
  };

  // Function to refresh reactions for a specific post only
  const refreshSpecificPostReactions = async (postId) => {
    try {
      // Get the specific post data
      const postData = await postsAPI.getPostById(postId);
      
      if (postData && postData.data) {
        const updatedPost = postData.data;
        
        // Update only the specific post
        setPosts(prevPosts => {
          return prevPosts.map(prevPost => {
            if ((prevPost.post_id || prevPost.id) === postId) {
              // Normalize the updated post data properly
              const normalizedUpdatedPost = normalizePost(updatedPost);
              
              return {
                ...prevPost,
                reactions: normalizedUpdatedPost.reaction_counts || normalizedUpdatedPost.reactions || prevPost.reactions,
                reaction_counts: normalizedUpdatedPost.reaction_counts || prevPost.reaction_counts,
                comments: normalizedUpdatedPost.comments || prevPost.comments
              };
            }
            return prevPost;
          });
        });
      }
    } catch (error) {
      console.error('❌ Failed to refresh specific post reactions:', error.message);
      // Fallback to full refresh if specific post fetch fails
      await refreshReactions();
    }
  };

  const createPost = async (postData) => {
    if (!user) {
      console.error('No authenticated user found. Cannot create post.');
      throw new Error('You must be logged in to create a post');
    }

    // Use token-based authentication - backend will handle user identification
    const authorName = user?.name || user?.username || (user?.is_admin ? 'Admin' : 'Employee User');
    const authorAvatar = user?.profile_picture_link || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

    try {
      // Optimistically create the post object first for immediate UI update
      const tempId = `temp-${Date.now()}`;
      const optimisticPost = {
        id: tempId,
        post_id: tempId,
        authorName: authorName,
        authorAvatar: authorAvatar,
        authorPosition: user?.position || user?.job_title || (user?.is_admin ? 'Administrator' : 'Employee'),
        content: postData.content,
        images: postData.images || [],
        videos: postData.videos || [],
        documents: postData.documents || [],
        links: postData.links || [],
        tags: postData.tags || [],
        mentions: postData.mentions || [],
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
        reactions: {},
        is_pinned: false,
        is_comments_allowed: true,
        is_broadcast: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOptimistic: true // Flag to identify optimistic updates
      };

      // Add optimistic post to UI immediately
      setPosts(prevPosts => [optimisticPost, ...prevPosts]);

      // Call backend API - combine all media into one array with proper format
      const allMedia = [
        // Images as media objects
        ...(postData.images || []).filter(img => img && (img.url || typeof img === 'string')).map(img => ({ 
          link: typeof img === 'string' ? img : img.url 
        })),
        // Videos as media objects  
        ...(postData.videos || []).filter(vid => vid && (vid.url || typeof vid === 'string')).map(vid => ({ 
          link: typeof vid === 'string' ? vid : vid.url 
        })),
        // Documents as media objects
        ...(postData.documents || []).filter(doc => doc && (doc.url || typeof doc === 'string')).map(doc => ({ 
          link: typeof doc === 'string' ? doc : doc.url 
        })),
        // Links as media objects - handle both string URLs and objects with url property
        ...(postData.links || []).filter(link => link && (typeof link === 'string' || link.url)).map(link => ({ 
          link: typeof link === 'string' ? link : link.url 
        }))
      ];

      const backendResult = await postsAPI.createPost({
        content: postData.content,
        media: allMedia,
        mentions: postData.mentions || [],
        tags: postData.tags || []
      });
      
      // Create final post object with backend data - process media array from backend
      const processMediaFromBackend = (mediaArray) => {
        const mediaArrays = { images: [], videos: [], documents: [], links: [] };
        
        (mediaArray || []).forEach(item => {
          let actualUrl = item;
          if (typeof item === 'object' && item.link) {
            actualUrl = item.link;
          }
          
          // Decode URL to handle encoded characters
          const decodedUrl = decodeURIComponent(actualUrl);
          
          // Categorize by file extension
          if (decodedUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i)) {
            mediaArrays.images.push({ url: actualUrl, name: 'Image' });
          } else if (decodedUrl.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)) {
            mediaArrays.videos.push({ url: actualUrl, name: 'Video' });
          } else if (decodedUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) {
            mediaArrays.documents.push({ url: actualUrl, name: 'Document', isPDF: decodedUrl.match(/\.pdf$/i) });
          } else {
            mediaArrays.links.push({ url: actualUrl, title: actualUrl });
          }
        });
        
        return mediaArrays;
      };

      const processedMedia = processMediaFromBackend(backendResult.media);
      
      const finalPost = {
        id: backendResult.post_id || backendResult.id || tempId,
        post_id: backendResult.post_id || tempId,
        author: backendResult.author || authorName,
        authorName: backendResult.author || authorName,
        authorAvatar: authorAvatar,
        authorPosition: user?.position || user?.job_title || (user?.is_admin ? 'Administrator' : 'Employee'),
        content: postData.content,
        images: processedMedia.images,
        videos: processedMedia.videos,
        documents: processedMedia.documents,
        links: processedMedia.links,
        tags: postData.tags || [],
        mentions: postData.mentions || [],
        timestamp: backendResult.created_at || new Date().toISOString(),
        likes: [],
        comments: [],
        reactions: {},
        is_pinned: false,
        is_comments_allowed: true,
        is_broadcast: false,
        created_at: backendResult.created_at || new Date().toISOString(),
        updated_at: backendResult.updated_at || new Date().toISOString()
      };

      // Replace optimistic post with real post data
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === tempId ? finalPost : post
        )
      );

      return finalPost;

    } catch (error) {
      console.error('❌ Post creation failed:', error.message);
      
      // Remove optimistic post if backend call failed
      setPosts(prevPosts => 
        prevPosts.filter(post => !post.isOptimistic || post.id !== tempId)
      );
      
      throw new Error('Failed to create post: ' + error.message);
    }
  };

  const editPost = async (postId, updatedData) => {
    if (!user) return;

    try {
      const postToUpdate = posts.find(p => (p.id === postId || p.post_id === postId));
      if (!postToUpdate) {
        throw new Error('Post not found');
      }

      // Optimistically update the UI immediately
      const optimisticUpdate = {
        ...postToUpdate,
        ...updatedData,
        updated_at: new Date().toISOString(),
        isUpdating: true // Flag to show updating state
      };

      setPosts(prevPosts => 
        prevPosts.map(post => 
          (post.id === postId || post.post_id === postId) ? optimisticUpdate : post
        )
      );

      // Call the API to update the post - use the correct post ID
      const actualPostId = postToUpdate.post_id || postToUpdate.id;
      const apiResponse = await postsAPI.updatePost(actualPostId, updatedData);
      
      // Update with final data from backend
      const finalUpdate = {
        ...optimisticUpdate,
        ...apiResponse,
        isUpdating: false
      };

      setPosts(prevPosts => 
        prevPosts.map(post => 
          (post.id === postId || post.post_id === postId) ? finalUpdate : post
        )
      );
      
    } catch (error) {
      console.error('❌ Edit post error:', error);
      
      // Revert optimistic update if API call failed
      setPosts(prevPosts => 
        prevPosts.map(post => 
          (post.id === postId || post.post_id === postId) 
            ? { ...post, isUpdating: false }
            : post
        )
      );
      
      throw error;
    }
  };

  const deletePost = async (postId) => {
    if (!user) return;

    try {
      // Optimistically remove from UI immediately
      const postToDelete = posts.find(p => (p.id === postId || p.post_id === postId));
      setPosts(prevPosts => prevPosts.filter(post => 
        post.id !== postId && post.post_id !== postId
      ));

      // Call the API to delete the post
      await postsAPI.deletePost(postId);
      
    } catch (error) {
      console.error('❌ Delete post failed:', error.message);
      
      // Restore the post if deletion failed
      if (postToDelete) {
        setPosts(prevPosts => [postToDelete, ...prevPosts]);
      }
      
      throw error;
    }
  };

  // NOTE: likePost function removed - likes now handled through addReaction system
  // with proper toggle behavior using add/remove reaction API endpoints

  const addComment = async (postId, commentData) => {

    if (!user) {
      console.error('❌ No user found for adding comment - user object is:', user);
      // Instead of throwing an error, let's wait for the user to load
      console.warn('⚠️ User not loaded yet, please try again');
      return;
    }

    try {

      
      // Process comment data to extract mentions
      const processedData = typeof commentData === 'string' 
        ? {
            content: commentData,
            mentions: extractMentionsFromText(commentData)
          }
        : {
            ...commentData,
            mentions: commentData.mentions || extractMentionsFromText(commentData.content || '')
          };
      
      console.log('🔍 PostContext addComment input:', commentData);
      console.log('🔍 PostContext processedData:', processedData);
      
      // Call the API to add comment
      const result = await postsAPI.addComment(postId, processedData);

      // Optimistically update the UI
      const newComment = {
        id: result.comment_id || result.id || uuidv4(),
        comment_id: result.comment_id || result.id, // Store the backend comment_id
        author: {
          username: result.author?.username || result.author || user.username || user.name,
          employee_id: user.employee_id || user.id,
          employee_name: user.name,
          employee_username: user.username || user.employee_username,
          email: result.author?.email || user.email || "employee@floww.com"
        },
        content: commentData.content,
        created_at: result.timestamp || new Date().toISOString(),
        replies: [],
        reactions: []
      };

      console.log('💾 Adding comment to UI:', newComment);

    setPosts(prevPosts =>
      prevPosts.map(post =>
          post.id === postId || post.post_id === postId
          ? { ...post, comments: [...(post.comments || []), newComment] }
          : post
      )
    );
    } catch (error) {
      console.error('❌ Add comment error:', error);
      throw error;
    }
  };

  // Add reply to comment
  const addReply = async (postId, commentId, replyData) => {
    if (!user) return;

    try {
      // Call the API to add reply
      const result = await postsAPI.addReply(postId, commentId, replyData);
      
      // Optimistically update the UI
      const newReply = {
        id: result.reply_id || result.id || uuidv4(),
        reply_id: result.reply_id || result.id, // Store the backend reply_id
        comment_id: result.reply_id || result.id, // Also store as comment_id for consistency
        author: {
          username: result.author?.username || result.author || user.username || user.name,
          employee_id: user.employee_id || user.id,
          employee_name: user.name,
          employee_username: user.username || user.employee_username,
          email: result.author?.email || user.email || "employee@floww.com"
        },
        author_name: result.author?.username || result.author || user.username || user.name,
        content: replyData.content,
        timestamp: result.timestamp || new Date().toISOString(),
        created_at: result.timestamp || new Date().toISOString(),
        likes: [],
        reactions: {}
      };

      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId || post.post_id === postId) {
            return {
              ...post,
              comments: post.comments?.map(comment => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply]
                  };
                }
                return comment;
              }) || []
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('❌ Add reply error:', error);
      throw error;
    }
  };

  // Delete comment (comment author or admin can delete)
  const deleteComment = async (postId, commentId) => {
    if (!user) return;

    try {
      // Find the comment to check authorization
      const post = posts.find(p => p.id === postId || p.post_id === postId);
      const comment = post?.comments?.find(c => c.id === commentId || c.comment_id === commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user is authorized to delete (comment author or admin)
      const isCommentAuthor = comment.author && (
        comment.author.employee_id === user.employee_id ||
        comment.author.employee_id === user.id ||
        comment.author.user_id === user.employee_id ||
        comment.author.user_id === user.id ||
        comment.author.username === user.username ||
        comment.author.username === user.employee_username ||
        comment.author.employee_username === user.username ||
        comment.author.employee_username === user.employee_username ||
        comment.author.id === user.id ||
        comment.author.id === user.employee_id
      );

      if (!isCommentAuthor && !user.is_admin) {
        throw new Error('Not authorized to delete this comment');
      }

      const backendCommentId = comment?.comment_id || commentId;
      await postsAPI.deleteComment(backendCommentId);

      // Optimistically update the UI
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId || post.post_id === postId) {
            return {
              ...post,
              comments: post.comments?.filter(comment => comment.id !== commentId && comment.comment_id !== commentId) || []
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('❌ Delete comment error:', error);
      throw error;
    }
  };

  // Delete reply
  const deleteReply = async (postId, commentId, replyId) => {
    if (!user) return;

    try {
      // Call the API to delete reply
      await postsAPI.deleteReply(postId, commentId, replyId);
      
      // Optimistically update the UI
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId || post.post_id === postId) {
            return {
              ...post,
              comments: post.comments?.map(comment => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    replies: (comment.replies || []).filter(reply => {
                      const rId = reply.reply_id || reply.id || reply.comment_id;
                      return rId !== replyId;
                    })
                  };
                }
                return comment;
              }) || []
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('❌ Delete reply error:', error);
      throw error;
    }
  };

  // Edit comment (only comment author can edit)
  const editComment = async (commentId, newContent) => {
    if (!user) return;

    try {
      // Find the comment to check authorization
      let targetComment = null;
      let targetPost = null;
      
      for (const post of posts) {
        const comment = post.comments?.find(c => c.id === commentId || c.comment_id === commentId);
        if (comment) {
          targetComment = comment;
          targetPost = post;
          break;
        }
      }

      if (!targetComment) {
        throw new Error('Comment not found');
      }

      // Check if user is authorized to edit (only comment author)
      const isCommentAuthor = targetComment.author && (
        targetComment.author.employee_id === user.employee_id ||
        targetComment.author.employee_id === user.id ||
        targetComment.author.user_id === user.employee_id ||
        targetComment.author.user_id === user.id ||
        targetComment.author.username === user.username ||
        targetComment.author.username === user.employee_username ||
        targetComment.author.employee_username === user.username ||
        targetComment.author.employee_username === user.employee_username ||
        targetComment.author.id === user.id ||
        targetComment.author.id === user.employee_id
      );

      if (!isCommentAuthor) {
        throw new Error('Not authorized to edit this comment');
      }

      const processedData = typeof newContent === 'string' 
        ? {
            content: newContent,
            mentions: extractMentionsFromText(newContent)
          }
        : {
            ...newContent,
            mentions: newContent.mentions || extractMentionsFromText(newContent.content || '')
          };
      
 

      const apiResponse = await postsAPI.editComment(commentId, processedData);
      
      // First, let's see the current state before updating
      setPosts(prevPosts => {
        const updatedPosts = prevPosts.map(post => {
          return {
            ...post,
            comments: post.comments?.map(comment => {
              if (comment.id === commentId || comment.comment_id === commentId) {
                const updatedComment = {
                  ...comment,
                  content: processedData.content || newContent,
                  edited: true,
                  edited_at: new Date().toISOString()
                };
                return updatedComment;
              }
              return comment;
            }) || []
          };
        });
        return updatedPosts;
      });
      
      // Also check if we need to refresh from server
      
    } catch (error) {
      console.error('❌ Edit comment error:', error);
      throw error;
    }
  };

  // Add reply to comment
  const addCommentReply = async (postId, commentId, replyContent) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId || p.post_id === postId);
      const comment = post?.comments?.find(c => c.id === commentId || c.comment_id === commentId);
      const backendCommentId = comment?.comment_id || commentId;
      const backendPostId = post?.post_id || postId;

      // Process reply content to extract mentions
      const processedData = typeof replyContent === 'string' 
        ? {
            content: replyContent,
            mentions: extractMentionsFromText(replyContent)
          }
        : {
            ...replyContent,
            mentions: replyContent.mentions || extractMentionsFromText(replyContent.content || '')
          };
      


      const response = await postsAPI.addCommentReply(backendPostId, backendCommentId, processedData);

      // Create optimistic reply object
      const newReply = {
        id: response?.reply_id || `reply-${Date.now()}`,
        reply_id: response?.reply_id,
        content: processedData.content || replyContent,
        author: {
          username: user?.name || user?.username || (user?.is_admin ? 'Admin' : 'Employee User')
        },
        created_at: new Date().toISOString(),
        reactions: {}
      };

      // Optimistically update the UI
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId || post.post_id === postId) {
            return {
              ...post,
              comments: post.comments?.map(comment => {
                if (comment.id === commentId || comment.comment_id === commentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply]
                  };
                }
                return comment;
              }) || []
            };
          }
          return post;
        })
      );

      return response;
    } catch (error) {
      console.error('❌ Add comment reply error:', error);
      throw error;
    }
  };

  // Add reaction to comment - handles both emoji reactions and likes
  const addCommentReaction = async (commentId, reactionType, emoji = null, getUserReactionFn = null) => {
    if (!user) return;
    
    // Admin users cannot react to comments
    if (user?.is_admin) {
      return;
    }

    // Use reactionType as-is since it comes from the emojiReactions mapping
    const safeReactionType = reactionType === 'love' ? 'like' : reactionType;
    // Send the emoji to the backend for all reaction types
    const reactionEmoji = emoji || '👍';

    // Find the comment or reply to get the backend comment_id
    let targetComment = null;
    let parentPost = null;
    let isReply = false;
    
    // First check if it's a direct comment
    posts.forEach(post => {
      const comment = post.comments?.find(c => c.id === commentId || c.comment_id === commentId);
      if (comment) {
        targetComment = comment;
        parentPost = post;
        return;
      }
      
      // If not found as direct comment, check if it's a reply
      post.comments?.forEach(comment => {
        const reply = comment.replies?.find(r => r.id === commentId || r.comment_id === commentId);
        if (reply) {
          targetComment = reply;
          parentPost = post;
          isReply = true;
          return;
        }
      });
    });

    if (!targetComment) {
      console.error('Comment/Reply not found:', commentId);
      return;
    }

    const backendCommentId = targetComment.comment_id || commentId;
    const currentUserId = user?.id || user?.user_id || user?.employee_id;

    // Check if user already has this reaction BEFORE optimistic update
    let hasExistingReaction = false;
    if (getUserReactionFn) {
      const userCurrentReaction = getUserReactionFn();
      hasExistingReaction = userCurrentReaction === safeReactionType;
    } else {
      // Fallback logic for comment reactions
      if (targetComment.reactions?.[safeReactionType]) {
        const reactionData = targetComment.reactions[safeReactionType];
        if (Array.isArray(reactionData)) {
          hasExistingReaction = reactionData.includes(currentUserId);
        } else if (reactionData.users && Array.isArray(reactionData.users)) {
          hasExistingReaction = reactionData.users.includes(currentUserId);
        }
      }
    }

    console.log('🔍 Comment reaction check:', {
      commentId,
      safeReactionType,
      hasExistingReaction,
      currentUserId,
      isReply
    });

    try {
      // Optimistically update the UI first for immediate feedback
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === parentPost?.id || post.post_id === parentPost?.post_id) {
            return {
              ...post,
              comments: post.comments?.map(comment => {
                // Check if this is the target comment
                if (comment.id === commentId || comment.comment_id === commentId) {
                  const updatedReactions = { ...comment.reactions || {} };
                  
                  // Remove user from ALL reactions first (one reaction at a time rule)
                  Object.keys(updatedReactions).forEach(reactionKey => {
                    if (Array.isArray(updatedReactions[reactionKey])) {
                      updatedReactions[reactionKey] = updatedReactions[reactionKey].filter(
                        id => id !== currentUserId
                      );
                      if (updatedReactions[reactionKey].length === 0) {
                        delete updatedReactions[reactionKey];
                      }
                    }
                  });
                  
                  // If user didn't have this specific reaction, add it
                  if (!hasExistingReaction) {
                    if (!updatedReactions[safeReactionType]) {
                      updatedReactions[safeReactionType] = [];
                    }
                    updatedReactions[safeReactionType] = [...updatedReactions[safeReactionType], currentUserId];
                  }

                  return {
                    ...comment,
                    reactions: updatedReactions
                  };
                }
                
                // Check if this is a reply within this comment
                if (comment.replies) {
                  const updatedReplies = comment.replies.map(reply => {
                    if (reply.id === commentId || reply.comment_id === commentId) {
                      const updatedReactions = { ...reply.reactions || {} };
                      
                      // Remove user from ALL reactions first (one reaction at a time rule)
                      Object.keys(updatedReactions).forEach(reactionKey => {
                        if (Array.isArray(updatedReactions[reactionKey])) {
                          updatedReactions[reactionKey] = updatedReactions[reactionKey].filter(
                            id => id !== currentUserId
                          );
                          if (updatedReactions[reactionKey].length === 0) {
                            delete updatedReactions[reactionKey];
                          }
                        }
                      });
                      
                      // If user didn't have this specific reaction, add it
                      if (!hasExistingReaction) {
                        if (!updatedReactions[safeReactionType]) {
                          updatedReactions[safeReactionType] = [];
                        }
                        updatedReactions[safeReactionType] = [...updatedReactions[safeReactionType], currentUserId];
                      }

                      return {
                        ...reply,
                        reactions: updatedReactions
                      };
                    }
                    return reply;
                  });

                  return {
                    ...comment,
                    replies: updatedReplies
                  };
                }
                
                return comment;
              }) || []
            };
          }
          return post;
        })
      );

      // Call appropriate backend API based on whether we're adding or removing
      if (hasExistingReaction) {
        console.log('🗑️ Removing comment reaction via API:', safeReactionType);
        await postsAPI.deleteCommentReaction(backendCommentId, safeReactionType);
        // Remove from local user reactions state
        removeUserCommentReaction(commentId, safeReactionType);
      } else {
        console.log('➕ Adding comment reaction via API:', safeReactionType);
        await postsAPI.addCommentReaction(backendCommentId, safeReactionType, reactionEmoji);
        // Add to local user reactions state
        addUserCommentReaction(commentId, safeReactionType);
      }
      
      // Refresh the post data to get updated reactions
      const postId = parentPost?.post_id || parentPost?.id;
      if (postId) {
        await refreshSpecificPostReactions(postId);
      }

    } catch (error) {
      console.error('❌ Comment reaction error:', error);
      // Revert the optimistic update on error
      await reloadPosts();
      throw error;
    }
  };

  // Add reaction function - handles both emoji reactions and likes
  const addReaction = async (postId, reactionType, emoji = null, activeView = 'home', getUserReactionFn = null) => {
    if (!user) return;
    
    // Admin users cannot react to posts
    if (user?.is_admin) {
      return;
    }

    // Use reactionType as-is since it comes from the emojiReactions mapping
    const safeReactionType = reactionType;
    // Send the emoji to the backend for all reaction types
    const reactionEmoji = emoji || '👍';

    // Optimistic update first
    const currentUserId = user?.user_id || user?.id || user?.employee_id;
    
    // Check if user already has this reaction BEFORE optimistic update
    let hasExistingReaction = false;
    if (getUserReactionFn) {
      const userCurrentReaction = getUserReactionFn();
      hasExistingReaction = userCurrentReaction === safeReactionType;
    } else {
      // Fallback logic
      const currentPost = posts.find(p => (p.post_id || p.id) === postId);
      if (currentPost?.reactions?.[safeReactionType]) {
        const reactionData = currentPost.reactions[safeReactionType];
        if (reactionData.users && Array.isArray(reactionData.users)) {
          hasExistingReaction = reactionData.users.includes(currentUserId);
        } else if (typeof reactionData === 'number' && reactionData > 0) {
          // For count-only format, we can't reliably determine if user has it
          // This should be handled by the getUserReactionFn parameter instead
          hasExistingReaction = false;
        }
      }
    }

    // Optimistic update first
    setPosts(prevPosts => {
      return prevPosts.map(post => {
        if ((post.post_id || post.id) === postId) {
          const updatedPost = { ...post };
          
          // Initialize reactions if they don't exist
          if (!updatedPost.reactions) {
            updatedPost.reactions = {};
          }
          if (!updatedPost.reaction_counts) {
            updatedPost.reaction_counts = {};
          }

          // Ensure reaction is in proper object format
          if (updatedPost.reactions[safeReactionType] && typeof updatedPost.reactions[safeReactionType] !== 'object') {
            // If it's not an object, reset it
            updatedPost.reactions[safeReactionType] = { users: [], count: 0 };
          }

          // Check if user already has this reaction (with safe checking)
          const hasReaction = updatedPost.reactions[safeReactionType] && 
                             Array.isArray(updatedPost.reactions[safeReactionType].users) &&
                             updatedPost.reactions[safeReactionType].users.includes(currentUserId);
          
          if (hasReaction) {
            // Remove reaction (toggle off)
            if (updatedPost.reactions[safeReactionType] && 
                typeof updatedPost.reactions[safeReactionType] === 'object') {
              updatedPost.reactions[safeReactionType].users = 
                (updatedPost.reactions[safeReactionType].users || []).filter(id => id !== currentUserId);
              updatedPost.reactions[safeReactionType].count = Math.max(0, 
                (updatedPost.reactions[safeReactionType].count || 1) - 1);
              
              // Remove reaction type if count is 0
              if (updatedPost.reactions[safeReactionType].count === 0) {
                delete updatedPost.reactions[safeReactionType];
              }
            }
            updatedPost.reaction_counts[safeReactionType] = Math.max(0, 
              (updatedPost.reaction_counts[safeReactionType] || 1) - 1);
            
            if (updatedPost.reaction_counts[safeReactionType] === 0) {
              delete updatedPost.reaction_counts[safeReactionType];
            }
          } else {
            // Add reaction - ensure proper object structure
            if (!updatedPost.reactions[safeReactionType] || 
                typeof updatedPost.reactions[safeReactionType] !== 'object') {
              updatedPost.reactions[safeReactionType] = { users: [], count: 0 };
            }
            
            // Make sure users is an array
            if (!Array.isArray(updatedPost.reactions[safeReactionType].users)) {
              updatedPost.reactions[safeReactionType].users = [];
            }
            
            if (!updatedPost.reactions[safeReactionType].users.includes(currentUserId)) {
              updatedPost.reactions[safeReactionType].users = 
                [...updatedPost.reactions[safeReactionType].users, currentUserId];
              updatedPost.reactions[safeReactionType].count = 
                (updatedPost.reactions[safeReactionType].count || 0) + 1;
            }
            updatedPost.reaction_counts[safeReactionType] = 
              (updatedPost.reaction_counts[safeReactionType] || 0) + 1;
          }

          return updatedPost;
        }
        return post;
      });
    });

    try {
      // Call appropriate backend API based on whether we're adding or removing
      if (hasExistingReaction) {
        await postsAPI.removeReaction(postId, safeReactionType);
        // Remove from local user reactions state
        removeUserReaction(postId, safeReactionType);
      } else {
        await postsAPI.addReaction(postId, safeReactionType, reactionEmoji);
        // Add to local user reactions state
        addUserReaction(postId, safeReactionType);
      }
      
      // Only refresh the specific post's data, not the entire feed
      await refreshSpecificPostReactions(postId);

    } catch (error) {
      console.error('❌ Failed to add/remove reaction:', error.message);
      // Revert optimistic update on error by reloading that specific post
      await refreshSpecificPostReactions(postId);
      throw error;
    }
  };

  // Remove reaction function - for explicit reaction removal
  const removeReaction = async (postId, reactionType, activeView = 'home') => {
    if (!user) return;
    
    // Admin users cannot react to posts
    if (user?.is_admin) {
      return;
    }

    const safeReactionType = reactionType === '❤️' ? 'like' : reactionType;
    const currentUserId = user?.user_id || user?.id || user?.employee_id;

    // Optimistic update first
    setPosts(prevPosts => {
      return prevPosts.map(post => {
        if ((post.post_id || post.id) === postId) {
          const updatedPost = { ...post };
          
          if (updatedPost.reactions && updatedPost.reactions[safeReactionType] && 
              typeof updatedPost.reactions[safeReactionType] === 'object') {
            // Remove user from reaction - ensure users is an array
            if (Array.isArray(updatedPost.reactions[safeReactionType].users)) {
              updatedPost.reactions[safeReactionType].users = 
                updatedPost.reactions[safeReactionType].users.filter(id => id !== currentUserId);
            }
            updatedPost.reactions[safeReactionType].count = Math.max(0, 
              (updatedPost.reactions[safeReactionType].count || 1) - 1);
            
            // Remove reaction type if count is 0
            if (updatedPost.reactions[safeReactionType].count === 0) {
              delete updatedPost.reactions[safeReactionType];
            }
          }

          if (updatedPost.reaction_counts && updatedPost.reaction_counts[safeReactionType]) {
            updatedPost.reaction_counts[safeReactionType] = Math.max(0, 
              (updatedPost.reaction_counts[safeReactionType] || 1) - 1);
            
            if (updatedPost.reaction_counts[safeReactionType] === 0) {
              delete updatedPost.reaction_counts[safeReactionType];
            }
          }

          return updatedPost;
        }
        return post;
      });
    });

    try {
      // Call backend API
      await postsAPI.removeReaction(postId, safeReactionType);
      
      // Only refresh the specific post's data
      await refreshSpecificPostReactions(postId);

    } catch (error) {
      console.error('❌ Failed to remove reaction:', error.message);
      // Revert optimistic update on error
      await refreshSpecificPostReactions(postId);
      throw error;
    }
  };

  const getUserPosts = async () => {
    try {
      // Use backend API for current user's posts (token-based)
      const backendPosts = await postsAPI.getMyPosts();
      
      // Check the new nested structure
      if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
        return backendPosts.data.posts;
      } else if (Array.isArray(backendPosts.data)) {
        // Fallback to old structure
        return backendPosts.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to get user posts:', error);
      return [];
    }
  };

  const pinPost = (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, is_pinned: !post.is_pinned }
          : post
      )
    );
  };

  const searchPosts = (query) => {
    if (!query.trim()) return posts;
    
    const lowercaseQuery = query.toLowerCase();
    return posts.filter(post =>
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.authorName.toLowerCase().includes(lowercaseQuery) ||
      (post.tags && post.tags.some(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.tag_name || tag.name || '';
        return tagName.toLowerCase().includes(lowercaseQuery);
      }))
    );
  };

  const getPostsByTag = (tag) => {
    return posts.filter(post => 
      post.tags && post.tags.some(postTag => {
        const tagName = typeof postTag === 'string' ? postTag : postTag.tag_name || postTag.name;
        return tagName === tag;
      })
    );
  };

  const getFilteredPosts = (filters = {}) => {
    let filteredPosts = [...posts];

    // Filter by tag
    if (filters.tag && filters.tag !== 'all') {
      const beforeTagFilter = filteredPosts.length;
      filteredPosts = filteredPosts.filter(post => 
        post.tags && post.tags.some(postTag => {
          const tagName = typeof postTag === 'string' ? postTag : postTag.tag_name || postTag.name;
          return tagName === filters.tag;
        })
      );
    }

    // Filter by search query
    if (filters.search && filters.search.trim()) {
      const beforeSearchFilter = filteredPosts.length;
      const searchQuery = filters.search.toLowerCase().trim();
      filteredPosts = filteredPosts.filter(post =>
        post.content.toLowerCase().includes(searchQuery) ||
        post.authorName.toLowerCase().includes(searchQuery) ||
        (post.tags && post.tags.some(tag => {
          const tagName = typeof tag === 'string' ? tag : tag.tag_name || tag.name || '';
          return tagName.toLowerCase().includes(searchQuery);
        }))
      );
    }

    return filteredPosts;
  };

  const value = {
    posts,
    loading,
    tags,
    normalizePost, // Export normalizePost function
    createPost,
    editPost,
    deletePost,
    // likePost removed - now handled through addReaction
    addComment,
    editComment,
    addReply,
    addCommentReply,
    deleteComment,
    deleteReply,
    addCommentReaction,
    getUserPosts,
    pinPost,
    searchPosts,
    getPostsByTag,
    getFilteredPosts,
    reloadPosts,
    loadAllPosts,
    setIsDashboardManaged, // Expose dashboard management control
    loadMorePosts,
    addReaction,
    removeReaction,
    hasUserReacted,
    hasUserReactedToComment,
    userReactions,
    // Pagination state
    nextCursor,
    hasMorePosts,
    isLoadingMore
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};
