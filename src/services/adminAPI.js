// =============================================================================
// ADMIN API SERVICE
// =============================================================================

const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/wall',
  TIMEOUT: 30000, // Increased timeout to 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  let data;
  
  try {
    data = await response.json();
  } catch (error) {
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
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Log API calls for debugging
const logApiCall = (method, url, data = null) => {
  console.log(`🌐 ${method} ${url}`, data ? { data } : '');
};

// =============================================================================
// ADMIN API FUNCTIONS
// =============================================================================

export const adminAPI = {
  // ========================================
  // POST MANAGEMENT
  // ========================================
  
  // Get all posts (admin only)
getAllPosts: async (lastPostId = null) => {
  // Get user_id from localStorage, fallback to author_id
  let user_id = null;
  try {
    const stored = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('author_id');
    if (stored) user_id = JSON.parse(stored);
  } catch (e) {
    console.warn('⚠️ Failed to parse user ID from localStorage:', e);
  }

  if (!user_id) {
    throw new Error('Invalid or missing user_id');
  }

  // Build endpoint with only lastPostId in URL (no limit)
  let endpoint = `${API_CONFIG.BASE_URL}/admin/posts`;
  if (lastPostId) {
    endpoint += `?lastPostId=${encodeURIComponent(lastPostId)}`;
  }

  // Prepare request body with user_id
  const requestBody = { user_id };

  console.log('🔄 API getAllPosts - Endpoint:', endpoint);
  console.log('📦 Request Body:', requestBody);
  logApiCall('POST', endpoint, requestBody);

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await handleResponse(response);

    const posts = result?.data?.posts || result?.posts || result?.data || [];
    const next = result?.data?.nextCursor || result?.nextCursor || null;
    const hasMore = result?.data?.hasMore || result?.hasMore || (next !== null);

    console.log(`✅ Retrieved ${posts.length} admin posts`);
    console.log('🔍 Pagination info:', {
      nextCursor: next,
      hasMore
    });

    return {
      posts,
      lastPostId: next, // Use nextCursor as lastPostId for consistency with frontend
      nextCursor: next, // Also provide nextCursor for clarity
      hasMore,
      raw: result
    };
  } catch (error) {
    console.error('❌ Get all posts error:', error.message);
    throw error;
  }
},


  // Toggle pin status of a post
  togglePinPost: async (postId) => {
    // Get user_id from localStorage
    let userId;
    try {
      const stored = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (stored) {
        userId = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('⚠️ Unable to retrieve user_id from localStorage:', e.message);
    }

    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/toggle_pin`;
    logApiCall('GET', endpoint, { postId, userId });

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Toggle pin post error:', error.message);
      throw error;
    }
  },

  // Get comments for a specific post
  getPostComments: async (postId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/comments`;
    logApiCall('POST', endpoint, { postId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get post comments error:', error.message);
      throw error;
    }
  },

  // Delete a post (admin only)
  deletePost: async (postId) => {
    // Handle both direct postId and post data with post_id
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/posts/delete/${actualPostId}`;

    let user_id = null;
    try {
      const stored = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (stored) user_id = JSON.parse(stored);
    } catch (e) {
      console.warn('⚠️ Failed to parse user ID from localStorage:', e);
    }
    
    if (!user_id) {
      throw new Error('User not logged in. Please login first.');
    }
    
    // Prepare request body with author_id as required by backend
    const requestBody = {
      author_id: user_id
    };
    
    console.log('🔍 API deletePost - Post ID:', actualPostId);
    console.log('🔍 API deletePost - Author ID:', user_id);
    console.log('🔍 API deletePost - Endpoint:', endpoint);
    console.log('🔍 API deletePost - Request body:', requestBody);
    logApiCall('POST', endpoint, requestBody);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Handle empty or non-JSON responses
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await handleResponse(response);
      } else {
        // If response is not JSON, check if it's successful
        if (response.ok) {
          result = { status: 'success', message: 'Post deleted successfully' };
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      console.log('✅ Post deleted successfully:', actualPostId);
      console.log('🔍 Backend response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Delete post error:', error.message);
      throw error;
    }
  },

  // ========================================
  // USER MANAGEMENT
  // ========================================
  
  // Toggle block status of a user
  toggleBlockUser: async (userId) => {
    let user_id = null;

    try {
      const stored = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (stored) {
        user_id = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse user_id from localStorage:', e);
    }

    if (!user_id) {
      console.error('❌ No valid user_id found in localStorage.');
      throw new Error('Invalid or missing user_id');
    }

    // Use the toggle endpoint - let backend handle the current status logic
    const endpoint = `${API_CONFIG.BASE_URL}/admin/${userId}/toggle_block`;
    
    console.log('🔍 Toggle block user - User ID:', userId);
    console.log('🔍 Toggle block user - Admin ID:', user_id);
    logApiCall('POST', endpoint, { user_id });

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id }),
      });

      const result = await handleResponse(response);
      console.log('✅ User block status toggled successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Toggle block user error:', error.message);
      throw error;
    }
  },



  // ========================================
  // BROADCAST MESSAGES
  // ========================================
  
  // Send broadcast message
  broadcastMessage: async (userId, content, media = [], mentions = [], tags = []) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/broadcast`;
    logApiCall('POST', endpoint, { userId, content, media, mentions, tags });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          content,
          media,
          mentions,
          tags
        })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Broadcast message error:', error.message);
      throw error;
    }
  },

  // ========================================
  // REPORTS MANAGEMENT
  // ========================================
  
  // Get all reported content
  getReportedContent: async () => {
    // Get user_id from localStorage
    let userId;
    try {
      const stored = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (stored) {
        userId = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('⚠️ Unable to retrieve user_id from localStorage:', e.message);
    }

    const endpoint = `${API_CONFIG.BASE_URL}/admin/reports`;
    logApiCall('POST', endpoint, { userId });

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Get reported content error:', error.message);
      throw error;
    }
  },

  // Resolve a report
  resolveReport: async (reportId, userId, action = 'resolved') => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/reports/${reportId}/resolve`;
    logApiCall('POST', endpoint, { reportId, userId, action });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          action // 'approved' or 'rejected'
        })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Resolve report error:', error.message);
      throw error;
    }
  },

  // ========================================
  // COMMENT MANAGEMENT
  // ========================================
  
  // Toggle comments for a post
  togglePostComments: async (postId, userId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/posts/${postId}/comments/status`;
    logApiCall('POST', endpoint, { postId, userId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId
        })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Toggle post comments error:', error.message);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    const userId = localStorage.getItem('user_id');
    const endpoint = `${API_CONFIG.BASE_URL}/comments/${commentId}/delete`;
    logApiCall('POST', endpoint, { commentId, userId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId
        })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Delete comment error:', error.message);
      throw error;
    }
  },

  // Toggle comments on a post
  toggleCommentsOnPost: async (postId) => {
    const userId = localStorage.getItem('user_id');
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/toggle_comments`;
    logApiCall('POST', endpoint, { postId, userId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId
        })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Toggle comments error:', error.message);
      throw error;
    }
  },

  // Block/unblock a user
  blockUser: async (userId) => {
    const adminUserId = localStorage.getItem('user_id');
    const endpoint = `${API_CONFIG.BASE_URL}/admin/${userId}/toggle_block`;
    logApiCall('POST', endpoint, { userId, adminUserId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: adminUserId
        })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Block user error:', error.message);
      throw error;
    }
  }
};

export default adminAPI;
