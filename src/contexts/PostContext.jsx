import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { postsAPI } from '../services/api';

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
  const [tags] = useState([
    'Announcements',
    'Achievements',
    'General Discussion',
    'Policy Updates',
    'Ideas & Suggestions',
    'Training Materials'
  ]);

  // Load posts from backend API on mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        console.log('🚀 Loading user posts from backend...');
        const backendPosts = await postsAPI.getMyPosts();
        
        if (backendPosts && backendPosts.data && backendPosts.data.length > 0) {
          console.log('✅ Loaded user posts from backend:', backendPosts.data.length);
          setPosts(backendPosts.data);
        } else {
          console.log('📝 No posts found for current user, showing empty state');
          setPosts([]);
        }
      } catch (error) {
        console.error('❌ Failed to load user posts from backend:', error.message);
        console.log('📝 Showing empty posts state due to backend error');
        setPosts([]);
      }
    };

    // Only load posts if user is authenticated
    if (user) {
      loadPosts();
    } else {
      console.log('⚠️ No authenticated user, skipping post loading');
      setPosts([]);
    }
  }, [user]);

  // Standalone function to reload posts (can be called after edit/delete)
  const reloadPosts = async () => {
    try {
      console.log('🔄 Reloading user posts from backend...');
      const backendPosts = await postsAPI.getMyPosts();
      
      if (backendPosts && backendPosts.data && backendPosts.data.length > 0) {
        console.log('✅ Reloaded user posts from backend:', backendPosts.data.length);
        setPosts(backendPosts.data);
      } else {
        console.log('📝 No posts found for current user after reload');
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Failed to reload user posts from backend:', error.message);
      setPosts([]);
    }
  };

  // Function to load all posts for home feed
  const loadAllPosts = async () => {
    try {
      console.log('🚀 Loading all posts from backend for home feed...');
      const backendPosts = await postsAPI.getPosts();
      
      if (backendPosts && (backendPosts.data || backendPosts.posts) && (backendPosts.data?.length > 0 || backendPosts.posts?.length > 0)) {
        const postsData = backendPosts.data || backendPosts.posts;
        console.log('✅ Loaded all posts from backend:', postsData.length);
        setPosts(postsData);
      } else {
        console.log('📝 No posts found in home feed');
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Failed to load all posts from backend:', error.message);
      console.log('📝 Showing empty posts state due to backend error');
      setPosts([]);
    }
  };

  const createPost = async (postData) => {
    console.log('Current user object:', user);
    
    // Get the stored user_id and author_id locally
    const userId = getCurrentUserId();
    const authorId = getCurrentAuthorId();
    
    console.log('📍 PostContext - Using user_id:', userId);
    console.log('📍 PostContext - Using author_id:', authorId);
    console.log('📍 PostContext - user object user_id:', user?.user_id);
    console.log('📍 PostContext - user object author_id:', user?.author_id);
    
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

    console.log('✅ Using consistent IDs - user_id:', userId, 'author_id:', authorId);

    try {
      console.log('🚀 Creating post via backend API...');
      const backendResult = await postsAPI.createPost({
        content: postData.content,
        media: postData.images || postData.videos || [],
        mentions: postData.mentions || [],
        tags: postData.tags || []
      });
      
      console.log('✅ Backend post creation successful:', backendResult);
      
      // Create frontend post object with backend data
      const newPost = {
        id: backendResult.post_id || backendResult.id || uuidv4(),
        post_id: backendResult.post_id || `${authorId}POS${Date.now()}`,
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

      // Update posts state (no local storage)
      setPosts(prevPosts => [newPost, ...prevPosts]);
      console.log('✅ Post created successfully:', newPost);
      
      return newPost;

    } catch (error) {
      console.error('❌ Post creation failed:', error.message);
      throw new Error('Failed to create post: ' + error.message);
    }
  };

  const editPost = async (postId, updatedData) => {
    if (!user) return;

    try {
      console.log('🔍 PostContext editPost - Post ID:', postId);
      console.log('🔍 PostContext editPost - Updated data:', updatedData);
      
      // Call the API to update the post
      const apiResponse = await postsAPI.updatePost(postId, updatedData);
      console.log('🔍 PostContext editPost - API response:', apiResponse);
      
      // Reload posts from backend to get the latest data
      await reloadPosts();
      
      console.log('✅ Post updated and reloaded:', postId);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const deletePost = async (postId) => {
    if (!user) return;

    try {
      // Call the API to delete the post
      await postsAPI.deletePost(postId);
      
      // Remove from local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      console.log('✅ Post deleted:', postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  const likePost = (postId) => {
    if (!user?.id) return;

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const likes = post.likes || [];
          const hasLiked = likes.includes(user.id);
          
          return {
            ...post,
            likes: hasLiked
              ? likes.filter(id => id !== user.id)
              : [...likes, user.id]
          };
        }
        return post;
      })
    );
  };

  const addComment = (postId, commentData) => {
    if (!user) return;

    const newComment = {
      id: uuidv4(),
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content: commentData.content,
      timestamp: new Date().toISOString(),
      likes: []
    };

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...(post.comments || []), newComment] }
          : post
      )
    );
  };

  const getUserPosts = async (userId) => {
    try {
      // Check if requesting posts for current user
      const currentUserId = getCurrentUserId();
      
      if (userId === currentUserId) {
        // Use backend API for current user's posts
        console.log('🚀 Fetching current user posts from backend...');
        const backendPosts = await postsAPI.getMyPosts();
        
        if (backendPosts && backendPosts.data) {
          console.log('✅ Retrieved current user posts from backend:', backendPosts.data.length);
          return backendPosts.data;
        }
      }
      
      // Fallback: Filter posts from current state for other users
      const userPosts = posts.filter(post => 
        post.authorId === userId || 
        post.author_id === userId || 
        post.user_id === userId
      );
      
      console.log('✅ Retrieved user posts from state:', userPosts.length);
      return userPosts;
    } catch (error) {
      console.error('Error getting user posts:', error);
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
    likePost,
    addComment,
    getUserPosts,
    pinPost,
    searchPosts,
    getPostsByTag,
    getFilteredPosts,
    reloadPosts,
    loadAllPosts
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};
