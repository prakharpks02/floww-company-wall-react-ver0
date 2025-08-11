import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
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
  const { user, getCurrentUserId, getCurrentAuthorId } = useAuth();
  const [posts, setPosts] = useState([]);
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
  const normalizeReactionCounts = (reactionCounts, currentUserId) => {
 
    
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
      normalizedReactions = normalizeReactionCounts(rawPost.reaction_counts, user?.user_id || user?.id);
    } 
    // Fallback to old reactions array format
    else if (rawPost.reactions) {
      console.log('🔍 PostContext normalizePost - Using reactions array format');
      normalizedReactions = normalizeReactions(rawPost.reactions);
    }
    
    // Extract author information from backend format
    const authorId = rawPost.author?.user_id || rawPost.author?.id || rawPost.authorId || rawPost.author_id || rawPost.user_id;
    const authorName = rawPost.author?.username || rawPost.author?.name || rawPost.authorName || rawPost.author_name;
    const authorAvatar = rawPost.author?.avatar || rawPost.authorAvatar || rawPost.author_avatar;
    
    console.log('🔍 PostContext normalizePost - Author info:', {
      authorId,
      authorName,
      authorAvatar,
      originalAuthor: rawPost.author
    });
    
    // Normalize comments to handle backend format
    const normalizedComments = rawPost.comments?.map(comment => {
      const commentAuthorId = comment.author?.user_id || comment.author?.id || comment.authorId || comment.author_id;
      const commentAuthorName = comment.author?.username || comment.author?.name || comment.authorName || 
                               (comment.author_id && user && comment.author_id === user.user_id ? user.name || user.username : null) ||
                               'Unknown User';
      const commentAuthorAvatar = comment.author?.avatar || comment.authorAvatar || 
                                 (comment.author_id && user && comment.author_id === user.user_id ? user.avatar : null) ||
                                 'https://ui-avatars.com/api/?name=' + encodeURIComponent(commentAuthorName) + '&background=random';
      
      return {
        ...comment,
        id: comment.comment_id || comment.id, // Use comment_id as the primary id
        comment_id: comment.comment_id || comment.id, // Keep the backend comment_id
        authorId: commentAuthorId,
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
      // Ensure consistent author ID fields
      authorId: authorId,
      author_id: authorId,
      user_id: authorId,
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
        const mediaArrays = { images: [], videos: [], documents: [], links: [] };
        rawPost.media.forEach((mediaItem, index) => {
          if (mediaItem && mediaItem.link) {
            const url = mediaItem.link;
            // Create a proper media object with id for removal functionality
            const mediaObj = {
              id: `media-${index}-${Date.now()}`,
              url: url,
              name: url.split('/').pop() || 'Media file'
            };
            
            // Determine type based on URL or default to link
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              mediaArrays.images.push(mediaObj);
            } else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
              mediaArrays.videos.push(mediaObj);
            } else if (url.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i)) {
              mediaArrays.documents.push(mediaObj);
            } else {
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
  
    console.log('🔍 PostContext normalizePost - Normalized post:', normalized);
    return normalized;
  };

  // Helper function to check if current user has reacted to a post
  const hasUserReacted = (postId, reactionType) => {
    const currentUserId = user?.user_id || user?.id;
    const postReactions = userReactions[postId];
    if (postReactions && postReactions[reactionType]) {
      return true;
    }
    return false;
  };

  // Helper function to add user reaction to local state
  const addUserReaction = (postId, reactionType) => {
    const currentUserId = user?.user_id || user?.id;
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
    const currentUserId = user?.user_id || user?.id;
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
    if (!user?.user_id && !user?.id) return;
    
    const currentUserId = user?.user_id || user?.id;
    const updatedReactions = { ...userReactions };
    let hasUpdates = false;
    
    posts.forEach(post => {
      const postId = post.post_id || post.id;
      if (!postId) return;
      
      // Check if post has detailed reaction data with user lists
      if (post.reactions && typeof post.reactions === 'object') {
        Object.entries(post.reactions).forEach(([reactionType, reactionData]) => {
          if (reactionData.users && Array.isArray(reactionData.users)) {
            const userHasReacted = reactionData.users.includes(currentUserId);
            
            // Update local tracking if we find the user in the reaction list
            if (userHasReacted && !hasUserReacted(postId, reactionType)) {
              if (!updatedReactions[postId]) {
                updatedReactions[postId] = {};
              }
              updatedReactions[postId][reactionType] = true;
              hasUpdates = true;
              console.log(`🔍 PostContext - Synced user reaction: ${postId} -> ${reactionType}`);
            }
          }
        });
      }
    });
    
    // Update state and localStorage if we found new reactions
    if (hasUpdates) {
      setUserReactions(updatedReactions);
      try {
        localStorage.setItem('userReactions', JSON.stringify(updatedReactions));
      } catch (error) {

      }
    }
  }, [posts, user]);

  // Load posts from backend API on mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        console.log('🔄 PostContext - Loading posts for user:', user?.user_id || user?.id);
        
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
      }
    };

    // Only load posts if user is authenticated
    if (user) {
      console.log('🔄 PostContext - User authenticated, loading posts...');
      loadAllPosts(true); // Reset pagination on initial load
    } else {
      console.log('⚠️ PostContext - No authenticated user, skipping post loading');
      setPosts([]);
      setNextCursor(null);
      setHasMorePosts(true);
    }
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
    
    if (resetPagination) {
      setPosts(normalizedPosts);
    } else {
      // Append new posts for pagination
      setPosts(prevPosts => [...prevPosts, ...normalizedPosts]);
    }
    
    console.log('📄 Pagination state updated:', {
      newPostsCount: normalizedPosts.length,
      totalPosts: resetPagination ? normalizedPosts.length : posts.length + normalizedPosts.length,
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

    
    // Get the stored user_id and author_id locally
    const userId = getCurrentUserId();
    const authorId = getCurrentAuthorId();
    
   
    
    // Verify that user_id equals author_id
    if (userId !== authorId) {
      console.error('❌ CRITICAL: user_id and author_id do NOT match!', { userId, authorId });
    } else {
      console.log('✅ VERIFIED: user_id and author_id match correctly');
    }
    
    // IMPORTANT: Only use the logged-in user's existing ID
    if (!user || !userId || !authorId) {
      console.error('No authenticated user found or missing user_id/author_id. Cannot create post without valid user.');
      throw new Error('You must be logged in to create a post');
    }

    // Use the locally stored user data
    const authorName = user.name || 'User';
    const authorAvatar = user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
    const authorPosition = user.position || 'Employee';

    

    try {
      // Optimistically create the post object first for immediate UI update
      const tempId = `temp-${Date.now()}`;
      const optimisticPost = {
        id: tempId,
        post_id: tempId,
        authorId: authorId,
        author_id: authorId,
        user_id: authorId,
        authorName: authorName,
        authorAvatar: authorAvatar,
        authorPosition: authorPosition,
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
        authorId: authorId,
        author_id: authorId,
        user_id: authorId,
        authorName: authorName,
        authorAvatar: authorAvatar,
        authorPosition: authorPosition,
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
      const userId = user?.user_id || user?.id;
      const newComment = {
        id: result.comment_id || result.id || uuidv4(),
        comment_id: result.comment_id || result.id, // Store the backend comment_id
        author: {
          user_id: userId,
          username: user.username || user.name,
          email: user.email
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
      const userId = user?.user_id || user?.id;
      const newReply = {
        id: result.reply_id || result.id || uuidv4(),
        reply_id: result.reply_id || result.id, // Store the backend reply_id
        authorId: userId,
        authorName: user.name,
        authorAvatar: user.avatar,
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
      const userId = user?.user_id || user?.id;

      await postsAPI.deleteComment(backendCommentId, userId);

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
      newContent,
      userId: user?.user_id || user?.id
    });

    try {
      const userId = user?.user_id || user?.id;
      const apiResponse = await postsAPI.editComment(commentId, userId, newContent);
      
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
      const userId = user?.user_id || user?.id;
      const post = posts.find(p => p.id === postId || p.post_id === postId);
      const comment = post?.comments?.find(c => c.id === commentId || c.comment_id === commentId);
      const backendCommentId = comment?.comment_id || commentId;
      const backendPostId = post?.post_id || postId;

      const response = await postsAPI.addCommentReply(backendPostId, backendCommentId, userId, replyContent);

      // Create optimistic reply object
      const newReply = {
        id: response?.reply_id || `reply-${Date.now()}`,
        reply_id: response?.reply_id,
        content: replyContent,
        author: {
          user_id: userId,
          username: user?.username || user?.name || 'You'
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
    if (!user?.user_id && !user?.id) return;

    // Always use 'like' as the reactionType for likes, never the emoji
    const safeReactionType = reactionType === '❤️' ? 'like' : reactionType;
    const userId = user?.user_id || user?.id;
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

    // Find if user has any reaction on this comment/reply (handle both formats)
    const userPrevReaction = targetComment && Object.keys(targetComment.reactions || {}).find(rt => {
      const r = targetComment.reactions[rt];
      if (!r) return false;
      
      // Handle array format from optimistic updates: [{user_id: 123}, {user_id: 456}]
      if (Array.isArray(r)) {
        return r.some(reaction => 
          reaction.user_id === userId || 
          reaction.id === userId
        );
      }
      
      // Handle object format from API: {users: [123, 456], count: 2}
      if (r.users && Array.isArray(r.users)) {
        return r.users.includes(userId);
      }
      
      return false;
    });

    console.log('🔍 PostContext userPrevReaction detection:', {
      commentId,
      userId,
      userPrevReaction,
      safeReactionType,
      isReply,
      targetCommentReactions: targetComment?.reactions,
      willToggleOff: userPrevReaction === safeReactionType
    });

    try {
      // Remove previous reaction if exists and is different
      if (userPrevReaction && userPrevReaction !== safeReactionType) {
        await postsAPI.deleteCommentReaction(backendCommentId, userPrevReaction);
      }
      // If user is toggling off the same reaction, just remove it
      if (userPrevReaction === safeReactionType) {
        await postsAPI.deleteCommentReaction(backendCommentId, safeReactionType);
      } else {
        // Add the new reaction
        await postsAPI.addCommentReaction(backendCommentId, safeReactionType, reactionEmoji);
      }

      // ✅ OPTIMISTIC UI UPDATE - Update local state immediately
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p !== parentPost) return p;
          
          return {
            ...p,
            comments: p.comments.map(c => {
              // If this is a direct comment reaction
              if (!isReply && (c.id === commentId || c.comment_id === commentId)) {
                // Create updated reactions object for comment - ensure it's properly initialized
                const updatedReactions = { ...(c.reactions || {}) };
                
                // First, remove user from ALL reaction types (since user can only have one reaction)
                Object.keys(updatedReactions).forEach(reactionType => {
                  if (Array.isArray(updatedReactions[reactionType])) {
                    updatedReactions[reactionType] = updatedReactions[reactionType].filter(
                      r => r.user_id !== userId
                    );
                    // Remove the reaction type if no users left
                    if (updatedReactions[reactionType].length === 0) {
                      delete updatedReactions[reactionType];
                    }
                  } else if (updatedReactions[reactionType]) {
                    // Handle non-array reaction structures by converting to array
                    updatedReactions[reactionType] = [];
                  }
                });
                
                // Add user to new reaction (unless toggling off the same reaction)
                if (userPrevReaction !== safeReactionType) {
                  if (!updatedReactions[safeReactionType] || !Array.isArray(updatedReactions[safeReactionType])) {
                    updatedReactions[safeReactionType] = [];
                  }
                  // Add the user to the new reaction type
                  updatedReactions[safeReactionType].push({ user_id: userId });
                }
                
                return {
                  ...c,
                  reactions: updatedReactions
                };
              }
              
              // If this is a reply reaction, update the reply within the comment
              if (isReply && c.replies) {
                return {
                  ...c,
                  replies: c.replies.map(r => {
                    if (r.id === commentId || r.comment_id === commentId) {
                      // Create updated reactions object for reply - ensure it's properly initialized
                      const updatedReactions = { ...(r.reactions || {}) };
                      
                      // First, remove user from ALL reaction types
                      Object.keys(updatedReactions).forEach(reactionType => {
                        if (Array.isArray(updatedReactions[reactionType])) {
                          updatedReactions[reactionType] = updatedReactions[reactionType].filter(
                            reaction => reaction.user_id !== userId
                          );
                          // Remove the reaction type if no users left
                          if (updatedReactions[reactionType].length === 0) {
                            delete updatedReactions[reactionType];
                          }
                        } else if (updatedReactions[reactionType]) {
                          // Handle non-array reaction structures by converting to array
                          updatedReactions[reactionType] = [];
                        }
                      });
                      
                      // Add user to new reaction (unless toggling off the same reaction)
                      if (userPrevReaction !== safeReactionType) {
                        if (!updatedReactions[safeReactionType] || !Array.isArray(updatedReactions[safeReactionType])) {
                          updatedReactions[safeReactionType] = [];
                        }
                        updatedReactions[safeReactionType].push({ user_id: userId });
                      }
                      
                      console.log('🔍 Optimistic reply reaction update:', {
                        replyId: commentId,
                        oldReactions: r.reactions,
                        newReactions: updatedReactions,
                        safeReactionType,
                        userPrevReaction,
                        userId
                      });
                      
                      return {
                        ...r,
                        reactions: updatedReactions
                      };
                    }
                    return r;
                  })
                };
              }
              
              return c;
            })
          };
        })
      );

    } catch (error) {
      console.error('❌ Comment reaction error:', error);
      throw error;
    }
  };



  // Add reaction function - handles both emoji reactions and likes
  const addReaction = async (postId, reactionType, emoji = null, activeView = 'home') => {
    if (!user?.user_id && !user?.id) return;

    // Always use 'like' as the reactionType for likes, never the emoji
    const safeReactionType = reactionType === '❤️' ? 'like' : reactionType;
    const userAlreadyReacted = hasUserReacted(postId, safeReactionType);
    const shouldRemoveReaction = userAlreadyReacted;
    const shouldAddReaction = !userAlreadyReacted;

    try {
      const userId = user?.user_id || user?.id;
      // For likes, do NOT send the emoji to the backend if it doesn't expect it
      const reactionEmoji = safeReactionType === 'like' ? undefined : (emoji || '👍');

     

      // Find the current post to see its current state
      const currentPost = posts.find(p => p.id === postId || p.post_id === postId);
    
      // First, optimistically update local user reaction state
      if (userAlreadyReacted) {
        removeUserReaction(postId, safeReactionType);
      } else {
        addUserReaction(postId, safeReactionType);
      }

      // Then, optimistically update the UI for immediate feedback
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId || post.post_id === postId) {
            const currentReactions = post.reactions || {};
            let updatedReactions = { ...currentReactions };

         

            if (userAlreadyReacted) {
              // Remove reaction (toggle off)
              if (updatedReactions[safeReactionType]) {
                updatedReactions[safeReactionType] = {
                  ...updatedReactions[safeReactionType],
                  count: Math.max(0, (updatedReactions[safeReactionType]?.count || 1) - 1)
                };

                // Remove empty reactions
                if (updatedReactions[safeReactionType].count === 0) {
                  delete updatedReactions[safeReactionType];
                }
              }
            } else {
              // Add reaction (toggle on)
              updatedReactions[safeReactionType] = {
                users: [], // We don't track users in reaction_counts format
                count: (updatedReactions[safeReactionType]?.count || 0) + 1
              };
            }

          

            return {
              ...post,
              reactions: updatedReactions
            };
          }
          return post;
        })
      );

      // Then call backend API based on the ORIGINAL state (before optimistic updates)
      let result;
      if (shouldRemoveReaction) {
        // User already had this reaction, so remove it
        
        result = await postsAPI.removeReaction(postId, safeReactionType);

      } else if (shouldAddReaction) {
        // User didn't have this reaction, so add it
        console.log('🔄 PostContext addReaction - Adding new reaction to backend...');
        if (safeReactionType === 'like') {
          result = await postsAPI.addReaction(postId, safeReactionType);
        } else {
          result = await postsAPI.addReaction(postId, safeReactionType, reactionEmoji);
        }
        console.log('✅ Reaction added successfully:', result);
      }

     

      // Finally, reload posts from backend to ensure consistency (with a small delay to let user see the immediate feedback)
      // Use the appropriate reload function based on the active view
      setTimeout(() => {
        if (activeView === 'myposts') {
          reloadPosts().then(() => {
            console.log('✅ Reloaded user posts after reaction');
          }).catch(error => {
            console.error('❌ Failed to reload user posts after reaction:', error);
          });
        } else {
          // Default to home feed
          loadAllPosts().then(() => {
            console.log('✅ Reloaded home feed after reaction');
          }).catch(error => {
            console.error('❌ Failed to reload home feed after reaction:', error);
          });
        }
      }, 500); // 500ms delay to let the user see the immediate feedback

    } catch (error) {
      console.error('❌ Failed to add/remove reaction:', error.message);

      // If API call fails, revert the optimistic update by reloading posts
      // and reverting local user reaction state based on ORIGINAL state
      console.log('🔄 API failed, reverting optimistic update...');
      if (shouldRemoveReaction) {
        // We tried to remove but failed, so add it back
        addUserReaction(postId, safeReactionType);
      } else if (shouldAddReaction) {
        // We tried to add but failed, so remove it
        removeUserReaction(postId, safeReactionType);
      }

      // Reload the appropriate feed based on active view
      if (activeView === 'myposts') {
        reloadPosts().catch(reloadError => {
          console.error('❌ Failed to reload user posts after reaction error:', reloadError);
        });
      } else {
        loadAllPosts().catch(reloadError => {
          console.error('❌ Failed to reload home feed after reaction error:', reloadError);
        });
      }

      // Don't throw the error to prevent potential page refreshes
     
    }
  };

  const getUserPosts = async (userId) => {
    try {
      // Check if requesting posts for current user
      const currentUserId = getCurrentUserId();
      
      if (userId === currentUserId) {
        // Use backend API for current user's posts
        const backendPosts = await postsAPI.getMyPosts();
        
        // Check the new nested structure
        if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
          return backendPosts.data.posts;
        } else if (Array.isArray(backendPosts.data)) {
          // Fallback to old structure
          return backendPosts.data;
        }
      }
      
      // Fallback: Filter posts from current state for other users
      const userPosts = posts.filter(post => 
        post.authorId === userId || 
        post.author_id === userId || 
        post.user_id === userId
      );
      
      return userPosts;
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
