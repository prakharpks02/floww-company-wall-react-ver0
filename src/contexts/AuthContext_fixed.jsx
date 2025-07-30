import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to store user data consistently in localStorage
  const storeUserLocally = (userData) => {
    console.log('🔍 Storing user data locally:', userData);
    
    const userSession = {
      id: userData.user_id || userData.id || `USR${Date.now()}`, // Generate ID if not provided
      user_id: userData.user_id || userData.id || `USR${Date.now()}`,
      author_id: userData.user_id || userData.id || `USR${Date.now()}`,
      name: userData.username || userData.name,
      email: userData.email,
      position: userData.position || 'Employee',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: userData.department || 'General',
      is_admin: userData.is_admin || false,
      is_blocked: userData.is_blocked || false
    };
    
    localStorage.setItem('hrUser', JSON.stringify(userSession));
    setUser(userSession);
    console.log('✅ User stored locally:', userSession);
    return userSession;
  };

  // Helper function to get stored user_id/author_id
  const getCurrentUserId = () => {
    if (user && user.user_id) {
      return user.user_id; // This is the same as author_id
    }
    return null;
  };

  const getCurrentAuthorId = () => {
    if (user && user.author_id) {
      return user.author_id; // This is the same as user_id
    }
    return null;
  };

  // Generate a simple user ID
  const generateUserId = () => {
    return `USR${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  // Get all registered users from localStorage
  const getAllRegisteredUsers = () => {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  };

  // Save user to registered users list
  const saveToRegisteredUsers = (userData) => {
    const users = getAllRegisteredUsers();
    const newUser = {
      id: generateUserId(),
      user_id: userData.user_id || generateUserId(),
      username: userData.username,
      email: userData.email,
      position: userData.position || 'Employee',
      department: userData.department || 'General',
      is_admin: userData.is_admin || false,
      is_blocked: userData.is_blocked || false,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    return newUser;
  };

  // Find user by username or email
  const findUser = (username, email) => {
    const users = getAllRegisteredUsers();
    return users.find(user => 
      user.username === username || user.email === email
    );
  };

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('hrUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('Loaded user from localStorage:', parsedUser);
      setUser(parsedUser);
    } else {
      console.log('No stored user found in localStorage');
    }
    setLoading(false);
  }, []);

  // Register new user (Backend integrated)
  const register = async (username, email) => {
    try {
      console.log('🚀 Starting backend registration for:', { username, email });
      
      // First try backend registration
      try {
        const result = await userAPI.createUser({ username, email });
        console.log('✅ Backend registration successful:', result);
        
        // Extract user_id from backend response - check multiple possible field names
        const userId = result.user_id || result.id || result.userId || generateUserId();
        console.log('📍 Extracted user_id from backend:', userId);
        
        // Store user data locally after successful backend registration
        const userSession = {
          id: userId,
          user_id: userId,
          author_id: userId,
          name: username,
          email: email,
          position: 'Employee',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          department: 'General',
          is_admin: false,
          is_blocked: false
        };
        
        console.log('💾 Storing user session:', userSession);
        localStorage.setItem('hrUser', JSON.stringify(userSession));
        setUser(userSession);
        
        return { success: true, user: userSession };
      } catch (backendError) {
        console.log('⚠️ Backend registration failed, falling back to frontend:', backendError.message);
        
        // Fallback to frontend-only registration
        const existingUser = findUser(username, email);
        if (existingUser) {
          console.log('❌ User already exists:', existingUser);
          return { 
            success: false, 
            error: 'User with this username or email already exists. Please try logging in instead.' 
          };
        }

        // Create new user locally
        const newUser = saveToRegisteredUsers({ username, email });
        const userSession = storeUserLocally(newUser);
        
        console.log('✅ Frontend registration successful:', userSession);
        return { success: true, user: userSession };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  // Login user (Backend integrated)
  const login = async (username, email) => {
    try {
      console.log('🚀 Starting backend login for:', { username, email });

      // First try backend login
      try {
        const loginData = username ? { username } : { email };
        const result = await userAPI.login(loginData);
        console.log('✅ Backend login successful:', result);
        
        // Extract user_id from backend response - check multiple possible field names
        const userId = result.user_id || result.id || result.userId || generateUserId();
        console.log('📍 Extracted user_id from backend:', userId);
        
        // Store user data locally after successful backend login
        const userSession = {
          id: userId,
          user_id: userId,
          author_id: userId,
          name: result.username || username,
          email: result.email || email,
          position: result.position || 'Employee',
          avatar: result.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          department: result.department || 'General',
          is_admin: result.is_admin || false,
          is_blocked: result.is_blocked || false
        };
        
        console.log('💾 Storing user session:', userSession);
        localStorage.setItem('hrUser', JSON.stringify(userSession));
        setUser(userSession);
        
        return { success: true, user: userSession };
      } catch (backendError) {
        console.log('⚠️ Backend login failed, falling back to frontend:', backendError.message);
        
        // Fallback to frontend-only login
        const existingUser = findUser(username, email);
        if (existingUser) {
          const userSession = storeUserLocally(existingUser);
          console.log('✅ Frontend login successful with registered user:', userSession);
          return { success: true, user: userSession };
        }

        // User not found
        console.log('❌ User not found');
        return { success: false, error: 'User not found. Please register first or check your credentials.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('hrUser');
    userAPI.clearSession(); // Clear API session as well
    setUser(null);
  };

  const getAllEmployees = () => {
    return [];
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    getAllEmployees,
    getCurrentUserId, // Helper to get current user_id
    getCurrentAuthorId, // Helper to get current author_id (same as user_id)
    storeUserLocally, // Helper to store user data consistently
    getAllRegisteredUsers, // Get all registered users
    findUser // Find user helper
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
