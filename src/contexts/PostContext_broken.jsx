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

  // Get notification context if available
  const [notificationContext, setNotificationContext] = useState(null);

  // Debug: Log user changes to track state issues
  useEffect(() => {
    console.log('PostContext - User state changed:', user);
    console.log('PostContext - User has id?', user?.id);
  }, [user]);

  useEffect(() => {
    // Try to get notification context
    const tryGetNotificationContext = () => {
      try {
        // This will be available after NotificationProvider is loaded
        const { useNotification } = require('./NotificationContext');
        // We can't use the hook here, but we'll handle notifications in components
      } catch (e) {
        // NotificationContext not available yet
      }
    };
    tryGetNotificationContext();
  }, []);

  // Initialize with some sample posts
  useEffect(() => {
    const samplePosts = [
      {
        id: '688485a0e9beaf67620d6676',
        post_id: '43368POS55750',
        authorId: 'USR43368',
        author_id: 'USR43368',
        user_id: 'USR43368', // user_id same as author_id
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
      },
      {
        id: '2',
        authorId: '3',
        author_id: 'USR3', // Add author_id for consistency
        user_id: 'USR3', // user_id same as author_id
        authorName: 'Emily Rodriguez',
        authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        authorPosition: 'HR Business Partner',
        content: '<p><strong>Monthly Recognition:</strong> Congratulations to our team members who went above and beyond this month! 🌟</p><ul><li>Outstanding teamwork on the Q4 recruitment drive</li><li>Excellent collaboration on policy updates</li><li>Innovation in employee engagement initiatives</li></ul>',
        images: [],
        videos: [],
        documents: [],
        links: [],
        tags: ['Achievements'],
        mentions: [],
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        likes: ['1', '2', '4', '5'],
        comments: []
      },
      {
        id: '3',
        authorId: '1',
        author_id: 'USR1', // Add author_id for consistency
        user_id: 'USR1', // user_id same as author_id
        authorName: 'Sarah Johnson',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b5b34b7d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        authorPosition: 'HR Manager',
        content: '<p>Here are the updated job offer letters for the new positions. Please review and let me know if you have any questions.</p>',
        images: [],
        videos: [],
        documents: [
          {
            id: 'doc1',
            name: 'Job Offer Letters - 03012024 (24).pdf',
            size: 245760,
            type: 'application/pdf',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            isPDF: true,
            uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ],
        links: [],
        tags: ['Policy Updates'],
        mentions: [],
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likes: ['2', '3'],
        comments: [],
        reactions: {
          like: { users: ['2'], count: 1 },
          love: { users: ['3'], count: 1 }
        }
      }
    ];
    setPosts(samplePosts);
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
        id: uuidv4(),
        post_id: `43368POS${Date.now()}`, // Correct format: 43368POS55750 (not using authorId)
        authorId: authorId,
        author_id: authorId, // Use the existing user's ID (like USR65784)
        user_id: authorId, // user_id should be same as author_id (like USR65784)
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

      setPosts(prevPosts => [newPost, ...prevPosts]);
      return newPost;
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
  };

  const deletePost = async (postId) => {
    if (!user) return;

    try {
      // Try to delete via API first
      const post = posts.find(p => p.id === postId);
      if (post && post.post_id) {
        console.log('Deleting post via API:', post.post_id);
        await postAPI.deletePost(post.post_id, user.id);
        console.log('Post deleted successfully via API');
      }
    } catch (error) {
      console.error('Failed to delete post via API:', error);
      // Continue with local deletion even if API fails
    }

    // Remove from local state
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const likePost = (postId) => {
    if (!user) return;

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

  const addComment = (postId, commentContent) => {
    if (!user) return;

    const newComment = {
      id: uuidv4(),
      authorId: user.id,
      author_id: user.id, // Ensure author_id is consistent
      user_id: user.id, // user_id should be same as author_id
      authorName: user.name,
      authorAvatar: user.avatar,
      content: commentContent,
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

    return newComment;
  };

  const likeComment = (postId, commentId) => {
    if (!user) return;

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id === commentId) {
                const likes = comment.likes || [];
                const hasLiked = likes.includes(user.id);
                
                return {
                  ...comment,
                  likes: hasLiked
                    ? likes.filter(id => id !== user.id)
                    : [...likes, user.id]
                };
              }
              return comment;
            })
          };
        }
        return post;
      })
    );
  };

  const addReply = (postId, commentId, replyContent) => {
    if (!user || !replyContent.trim()) return;

    const newReply = {
      id: uuidv4(),
      authorId: user.id,
      author_id: user.id, // Ensure author_id is consistent
      user_id: user.id, // user_id should be same as author_id
      authorName: user.name,
      authorAvatar: user.avatar,
      content: replyContent.trim(),
      timestamp: new Date().toISOString(),
      likes: []
    };

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newReply]
                };
              }
              return comment;
            })
          };
        }
        return post;
      })
    );

    return newReply;
  };

  const deleteComment = (postId, commentId) => {
    if (!user) return;

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.filter(comment => comment.id !== commentId)
          };
        }
        return post;
      })
    );
  };

  const deleteReply = (postId, commentId, replyId) => {
    if (!user) return;

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies?.filter(reply => reply.id !== replyId) || []
                };
              }
              return comment;
            })
          };
        }
        return post;
      })
    );
  };

  const addReaction = (postId, reactionType) => {
    if (!user) return;

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const currentReactions = post.reactions || {};
          const userReactions = currentReactions[reactionType]?.users || [];
          
          let updatedReactions = { ...currentReactions };
          
          if (userReactions.includes(user.id)) {
            // Remove reaction
            updatedReactions[reactionType] = {
              ...updatedReactions[reactionType],
              users: userReactions.filter(id => id !== user.id),
              count: Math.max(0, (updatedReactions[reactionType]?.count || 1) - 1)
            };
            
            // Remove empty reactions
            if (updatedReactions[reactionType].count === 0) {
              delete updatedReactions[reactionType];
            }
          } else {
            // Remove any existing reaction by this user first
            Object.keys(updatedReactions).forEach(type => {
              if (updatedReactions[type].users?.includes(user.id)) {
                updatedReactions[type] = {
                  ...updatedReactions[type],
                  users: updatedReactions[type].users.filter(id => id !== user.id),
                  count: Math.max(0, updatedReactions[type].count - 1)
                };
                
                if (updatedReactions[type].count === 0) {
                  delete updatedReactions[type];
                }
              }
            });
            
            // Add new reaction
            updatedReactions[reactionType] = {
              users: [...(updatedReactions[reactionType]?.users || []), user.id],
              count: (updatedReactions[reactionType]?.count || 0) + 1
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
  };

  const getFilteredPosts = (filters = {}) => {
    let filteredPosts = [...posts];

    if (filters.tag && filters.tag !== 'all') {
      filteredPosts = filteredPosts.filter(post =>
        post.tags.includes(filters.tag)
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        post.content.toLowerCase().includes(searchTerm) ||
        post.authorName.toLowerCase().includes(searchTerm)
      );
    }

    return filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getPostById = (postId) => {
    return posts.find(post => post.id === postId);
  };

  const getUserPosts = async (userId) => {
    try {
      // Use userId directly since author_id in database expects USR format
      const authorId = userId;
      
      // Make POST request to /posts/me with author_id in body
      console.log('API: Fetching posts for author_id:', authorId);
      console.log('API: Making POST request to http://localhost:8000/api/wall/posts/me');
      const response = await postAPI.getMyPosts(authorId);
      console.log('API response for user posts:', response);
      
      // Handle different response structures
      let posts = [];
      if (response.posts) {
        posts = response.posts;
      } else if (Array.isArray(response)) {
        posts = response;
      } else if (response.data && Array.isArray(response.data)) {
        posts = response.data;
      }
      
      // Transform API posts to match our frontend structure
      const transformedPosts = posts.map(post => ({
        id: post.id || post._id, // Use database _id or id
        post_id: post.post_id,
        authorId: post.author_id,
        author_id: post.author_id,
        user_id: post.author_id, // user_id should be same as author_id
        authorName: user?.name || 'User',
        authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        authorPosition: user?.position || 'Employee',
        content: post.content,
        images: post.media?.filter(url => 
          typeof url === 'string' && (
            url.includes('.jpg') || url.includes('.png') || 
            url.includes('.jpeg') || url.includes('.gif') ||
            url.includes('.webp')
          )
        ) || [],
        videos: post.media?.filter(url => 
          typeof url === 'string' && (
            url.includes('.mp4') || url.includes('.avi') || 
            url.includes('.mov') || url.includes('.webm')
          )
        ) || [],
        documents: post.media?.filter(url => 
          typeof url === 'string' && (
            url.includes('.pdf') || url.includes('.doc') || 
            url.includes('.docx') || url.includes('.txt')
          )
        ) || [],
        links: [], // Handle links separately if needed
        tags: post.tags || [], // Keep tags as tags
        mentions: post.mentions || [],
        timestamp: post.created_at || post.updated_at,
        likes: [],
        comments: [],
        reactions: post.reactions || {},
        is_pinned: post.is_pinned || false,
        is_comments_allowed: post.is_comments_allowed !== false,
        is_broadcast: post.is_broadcast || false,
        created_at: post.created_at,
        updated_at: post.updated_at
      }));
      
      console.log('Processed API posts:', transformedPosts);
      return transformedPosts;
    } catch (error) {
      console.log('API fetch failed, returning local posts:', error);
      // Fallback to local posts, checking multiple possible ID fields
      const localPosts = posts.filter(post => 
        post.authorId === userId || 
        post.author_id === userId ||
        post.user_id === userId
      );
      console.log('Local posts fallback:', localPosts);
      return localPosts;
    }
  };

  const value = {
    posts,
    tags,
    createPost,
    editPost,
    deletePost,
    likePost,
    addComment,
    likeComment,
    deleteComment,
    addReply,
    deleteReply,
    addReaction,
    getFilteredPosts,
    getPostById,
    getUserPosts
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};
