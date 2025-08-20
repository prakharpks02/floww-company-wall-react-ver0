import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext_token';
import { postsAPI } from '../services/api';
import { adminAPI } from '../services/adminAPI';

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
      console.log('🔍 PostContext normalizeReactions - Not an array, returning as is:', reactionsArray);
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
    console.log('🔍 PostContext normalizePost - Raw post:', rawPost);
    
    let normalizedReactions = {};
    
    // Handle new reaction_counts format first (takes priority)
    if (rawPost.reaction_counts) {
      console.log('🔍 PostContext normalizePost - Using reaction_counts format');
      normalizedReactions = normalizeReactionCounts(rawPost.reaction_counts);
    } 
    // Fallback to old reactions array format
    else if (rawPost.reactions) {
      console.log('🔍 PostContext normalizePost - Using reactions array format');
      normalizedReactions = normalizeReactions(rawPost.reactions);
    }
    
    // Extract author information from backend format
    const authorName = rawPost.author?.username || rawPost.author?.name || rawPost.authorName || rawPost.author_name || user?.name || 'Unknown User';
    const authorAvatar = rawPost.author?.avatar || rawPost.authorAvatar || rawPost.author_avatar;
    
    console.log('🔍 PostContext normalizePost - Author info:', {
      authorName,
      authorAvatar,
      originalAuthor: rawPost.author
    });
    
    // Normalize comments to handle backend format
    const normalizedComments = rawPost.comments?.map(comment => {
      const commentAuthorName = comment.author?.username || comment.author?.name || comment.authorName || user?.name || 'Unknown User';
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
        console.log('🔍 Processing media array:', rawPost.media);
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
            
            console.log('🔍 Processing media URL:', url);
            
            // Simplified image detection - just check for common image extensions
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(url) ||
                           url.includes('cdn.gofloww.co') && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i.test(url);
                           
            const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)(\?.*)?$/i.test(url);
                           
            const isDocument = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)(\?.*)?$/i.test(url);
            
            if (isImage) {
              mediaArrays.images.push(mediaObj);
              console.log('✅ Added as image:', mediaObj);
            } else if (isVideo) {
              mediaArrays.videos.push(mediaObj);
              console.log('✅ Added as video:', mediaObj);
            } else if (isDocument) {
              mediaObj.isPDF = /\.pdf(\?.*)?$/i.test(url);
              mediaArrays.documents.push(mediaObj);
              console.log('✅ Added as document:', mediaObj);
            } else {
              // Only add to links if it's not categorized as image, video, or document
              // This prevents duplicates
              mediaArrays.links.push(mediaObj);
              console.log('✅ Added as link:', mediaObj);
            }
          }
        });
        
        console.log('🔍 Final media arrays:', mediaArrays);
        return mediaArrays;
      })() : {
        // Keep existing arrays if no media array
        images: rawPost.images || [],
        videos: rawPost.videos || [],
        documents: rawPost.documents || [],
        links: rawPost.links || []
      })
    };
  
    console.log('🔍 PostContext normalizePost - Normalized post:', normalized);
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
        console.log('⚠️ PostContext - No authenticated user, skipping post loading');
        setPosts([]);
        setNextCursor(null);
        setHasMorePosts(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('🔄 PostContext - Loading posts for user');
        
        const backendPosts = await postsAPI.getMyPosts();
        console.log('🔄 PostContext - Backend response:', backendPosts);
        
        let postsData = [];

        // Check the new nested structure (same as loadAllPosts)
        if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
          postsData = backendPosts.data.posts;
          console.log('✅ PostContext - Found posts in nested structure:', postsData.length);
        } else if (Array.isArray(backendPosts.data)) {
          // Fallback to old structure if present
          postsData = backendPosts.data;
          console.log('✅ PostContext - Found posts in old structure:', postsData.length);
        } else {
          console.log('📝 PostContext - No posts found for current user, showing empty state');
          postsData = [];
        }

        // Normalize all posts to ensure consistent format
        const normalizedPosts = postsData.map(post => {
          const normalized = normalizePost(post);
          console.log('🔄 PostContext - Normalized post:', normalized);
          return normalized;
        });
        
        setPosts(normalizedPosts);
        // Reset pagination state
        setNextCursor(null);
        setHasMorePosts(true);
      } catch (error) {
        console.error('❌ PostContext - Failed to load user posts from backend:', error.message);
        console.log('📝 PostContext - Showing empty posts state due to backend error');
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

  // Standalone function to reload posts (can be called after edit/delete)
  const reloadPosts = async () => {
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
        console.log('📝 No posts found for current user');
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
      const cursor = resetPagination ? null : nextCursor;
      console.log('🔄 Loading posts with cursor:', cursor, 'resetPagination:', resetPagination);
    
    // Fetch regular posts and pinned posts in parallel (only fetch pinned on initial load)
    const [backendPosts, pinnedPostsResponse] = await Promise.all([
      postsAPI.getPosts(1, 10, cursor),
      resetPagination ? adminAPI.getPinnedPosts() : Promise.resolve({ posts: [] })
    ]);
    
    console.log('📡 Backend response:', backendPosts);
    console.log('📌 Pinned posts response:', pinnedPostsResponse);
    
    let postsData = [];
    let pinnedPosts = [];

    // Process regular posts
    if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
      postsData = backendPosts.data.posts;
      console.log('✅ Found posts in nested structure:', postsData.length);
    } else if (Array.isArray(backendPosts.data)) {
      postsData = backendPosts.data;
      console.log('✅ Found posts in flat structure:', postsData.length);
    } else if (Array.isArray(backendPosts.posts)) {
      postsData = backendPosts.posts;
      console.log('✅ Found posts in posts array:', postsData.length);
    } else {
      console.warn('🛑 No posts found in backend response:', backendPosts);
      postsData = [];
    }

    // Process pinned posts (only on initial load)
    if (resetPagination && pinnedPostsResponse.posts && Array.isArray(pinnedPostsResponse.posts)) {
      pinnedPosts = pinnedPostsResponse.posts;
      console.log('✅ Found pinned posts:', pinnedPosts.length);
      
      // Mark pinned posts with is_pinned flag
      pinnedPosts = pinnedPosts.map(post => ({
        ...post,
        is_pinned: true
      }));
    }

    // Combine and deduplicate posts
    let allPosts = [];
    if (resetPagination) {
      // For initial load, combine pinned and regular posts, removing duplicates
      const pinnedPostIds = new Set(pinnedPosts.map(p => p.post_id));
      const regularPostsFiltered = postsData.filter(p => !pinnedPostIds.has(p.post_id));
      allPosts = [...pinnedPosts, ...regularPostsFiltered];
      console.log('� Combined posts for home feed:', {
        pinnedCount: pinnedPosts.length,
        regularCount: regularPostsFiltered.length,
        totalCombined: allPosts.length,
        duplicatesRemoved: postsData.length - regularPostsFiltered.length
      });
    } else {
      // For pagination, just add new regular posts
      allPosts = postsData;
    }

    // Update pagination state - check multiple possible cursor field names in data object
    const newNextCursor = backendPosts.data?.nextCursor || backendPosts.data?.lastPostId || 
                         backendPosts.data?.next_cursor || backendPosts.data?.last_post_id ||
                         backendPosts.nextCursor || backendPosts.lastPostId || null;
    setNextCursor(newNextCursor);
    
    // Check if there are more posts - we have more if:
    // 1. We have a valid next cursor/lastPostId AND
    // 2. We got some posts back (even if less than requested limit)
    const hasMore = newNextCursor !== null && newNextCursor !== undefined && allPosts.length > 0;
    setHasMorePosts(hasMore);

    console.log('🔍 Pagination decision logic:', {
      postsReceived: allPosts.length,
      newNextCursor,
      hasValidCursor: newNextCursor !== null && newNextCursor !== undefined,
      willHaveMore: hasMore,
      resetPagination
    });

    // Normalize and set posts
    const normalizedPosts = allPosts.map(normalizePost);
    
    // Additional deduplication check based on post_id to prevent React key conflicts
    const seenPostIds = new Set();
    const uniqueNormalizedPosts = normalizedPosts.filter(post => {
      const postId = post.post_id || post.id;
      if (seenPostIds.has(postId)) {
        console.log('⚠️ Duplicate post detected and removed:', postId);
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
    
    console.log('📄 Pagination state updated:', {
      rawPostsCount: allPosts.length,
      normalizedPostsCount: normalizedPosts.length,
      uniquePostsCount: uniqueNormalizedPosts.length,
      duplicatesFiltered: normalizedPosts.length - uniqueNormalizedPosts.length,
      totalPosts: resetPagination ? uniqueNormalizedPosts.length : posts.length + uniqueNormalizedPosts.length,
      hasMore,
      nextCursor: newNextCursor
    });
    
  } catch (error) {
    console.error('❌ Failed to load posts for home feed:', error.message);
    if (resetPagination) {
      setPosts([]);
      setHasMorePosts(false);
      setNextCursor(null);
    }
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

  const createPost = async (postData) => {
    if (!user) {
      console.error('No authenticated user found. Cannot create post.');
      throw new Error('You must be logged in to create a post');
    }

    // Use token-based authentication - backend will handle user identification
    const authorName = user?.name || user?.username || 'Unknown User';
    const authorAvatar = user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

    try {
      // Optimistically create the post object first for immediate UI update
      const tempId = `temp-${Date.now()}`;
      const optimisticPost = {
        id: tempId,
        post_id: tempId,
        authorName: authorName,
        authorAvatar: authorAvatar,
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

      console.log('🔍 PostContext createPost - All media objects:', allMedia);

      const backendResult = await postsAPI.createPost({
        content: postData.content,
        media: allMedia,
        mentions: postData.mentions || [],
        tags: postData.tags || []
      });
      
      console.log('✅ Backend post creation successful:', backendResult);
      
      // Create final post object with backend data
      const finalPost = {
        id: backendResult.post_id || backendResult.id || tempId,
        post_id: backendResult.post_id || tempId,
        author: backendResult.author || authorName,
        authorName: backendResult.author || authorName,
        authorAvatar: authorAvatar,
        content: postData.content,
        images: postData.images || [],
        videos: postData.videos || [],
        documents: postData.documents || [],
        links: postData.links || [],
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

      console.log('✅ Post created successfully with real-time update:', finalPost);
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

    console.log('🔍 PostContext editPost - Input data:', {
      postId,
      updatedData,
      images: updatedData.images,
      videos: updatedData.videos,
      documents: updatedData.documents,
      links: updatedData.links
    });

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
      console.log('🔍 PostContext editPost - API response:', apiResponse);
      
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
      
      console.log('✅ Post updated successfully with real-time update:', postId);
      
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
      
      console.log('✅ Post deleted successfully with real-time update:', postId);
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
    if (!user) return;

    try {
      // Call the API to add comment
      const result = await postsAPI.addComment(postId, commentData);
      
      // Optimistically update the UI
      const newComment = {
        id: result.comment_id || result.id || uuidv4(),
        comment_id: result.comment_id || result.id, // Store the backend comment_id
        author: {
          username: result.author?.username || result.author || username,
          email: result.author?.email || "employee@floww.com"
        },
        content: commentData.content,
        created_at: result.timestamp || new Date().toISOString(),
        replies: [],
        reactions: []
      };

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
        author: result.author?.username || result.author || username,
        author_name: result.author?.username || result.author || username,
        content: replyData.content,
        timestamp: result.timestamp || new Date().toISOString(),
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

  // Delete comment (only post author can delete)
  const deleteComment = async (postId, commentId) => {
    if (!user) return;

    try {
      // Find the comment to get the backend comment_id
      const post = posts.find(p => p.id === postId || p.post_id === postId);
      const comment = post?.comments?.find(c => c.id === commentId || c.comment_id === commentId);
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

    console.log('🔍 PostContext editComment called:', {
      commentId,
      newContent
    });

    try {
      const apiResponse = await postsAPI.editComment(commentId, newContent);
      
      console.log('🔍 PostContext editComment API response:', apiResponse);

      // First, let's see the current state before updating
      setPosts(prevPosts => {
        console.log('🔍 PostContext before edit - current posts:', prevPosts.length);
        
        const updatedPosts = prevPosts.map(post => {
          console.log('🔍 PostContext checking post:', {
            postId: post.id || post.post_id,
            commentsCount: post.comments?.length || 0,
            hasComments: !!post.comments
          });
          
          if (post.comments && post.comments.length > 0) {
            console.log('🔍 PostContext post comments before edit:', post.comments.map(c => ({
              id: c.comment_id || c.id,
              content: c.content,
              contentType: typeof c.content
            })));
          }
          
          return {
            ...post,
            comments: post.comments?.map(comment => {
              console.log('🔍 PostContext checking comment for edit:', {
                commentIdToEdit: commentId,
                commentId: comment.comment_id,
                commentIdAlt: comment.id,
                currentContent: comment.content,
                currentContentType: typeof comment.content,
                newContent: newContent,
                newContentType: typeof newContent,
                willUpdate: comment.id === commentId || comment.comment_id === commentId
              });
              
              if (comment.id === commentId || comment.comment_id === commentId) {
                const updatedComment = {
                  ...comment,
                  content: newContent,
                  edited: true,
                  edited_at: new Date().toISOString()
                };
                console.log('🔍 PostContext updated comment result:', {
                  original: comment,
                  updated: updatedComment,
                  contentChanged: comment.content !== newContent
                });
                return updatedComment;
              }
              return comment;
            }) || []
          };
        });
        
        console.log('🔍 PostContext updated posts after edit - checking first post comments:', 
          updatedPosts[0]?.comments?.map(c => ({
            id: c.comment_id || c.id,
            content: c.content,
            contentType: typeof c.content
          }))
        );
        return updatedPosts;
      });
      
      // Also check if we need to refresh from server
      console.log('🔍 PostContext checking if we should refresh post data from server...');
      
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

      const response = await postsAPI.addCommentReply(backendPostId, backendCommentId, replyContent);

      // Create optimistic reply object
      const newReply = {
        id: response?.reply_id || `reply-${Date.now()}`,
        reply_id: response?.reply_id,
        content: replyContent,
        author: {
          username: user?.name || user?.username || 'Unknown User'
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
      // Add or toggle the reaction
      await postsAPI.addCommentReaction(backendCommentId, safeReactionType, reactionEmoji);
      
      // Refresh posts to get updated reactions from backend
      await reloadPosts();

    } catch (error) {
      console.error('❌ Comment reaction error:', error);
      throw error;
    }
  };

  // Add reaction function - handles both emoji reactions and likes
  const addReaction = async (postId, reactionType, emoji = null, activeView = 'home') => {
    if (!user) return;

    // Always use 'like' as the reactionType for likes, never the emoji
    const safeReactionType = reactionType === '❤️' ? 'like' : reactionType;
    // For likes, do NOT send the emoji to the backend if it doesn't expect it
    const reactionEmoji = safeReactionType === 'like' ? undefined : (emoji || '👍');

    try {
      // Add or toggle the reaction
      await postsAPI.addReaction(postId, safeReactionType, reactionEmoji);
      
      // Reload the appropriate feed based on the active view
      if (activeView === 'myposts') {
        await reloadPosts();
        console.log('✅ Reloaded user posts after reaction');
      } else {
        // Default to home feed
        await loadAllPosts();
        console.log('✅ Reloaded home feed after reaction');
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
      filteredPosts = filteredPosts.filter(post => 
        post.tags && post.tags.some(postTag => {
          const tagName = typeof postTag === 'string' ? postTag : postTag.tag_name || postTag.name;
          return tagName === filters.tag;
        })
      );
    }

    // Filter by search query
    if (filters.search && filters.search.trim()) {
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
