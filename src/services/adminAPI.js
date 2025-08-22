// =============================================================================
// ADMIN API SERVICE
// =============================================================================

// Get the appropriate admin token based on current URL
const getAdminToken = () => {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/crm')) {
    return import.meta.env.VITE_FLOWW_ADMIN_TOKEN;
  }
  return import.meta.env.VITE_FLOWW_EMPLOYEE_TOKEN;
};

const API_CONFIG = {
  BASE_URL: 'https://dev.gofloww.co/api/wall',
  TIMEOUT: 30000, // Increased timeout to 30 seconds
  HEADERS: {
    'Authorization': getAdminToken(),
    'Content-Type': 'application/json',
  }
};

// Debug: Log the token being used
console.log('🔑 Admin API Token:', API_CONFIG.HEADERS.Authorization ? 'Token loaded' : 'No token found');
console.log('🔑 Current path:', window.location.pathname);
console.log('🔑 Using token type:', window.location.pathname.includes('/crm') ? 'Admin' : 'Employee');

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
  
  // Get fresh token for each request
  const currentToken = getAdminToken();
  
  // Prepare headers
  let headers = {
    'Authorization': currentToken,
    ...options.headers
  };
  
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers
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
  getAllPosts: async (lastPostId = null, excludeBroadcasts = true) => {
    // Build endpoint with pagination parameter if provided
    let endpoint = `${API_CONFIG.BASE_URL}/admin/posts`;
    const params = new URLSearchParams();
    
    if (lastPostId) {
      params.append('lastPostId', lastPostId);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    console.log('🔄 API getAllPosts - Endpoint:', endpoint);
    logApiCall('GET', endpoint);

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
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
        lastPostId: next,
        nextCursor: next,
        hasMore,
        raw: result
      };
    } catch (error) {
      console.error('❌ Get all posts error:', error.message);
      throw error;
    }
  },

  // Get broadcast posts
  getBroadcastPosts: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/broadcast`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      // Handle the nested data structure from API response
      const posts = result?.data?.posts || result?.posts || result?.data || [];
      
      console.log(`✅ Retrieved ${posts.length} broadcast posts`);
      console.log('🔍 Admin API getBroadcastPosts - Raw result:', result);
      console.log('🔍 Admin API getBroadcastPosts - Extracted posts:', posts);
      
      return {
        posts,
        raw: result
      };
    } catch (error) {
      console.error('❌ Get broadcast posts error:', error.message);
      throw error;
    }
  },

  // Create new post
  createPost: async (postData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts`;
    logApiCall('POST', endpoint, postData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Post created successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Create post error:', error.message);
      throw error;
    }
  },

  // Broadcast post
  broadcastPost: async (postData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/broadcast`;
    logApiCall('POST', endpoint, postData);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Post broadcasted successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Broadcast post error:', error.message);
      throw error;
    }
  },

  // Get pinned posts (using dedicated pinned posts endpoint)
  getPinnedPosts: async () => {
    const currentPath = window.location.pathname;
    let endpoint;
    
    if (currentPath.includes('/crm')) {
      // Admin endpoint
      endpoint = `${API_CONFIG.BASE_URL}/admin/posts/pinned`;
    } else {
      // Employee endpoint  
      endpoint = `${API_CONFIG.BASE_URL}/posts/pinned`;
    }
    
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      const result = await handleResponse(response);
      
      console.log(`✅ Retrieved pinned posts from ${endpoint}`);
      console.log('� Pinned posts result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Get pinned posts error:', error.message);
      throw error;
    }
  },

  // Toggle pin status of a post
  togglePinPost: async (postId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/toggle_pin`;
    logApiCall('POST', endpoint, { postId });

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Send empty body as shown in Postman
      });

      const result = await handleResponse(response);
      console.log('✅ Post pin status toggled successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Toggle pin post error:', error.message);
      throw error;
    }
  },

  // Add comment to post
  addPostComment: async (postId, commentData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/comments`;
    logApiCall('POST', endpoint, { postId, commentData });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(commentData)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Comment added successfully');
      console.log('🔍 AdminAPI - New comment response:', result);
      if (result.author) {
        console.log('🔍 AdminAPI - New comment author:', result.author);
        console.log('🔍 AdminAPI - New comment author fields:', Object.keys(result.author));
      }
      
      return result;
    } catch (error) {
      console.error('❌ Add comment error:', error.message);
      throw error;
    }
  },

  // Get post comments for admin view
  getPostComments: async (postId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${postId}/comments`;
    logApiCall('POST', endpoint, { postId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const result = await handleResponse(response);
      console.log('✅ Retrieved post comments');
      console.log('🔍 AdminAPI - Comment response:', result);
      if (result.data && Array.isArray(result.data)) {
        console.log('🔍 AdminAPI - First comment structure:', result.data[0]);
        if (result.data[0]?.author) {
          console.log('🔍 AdminAPI - First comment author:', result.data[0].author);
          console.log('🔍 AdminAPI - Author fields:', Object.keys(result.data[0].author));
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Get post comments error:', error.message);
      throw error;
    }
  },

  // Delete a post (admin only)
  deletePost: async (postId) => {
    // Handle both direct postId and post data with post_id
    const actualPostId = (typeof postId === 'object' && postId.post_id) ? postId.post_id : postId;
    const endpoint = `${API_CONFIG.BASE_URL}/admin/posts/${actualPostId}/delete`;
    
    console.log('🔍 API deletePost - Post ID:', actualPostId);
    console.log('🔍 API deletePost - Endpoint:', endpoint);
    logApiCall('POST', endpoint, { postId: actualPostId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({})
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
  toggleBlockUser: async (employeeId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/${employeeId}/toggle_block`;
    
    console.log('🔍 Toggle block user - Employee ID:', employeeId);
    console.log('🔍 Toggle block user - Employee ID type:', typeof employeeId);
    console.log('🔍 Toggle block user - Employee ID length:', employeeId?.length);
    console.log('🔍 Toggle block user - Endpoint:', endpoint);
    logApiCall('POST', endpoint, { employeeId });

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Send empty body as shown in Postman
      });

      const result = await handleResponse(response);
      console.log('✅ Employee block status toggled successfully:', result);
      
      // Parse the message to extract the new status
      let newBlockStatus = false;
      if (result.message && result.message.includes('Blocked: True')) {
        newBlockStatus = true;
      } else if (result.message && result.message.includes('Blocked: False')) {
        newBlockStatus = false;
      }
      
      console.log('🔍 Parsed new block status:', newBlockStatus);
      
      return {
        ...result,
        is_blocked: newBlockStatus,
        new_status: newBlockStatus
      };
    } catch (error) {
      console.error('❌ Toggle block user error:', error.message);
      throw error;
    }
  },

  // Get blocked users
  getBlockedUsers: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/get_blocked_users`;
    logApiCall('POST', endpoint);

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Send empty body as required by API
      });

      const result = await handleResponse(response);
      console.log('✅ Retrieved blocked users');
      
      return result;
    } catch (error) {
      console.error('❌ Get blocked users error:', error.message);
      throw error;
    }
  },



  // ========================================
  // BROADCAST MESSAGES
  // ========================================
  
  // Send broadcast message
  broadcastMessage: async (content, media = [], mentions = [], tags = []) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/broadcast`;
    logApiCall('POST', endpoint, { content, media, mentions, tags });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          content,
          media,
          mentions,
          tags
        })
      });
      
      const result = await handleResponse(response);
      console.log('✅ Broadcast message sent successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Broadcast message error:', error.message);
      throw error;
    }
  },

  // ========================================
  // REPORTS MANAGEMENT
  // ========================================
  
  // Create report
  createReport: async (reportData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/reports`;
    logApiCall('POST', endpoint, reportData);

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify(reportData)
      });

      const result = await handleResponse(response);
      console.log('✅ Report created successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Create report error:', error.message);
      throw error;
    }
  },

  // Get all reported content
  getReportedContent: async () => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/reports`;
    logApiCall('POST', endpoint);

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Send empty body as required by API
      });

      const result = await handleResponse(response);
      console.log('✅ getReportedContent - Response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Get reported content error:', error.message);
      throw error;
    }
  },

  // Resolve a report
  resolveReport: async (reportId, action = 'resolved') => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/reports/${reportId}/resolve`;
    logApiCall('POST', endpoint, { reportId, action });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Send empty body as shown in Postman
      });
      
      const result = await handleResponse(response);
      console.log('✅ Report resolved successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Resolve report error:', error.message);
      throw error;
    }
  },

  // ========================================
  // COMMENT MANAGEMENT
  // ========================================
  
  // Delete a comment
  deleteComment: async (commentId) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/comments/${commentId}/delete`;
    logApiCall('POST', endpoint, { commentId });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Send empty body as shown in Postman
      });
      
      const result = await handleResponse(response);
      console.log('✅ Comment deleted successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Delete comment error:', error.message);
      throw error;
    }
  },

  // Toggle comments on a post (enable/disable comments)
  togglePostComments: async (postId, currentState) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/comments/${postId}/toggle`;
    logApiCall('POST', endpoint, { postId, currentState });
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Send empty body as shown in Postman
      });
      
      const result = await handleResponse(response);
      console.log('✅ Post comments toggled successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Toggle post comments error:', error.message);
      throw error;
    }
  },

  // ========================================
  // FILE MANAGEMENT
  // ========================================
  
  // Upload file
  uploadFile: async (fileData) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/upload_file`;
    logApiCall('POST', endpoint, 'File upload');
    
    try {
      // Use fetchWithTimeout which will automatically handle headers correctly for FormData
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        body: fileData // Should be FormData
      });
      
      const result = await handleResponse(response);
      console.log('✅ File uploaded successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Upload file error:', error.message);
      throw error;
    }
  },

  // Get users for mentions (admin side)
  getUsersForMentions: async (query = '', limit = 10) => {
    const endpoint = `${API_CONFIG.BASE_URL}/admin/get_user_for_mentions?query=${encodeURIComponent(query)}&limit=${limit}`;
    logApiCall('GET', endpoint);
    
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET'
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Admin mention API endpoint not available yet, returning empty array');
        return { data: [] };
      }
      
      const result = await handleResponse(response);
      console.log('✅ Admin - Users for mentions retrieved successfully:', result);
      return result;
    } catch (error) {
      console.warn('Admin mention API not available yet:', error.message);
      // Return empty array as fallback when API is not available
      return { data: [] };
    }
  },

  // ========================================
  // ALIASES FOR BACKWARD COMPATIBILITY
  // ========================================
  
  // Alias for deleteComment for backward compatibility
  adminDeleteComment: function(commentId) {
    return this.deleteComment(commentId);
  },

  // Alias for deleteComment for replies (since there's no separate reply delete endpoint)
  adminDeleteReply: function(postId, commentId, replyId) {
    return this.deleteComment(replyId);
  }
};

export default adminAPI;
