// =============================================================================
// API CONFIGURATION
// =============================================================================

import Cookies from "js-cookie";

// Get authentication token based on environment and user type
const getAuthToken = (userType = 'employee') => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === "localhost") {
      // Use the correct token based on user type for localhost development
      if (userType === 'admin') {
        return import.meta.env.VITE_FLOWW_ADMIN_TOKEN;
      }
      return import.meta.env.VITE_FLOWW_EMPLOYEE_TOKEN;
    } else {
      // Use token from cookies for production/staging
      if (userType === 'admin') {
        return Cookies.get("floww-admin-token");
      }
      return Cookies.get("floww-employee-token");
    }
  }
  // Fallback for SSR or Node.js environment
  if (userType === 'admin') {
    return import.meta.env.VITE_FLOWW_ADMIN_TOKEN;
  }
  return import.meta.env.VITE_FLOWW_EMPLOYEE_TOKEN;
};

// Store token in cookies (useful for production environments)
const storeTokenInCookies = (token, userType = 'employee') => {
  if (typeof window !== 'undefined') {
    const cookieName = userType === 'admin' ? "floww-admin-token" : "floww-employee-token";
    Cookies.set(cookieName, token, {
      expires: 30, // 30 days
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    });
    console.log(`✅ ${userType} token stored in cookies successfully`);
  }
};

// Get current user type from current URL path
const getCurrentUserType = () => {
  const currentPath = window.location.pathname;
  return currentPath.includes('/crm') ? 'admin' : 'employee';
};

// Get authentication headers for API requests
const getAuthHeaders = () => {
  const currentUserType = getCurrentUserType();
  const token = getAuthToken(currentUserType);
  return {
    'Authorization': token
  };
};

const FLOWW_TOKEN = getAuthToken();

const API_CONFIG = {
  BASE_URL: 'https://dev.gofloww.co/api/wall',
  TIMEOUT: 10000, // 10 seconds
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Helper function to check authentication and redirect if needed
const checkAuthToken = (userType = null) => {
  const currentUserType = userType || getCurrentUserType();
  const currentToken = getAuthToken(currentUserType);
  
  if (!currentToken) {
    console.warn(`⚠️ No ${currentUserType} authentication token found`);
    if (typeof window !== 'undefined') {
      if (window.location.hostname === "localhost") {
        console.error(`❌ Missing ${currentUserType} token for localhost development`);
        throw new Error(`Missing ${currentUserType} authentication token for localhost development`);
      } else {
        console.warn('⚠️ Redirecting to Floww authentication');
        if (currentUserType === 'admin') {
          window.location.href = import.meta.env.VITE_ADMIN_DASHBOARD_URL || 'http://localhost:8000/crm/dashboard';
        } else {
          window.location.href = 'https://dev.gofloww.co';
        }
        throw new Error('Missing authentication token. Redirecting...');
      }
    }
  }
  return currentToken;
};

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

// Helper function to create fetch requests with timeout and authentication
const fetchWithTimeout = async (url, options = {}) => {
  // Get fresh token for each request and check authentication
  const userType = options.userType || getCurrentUserType();
  const currentToken = checkAuthToken(userType);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  // Handle headers properly for different request types
  let headers = {
    'Authorization': currentToken,
  };
  
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Merge with any additional headers provided
  if (options.headers) {
    headers = { ...headers, ...options.headers };
  }
  
  // Remove userType from options before passing to fetch
  const { userType: _, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers
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
// USER MANAGEMENT APIs - Simplified for Token Authentication
// =============================================================================
export const userAPI = {
  // Check if user is authenticated (token-based)
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Get current user status (always returns true with token auth)
  getCurrentUserId: () => {
    return 'authenticated_user'; // Backend handles actual user identification
  },

  // Get user session (simplified for token auth)
  getUserSession: () => {
    const token = getAuthToken();
    return {
      authenticated: !!token,
      token: token,
      environment: typeof window !== 'undefined' ? 
        (window.location.hostname === "localhost" ? 'development' : 'production') : 'server'
    };
  },

  // Store token in cookies (for production use)
  storeToken: (token) => {
    storeTokenInCookies(token);
  },

  // Get current token
  getCurrentToken: () => {
    return getAuthToken();
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

  // Get current user details
  getCurrentUser: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/get_user`;
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      const result = await handleResponse(response);
      console.log('✅ Current user retrieved successfully:', result);
      
      // Transform the response to match expected user structure
      if (result.status === 'success' && result.data) {
        const userData = result.data;
        return {
          status: 'success',
          data: {
            ...userData,
            username: userData.employee_username, // Map employee_username to username
            name: userData.employee_name,
            profile_picture: userData.profile_picture_link,
            title: userData.job_title, // Use job_title instead of employee
            is_blocked: userData.is_blocked || false
          },
          message: result.message
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Get current user error:', error.message);
      throw error;
    }
  },

  // Clear session (remove token from cookies)
  clearSession: () => {
    if (typeof window !== 'undefined') {
      Cookies.remove("floww-employee-token");
      console.log('✅ Token removed from cookies');
    }
    console.log('✅ Session cleared (token-based auth)');
  },

  // Get users for mentions (employee side)
  getUsersForMentions: async (query = '', limit = 10) => {
    const endpoint = `${API_CONFIG.BASE_URL}/get_user_for_mentions?query=${encodeURIComponent(query)}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Mention API endpoint not available yet, returning empty array');
        return { data: [] };
      }
      
      const result = await handleResponse(response);
      console.log('✅ Users for mentions retrieved successfully:', result);
      return result;
    } catch (error) {
      console.warn('Mention API not available yet:', error.message);
      // Return empty array as fallback when API is not available
      return { data: [] };
    }
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
      const requestBody = {
        content: postData.content,
        ...(postData.media && postData.media.length > 0 && { media: postData.media }),
        ...(postData.mentions && postData.mentions.length > 0 && { 
          // Ensure backend receives only usernames (strings) for mentions
          mentions: postData.mentions.map(m => {
            if (typeof m === 'string') return m;
            if (m && typeof m === 'object') return m.username || m.user_id || '';
            return String(m);
          }).filter(Boolean)
        }),
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
      console.log('🔍 API createPost - Processed mentions (usernames only):', requestBody.mentions);

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

  // Get current user's posts
  getMyPosts: async () => {
    // For admin users, use admin endpoint, for employees use regular posts endpoint
    const currentUserType = getCurrentUserType();
    const endpoint = currentUserType === 'admin' 
      ? `${API_CONFIG.BASE_URL}/admin/posts`
      : `${API_CONFIG.BASE_URL}/posts`;
    
    try {
      console.log('🔍 API getMyPosts - User type:', currentUserType);
      console.log('🔍 API getMyPosts - Endpoint:', endpoint);
      logApiCall('GET', endpoint);

      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        userType: currentUserType // Pass user type to ensure correct token is used
      });
      
      const result = await handleResponse(response);
      console.log('🔍 API getMyPosts - Full response:', result);
      
      // Extract posts from the response
      const posts = result?.data?.posts || result?.posts || result?.data || [];
      console.log(`✅ Retrieved ${posts.length} posts from ${currentUserType} endpoint`);
      if (posts.length > 0) {
        console.log('🔍 API getMyPosts - First post structure:', posts[0]);
      }
      
      return {
        ...result,
        data: posts
      };
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
    
    // Transform the data to match backend expectations
    const backendData = {
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
      ...(updateData.mentions && { 
        // Ensure backend receives only usernames (strings) for mentions
        mentions: (Array.isArray(updateData.mentions) ? updateData.mentions : [updateData.mentions]).map(m => {
          if (typeof m === 'string') return m;
          if (m && typeof m === 'object') return m.username || m.user_id || '';
          return String(m);
        }).filter(Boolean)
      })
    };
    
    console.log('🔍 API updatePost - Post ID:', actualPostId);
    console.log('🔍 API updatePost - Endpoint:', endpoint);
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
    
    console.log('🔍 API deletePost - Post ID:', actualPostId);
    console.log('🔍 API deletePost - Endpoint:', endpoint);
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
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
    
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
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
      const requestBody = {
        reaction_type: reactionType,
        emoji: emoji
      };

      console.log('🔍 API addReaction - Original postId:', postId);
      console.log('🔍 API addReaction - Actual postId:', actualPostId);
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
      const requestBody = {
        reaction_type: reactionType
      };

      console.log('🔍 API removeReaction - Original postId:', postId);
      console.log('🔍 API removeReaction - Actual postId:', actualPostId);
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
      // The backend expects { content }
      const requestBody = {
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
      const requestBody = {
        content: replyData.content
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
      const requestBody = {
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
      const requestBody = {
        reaction_type: reactionType
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
  // Delete comment by comment_id (POST)
  deleteComment: async (commentId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/delete`;
    logApiCall('POST', endpoint);
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
    });
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Delete comment error:', error.message);
      throw error;
    }
  },

  // Edit comment by comment_id (POST)
  editComment: async (commentId, content) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/edit`;
    
    // Try multiple field names to match backend expectations
    const requestBody = {
      content: content,        // Primary field name
      comment: content,        // Fallback field name
      new_content: content     // Alternative field name
    };
    
    console.log('🔍 API editComment:', {
      commentId,
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
  addCommentReply: async (postId, commentId, content) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}/replies`;
    logApiCall('POST', endpoint, { content });
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ 
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
      const requestBody = {
        reason: reason
      };

      console.log('🔍 API reportPost - Post ID:', actualPostId);
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
      const requestBody = {
        reason: reason
      };

      console.log('🔍 API reportComment - Comment ID:', commentId);
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
  },

  // Get pinned posts (for employee side)
  getPinnedPosts: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/pinned`;
    
    try {
      logApiCall('GET', endpoint);

      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      const result = await handleResponse(response);
      console.log('✅ Pinned posts retrieved successfully for employee:', result);
      return result;
    } catch (error) {
      console.error('❌ Get pinned posts error:', error.message);
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
    const endpoint = `${API_CONFIG.BASE_URL}/upload_file`;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      logApiCall('POST', endpoint, { fileName: file.name, fileSize: file.size });

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: formData
        // fetchWithTimeout will automatically handle headers for FormData
      });
      
      const result = await handleResponse(response);
      console.log('✅ File uploaded successfully:', result);
      
      // Extract file URL from the nested response structure
      // Expected format: { status: "success", message: "...", data: { file_url: "..." } }
      const fileUrl = result.data?.file_url || result.url || result.link || result.file_url;
      
      // Normalize response to ensure 'url' field is available for compatibility
      return {
        ...result,
        url: fileUrl,
        file_url: fileUrl
      };
    } catch (error) {
      console.error('❌ Upload file error:', error.message);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files, type = 'image') => {
    try {
      // Upload files individually since the endpoint expects single file uploads
      const uploadPromises = files.map(file => mediaAPI.uploadFile(file, type));
      const results = await Promise.all(uploadPromises);
      
      console.log(`✅ ${files.length} files uploaded successfully`);
      
      return results;
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
      console.log('🔍 API getBlockedUsers - Endpoint:', endpoint);
      logApiCall('POST', endpoint);

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
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
      console.log('🔍 API adminDeleteComment:', {
        commentId,
        endpoint
      });
      
      logApiCall('POST', endpoint);
      
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
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
      console.log('🔍 API adminDeleteReply:', {
        postId,
        commentId,
        replyId,
        endpoint
      });
      
      logApiCall('POST', endpoint);
      
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
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
  
  // Utility functions
  utils: {
    handleResponse,
    fetchWithTimeout,
    logApiCall,
    checkAuthToken
  },
  
  // Convenience methods for common operations
  auth: {
    isLoggedIn: () => userAPI.isAuthenticated(),
    getCurrentUser: () => userAPI.getUserSession(),
    getCurrentToken: () => userAPI.getCurrentToken(),
    storeToken: (token) => userAPI.storeToken(token),
    clearToken: () => userAPI.clearSession(),
    // Token-based authentication with environment detection
    checkAuth: () => {
      const currentToken = getAuthToken();
      if (!currentToken) {
        if (typeof window !== 'undefined' && window.location.hostname !== "localhost") {
          window.location.href = 'https://dev.gofloww.co';
          return false;
        }
        return false;
      }
      return true;
    }
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
};// =============================================================================
// EXPORTS
// =============================================================================

// Individual APIs are already exported above when defined:
// - export const userAPI = { ... }
// - export const postsAPI = { ... }
// - export const mediaAPI = { ... }
// - export const notificationsAPI = { ... }
// - export const adminAPI = { ... }
// - export const utilityAPI = { ... }

// Export main API object as default
export default api;

// =============================================================================
// API INITIALIZATION & SETUP
// =============================================================================

// Initialize API on load
if (typeof window !== 'undefined') {
  // Browser environment - check authentication token
  const currentToken = getAuthToken();
  
  if (!currentToken) {
    if (window.location.hostname === "localhost") {
      console.error('❌ No authentication token found for localhost development');
    } else {
      console.warn('⚠️ No authentication token found, redirecting to Floww');
      window.location.href = 'https://dev.gofloww.co';
    }
  } else {
    const environment = window.location.hostname === "localhost" ? 'development' : 'production';
    const tokenSource = window.location.hostname === "localhost" ? 'hardcoded' : 'cookie';
    
    console.log(`✅ Authentication token loaded successfully`);
    console.log(`🔍 Environment: ${environment}`);
    console.log(`🔍 Token source: ${tokenSource}`);
    
    // Store token in cookies if not already stored (for production)
    if (environment === 'production' && !Cookies.get("floww-employee-token")) {
      storeTokenInCookies(currentToken);
    }
  }
}