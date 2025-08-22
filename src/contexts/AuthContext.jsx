import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';

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
  const adminToken = import.meta.env.VITE_FLOWW_ADMIN_TOKEN;
  const employeeToken = import.meta.env.VITE_FLOWW_EMPLOYEE_TOKEN;
  
  // If current path contains /crm, use admin token
  if (currentPath.includes('/crm')) {
    console.log('🛡️ Admin route detected, using admin token');
    return { token: adminToken, isAdmin: true };
  }
  
  // Otherwise use employee token
  console.log('👤 Employee route detected, using employee token');
  return { token: employeeToken, isAdmin: false };
};

useEffect(() => {
  const fetchUser = async () => {
    try {
      const { token, isAdmin } = getTokenAndUserType();
      
      if (!token) {
        // Redirect if no token
        window.location.href = "https://dev.gofloww.co";
        return;
      }

      // For admin users, try to fetch real data from API first
      if (isAdmin) {
        try {
          console.log('🔍 AuthContext - Admin: Calling getCurrentUser API...');
          console.log('🔍 AuthContext - Admin: Token being used:', token ? 'Token exists' : 'No token');
          console.log('🔍 AuthContext - Admin: Current path:', window.location.pathname);
          
          const response = await userAPI.getCurrentUser();
          console.log('🔍 AuthContext - Admin: API Response:', response);
          console.log('🔍 AuthContext - Admin: Response status:', response?.status);
          console.log('🔍 AuthContext - Admin: Response data:', response?.data);
          
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
              avatar: userData.profile_picture_link || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.employee_name)}&background=9f7aea&color=white&size=128`,
              position: userData.job_title || 'Administrator',
              department: 'Administration',
              is_admin: true
            };
            
            console.log('🔍 AuthContext - Admin: Transformed user data:', adminUser);
            setUser(adminUser);
            console.log(`✅ Admin user authenticated: ${userData.employee_name} (${userData.employee_username}) for path: ${window.location.pathname}`);
            return;
          }
        } catch (apiError) {
          console.error('❌ Admin: Failed to fetch user data from API:', apiError);
          console.error('❌ Admin: Using fallback admin user');
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
          avatar: `https://ui-avatars.com/api/?name=Admin&background=9f7aea&color=white&size=128`,
          position: 'Administrator',
          department: 'Administration',
          is_admin: true
        };
        setUser(adminUser);
        console.log(`⚠️ Admin user authenticated with fallback data for path: ${window.location.pathname}`);
        return;
      }

      // For employee users, fetch real data from API
      try {
        console.log('🔍 AuthContext - Calling getCurrentUser API...');
        console.log('🔍 AuthContext - Token being used:', token ? 'Token exists' : 'No token');
        console.log('🔍 AuthContext - Current path:', window.location.pathname);
        
        const response = await userAPI.getCurrentUser();
        console.log('🔍 AuthContext - API Response:', response);
        console.log('🔍 AuthContext - Response status:', response?.status);
        console.log('🔍 AuthContext - Response data:', response?.data);
        
        const userData = response.data;
        
        console.log('🔍 AuthContext - Raw user data from API:', userData);
        
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
          avatar: userData.profile_picture_link || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.employee_name)}&background=9f7aea&color=white&size=128`,
          position: userData.job_title, // Using job_title instead of 'Employee'
          department: 'General',
          is_admin: false
        };

        console.log('🔍 AuthContext - Transformed user data:', authenticatedUser);
        setUser(authenticatedUser);
        console.log(`✅ Employee user authenticated: ${userData.employee_name} (${userData.employee_username}) for path: ${window.location.pathname}`);
      } catch (apiError) {
        console.error('❌ Failed to fetch user data from API:', apiError);
        console.error('❌ API Error details:', {
          message: apiError.message,
          stack: apiError.stack,
          name: apiError.name
        });
        
        // Use fallback with detailed error logging
        console.error('❌ API call failed, using fallback user. Error details:');
        console.error('Error message:', apiError.message);
        console.error('Error name:', apiError.name);
        console.error('Full error:', apiError);
        
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
          avatar: `https://ui-avatars.com/api/?name=Employee&background=9f7aea&color=white&size=128`,
          position: 'Employee',
          department: 'General',
          is_admin: false
        };
        setUser(fallbackUser);
        console.log('⚠️ Using fallback employee user due to API error');
      }
    } catch (error) {
      console.error("Error setting up user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Listen for URL changes to switch tokens
  const handleLocationChange = () => {
    console.log('🔄 URL changed, re-evaluating user type...');
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

  const logout = () => {
    // For token auth, we could clear the token or redirect
    console.log('Logout requested - redirecting to Floww');
    window.location.href = 'https://dev.gofloww.co';
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
    getAllEmployees
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
