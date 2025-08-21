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
    
    // Use the existing user_id from userData - DO NOT generate new IDs
    const consistentUserId = userData.user_id || userData.id;
    
    if (!consistentUserId) {
      throw new Error('Cannot store user locally: No user_id provided');
    }
    
    const userSession = {
      id: consistentUserId,
      user_id: consistentUserId,
      author_id: consistentUserId, // IMPORTANT: author_id must equal user_id
      name: userData.username || userData.name,
      email: userData.email,
      position: userData.position || 'Employee',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: userData.department || 'General',
      is_admin: userData.is_admin || false,
      is_blocked: userData.is_blocked === true || userData.is_blocked === "true"
    };
    
    localStorage.setItem('hrUser', JSON.stringify(userSession));
    // Also store user_id for API service compatibility
    localStorage.setItem('userId', JSON.stringify(consistentUserId));
    localStorage.setItem('userSession', JSON.stringify(userSession));
    setUser(userSession);
    console.log('✅ User stored locally with backend ID:', userSession);
    return userSession;
  };

  // Helper function to get stored user_id/author_id
  const getCurrentUserId = () => {
    console.log('🔍 getCurrentUserId - Current user:', user);
    if (user && user.user_id) {
      // console.log('✅ Returning user_id:', user.user_id);
      return user.user_id; // This is the same as author_id
    }
    // console.log('❌ No user_id found, returning null');
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

  // Initialize default users (including admin for testing)
  const initializeDefaultUsers = () => {
    const users = getAllRegisteredUsers();
    
    // Check if admin user already exists
    const adminExists = users.find(user => user.username === 'admin' && user.is_admin);
    
    if (!adminExists) {
      const adminUser = {
        id: 'ADMIN_001',
        user_id: 'ADMIN_001',
        username: 'admin',
        email: 'admin@gmail.com',
        position: 'Administrator',
        department: 'IT',
        is_admin: true,
        is_blocked: false,
        created_at: new Date().toISOString()
      };
      
      users.push(adminUser);
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      console.log('✅ Default admin user created for testing:', adminUser);
    }
    
    // Check if regular user exists
    const userExists = users.find(user => user.username === 'user123');
    
    if (!userExists) {
      const regularUser = {
        id: 'USER_001',
        user_id: 'USER_001',
        username: 'user123',
        email: 'user@gmail.com',
        position: 'Employee',
        department: 'General',
        is_admin: false,
        is_blocked: false,
        created_at: new Date().toISOString()
      };
      
      users.push(regularUser);
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      console.log('✅ Default regular user created for testing:', regularUser);
    }
  };

  // Get all registered users from localStorage
  const getAllRegisteredUsers = () => {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  };

  // Save user to registered users list (frontend-only fallback)
  const saveToRegisteredUsers = (userData) => {
    const users = getAllRegisteredUsers();
    // Only generate ID for frontend-only registration fallback
    const userId = userData.user_id || userData.id || generateUserId(); 
    
    const newUser = {
      id: userId,
      user_id: userId,
      username: userData.username,
      email: userData.email,
      position: userData.position || 'Employee',
      department: userData.department || 'General',
      is_admin: userData.is_admin || false,
      is_blocked: userData.is_blocked === true || userData.is_blocked === "true",
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    console.log('✅ User saved to registered users (frontend fallback):', newUser);
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
    // Initialize default users for testing
    initializeDefaultUsers();
    
    // Check for stored user session
    const storedUser = localStorage.getItem('hrUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('Loaded user from localStorage:', parsedUser);
      
      // CRITICAL: Ensure user_id and author_id are consistent
      if (parsedUser.user_id && parsedUser.user_id !== parsedUser.author_id) {
        console.log('🔧 Fixing inconsistent user_id/author_id in stored user');
        parsedUser.author_id = parsedUser.user_id; // Fix the author_id to match user_id
        parsedUser.id = parsedUser.user_id; // Also ensure id matches
        
        // Re-save the corrected user data
        localStorage.setItem('hrUser', JSON.stringify(parsedUser));
        localStorage.setItem('userId', JSON.stringify(parsedUser.user_id));
        localStorage.setItem('userSession', JSON.stringify(parsedUser));
        
        // console.log('✅ Fixed and re-saved user with consistent IDs:', parsedUser);
      }
      
      setUser(parsedUser);
      
      // Ensure API service compatibility - store user_id if not already stored
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId && parsedUser.user_id) {
        localStorage.setItem('userId', JSON.stringify(parsedUser.user_id));
        localStorage.setItem('userSession', JSON.stringify(parsedUser));
      }
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
        // console.log('✅ Backend registration successful:', result);
        
        // Extract user_id from backend response - check the correct structure
        const userId = result.data?.user_id || result.user_id || result.id || result.userId;
        
        if (!userId) {
          console.error('❌ Backend response missing user_id:', result);
          throw new Error('Backend registration successful but no user ID returned');
        }
        
        console.log('📍 Extracted user_id from backend:', userId);
        console.log('📍 Backend response data:', result);
        
        // Store user data locally after successful backend registration
        const userSession = {
          id: userId,
          user_id: userId,
          author_id: userId, // CRITICAL: author_id MUST equal user_id
          name: username,
          email: email,
          position: 'Employee',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          department: 'General',
          is_admin: false,
          is_blocked: false
        };
        
        console.log('💾 Storing user session with backend ID:', userSession);
        console.log('🔍 Verifying: user_id =', userId, ', author_id =', userId);
        
        try {
          localStorage.setItem('hrUser', JSON.stringify(userSession));
          localStorage.setItem('userId', JSON.stringify(userId));
          localStorage.setItem('userSession', JSON.stringify(userSession));
          setUser(userSession);
          console.log('✅ Successfully stored user data in localStorage');
        } catch (storageError) {
          console.error('❌ Failed to store user data in localStorage:', storageError);
          throw storageError;
        }
        
        console.log('✅ Backend registration completed successfully with ID:', userId);
        return { success: true, user: userSession };
        
      } catch (backendError) {
        console.error('❌ Backend registration failed with error:', backendError);
        console.error('❌ Error message:', backendError.message);
        console.error('❌ Error stack:', backendError.stack);
        console.log('⚠️ Falling back to frontend registration due to backend error');
        
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
        
        // Extract user_id from backend response - check the correct structure
        const userId = result.data?.user_id || result.user_id || result.id || result.userId;
        
        if (!userId) {
          throw new Error('Backend login successful but no user ID returned');
        }
        
        console.log('📍 Extracted user_id from backend:', userId);
        console.log('📍 Backend login response data:', result);
        
        // Store user data locally after successful backend login
        const userSession = {
          id: userId,
          user_id: userId,
          author_id: userId, // CRITICAL: author_id MUST equal user_id
          name: result.data?.username || result.username || username,
          email: result.data?.email || result.email || email,
          position: result.data?.position || result.position || 'Employee',
          avatar: result.data?.avatar || result.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          department: result.data?.department || result.department || 'General',
          is_admin: result.data?.is_admin || result.is_admin || false,
          is_blocked: result.data?.is_blocked === true || result.data?.is_blocked === "true" || result.is_blocked === true || result.is_blocked === "true"
        };
        
        console.log('💾 Storing user session with consistent IDs:', userSession);
        console.log('🔍 Verifying: user_id =', userId, ', author_id =', userId);
        console.log('🔍 User name being stored:', userSession.name);
        console.log('🔍 User type being stored:', userSession.is_admin ? 'Admin' : 'Employee');
        
        localStorage.setItem('hrUser', JSON.stringify(userSession));
        // Also store user_id for API service compatibility
        localStorage.setItem('userId', JSON.stringify(userId));
        localStorage.setItem('userSession', JSON.stringify(userSession));
        setUser(userSession);
        
        // Handle admin routing
        if (userSession.is_admin) {
          console.log('🔄 Admin user detected, checking admin dashboard URL...');
          const adminDashboardUrl = import.meta.env.VITE_ADMIN_DASHBOARD_URL || 'http://localhost:8000/dashboard/admin';
          console.log('🔄 Admin dashboard URL:', adminDashboardUrl);
          
          // Always redirect admin users to the admin dashboard
          console.log('🔄 Redirecting admin to:', adminDashboardUrl);
          
          // Use a timeout to ensure the user data is properly stored before redirect
          setTimeout(() => {
            window.location.href = adminDashboardUrl;
          }, 100);
          
          return { success: true, user: userSession, redirect: adminDashboardUrl };
        }
        
        return { success: true, user: userSession };
      } catch (backendError) {
        console.log('⚠️ Backend login failed, falling back to frontend:', backendError.message);
        
        // Fallback to frontend-only login
        const existingUser = findUser(username, email);
        if (existingUser) {
          const userSession = storeUserLocally(existingUser);
          console.log('✅ Frontend login successful with registered user:', userSession);
          
          // Handle admin routing for frontend fallback as well
          if (userSession.is_admin) {
            console.log('🔄 Admin user detected in frontend fallback');
            const adminDashboardUrl = import.meta.env.VITE_ADMIN_DASHBOARD_URL || 'http://localhost:8000/dashboard/admin';
            
            // Always redirect admin users to the admin dashboard
            console.log('🔄 Redirecting admin to:', adminDashboardUrl);
            
            // Use a timeout to ensure the user data is properly stored before redirect
            setTimeout(() => {
              window.location.href = adminDashboardUrl;
            }, 100);
            
            return { success: true, user: userSession, redirect: adminDashboardUrl };
          }
          
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
    localStorage.removeItem('userId');
    localStorage.removeItem('userSession');
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
