import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { postsAPI } from '../services/api';
import { adminAPI } from '../services/adminAPI';
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
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
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

    
    if (!Array.isArray(reactionsArray)) {
      // If it's already an object, return as is
      return reactionsArray || {};
    }
    
    if (reactionsArray.length === 0) {
    
      return {};
    }
    
    const reactionsObject = {};
    
    // Group reactions by type
    reactionsArray.forEach((reaction, index) => {
  
      const reactionType = reaction.reaction_type;
      const userId = reaction.user_id;
      

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
        
      } else {
       
      }
    });
    

    return reactionsObject;
  };

  // Helper function to normalize reaction_counts format to frontend object format
  const normalizeReactionCounts = (reactionCounts) => {
 
    
    if (!reactionCounts || typeof reactionCounts !== 'object') {
   
      return {};
    }
    
    const reactionsObject = {};
    
    // Convert reaction_counts format (e.g., {like: 1, love: 2}) to frontend format
    Object.entries(reactionCounts).forEach(([reactionType, count]) => {
      if (count > 0) {
        reactionsObject[reactionType] = {
          users: [], // We don't have user list in reaction_counts format, will be populated from other sources
          count: count
        };
      
      }
    });
    
   
    return reactionsObject;
  };

  // Normalize post data to ensure consistent format
  const normalizePost = (rawPost) => {
    let normalizedReactions = {};
    
    // Handle new reaction_counts format first (takes priority)
    if (rawPost.reaction_counts) {
      normalizedReactions = normalizeReactionCounts(rawPost.reaction_counts);
    } 
    // Fallback to old reactions array format
    else if (rawPost.reactions) {
      normalizedReactions = normalizeReactions(rawPost.reactions);
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
          // Normalize comment reactions from array to object format
          if (Array.isArray(comment.reactions)) {
            const reactionsObj = {};
            comment.reactions.forEach(reaction => {
              const type = reaction.reaction_type || reaction.type;
              const userId = reaction.user_id || reaction.userId;
              
              if (!reactionsObj[type]) {
                reactionsObj[type] = { users: [], count: 0 };
              }
              if (!reactionsObj[type].users.includes(userId)) {
                reactionsObj[type].users.push(userId);
                reactionsObj[type].count++;
              }
            });
            return reactionsObj;
          } else if (comment.reactions && typeof comment.reactions === 'object') {
            return comment.reactions;
          } else {
            return {};
          }
        })(),
        replies: comment.replies || []
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
      if (!user) {
        setPosts([]);
        setNextCursor(null);
        setHasMorePosts(true);
        setLoading(false);
        return;
      }
      
      // Admin users don't have personal posts, skip loading
      if (user?.is_admin) {
        setPosts([]);
        setNextCursor(null);
        setHasMorePosts(true);
        setLoading(false);
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
      } catch (error) {
        console.error('❌ PostContext - Failed to load user posts from backend:', error.message);
        setPosts([]);
        setNextCursor(null);
        setHasMorePosts(false);
      } finally {
        setLoading(false);
      }
    };

    // Call the loadPosts function
    loadPosts();
  }, [user]);

  // Auto-refresh reactions every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || !user) return;

    const intervalId = setInterval(() => {
      refreshReactions();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, user, posts.length]);

  // Standalone function to reload posts (can be called after edit/delete)
  const reloadPosts = async () => {
    // Admin users don't have personal posts, skip reloading
    if (user?.is_admin) {
      setPosts([]);
      return;
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
  const addCommentReaction = async (commentId, reactionType, emoji = null) => {
    if (!user) return;
    
    // Admin users cannot react to comments
    if (user?.is_admin) {
      return;
    }

    // Always use 'like' as the reactionType for likes, never the emoji
    const safeReactionType = reactionType === '❤️' ? 'like' : reactionType;
    // Define reactionEmoji properly based on the reaction type
    const reactionEmoji = safeReactionType === 'like' ? undefined : (emoji || '👍');

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
                  const currentReactions = comment.reactions || {};
                  const userId = user.id || user.user_id || user.employee_id;
                  
                  // Check if user has this specific reaction
                  const userHasThisReaction = currentReactions[safeReactionType]?.some?.(
                    id => id === userId
                  ) || currentReactions[safeReactionType]?.includes?.(userId);

                  let updatedReactions = { ...currentReactions };
                  
                  // First, remove user from ALL existing reactions (to handle switching)
                  Object.keys(updatedReactions).forEach(reactionKey => {
                    if (Array.isArray(updatedReactions[reactionKey])) {
                      updatedReactions[reactionKey] = updatedReactions[reactionKey].filter(
                        id => id !== userId
                      );
                      // Remove empty arrays
                      if (updatedReactions[reactionKey].length === 0) {
                        delete updatedReactions[reactionKey];
                      }
                    } else if (updatedReactions[reactionKey]?.users) {
                      updatedReactions[reactionKey].users = updatedReactions[reactionKey].users.filter(
                        id => id !== userId
                      );
                      updatedReactions[reactionKey].count = Math.max(0, (updatedReactions[reactionKey].count || 1) - 1);
                      // Remove empty reaction objects
                      if (updatedReactions[reactionKey].count === 0) {
                        delete updatedReactions[reactionKey];
                      }
                    }
                  });
                  
                  // Then, if user didn't have this specific reaction, add it
                  if (!userHasThisReaction) {
                    if (!updatedReactions[safeReactionType]) {
                      updatedReactions[safeReactionType] = {
                        users: [userId],
                        count: 1
                      };
                    } else if (Array.isArray(updatedReactions[safeReactionType])) {
                      updatedReactions[safeReactionType] = [
                        ...updatedReactions[safeReactionType],
                        userId
                      ];
                    } else {
                      updatedReactions[safeReactionType].users = [
                        ...(updatedReactions[safeReactionType].users || []),
                        userId
                      ];
                      updatedReactions[safeReactionType].count = (updatedReactions[safeReactionType].count || 0) + 1;
                    }
                  }

                  return {
                    ...comment,
                    reactions: updatedReactions
                  };
                }
                
                // Check if this is a reply to this comment
                if (comment.replies?.length > 0) {
                  const updatedReplies = comment.replies.map(reply => {
                    if (reply.id === commentId || reply.comment_id === commentId) {
                      const currentReactions = reply.reactions || {};
                      const userId = user.id || user.user_id || user.employee_id;
                      
                      // Check if user has this specific reaction
                      const userHasThisReaction = currentReactions[safeReactionType]?.some?.(
                        id => id === userId
                      ) || currentReactions[safeReactionType]?.includes?.(userId);

                      let updatedReactions = { ...currentReactions };
                      
                      // First, remove user from ALL existing reactions (to handle switching)
                      Object.keys(updatedReactions).forEach(reactionKey => {
                        if (Array.isArray(updatedReactions[reactionKey])) {
                          updatedReactions[reactionKey] = updatedReactions[reactionKey].filter(
                            id => id !== userId
                          );
                          // Remove empty arrays
                          if (updatedReactions[reactionKey].length === 0) {
                            delete updatedReactions[reactionKey];
                          }
                        } else if (updatedReactions[reactionKey]?.users) {
                          updatedReactions[reactionKey].users = updatedReactions[reactionKey].users.filter(
                            id => id !== userId
                          );
                          updatedReactions[reactionKey].count = Math.max(0, (updatedReactions[reactionKey].count || 1) - 1);
                          // Remove empty reaction objects
                          if (updatedReactions[reactionKey].count === 0) {
                            delete updatedReactions[reactionKey];
                          }
                        }
                      });
                      
                      // Then, if user didn't have this specific reaction, add it
                      if (!userHasThisReaction) {
                        if (!updatedReactions[safeReactionType]) {
                          updatedReactions[safeReactionType] = {
                            users: [userId],
                            count: 1
                          };
                        } else if (Array.isArray(updatedReactions[safeReactionType])) {
                          updatedReactions[safeReactionType] = [
                            ...updatedReactions[safeReactionType],
                            userId
                          ];
                        } else {
                          updatedReactions[safeReactionType].users = [
                            ...(updatedReactions[safeReactionType].users || []),
                            userId
                          ];
                          updatedReactions[safeReactionType].count = (updatedReactions[safeReactionType].count || 0) + 1;
                        }
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

      // Add or toggle the reaction on the backend
      await postsAPI.addCommentReaction(backendCommentId, safeReactionType, reactionEmoji);
      
     

    } catch (error) {
      console.error('❌ Comment reaction error:', error);
      // Revert the optimistic update on error
      await reloadPosts();
      throw error;
    }
  };

  // Add reaction function - handles both emoji reactions and likes
  const addReaction = async (postId, reactionType, emoji = null, activeView = 'home') => {
    if (!user) return;
    
    // Admin users cannot react to posts
    if (user?.is_admin) {
      return;
    }

    // Always use 'like' as the reactionType for likes, never the emoji
    const safeReactionType = reactionType === '❤️' ? 'like' : reactionType;
    // For likes, do NOT send the emoji to the backend if it doesn't expect it
    const reactionEmoji = safeReactionType === 'like' ? undefined : (emoji || '👍');

    try {
      // Add or toggle the reaction
      await postsAPI.addReaction(postId, safeReactionType, reactionEmoji);
      
      // Immediately refresh reactions for real-time updates
      await refreshReactions();
      
      // Reload the appropriate feed based on the active view
      if (activeView === 'myposts') {
        await reloadPosts();
      } else {
        // Default to home feed
        await loadAllPosts();
      }

    } catch (error) {
      console.error('❌ Failed to add/remove reaction:', error.message);
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
    loadMorePosts,
    addReaction,
    hasUserReacted,
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
