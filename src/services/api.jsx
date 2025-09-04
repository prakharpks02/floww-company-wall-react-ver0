// =============================================================================
// API CONFIGURATION
// =============================================================================

import { cookieUtils } from '../utils/cookieUtils';

// Request deduplication cache
const requestCache = new Map();
const CACHE_DURATION = 2000; // 2 second cache for deduplication
const activeRequests = new Set(); // Track currently active requests

// Get authentication token based on environment and user type
const getAuthToken = (userType = 'employee') => {
  const { employeeToken, employeeId, adminToken } = cookieUtils.getAuthTokens();
  
  if (userType === 'admin') {
    return adminToken;
  }
  
  // For employee, validate both token and ID exist
  if (employeeToken && employeeId) {
    return employeeToken;
  }
  
  return null;
};

// Store token in cookies (useful for production environments)
const storeTokenInCookies = (employeeToken, adminToken, employeeId = null) => {
  cookieUtils.setAuthTokens(employeeToken, adminToken, employeeId);
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
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://dev.gofloww.co/api/wall',
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
    if (typeof window !== 'undefined') {
      if (window.location.hostname === "localhost") {
        throw new Error(`Missing ${currentUserType} authentication token for localhost development`);
      } else {
        if (currentUserType === 'admin') {
          window.location.href = import.meta.env.VITE_ADMIN_DASHBOARD_URL || 'http://localhost:8000/crm/dashboard';
        } else {
          window.location.href = import.meta.env.VITE_API_BASE_URL?.replace('/api/wall', '') || 'https://dev.gofloww.co';
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
  
  // Create cache key for request deduplication
  const cacheKey = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || {})}-${Date.now() - (Date.now() % CACHE_DURATION)}`;
  const simpleKey = `${options.method || 'GET'}-${url.split('?')[0]}`; // For active request tracking
  
  // Check if this endpoint should allow multiple simultaneous requests
  const allowConcurrentRequests = url.includes('/current_user') || 
                                 url.includes('/get_single_post') ||
                                 url.includes('/reactions');
  
  // Check if the same request is already in progress (but allow certain endpoints)
  if (!allowConcurrentRequests && activeRequests.has(simpleKey)) {
    console.log('🚫 Blocking duplicate request for:', url.split('/').pop());
    throw new Error('Duplicate request blocked');
  }
  
  // Check if there's a cached request in progress
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🔄 Returning cached request for:', url.split('/').pop());
      return cached.promise;
    }
  }
  
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
  
  const requestPromise = (async () => {
    // Mark request as active (only if we're tracking duplicates for this endpoint)
    if (!allowConcurrentRequests) {
      activeRequests.add(simpleKey);
    }
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers
      });
      
      clearTimeout(timeoutId);
      
      // Clean up cache after request completes
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, CACHE_DURATION);
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      requestCache.delete(cacheKey);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      // Remove from active requests (only if we were tracking)
      if (!allowConcurrentRequests) {
        activeRequests.delete(simpleKey);
      }
    }
  })();
  
  // Cache the request promise
  requestCache.set(cacheKey, {
    promise: requestPromise,
    timestamp: Date.now()
  });
  
  return requestPromise;
};

// Helper function to log API calls (for debugging)
const logApiCall = (method, endpoint, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 API ${method} ${endpoint}`, data ? { data } : '');
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
      console.error(`Storage error getting ${key}:`, error);
      return null;
    }
  },

  // Set item to localStorage with error handling
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage error setting ${key}:`, error);
      return false;
    }
  },

  // Remove item from localStorage
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage error removing ${key}:`, error);
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
  storeToken: (token, userType = 'employee', employeeId = null) => {
    if (userType === 'admin') {
      storeTokenInCookies(null, token, null);
    } else {
      storeTokenInCookies(token, null, employeeId);
    }
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
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get user by ID error:', error.message);
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
        body: JSON.stringify({})
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get current user error:', error.message);
      throw error;
    }
  },

  // Clear session (remove token from cookies)
  clearSession: () => {
    cookieUtils.clearAuthTokens();
  },

  // Get users for mentions (employee side)
  getUsersForMentions: async (query = '', limit = 10) => {
    const endpoint = `${API_CONFIG.BASE_URL}/get_user_for_mentions?query=${encodeURIComponent(query)}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get users for mentions error:', error.message);
      throw error;
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      
      const result = await handleResponse(response);
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
      endpoint = `${API_CONFIG.BASE_URL}/posts?lastPostId=${lastPostId}&limit=${limit}`;
    } else {
      endpoint = `${API_CONFIG.BASE_URL}/posts?page=${page}&limit=${limit}`;
    }
    
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      
      // Handle different response structures
      const posts = result?.data?.posts || result?.posts || result?.data || [];
      const nextCursor = result?.data?.nextCursor || result?.nextCursor || null;
      const hasMore = result?.data?.hasMore || result?.hasMore || false;
      
      return {
        posts,
        nextCursor,
        hasMore,
        raw: result
      };
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get my posts error:', error.message);
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
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get post by ID error:', error.message);
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
      post_content: updateData.content,
      ...(updateData.tags && updateData.tags.length > 0 && { 
        tags: updateData.tags.map(tag => {
          if (typeof tag === 'string') {
            return { name: tag, color: '#3B82F6' };
          }
          return tag;
        })
      }),
      ...((!updateData.tags || updateData.tags.length === 0) && { tags: [] }),
      ...(() => {
        if (updateData.media && updateData.media.length > 0) {
          return { media: updateData.media };
        }
        return {};
      })(),
      mentions: updateData.mentions ? updateData.mentions.map(m => {
        return typeof m === 'object' && m.employee_id ? m.employee_id : m;
      }).filter(Boolean) : []
    };
    
    logApiCall('POST', endpoint, backendData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(backendData)
      });
      
      const result = await handleResponse(response);
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
    
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const result = await handleResponse(response);
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
        body: JSON.stringify({ 
          reactionType: 'like',
          reaction_type: 'like' // Add both formats for compatibility
        })
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Toggle like error:', error.message);
      throw error;
    }
  },

  // Add post reaction
  addReaction: async (postId, reactionType, emoji) => {
    // Ensure postId is properly extracted if it's an object
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${actualPostId}/reactions`;
    
    // Prepare request body with multiple formats for compatibility
    const requestBody = {
      reactionType: reactionType,
      reaction_type: reactionType // Some backends expect snake_case
    };
    
    // Only add emoji if it's provided and not undefined
    if (emoji !== undefined && emoji !== null) {
      requestBody.emoji = emoji;
    }
    
    logApiCall('POST', endpoint, requestBody);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Add reaction error:', error.message);
      console.error('❌ Request body was:', requestBody);
      throw error;
    }
  },

  // Remove post reaction
  removeReaction: async (postId, reactionType) => {
    // Ensure postId is properly extracted if it's an object
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${actualPostId}/reactions/delete`;
    
    const requestBody = {
      reactionType: reactionType,
      reaction_type: reactionType // Add both formats for compatibility
    };
    
    logApiCall('POST', endpoint, requestBody);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Remove reaction error:', error.message);
      console.error('❌ Request body was:', requestBody);
      throw error;
    }
  },

  // Add comment to post
  addComment: async (postId, commentData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments`;
    logApiCall('POST', endpoint, commentData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(commentData)
      });
      
      const result = await handleResponse(response);
      return result;
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
      
      const result = await handleResponse(response);
      return result;
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(replyData)
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Add reply error:', error.message);
      throw error;
    }
  },

  // Get replies for a comment
  getReplies: async (postId, commentId, page = 1, limit = 20) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}/replies?page=${page}&limit=${limit}`;
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get replies error:', error.message);
      throw error;
    }
  },

  // Delete comment (only post author can delete)
  // Delete comment (using postId and commentId) - DEPRECATED: Use deleteCommentById instead
  deleteCommentLegacy: async (postId, commentId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}`;
    logApiCall('DELETE', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'DELETE'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Delete comment (legacy) error:', error.message);
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
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Delete reply error:', error.message);
      throw error;
    }
  },

  // Add reaction to comment
  addCommentReaction: async (commentId, reactionType, emoji = null) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/reactions`;
    
    // Prepare request body with multiple formats for compatibility
    const requestBody = {
      reactionType: reactionType,
      reaction_type: reactionType // Some backends expect snake_case
    };
    
    // Only add emoji if it's provided and not null/undefined
    if (emoji !== null && emoji !== undefined) {
      requestBody.emoji = emoji;
    }
    
    logApiCall('POST', endpoint, requestBody);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Add comment reaction error:', error.message);
      console.error('❌ Request body was:', requestBody);
      throw error;
    }
  },

  // Delete reaction from comment
  deleteCommentReaction: async (commentId, reactionType) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/reactions/delete`;
    
    const requestBody = {
      reactionType: reactionType,
      reaction_type: reactionType // Add both formats for compatibility
    };
    
    logApiCall('POST', endpoint, requestBody);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Delete comment reaction error:', error.message);
      console.error('❌ Request body was:', requestBody);
      throw error;
    }
  },

  // Delete comment by comment_id (POST) - Current API endpoint
  deleteComment: async (commentId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/delete`;
    logApiCall('POST', endpoint);
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Delete comment error:', error.message);
      throw error;
    }
  },

  // Edit comment by comment_id (POST)
  editComment: async (commentId, contentOrData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/edit`;
    
    console.log('🔍 API editComment - commentId:', commentId);
    console.log('🔍 API editComment - contentOrData:', contentOrData);
    
    // Handle both string content and object data
    const content = typeof contentOrData === 'string' ? contentOrData : contentOrData.content;
    const mentions = typeof contentOrData === 'object' ? contentOrData.mentions || [] : [];
    
    console.log('🔍 API editComment - extracted content:', content);
    console.log('🔍 API editComment - extracted mentions:', mentions);
    
    // Try multiple field names to match backend expectations
    const requestBody = {
      content: content,
      comment: content,
      new_content: content,
      mentions: mentions.length > 0 ? mentions.map(m => {
        return typeof m === 'object' && m.employee_id ? m.employee_id : m;
      }).filter(Boolean) : []
    };
    
    logApiCall('POST', endpoint, requestBody);
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Edit comment error:', error.message);
      throw error;
    }
  },

  // Add reply to comment
  addCommentReply: async (postId, commentId, contentOrData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/${commentId}/replies`;
    
    // Handle both string content and object data
    const content = typeof contentOrData === 'string' ? contentOrData : contentOrData.content;
    const mentions = typeof contentOrData === 'object' ? contentOrData.mentions || [] : [];
    
    const requestBody = {
      content: content,
      mentions: mentions.length > 0 ? mentions.map(m => {
        return typeof m === 'object' && m.employee_id ? m.employee_id : m;
      }).filter(Boolean) : []
    };
    
    logApiCall('POST', endpoint, requestBody);
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const result = await handleResponse(response);
      return result;
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      const result = await handleResponse(response);
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      const result = await handleResponse(response);
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
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
      
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: formData
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Upload file error:', error.message);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files, type = 'image') => {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, type));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('❌ Upload multiple files error:', error.message);
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
        body: JSON.stringify({ fileUrl })
      });
      
      const result = await handleResponse(response);
      return result;
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
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get notifications error:', error.message);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`;
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Mark notification as read error:', error.message);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/notifications/read-all`;
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const result = await handleResponse(response);
      return result;
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
  // Get all users
  getAllUsers: async (page = 1, limit = 50) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/users?page=${page}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        userType: 'admin'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get all users error:', error.message);
      throw error;
    }
  },

  // Toggle user block status
  toggleUserBlock: async (userId, block = true) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/users/${userId}/block`;
    logApiCall('POST', endpoint, { block });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ block }),
        userType: 'admin'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Toggle user block error:', error.message);
      throw error;
    }
  },

  // Delete post as admin
  deletePostAdmin: async (postId) => {
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${actualPostId}/delete`;
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}),
        userType: 'admin'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Admin delete post error:', error.message);
      throw error;
    }
  },

  // Get blocked users
  getBlockedUsers: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/blocked-users`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        userType: 'admin'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get blocked users error:', error.message);
      throw error;
    }
  },

  // Admin delete comment
  adminDeleteComment: async (commentId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/comments/${commentId}/delete`;
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}),
        userType: 'admin'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Admin delete comment error:', error.message);
      throw error;
    }
  },

  // Admin delete reply
  adminDeleteReply: async (postId, commentId, replyId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/comments/${commentId}/replies/${replyId}/delete`;
    logApiCall('POST', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}),
        userType: 'admin'
      });
      
      const result = await handleResponse(response);
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
  // Get server information
  getServerInfo: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/info`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Get server info error:', error.message);
      throw error;
    }
  },

  // Authentication utilities
  auth: {
    setTokens: (employeeToken, adminToken, employeeId = null) => {
      storeTokenInCookies(employeeToken, adminToken, employeeId);
    },
    getTokens: () => {
      return cookieUtils.getAuthTokens();
    },
    clearTokens: () => {
      cookieUtils.clearAuthTokens();
    },
    isAuthenticated: () => {
      return !!getAuthToken();
    },
    isEmployeeAuthenticated: () => {
      return !!getAuthToken('employee');
    },
    isAdminAuthenticated: () => {
      return !!getAuthToken('admin');
    }
  }
};

// =============================================================================
// MAIN API OBJECT - CENTRALIZED ACCESS POINT
// =============================================================================
const api = {
  config: API_CONFIG,
  user: userAPI,
  posts: postsAPI,
  media: mediaAPI,
  notifications: notificationsAPI,
  admin: adminAPI,
  utility: utilityAPI,
  utils: {
    handleResponse,
    fetchWithTimeout,
    logApiCall,
    checkAuthToken
  },
  auth: {
    isLoggedIn: () => userAPI.isAuthenticated(),
    getCurrentUser: () => userAPI.getUserSession(),
    getCurrentToken: () => userAPI.getCurrentToken(),
    storeToken: (token) => userAPI.storeToken(token),
    clearToken: () => userAPI.clearSession(),
    checkAuth: () => {
      try {
        return checkAuthToken();
      } catch (error) {
        console.error('❌ Auth check failed:', error.message);
        return false;
      }
    }
  },
  quick: {
    post: (content, options = {}) => postsAPI.createPost({
      content,
      ...options
    }),
    getUser: (userId) => userAPI.getUserById(userId),
    getFeed: (page = 1) => postsAPI.getPosts(page),
  },
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

// Export main API object as default
export default api;

// =============================================================================
// API INITIALIZATION & SETUP
// =============================================================================

// Initialize API on load
if (typeof window !== 'undefined') {
  // Check if we're in development mode and log initialization
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 API initialized', {
      baseUrl: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      authenticated: userAPI.isAuthenticated(),
      userType: getCurrentUserType()
    });
  }
}
