import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

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

  // Load posts from localStorage on mount
  useEffect(() => {
    const storedPosts = JSON.parse(localStorage.getItem('hrPosts') || '[]');
    if (storedPosts.length > 0) {
      setPosts(storedPosts);
    } else {
      // Initialize with sample posts if no stored posts
      const samplePosts = [
        {
          id: '688485a0e9beaf67620d6676',
          post_id: '43368POS55750',
          authorId: 'USR43368',
          author_id: 'USR43368',
          user_id: 'USR43368',
          authorName: 'Sarah Johnson',
          authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b5b34b7d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          authorPosition: 'HR Manager',
          content: 'Just finished our weekly sprint demo! Great progress by the team 🚀',
          images: [],
          videos: [],
          documents: [],
          links: [],
          tags: ['update', 'team', 'sprint'],
          mentions: ['harry123', 'jane_doe'],
          timestamp: '2025-07-26T13:07:03.207607',
          likes: ['2', '3', '4'],
          comments: [],
          reactions: {},
          is_pinned: false,
          is_comments_allowed: true,
          is_broadcast: false,
          created_at: '2025-07-26T13:07:03.207607',
          updated_at: '2025-07-26T13:07:03.207607'
        }
      ];
      setPosts(samplePosts);
      localStorage.setItem('hrPosts', JSON.stringify(samplePosts));
    }
  }, []);

  const createPost = async (postData) => {
    console.log('Current user object:', user);
    
    // Get the stored user_id and author_id locally
    const userId = getCurrentUserId();
    const authorId = getCurrentAuthorId();
    
    console.log('Using locally stored user_id:', userId);
    console.log('Using locally stored author_id:', authorId);
    
    // IMPORTANT: Only use the logged-in user's existing ID
    if (!user || !userId || !authorId) {
      console.error('No authenticated user found or missing user_id/author_id. Cannot create post without valid user.');
      throw new Error('You must be logged in to create a post');
    }

    // Use the locally stored user data
    const authorName = user.name || 'User';
    const authorAvatar = user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
    const authorPosition = user.position || 'Employee';

    console.log('✅ Using stored IDs - user_id:', userId, 'author_id:', authorId);

    try {
      // Create post locally (frontend only)
      const newPost = {
        id: uuidv4(),
        post_id: `43368POS${Date.now()}`,
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
        updated_at: new Date().toISOString()
      };

      // Store posts in localStorage
      const existingPosts = JSON.parse(localStorage.getItem('hrPosts') || '[]');
      const updatedPosts = [newPost, ...existingPosts];
      localStorage.setItem('hrPosts', JSON.stringify(updatedPosts));

      setPosts(prevPosts => [newPost, ...prevPosts]);
      console.log('✅ Post created locally:', newPost);
      
      return newPost;

    } catch (error) {
      console.error('Post creation failed:', error);
      throw new Error('Failed to create post: ' + error.message);
    }
  };

  const editPost = (postId, updatedData) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, ...updatedData, updatedAt: new Date().toISOString() }
          : post
      )
    );

    // Update localStorage
    const updatedPosts = posts.map(post =>
      post.id === postId
        ? { ...post, ...updatedData, updatedAt: new Date().toISOString() }
        : post
    );
    localStorage.setItem('hrPosts', JSON.stringify(updatedPosts));
  };

  const deletePost = async (postId) => {
    if (!user) return;

    try {
      // Remove from local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      // Update localStorage
      const updatedPosts = posts.filter(post => post.id !== postId);
      localStorage.setItem('hrPosts', JSON.stringify(updatedPosts));
      
      console.log('✅ Post deleted locally:', postId);
    } catch (error) {
      console.error('Error deleting post:', error);
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

    // Update localStorage
    const updatedPosts = posts.map(post => {
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
    });
    localStorage.setItem('hrPosts', JSON.stringify(updatedPosts));
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

    // Update localStorage
    const updatedPosts = posts.map(post =>
      post.id === postId
        ? { ...post, comments: [...(post.comments || []), newComment] }
        : post
    );
    localStorage.setItem('hrPosts', JSON.stringify(updatedPosts));
  };

  const getUserPosts = async (userId) => {
    try {
      // Filter posts by user ID from localStorage
      const userPosts = posts.filter(post => 
        post.authorId === userId || 
        post.author_id === userId || 
        post.user_id === userId
      );
      
      console.log('✅ Retrieved user posts locally:', userPosts);
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

    // Update localStorage
    const updatedPosts = posts.map(post =>
      post.id === postId
        ? { ...post, is_pinned: !post.is_pinned }
        : post
    );
    localStorage.setItem('hrPosts', JSON.stringify(updatedPosts));
  };

  const searchPosts = (query) => {
    if (!query.trim()) return posts;
    
    const lowercaseQuery = query.toLowerCase();
    return posts.filter(post =>
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.authorName.toLowerCase().includes(lowercaseQuery) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  };

  const getPostsByTag = (tag) => {
    return posts.filter(post => 
      post.tags && post.tags.includes(tag)
    );
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
    getPostsByTag
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};
