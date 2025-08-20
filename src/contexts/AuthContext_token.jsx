import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Hardcoded token for authentication
  const FLOWW_EMPLOYEE_TOKEN = '99f5c17fe3b5c866c94a132e9b781185651201eb80569326a893e5ecf3e7f448';

  useEffect(() => {
    // Check if token is available and set authenticated user
    if (FLOWW_EMPLOYEE_TOKEN) {
      const authenticatedUser = {
        id: 'authenticated_user',
        name: 'Employee User',
        email: 'employee@floww.co',
        authenticated: true,
        token: FLOWW_EMPLOYEE_TOKEN
      };
      setUser(authenticatedUser);
    } else {
      // Redirect to Floww if no token
      window.location.href = 'https://dev.gofloww.co';
    }
    setLoading(false);
  }, []);

  // Check authentication status
  const isAuthenticated = () => {
    return !!FLOWW_EMPLOYEE_TOKEN;
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
