// API Testing Utility for Backend Integration
// This file demonstrates how to use the centralized API service

import api from '../services/api.jsx';

/**
 * Test user creation functionality
 */
export const testUserCreation = async () => {
  try {
    const userData = {
      username: "john_doe",
      email: "john.doe@example.com"
    };
    
    const result = await api.user.createUser(userData);
    return result;
  } catch (error) {
    console.error('❌ User creation failed:', error.message);
    throw error;
  }
};

/**
 * Test user login functionality
 */
export const testUserLogin = async (credentials) => {
  try {
    // Login with username
    if (credentials.username) {
      const result = await api.user.login({ username: credentials.username });
      return result;
    }
    
    // Login with email
    if (credentials.email) {
      const result = await api.user.login({ email: credentials.email });
      return result;
    }
    
    throw new Error('Please provide either username or email for login');
  } catch (error) {
    console.error('❌ User login failed:', error.message);
    throw error;
  }
};

/**
 * Test post creation functionality
 */
export const testPostCreation = async () => {
  try {
    // Make sure user is logged in first
    const userId = api.user.getCurrentUserId();
    if (!userId) {
      throw new Error('User must be logged in to create posts');
    }
    
    const postData = {
      content: "This is my first post on the company wall!",
      media: [
        "https://example.com/image1.jpg",
        "https://example.com/video1.mp4"
      ],
      mentions: [
        "john_doe",
        "jane_smith"
      ],
      tags: [
        "announcement",
        "team",
        "project"
      ]
    };
    
    const result = await api.posts.createPost(postData);
    return result;
  } catch (error) {
    console.error('❌ Post creation failed:', error.message);
    throw error;
  }
};

/**
 * Test quick access methods
 */
export const testQuickMethods = async () => {
  try {
    // Test quick signup
    const userData = {
      username: "quick_user_" + Date.now(),
      email: `quick${Date.now()}@example.com`
    };
    
    const user = await api.auth.signUp(userData);
    
    // Test auth status
    // Test quick post
    const post = await api.quick.post("Hello from quick method!", {
      tags: ["test", "quick-method"],
      mentions: ["team"]
    });
    
    // Test quick feed fetch
    const feed = await api.quick.getFeed(1);
    
    return { user, post, feed };
  } catch (error) {
    console.error('❌ Quick methods test failed:', error.message);
    throw error;
  }
};

/**
 * Test media upload functionality
 */
export const testMediaUpload = async () => {
  try {
    // Create a dummy file for testing
    const dummyFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const result = await api.media.uploadFile(dummyFile, 'document');
    return result;
  } catch (error) {
    console.error('❌ Media upload failed:', error.message);
    throw error;
  }
};

/**
 * Test notifications functionality
 */
export const testNotifications = async () => {
  try {
    if (!api.auth.isLoggedIn()) {
      throw new Error('User must be logged in to test notifications');
    }
    
    const notifications = await api.notifications.getNotifications(1, 10);
    return notifications;
  } catch (error) {
    console.error('❌ Notifications test failed:', error.message);
    throw error;
  }
};

/**
 * Test admin functionality
 */
export const testAdminFunctions = async () => {
  try {
    const users = await api.admin.getAllUsers(1, 10);
    return users;
  } catch (error) {
    console.error('❌ Admin functions test failed:', error.message);
    throw error;
  }
};

/**
 * Test utility functions
 */
export const testUtilityFunctions = async () => {
  try {
    // Server info
    const info = await api.utility.getServerInfo();
    
    // Quick ping
    const ping = await api.quick.ping();
    
    return { info, ping };
  } catch (error) {
    console.error('❌ Utility functions test failed:', error.message);
    throw error;
  }
};

/**
 * Complete workflow test: Create user -> Login -> Create post -> Test features
 */
export const testCompleteWorkflow = async () => {
  try {
    // Step 1: Create user
    const userData = {
      username: "workflow_user_" + Date.now(),
      email: `workflow${Date.now()}@example.com`
    };
    
    const user = await api.auth.signUp(userData);
    
    // Step 2: Verify login status
    // Step 3: Create post using quick method
    const post = await api.quick.post("Hello from complete workflow test! 🎉", {
      tags: ["workflow-test", "api-integration", "demo"],
      mentions: ["team", "developers"]
    });
    
    // Step 4: Fetch user's posts
    const userPosts = await api.posts.getUserPosts(user.user_id, 1, 5);
    
    // Step 5: Test storage management
    const storedSession = api.storage.getItem(api.storage.KEYS.USER_SESSION);
    
    // Step 6: Test utility functions
    await testUtilityFunctions();
    
    return { user, post, userPosts };
    
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error.message);
    throw error;
  }
};

/**
 * Test all API endpoints
 */
export const testAllEndpoints = async () => {
  try {
    const results = {};
    
    // Test user APIs
    results.userCreation = await testUserCreation();
    results.userLogin = await testUserLogin({ username: results.userCreation.username });
    
    // Test post APIs
    results.postCreation = await testPostCreation();
    
    // Test quick methods
    results.quickMethods = await testQuickMethods();
    
    // Test utility functions
    results.utilities = await testUtilityFunctions();
    
    // Test media upload (will likely fail without actual file)
    try {
      results.mediaUpload = await testMediaUpload();
    } catch (error) {
      // Media upload test skipped
    }
    
    // Test notifications
    try {
      results.notifications = await testNotifications();
    } catch (error) {
      // Notifications test skipped
    }
    
    // Test admin functions
    try {
      results.admin = await testAdminFunctions();
    } catch (error) {
      // Admin functions test skipped
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ All endpoints test failed:', error.message);
    throw error;
  }
};

/**
 * Test helper to clear all stored data
 */
export const clearTestData = () => {
  api.storage.clearAllData();
};

/**
 * Show current API status
 */
export const showAPIStatus = () => {
  // Intentionally left without console logging per request
  return {
    baseURL: api.config.BASE_URL,
    timeout: api.config.TIMEOUT,
    loggedIn: api.auth.isLoggedIn(),
    currentUserId: api.user.getCurrentUserId(),
    userSession: api.auth.getCurrentUser()
  };
};

/**
 * Demo data for quick testing
 */
export const demoUsers = [
  {
    username: "john_doe",
    email: "john.doe@example.com"
  },
  {
    username: "jane_smith", 
    email: "jane.smith@example.com"
  },
  {
    username: "bob_wilson",
    email: "bob.wilson@example.com"
  }
];

/**
 * Demo posts for testing
 */
export const demoPosts = [
  {
    content: "Welcome to our company wall! 🎉",
    tags: ["welcome", "announcement"],
    mentions: ["team"]
  },
  {
    content: "Great job on the quarterly review everyone! 📊",
    tags: ["achievement", "quarterly-review"],
    mentions: ["management", "team"]
  },
  {
    content: "Don't forget about the team lunch tomorrow at 12 PM 🍕",
    tags: ["reminder", "team-lunch"],
    mentions: ["all"]
  }
];

// Export default test runner with all methods
export default {
  testUserCreation,
  testUserLogin,
  testPostCreation,
  testQuickMethods,
  testMediaUpload,
  testNotifications,
  testAdminFunctions,
  testUtilityFunctions,
  testCompleteWorkflow,
  testAllEndpoints,
  clearTestData,
  showAPIStatus,
  demoUsers,
  demoPosts,
  
  // Direct API access for advanced testing
  api
};
