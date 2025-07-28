import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Dummy HR employees data
  const hrEmployees = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@atomhr.com',
      password: 'password123',
      position: 'HR Manager',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b5b34b7d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: 'Human Resources'
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@atomhr.com',
      password: 'password123',
      position: 'Recruitment Specialist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: 'Human Resources'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@atomhr.com',
      password: 'password123',
      position: 'HR Business Partner',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: 'Human Resources'
    },
    {
      id: '4',
      name: 'David Kumar',
      email: 'david.kumar@atomhr.com',
      password: 'password123',
      position: 'Learning & Development Manager',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: 'Human Resources'
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      email: 'lisa.thompson@atomhr.com',
      password: 'password123',
      position: 'Compensation & Benefits Analyst',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: 'Human Resources'
    }
  ];

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

  // Helper method to manually set user with specific user_id (for testing/debugging)
  const setUserWithId = (userId, name, email) => {
    const userSession = {
      id: userId, // Use the provided user_id (like USR49174)
      user_id: userId, // Store both for consistency
      author_id: userId, // author_id same as user_id
      name: name || 'User',
      email: email || 'user@example.com',
      position: 'Employee',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      department: 'General'
    };
    
    localStorage.setItem('hrUser', JSON.stringify(userSession));
    setUser(userSession);
    console.log('✅ Manually set user with consistent IDs:', userSession);
    return userSession;
  };

  // Register new user
  const register = async (username, email) => {
    try {
      console.log('� Starting registration for:', { username, email });
      
  // Register new user (Frontend only)
  const register = async (username, email) => {
    try {
      console.log('� Starting frontend registration for:', { username, email });
      
      // Check if user already exists
      const existingUser = findUser(username, email);
      if (existingUser) {
        console.log('❌ User already exists:', existingUser);
        return { 
          success: false, 
          error: 'User with this username or email already exists. Please try logging in instead.' 
        };
      }

      // Create new user
      const newUser = saveToRegisteredUsers({ username, email });
      const userSession = storeUserLocally(newUser);
      
      console.log('✅ Registration successful:', userSession);
      return { success: true, user: userSession };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const login = async (username, email) => {
    try {
      console.log('� Starting login for:', { username, email });

      // Since the lookup endpoints don't exist, skip to hardcoded users for now
      // In the future, implement proper authentication endpoint
      
      console.log('⚠️ User lookup endpoints not available, checking hardcoded users...');
    } catch (error) {
      console.error('Login error:', error);

      // Fallback to hardcoded users for backward compatibility
      if ((username === 'user123' && email === 'user@gmail.com') || 
          (username === 'user1234' && email === 'user@gmail.com')) {
        const userSession = {
          id: 'USR43368',
          user_id: 'USR43368',
          author_id: 'USR43368',
          name: username,
          email: 'user@gmail.com',
          position: 'Employee',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          department: 'General'
        };
        
        localStorage.setItem('hrUser', JSON.stringify(userSession));
        setUser(userSession);
        console.log('✅ Fallback login successful with hardcoded user:', userSession);
        return { success: true, user: userSession };
      }

      if (username === 'user1234' && email === 'user2@gmail.com') {
        const userSession = {
          id: 'USR43369',
          user_id: 'USR43369',
          author_id: 'USR43369',
          name: 'user1234',
          email: 'user2@gmail.com',
          position: 'Employee',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          department: 'General'
        };
        
        localStorage.setItem('hrUser', JSON.stringify(userSession));
        setUser(userSession);
        console.log('✅ Fallback login successful with hardcoded user:', userSession);
        return { success: true, user: userSession };
      }

      return { success: false, error: 'Invalid username or email' };
    }
  };

  const logout = () => {
    localStorage.removeItem('hrUser');
    setUser(null);
  };

  const getAllEmployees = () => {
    return hrEmployees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      position: emp.position,
      avatar: emp.avatar,
      department: emp.department
    }));
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    getAllEmployees,
    hrEmployees,
    setUserWithId, // Helper method for testing
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
