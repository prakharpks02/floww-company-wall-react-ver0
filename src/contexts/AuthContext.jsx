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

      // For admin users, still use hardcoded data since they don't have user profiles
      if (isAdmin) {
        const adminUser = {
          id: 'ADMIN_USER',
          employee_id: 'ADMIN_USER',
          user_id: 'ADMIN_USER',
          author_id: 'ADMIN_USER',
          name: 'Admin User',
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
        console.log(`✅ Admin user authenticated for path: ${window.location.pathname}`);
        return;
      }

      // For employee users, fetch real data from API
      try {
        const response = await userAPI.getCurrentUser();
        const userData = response.data;
        
        const authenticatedUser = {
          id: userData.employee_id,
          employee_id: userData.employee_id,
          user_id: userData.employee_id,
          author_id: userData.employee_id,
          name: userData.username, // Using username as display name
          username: userData.username,
          email: userData.personal_email || userData.company_email,
          company_email: userData.company_email,
          personal_email: userData.personal_email,
          is_blocked: userData.is_blocked || false,
          authenticated: true,
          token: token,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=9f7aea&color=white&size=128`,
          position: 'Employee',
          department: 'General',
          is_admin: false
        };

        setUser(authenticatedUser);
        console.log(`✅ Employee user authenticated: ${userData.username} for path: ${window.location.pathname}`);
      } catch (apiError) {
        console.error('❌ Failed to fetch user data from API:', apiError);
        
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
