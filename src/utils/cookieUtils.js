// Cookie utility functions for authentication
export const cookieUtils = {
  // Get a cookie value by name
  getCookie: (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  },

  // Set a cookie with optional expiration and other attributes
  setCookie: (name, value, options = {}) => {
    let cookie = `${name}=${value}`;
    
    if (options.expires) {
      cookie += `; expires=${options.expires.toUTCString()}`;
    }
    
    if (options.maxAge) {
      cookie += `; max-age=${options.maxAge}`;
    }
    
    if (options.domain) {
      cookie += `; domain=${options.domain}`;
    }
    
    if (options.path) {
      cookie += `; path=${options.path}`;
    } else {
      cookie += `; path=/`;
    }
    
    if (options.secure) {
      cookie += `; secure`;
    }
    
    if (options.httpOnly) {
      cookie += `; httponly`;
    }
    
    if (options.sameSite) {
      cookie += `; samesite=${options.sameSite}`;
    }
    
    document.cookie = cookie;
  },

  // Remove a cookie by setting it to expire
  removeCookie: (name, options = {}) => {
    const expiredDate = new Date(0);
    cookieUtils.setCookie(name, '', { 
      ...options, 
      expires: expiredDate 
    });
  },

  // Get authentication tokens from cookies
  getAuthTokens: () => {
    // Hardcoded values for testing/development
    const employeeToken = cookieUtils.getCookie('floww-employee-token')|| '53877bef529b8a4568656eb14968158d91a7118cbf0de7e1b2ef3783d9ccef68';
    const employeeId = cookieUtils.getCookie('floww-employee-id') || 'emp-26WoIrooxdVU';
        // const employeeToken = cookieUtils.getCookie('floww-employee-token');
    // const employeeId = cookieUtils.getCookie('floww-employee-id')  ; 
    // const adminToken = cookieUtils.getCookie('floww-admin-token') || '53877bef529b8a4568656eb14968158d91a7118cbf0de7e1b2ef3783d9ccef68';
const adminToken = cookieUtils.getCookie('floww-admin-token');
    // 
    return {
      employeeToken,
      employeeId,
      adminToken
    };
  },

  // Check if employee authentication is valid (both token and ID required)
  isEmployeeAuthenticated: () => {
    const { employeeToken, employeeId } = cookieUtils.getAuthTokens();
    return !!(employeeToken && employeeId);
  },

  // Check if admin authentication is valid
  isAdminAuthenticated: () => {
    const { adminToken } = cookieUtils.getAuthTokens();
    return !!adminToken;
  },

  // Check if any valid authentication exists
  isAuthenticated: () => {
    return cookieUtils.isEmployeeAuthenticated() || cookieUtils.isAdminAuthenticated();
  },

  // Set authentication tokens in cookies
  setAuthTokens: (employeeToken, adminToken, employeeId = null, options = {}) => {
    const defaultOptions = {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: window.location.protocol === 'https:',
      sameSite: 'lax'
    };

    if (employeeToken) {
      cookieUtils.setCookie('floww-employee-token', employeeToken, {
        ...defaultOptions,
        ...options
      });
    }

    if (employeeId) {
      cookieUtils.setCookie('floww-employee-id', employeeId, {
        ...defaultOptions,
        ...options
      });
    }

    if (adminToken) {
      cookieUtils.setCookie('floww-admin-token', adminToken, {
        ...defaultOptions,
        ...options
      });
    }
  },

  // Clear all auth tokens
  clearAuthTokens: () => {
    cookieUtils.removeCookie('floww-employee-token');
    cookieUtils.removeCookie('floww-employee-id');
    cookieUtils.removeCookie('floww-admin-token');
  }
};
