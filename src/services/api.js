// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/wall',
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Helper function to handle API responses
const handleResponse = async (response) => {
  let data;
  
  try {
    data = await response.json();
  } catch (error) {
    // If response is not JSON, create a generic error response
    data = { message: 'Invalid response format' };
  }
  
  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

// Helper function to create fetch requests with timeout
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...API_CONFIG.HEADERS,
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
};

// Helper function to log API calls (for debugging)
const logApiCall = (method, endpoint, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 API ${method}: ${endpoint}`, data ? { data } : '');
  }
};

// =============================================================================
// LOCAL STORAGE MANAGEMENT
// =============================================================================

const StorageManager = {
  // Storage keys
  KEYS: {
    USER_ID: 'userId',
    USER_SESSION: 'userSession',
    HR_USER: 'hrUser',
    HR_POSTS: 'hrPosts',
    REGISTERED_USERS: 'registeredUsers'
  },

  // Get item from localStorage with error handling
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },

  // Set item to localStorage with error handling
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  // Remove item from localStorage
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  // Clear specific user-related data
  clearUserData: () => {
    const keysToRemove = [
      StorageManager.KEYS.USER_ID,
      StorageManager.KEYS.USER_SESSION,
      StorageManager.KEYS.HR_USER
    ];
    
    keysToRemove.forEach(key => StorageManager.removeItem(key));
  },

  // Clear all application data
  clearAllData: () => {
    Object.values(StorageManager.KEYS).forEach(key => StorageManager.removeItem(key));
  }
};

// =============================================================================
// USER MANAGEMENT APIs
// =============================================================================
export const userAPI = {
  // Create new user
  createUser: async (userData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/create_user`;
    logApiCall('POST', endpoint, userData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          username: userData.username,
          email: userData.email
        })
      });
      
      const result = await handleResponse(response);
      
      // Store user_id and session data
      if (result.user_id) {
        StorageManager.setItem(StorageManager.KEYS.USER_ID, result.user_id);
        StorageManager.setItem(StorageManager.KEYS.USER_SESSION, {
          user_id: result.user_id,
          username: userData.username,
          email: userData.email,
          created_at: new Date().toISOString()
        });
        
        console.log('✅ User created and stored:', result.user_id);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Create user error:', error.message);
      throw error;
    }
  },

  // Login user
  login: async (loginData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/login`;
    logApiCall('POST', endpoint, loginData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      
      const result = await handleResponse(response);
      
      // Store user session data
      if (result.user_id || result.id) {
        const userId = result.user_id || result.id;
        StorageManager.setItem(StorageManager.KEYS.USER_ID, userId);
        StorageManager.setItem(StorageManager.KEYS.USER_SESSION, {
          user_id: userId,
          username: result.username || loginData.username,
          email: result.email || loginData.email,
          logged_in_at: new Date().toISOString()
        });
        
        console.log('✅ User logged in and stored:', userId);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Login error:', error.message);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Could call backend logout endpoint here if needed
      // const endpoint = `${API_CONFIG.BASE_URL}/logout`;
      // await fetchWithTimeout(endpoint, { method: 'POST' });
      
      StorageManager.clearUserData();
      console.log('✅ User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error.message);
      // Still clear local data even if backend call fails
      StorageManager.clearUserData();
      throw error;
    }
  },

  // Get current user ID from storage
  getCurrentUserId: () => {
    return StorageManager.getItem(StorageManager.KEYS.USER_ID);
  },

  // Get full user session from storage
  getUserSession: () => {
    return StorageManager.getItem(StorageManager.KEYS.USER_SESSION);
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/users/${userId}`;
    logApiCall('PUT', endpoint, profileData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      const result = await handleResponse(response);
      
      // Update stored session data
      const currentSession = userAPI.getUserSession();
      if (currentSession) {
        StorageManager.setItem(StorageManager.KEYS.USER_SESSION, {
          ...currentSession,
          ...profileData,
          updated_at: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Update profile error:', error.message);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/users/${userId}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get user error:', error.message);
      throw error;
    }
  },

  // Clear user session
  clearSession: () => {
    StorageManager.clearUserData();
    console.log('✅ User session cleared');
  }
};

// =============================================================================
// POSTS MANAGEMENT APIs
// =============================================================================

export const postsAPI = {
  // Create new post
  createPost: async (postData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/create_post`;
    
    try {
      // Get author_id from stored user session
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in. Please login first.');
      }

      const requestBody = {
        author_id: userId,
        content: postData.content,
        ...(postData.media && postData.media.length > 0 && { media: postData.media }),
        ...(postData.mentions && postData.mentions.length > 0 && { mentions: postData.mentions }),
        // Process tags to extract just the tag names, not the nested objects
        ...(postData.tags && postData.tags.length > 0 && { 
          tags: postData.tags.map(tag => {
            // If tag is an object with tag_name, extract just the name
            if (typeof tag === 'object' && tag.tag_name) {
              return tag.tag_name;
            }
            // If tag is already a string, use it as is  
            return tag;
          })
        }),
        // If no tags are provided, explicitly send empty array
        ...((!postData.tags || postData.tags.length === 0) && { tags: [] })
      };

      console.log('🔍 API createPost - Original tags:', postData.tags);
      console.log('🔍 API createPost - Processed tags:', requestBody.tags);

      logApiCall('POST', endpoint, requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Post created successfully:', result.post_id || result.id);
      
      return result;
    } catch (error) {
      console.error('❌ Create post error:', error.message);
      throw error;
    }
  },

  // Get all posts with pagination support
  getPosts: async (page = 1, limit = 10, lastPostId = null) => {
    let endpoint;
    if (lastPostId) {
      // Use cursor-based pagination
      endpoint = `${API_CONFIG.BASE_URL}/posts?lastPostId=${lastPostId}&limit=${limit}`;
    } else {
      // Initial request or fallback to page-based pagination
      endpoint = `${API_CONFIG.BASE_URL}/posts?limit=${limit}`;
    }
    
    console.log('🔄 API getPosts - Endpoint:', endpoint);
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      console.log(`✅ Retrieved ${result.posts?.length || result.data?.posts?.length || result.data?.length || 0} posts from home feed`);
      console.log('🔍 API getPosts - Full response structure:', result);
      console.log('🔍 API getPosts - Response keys:', Object.keys(result));
      console.log('🔍 API getPosts - Data structure:', result.data ? Object.keys(result.data) : 'No data object');
      console.log('🔍 API getPosts - Pagination info:', {
        hasNextCursor: !!(result.data?.nextCursor || result.nextCursor),
        nextCursor: result.data?.nextCursor || result.nextCursor,
        hasLastPostId: !!(result.data?.lastPostId || result.lastPostId),
        lastPostId: result.data?.lastPostId || result.lastPostId,
        hasMore: result.data?.hasMore || result.hasMore
      });
       
      return result;
    } catch (error) {
      console.error('❌ Get posts error:', error.message);
      throw error;
    }
  },

  // Get current user's posts (requires authentication)
  getMyPosts: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/me`;
    
    try {
      // Get author_id from stored user session
      const userId = userAPI.getCurrentUserId();
      console.log('🔍 API getMyPosts - Current user ID:', userId);
      
      if (!userId) {
        throw new Error('User not logged in. Please login first.');
      }

      const requestBody = {
        author_id: userId
      };

      console.log('🔍 API getMyPosts - Request body:', requestBody);
      console.log('🔍 API getMyPosts - Endpoint:', endpoint);
      logApiCall('POST', endpoint, requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('🔍 API getMyPosts - Full response:', result);
      console.log(`✅ Retrieved ${result.data?.length || 0} posts for current user:`, userId);
      console.log('🔍 API getMyPosts - First post structure:', result.data?.[0]);
      
      return result;
    } catch (error) {
      console.error('❌ Get my posts error:', error.message);
      console.error('❌ Full error details:', error);
      throw error;
    }
  },

  // Get posts by user
  getUserPosts: async (userId, page = 1, limit = 20) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/user/${userId}?page=${page}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      console.log(`✅ Retrieved ${result.posts?.length || 0} posts for user ${userId}`);
      
      return result;
    } catch (error) {
      console.error('❌ Get user posts error:', error.message);
      throw error;
    }
  },

  // Get single post by ID
  getPostById: async (postId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/get_single_post`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get post error:', error.message);
      throw error;
    }
  },

  // Update post
  updatePost: async (postId, updateData) => {
    // Use post_id from the data if available, otherwise use the passed postId
    const actualPostId = updateData.post_id || postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/edit/${actualPostId}`;
    
    // Get author_id from stored user session
    const userId = userAPI.getCurrentUserId();
    if (!userId) {
      throw new Error('User not logged in. Please login first.');
    }
    
    // Transform the data to match backend expectations
    const backendData = {
      author_id: userId, // Add author_id as required by backend
      content: updateData.content,
      post_content: updateData.content, // Fallback field name
      // Process tags to extract just the tag names, not the nested objects
      ...(updateData.tags && updateData.tags.length > 0 && { 
        tags: updateData.tags.map(tag => {
          // If tag is an object with tag_name, extract just the name
          if (typeof tag === 'object' && tag.tag_name) {
            return tag.tag_name;
          }
          // If tag is already a string, use it as is  
          return tag;
        })
      }),
      // If no tags are provided, explicitly send empty array to clear existing tags
      ...((!updateData.tags || updateData.tags.length === 0) && { tags: [] }),
      // Combine all media into single media array with proper format
      ...(() => {
        const allMedia = [
          // Images as media objects
          ...(updateData.images || []).filter(img => img && (typeof img === 'string' || img.url)).map(img => ({ 
            link: typeof img === 'string' ? img : img.url 
          })),
          // Videos as media objects  
          ...(updateData.videos || []).filter(vid => vid && (typeof vid === 'string' || vid.url)).map(vid => ({ 
            link: typeof vid === 'string' ? vid : vid.url 
          })),
          // Documents as media objects
          ...(updateData.documents || []).filter(doc => doc && (typeof doc === 'string' || doc.url)).map(doc => ({ 
            link: typeof doc === 'string' ? doc : doc.url 
          })),
          // Links as media objects
          ...(updateData.links || []).filter(link => link && (typeof link === 'string' || link.url)).map(link => ({ 
            link: typeof link === 'string' ? link : link.url 
          }))
        ];
        
        // Always send media array, even if empty (to clear existing media)
        console.log('🔍 API updatePost - All media combined:', allMedia);
        console.log('🔍 API updatePost - Update data breakdown:', {
          images: updateData.images,
          videos: updateData.videos,
          documents: updateData.documents,
          links: updateData.links
        });
        return { media: allMedia };
      })(),
      ...(updateData.mentions && { mentions: updateData.mentions })
    };
    
    // console.log('🔍 API updatePost - Original data:', updateData);
    // console.log('🔍 API updatePost - Original tags:', updateData.tags);
    // console.log('🔍 API updatePost - Processed tags:', backendData.tags);
    // console.log('🔍 API updatePost - Transformed data:', backendData);
    // console.log('🔍 API updatePost - Post ID:', actualPostId);
    // console.log('🔍 API updatePost - Author ID:', userId);
    // console.log('🔍 API updatePost - Endpoint:', endpoint);
    logApiCall('POST', endpoint, backendData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(backendData)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Post updated successfully:', actualPostId);
      console.log('🔍 Backend response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Update post error:', error.message);
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    // Handle both direct postId and post data with post_id
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/delete/${actualPostId}`;
    
    // Get author_id from stored user session
    const userId = userAPI.getCurrentUserId();
    if (!userId) {
      throw new Error('User not logged in. Please login first.');
    }
    
    // Prepare request body with author_id as required by backend
    const requestBody = {
      author_id: userId
    };
    
    console.log('🔍 API deletePost - Post ID:', actualPostId);
    console.log('🔍 API deletePost - Author ID:', userId);
    console.log('🔍 API deletePost - Endpoint:', endpoint);
    console.log('🔍 API deletePost - Request body:', requestBody);
    logApiCall('POST', endpoint, requestBody);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Post deleted successfully:', actualPostId);
      console.log('🔍 Backend response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Delete post error:', error.message);
      throw error;
    }
  },

  // Like/Unlike post
  toggleLike: async (postId) => {
    // Ensure postId is properly extracted if it's an object
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${actualPostId}/reactions`;
    
    // console.log('🔍 API toggleLike - Original postId:', postId);
    // console.log('🔍 API toggleLike - Actual postId:', actualPostId);
    // console.log('🔍 API toggleLike - Endpoint:', endpoint);
    logApiCall('POST', endpoint);
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      const requestBody = { user_id: String(userId) };
      console.log('🔍 API toggleLike - Request body:', requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Like toggled successfully for post:', actualPostId);
      console.log('🔍 Backend response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Toggle like error:', error.message);
      console.error('❌ Full error details:', error);
      throw error;
    }
  },

  // Add post reaction
  addReaction: async (postId, reactionType, emoji) => {
    // Ensure postId is properly extracted if it's an object
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${actualPostId}/reactions`;
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in. Please login first.');
      }

      // Ensure userId is sent as string, not number
      const requestBody = {
        user_id: String(userId),
        reaction_type: reactionType,
        emoji: emoji
      };

      console.log('🔍 API addReaction - Original postId:', postId);
      console.log('🔍 API addReaction - Actual postId:', actualPostId);
      console.log('🔍 API addReaction - User ID (raw):', userId);
      console.log('🔍 API addReaction - User ID (string):', String(userId));
      console.log('🔍 API addReaction - Reaction Type:', reactionType);
      console.log('🔍 API addReaction - Emoji:', emoji);
      console.log('🔍 API addReaction - Request body:', requestBody);
      console.log('🔍 API addReaction - Endpoint:', endpoint);
      logApiCall('POST', endpoint, requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Reaction added successfully for post:', actualPostId);
      console.log('🔍 Backend response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Add reaction error:', error.message);
      console.error('❌ Full error details:', error);
      throw error;
    }
  },

  // Remove post reaction
  removeReaction: async (postId, reactionType) => {
    // Ensure postId is properly extracted if it's an object
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${actualPostId}/reactions/delete`;
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in. Please login first.');
      }

      // Ensure userId is sent as string, not number
      const requestBody = {
        user_id: String(userId),
        reaction_type: reactionType
      };

      console.log('🔍 API removeReaction - Original postId:', postId);
      console.log('🔍 API removeReaction - Actual postId:', actualPostId);
      console.log('🔍 API removeReaction - User ID (raw):', userId);
      console.log('🔍 API removeReaction - User ID (string):', String(userId));
      console.log('🔍 API removeReaction - Reaction Type:', reactionType);
      console.log('🔍 API removeReaction - Request body:', requestBody);
      console.log('🔍 API removeReaction - Endpoint:', endpoint);
      logApiCall('POST', endpoint, requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Reaction removed successfully for post:', actualPostId);
      console.log('🔍 Backend response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Remove reaction error:', error.message);
      console.error('❌ Full error details:', error);
      throw error;
    }
  },

  // Add comment to post
  addComment: async (postId, commentData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments`;
    logApiCall('POST', endpoint, commentData);
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }
      // The backend expects { user_id, content }
      const requestBody = {
        user_id: userId,
        content: commentData.content || commentData.comment // always send as 'content'
      };
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Add comment error:', error.message);
      throw error;
    }
  },

  // Get comments for post
  getComments: async (postId, page = 1, limit = 20) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments?page=${page}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get comments error:', error.message);
      throw error;
    }
  },

  // Add reply to comment
  addReply: async (postId, commentId, replyData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}/replies`;
    logApiCall('POST', endpoint, replyData);
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      const requestBody = {
        content: replyData.content,
        user_id: userId
      };

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Add reply error:', error.message);
      throw error;
    }
  },

  // Delete comment (only post author can delete)
  deleteComment: async (postId, commentId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}`;
    logApiCall('DELETE', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'DELETE'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Delete comment error:', error.message);
      throw error;
    }
  },

  // Delete reply
  deleteReply: async (postId, commentId, replyId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}`;
    logApiCall('DELETE', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'DELETE'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Delete reply error:', error.message);
      throw error;
    }
  },

  // Add reaction to comment
  addCommentReaction: async (commentId, reactionType, emoji = null) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/reactions`;
    logApiCall('POST', endpoint, { reactionType, emoji });
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      const requestBody = {
        user_id: userId,
        reaction_type: reactionType
      };

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Add comment reaction error:', error.message);
      throw error;
    }
  },

  // Delete reaction from comment
  deleteCommentReaction: async (commentId, reactionType) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/reactions/delete`;
    logApiCall('POST', endpoint, { reactionType });
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      const requestBody = {
        reaction_type: reactionType,
        user_id: userId
      };

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Delete comment reaction error:', error.message);
      throw error;
    }
  },
  // Delete comment by comment_id and user_id (POST)
  deleteComment: async (commentId, userId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/delete`;
    logApiCall('POST', endpoint, { user_id: userId });
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
    });
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Delete comment error:', error.message);
      throw error;
    }
  },

  // Edit comment by comment_id and user_id (POST)
  editComment: async (commentId, userId, content) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/edit`;
    
    // Try multiple field names to match backend expectations
    const requestBody = {
      user_id: userId,
      content: content,        // Primary field name
      comment: content,        // Fallback field name
      new_content: content     // Alternative field name
    };
    
    console.log('🔍 API editComment:', {
      commentId,
      userId,
      content,
      requestBody,
      endpoint
    });
    
    logApiCall('POST', endpoint, requestBody);
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('🔍 API editComment response:', result);
      return result;
    } catch (error) {
      console.error('❌ Edit comment error:', error.message);
      throw error;
    }
  },

  // Add reply to comment
  addCommentReply: async (postId, commentId, userId, content) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}/replies`;
    logApiCall('POST', endpoint, { user_id: userId, content });
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ 
          user_id: userId,
          content: content 
        })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Add comment reply error:', error.message);
      throw error;
    }
  },

  // Report post
  reportPost: async (postId, reason) => {
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${actualPostId}/report`;
    
    try {
      // Get user_id from localStorage, fallback to author_id
      let user_id = userAPI.getCurrentUserId();
      if (!user_id) {
        user_id = StorageManager.getItem('author_id');
      }
      
      if (!user_id) {
        throw new Error('User not logged in. Please login first.');
      }

      const requestBody = {
        user_id: user_id,
        reason: reason
      };

      console.log('🔍 API reportPost - Post ID:', actualPostId);
      console.log('🔍 API reportPost - User ID:', user_id);
      console.log('🔍 API reportPost - Reason:', reason);
      console.log('🔍 API reportPost - Request body:', requestBody);
      logApiCall('POST', endpoint, requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const result = await handleResponse(response);
      console.log('✅ Post reported successfully:', actualPostId);
      return result;
    } catch (error) {
      console.error('❌ Report post error:', error.message);
      throw error;
    }
  },

  // Report comment
  reportComment: async (commentId, reason) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/report`;
    
    try {
      // Get user_id from localStorage, fallback to author_id
      let user_id = userAPI.getCurrentUserId();
      if (!user_id) {
        user_id = StorageManager.getItem('author_id');
      }
      
      if (!user_id) {
        throw new Error('User not logged in. Please login first.');
      }

      const requestBody = {
        user_id: user_id,
        reason: reason
      };

      console.log('🔍 API reportComment - Comment ID:', commentId);
      console.log('🔍 API reportComment - User ID:', user_id);
      console.log('🔍 API reportComment - Reason:', reason);
      console.log('🔍 API reportComment - Request body:', requestBody);
      logApiCall('POST', endpoint, requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const result = await handleResponse(response);
      console.log('✅ Comment reported successfully:', commentId);
      return result;
    } catch (error) {
      console.error('❌ Report comment error:', error.message);
      throw error;
    }
  },

  // Get broadcast posts
  getBroadcastPosts: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/broadcast`;
    
    try {
      logApiCall('GET', endpoint);

      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });

      const result = await handleResponse(response);
      console.log('✅ Broadcast posts retrieved successfully');
      return result;
    } catch (error) {
      console.error('❌ Get broadcast posts error:', error.message);
      throw error;
    }
  }
};

// =============================================================================
// MEDIA MANAGEMENT APIs (for file uploads)
// =============================================================================

export const mediaAPI = {
  // Upload single file
  uploadFile: async (file, type = 'image') => {
    const endpoint = `${API_CONFIG.BASE_URL}/media/upload`;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      logApiCall('POST', endpoint, { fileName: file.name, fileSize: file.size });

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData - browser will set it with boundary
        headers: {}
      });
      
      const result = await handleResponse(response);
      console.log('✅ File uploaded successfully:', result.url);
      
      return result;
    } catch (error) {
      console.error('❌ Upload file error:', error.message);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files, type = 'image') => {
    const endpoint = `${API_CONFIG.BASE_URL}/media/upload/multiple`;
    
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      formData.append('type', type);
      
      logApiCall('POST', endpoint, { fileCount: files.length });

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: formData,
        headers: {}
      });
      
      const result = await handleResponse(response);
      console.log(`✅ ${files.length} files uploaded successfully`);
      
      return result;
    } catch (error) {
      console.error('❌ Upload files error:', error.message);
      throw error;
    }
  },

  // Delete media file
  deleteFile: async (fileUrl) => {
    const endpoint = `${API_CONFIG.BASE_URL}/media/delete`;
    logApiCall('DELETE', endpoint, { fileUrl });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'DELETE',
        body: JSON.stringify({ url: fileUrl })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Delete file error:', error.message);
      throw error;
    }
  }
};

// =============================================================================
// NOTIFICATIONS APIs
// =============================================================================

export const notificationsAPI = {
  // Get user notifications
  getNotifications: async (page = 1, limit = 20) => {
    const endpoint = `${API_CONFIG.BASE_URL}/notifications?page=${page}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get notifications error:', error.message);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`;
    logApiCall('PUT', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'PUT'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Mark notification as read error:', error.message);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/notifications/read-all`;
    logApiCall('PUT', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'PUT'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Mark all notifications as read error:', error.message);
      throw error;
    }
  }
};

// =============================================================================
// ADMIN APIs (for administrative functions)
// =============================================================================

export const adminAPI = {
  // Get all users (admin only)
  getAllUsers: async (page = 1, limit = 50) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/users?page=${page}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get all users error:', error.message);
      throw error;
    }
  },

  // Block/Unblock user
  toggleUserBlock: async (userId, block = true) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/users/${userId}/${block ? 'block' : 'unblock'}`;
    logApiCall('PUT', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'PUT'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Toggle user block error:', error.message);
      throw error;
    }
  },

  // Delete post (admin)
  deletePostAdmin: async (postId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}`;
    logApiCall('DELETE', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'DELETE'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Admin delete post error:', error.message);
      throw error;
    }
  },

  // Get blocked users (admin only)
  getBlockedUsers: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/get_blocked_users`;
    
    try {
      // Get user_id from localStorage, fallback to author_id
      let user_id = userAPI.getCurrentUserId();
      if (!user_id) {
        user_id = StorageManager.getItem('author_id');
      }
      
      if (!user_id) {
        throw new Error('User not logged in. Please login first.');
      }

      const requestBody = {
        user_id: user_id
      };

      console.log('🔍 API getBlockedUsers - User ID:', user_id);
      console.log('🔍 API getBlockedUsers - Request body:', requestBody);
      logApiCall('POST', endpoint, requestBody);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const result = await handleResponse(response);
      console.log('✅ Blocked users retrieved successfully');
      return result;
    } catch (error) {
      console.error('❌ Get blocked users error:', error.message);
      throw error;
    }
  },

  // Admin delete comment (admin can delete any comment)
  adminDeleteComment: async (commentId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/comments/${commentId}/delete`;
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      const requestBody = {
        admin_id: userId  // Use admin_id for admin operations
      };

      console.log('🔍 API adminDeleteComment:', {
        commentId,
        userId,
        requestBody,
        endpoint
      });
      
      logApiCall('POST', endpoint, requestBody);
      
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Admin comment deleted successfully:', commentId);
      return result;
    } catch (error) {
      console.error('❌ Admin delete comment error:', error.message);
      throw error;
    }
  },

  // Admin delete reply (admin can delete any reply)
  adminDeleteReply: async (postId, commentId, replyId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/comments/${commentId}/replies/${replyId}/delete`;
    
    try {
      const userId = userAPI.getCurrentUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      const requestBody = {
        admin_id: userId  // Use admin_id for admin operations
      };

      console.log('🔍 API adminDeleteReply:', {
        postId,
        commentId,
        replyId,
        userId,
        requestBody,
        endpoint
      });
      
      logApiCall('POST', endpoint, requestBody);
      
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Admin reply deleted successfully:', replyId);
      return result;
    } catch (error) {
      console.error('❌ Admin delete reply error:', error.message);
      throw error;
    }
  }
};

// =============================================================================
// UTILITY APIs
// =============================================================================

export const utilityAPI = {

  // Get server info
  getServerInfo: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/info`;
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get server info error:', error.message);
      throw error;
    }
  }
};

// =============================================================================
// MAIN API OBJECT - CENTRALIZED ACCESS POINT
// =============================================================================
const api = {
  // Configuration
  config: API_CONFIG,
  
  // Core APIs
  user: userAPI,
  posts: postsAPI,
  media: mediaAPI,
  notifications: notificationsAPI,
  admin: adminAPI,
  utility: utilityAPI,
  
  // Storage management
  storage: StorageManager,
  
  // Utility functions
  utils: {
    handleResponse,
    fetchWithTimeout,
    logApiCall
  },
  
  // Convenience methods for common operations
  auth: {
    isLoggedIn: () => !!userAPI.getCurrentUserId(),
    getCurrentUser: () => userAPI.getUserSession(),
    signUp: (userData) => userAPI.createUser(userData),
    signIn: (loginData) => userAPI.login(loginData),
    signOut: () => userAPI.logout()
  },
  
  // Quick access methods
  quick: {
    // Quick post creation
    post: (content, options = {}) => postsAPI.createPost({
      content,
      ...options
    }),
    
    // Quick user lookup
    getUser: (userId) => userAPI.getUserById(userId),
    
    // Quick posts fetch
    getFeed: (page = 1) => postsAPI.getPosts(page),
    
  
 
  },
  
  // Error constants
  errors: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR'
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

// Individual APIs are already exported above when defined:
// - export const userAPI = { ... }
// - export const postsAPI = { ... }
// - export const mediaAPI = { ... }
// - export const notificationsAPI = { ... }
// - export const adminAPI = { ... }
// - export const utilityAPI = { ... }

// Export StorageManager for direct access
export { StorageManager };

// Export main API object as default
export default api;

// =============================================================================
// API INITIALIZATION & SETUP
// =============================================================================

// Initialize API on load
if (typeof window !== 'undefined') {
  // Browser environment - check connection on load

}