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
    const employeeToken = cookieUtils.getCookie('floww_employee_token');
    const adminToken = cookieUtils.getCookie('floww_admin_token');
    
    return {
      employeeToken,
      adminToken
    };
  },

  // Set authentication tokens in cookies
  setAuthTokens: (employeeToken, adminToken, options = {}) => {
    const defaultOptions = {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: window.location.protocol === 'https:',
      sameSite: 'lax'
    };

    if (employeeToken) {
      cookieUtils.setCookie('floww_employee_token', employeeToken, {
        ...defaultOptions,
        ...options
      });
    }

    if (adminToken) {
      cookieUtils.setCookie('floww_admin_token', adminToken, {
        ...defaultOptions,
        ...options
      });
    }
  },

  // Clear all auth tokens
  clearAuthTokens: () => {
    cookieUtils.removeCookie('floww_employee_token');
    cookieUtils.removeCookie('floww_admin_token');
  }
};
