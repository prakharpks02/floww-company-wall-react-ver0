import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { cookieUtils } from '../utils/cookieUtils';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component for token-based authentication
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

// Get appropriate token and determine user type based on current URL
const getTokenAndUserType = () => {
  const currentPath = window.location.pathname;
  const { employeeToken, adminToken } = cookieUtils.getAuthTokens();
  
  // If current path contains /crm, use admin token
  if (currentPath.includes('/crm')) {
    return { token: adminToken, isAdmin: true };
  }
  
  // Otherwise use employee token
  return { token: employeeToken, isAdmin: false };
};

const fetchUser = async () => {
  try {
    const { token, isAdmin } = getTokenAndUserType();
  
    
    if (!token) {
   
      // No token found, redirect to main Floww application
      window.location.href = "https://dev.gofloww.co";
      return;
    }

      // For admin users, try to fetch real data from API first
      if (isAdmin) {
        try {
          
          
          const response = await userAPI.getCurrentUser();
          const userData = response.data;
          
          if (userData && userData.employee_name) {
            // Use real admin data from API
            const adminUser = {
              id: userData.employee_id,
              employee_id: userData.employee_id,
              user_id: userData.employee_id,
              author_id: userData.employee_id,
              name: userData.employee_name,
              username: userData.employee_username,
              email: userData.personal_email || userData.company_email,
              company_email: userData.company_email,
              personal_email: userData.personal_email,
              is_blocked: userData.is_blocked || false,
              authenticated: true,
              token: token,
              profile_picture_link: userData.profile_picture_link || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.employee_name)}&background=9f7aea&color=white&size=128`,
              position: userData.job_title || 'Administrator',
              department: 'Administration',
              is_admin: true
            };
            
         
            setUser(adminUser);
          
            return;
          }
        } catch (apiError) {
          
        }
        
        // Fallback to hardcoded admin data if API fails
        const adminUser = {
          id: 'ADMIN_USER',
          employee_id: 'ADMIN_USER',
          user_id: 'ADMIN_USER',
          author_id: 'ADMIN_USER',
          name: 'Admin',
          username: 'admin',
          email: 'admin@company.com',
          company_email: 'admin@company.com',
          personal_email: 'admin@company.com',
          is_blocked: false,
          authenticated: true,
          token: token,
          profile_picture_link: `https://ui-avatars.com/api/?name=Admin&background=9f7aea&color=white&size=128`,
          position: 'Administrator',
          department: 'Administration',
          is_admin: true
        };
        setUser(adminUser);
   
        return;
      }

      // For employee users, fetch real data from API
      try {
      
        
        const response = await userAPI.getCurrentUser();
      
        
        const userData = response.data;
        
      
        
        if (!userData) {
          throw new Error('No user data received from API');
        }
        
        const authenticatedUser = {
          id: userData.employee_id,
          employee_id: userData.employee_id,
          user_id: userData.employee_id,
          author_id: userData.employee_id,
          name: userData.employee_name, // Using employee_name as display name
          username: userData.employee_username, // Using employee_username
          email: userData.personal_email || userData.company_email,
          company_email: userData.company_email,
          personal_email: userData.personal_email,
          is_blocked: userData.is_blocked || false,
          authenticated: true,
          token: token,
          profile_picture_link: userData.profile_picture_link || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.employee_name)}&background=9f7aea&color=white&size=128`,
          position: userData.job_title, // Using job_title instead of 'Employee'
          department: 'General',
          is_admin: false
        };

    
        setUser(authenticatedUser);
        
      } catch (apiError) {
        
        
      
        
        // Fallback to basic employee user if API fails
        const fallbackUser = {
          id: 'EMPLOYEE_USER',
          employee_id: 'EMPLOYEE_USER',
          user_id: 'EMPLOYEE_USER',
          author_id: 'EMPLOYEE_USER',
          name: 'Employee User',
          username: 'employee',
          email: 'employee@company.com',
          company_email: 'employee@company.com',
          personal_email: 'employee@company.com',
          is_blocked: false,
          authenticated: true,
          token: token,
          profile_picture_link: `https://ui-avatars.com/api/?name=Employee&background=9f7aea&color=white&size=128`,
          position: 'Employee',
          department: 'General',
          is_admin: false
        };
        setUser(fallbackUser);
       
      }
    } catch (error) {
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for URL changes to switch tokens
    const handleLocationChange = () => {
     
      setLoading(true);
      fetchUser();
    };

    // Initial fetch
    fetchUser();

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleLocationChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleLocationChange();
    };

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Check authentication status
  const isAuthenticated = () => {
    const { token } = getTokenAndUserType();
    return !!token;
  };

  // Get current user ID (simplified for token auth)
  const getCurrentUserId = () => {
    return user?.id || 'authenticated_user';
  };

  // Get current author ID (same as user ID for consistency)
  const getCurrentAuthorId = () => {
    return getCurrentUserId();
  };

  // Get all employees (returns empty array since we don't manage users)
  const getAllEmployees = () => {
    return [];
  };

  // Token-based auth doesn't require login/logout/register
  const login = async () => {
    throw new Error('Login not required with token authentication');
  };

  const register = async () => {
    throw new Error('Registration not required with token authentication');
  };

  // Cookie management methods
  const setAuthTokens = (employeeToken, adminToken, options = {}) => {
    cookieUtils.setAuthTokens(employeeToken, adminToken, options);
  };

  const clearAuthTokens = () => {
    cookieUtils.clearAuthTokens();
  };

  const getAuthTokens = () => {
    return cookieUtils.getAuthTokens();
  };

  const refreshTokensFromCookies = async () => {
    const { employeeToken, adminToken } = cookieUtils.getAuthTokens();
    
    if (!employeeToken && !adminToken) {
      // No tokens found, redirect to main Floww application
      window.location.href = 'https://dev.gofloww.co';
      return;
    }

    // Re-fetch user data with current tokens
    setLoading(true);
    try {
      await fetchUser();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Clear invalid tokens and redirect
      clearAuthTokens();
      window.location.href = 'https://dev.gofloww.co';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthTokens(); // Clear cookies instead of just redirecting
    window.location.href = 'https://console.gofloww.co/employee/';
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    getCurrentUserId,
    getCurrentAuthorId,
    getAllEmployees,
    // Cookie management methods
    setAuthTokens,
    clearAuthTokens,
    getAuthTokens,
    refreshTokensFromCookies
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
