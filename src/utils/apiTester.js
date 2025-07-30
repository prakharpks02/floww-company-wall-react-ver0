// API Testing Utility for Backend Integration
// This file demonstrates how to use the centralized API service

import api from '../services/api';

/**
 * Test user creation functionality
 */
export const testUserCreation = async () => {
  try {
    console.log('🧪 Testing user creation...');
    
    const userData = {
      username: "john_doe",
      email: "john.doe@example.com"
    };
    
    const result = await api.user.createUser(userData);
    console.log('✅ User created successfully:', result);
    console.log('📁 User ID stored in localStorage:', api.user.getCurrentUserId());
    
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
    console.log('🧪 Testing user login...');
    
    // Login with username
    if (credentials.username) {
      const result = await api.user.login({ username: credentials.username });
      console.log('✅ Login with username successful:', result);
      return result;
    }
    
    // Login with email
    if (credentials.email) {
      const result = await api.user.login({ email: credentials.email });
      console.log('✅ Login with email successful:', result);
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
    console.log('🧪 Testing post creation...');
    
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
    console.log('✅ Post created successfully:', result);
    
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
    console.log('🧪 Testing quick access methods...');
    
    // Test quick signup
    const userData = {
      username: "quick_user_" + Date.now(),
      email: `quick${Date.now()}@example.com`
    };
    
    const user = await api.auth.signUp(userData);
    console.log('✅ Quick signup successful:', user);
    
    // Test auth status
    console.log('📍 Is logged in:', api.auth.isLoggedIn());
    console.log('👤 Current user:', api.auth.getCurrentUser());
    
    // Test quick post
    const post = await api.quick.post("Hello from quick method!", {
      tags: ["test", "quick-method"],
      mentions: ["team"]
    });
    console.log('✅ Quick post created:', post);
    
    // Test quick feed fetch
    const feed = await api.quick.getFeed(1);
    console.log('✅ Quick feed fetched:', feed);
    
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
    console.log('🧪 Testing media upload...');
    
    // Create a dummy file for testing
    const dummyFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const result = await api.media.uploadFile(dummyFile, 'document');
    console.log('✅ File uploaded successfully:', result);
    
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
    console.log('🧪 Testing notifications...');
    
    if (!api.auth.isLoggedIn()) {
      throw new Error('User must be logged in to test notifications');
    }
    
    const notifications = await api.notifications.getNotifications(1, 10);
    console.log('✅ Notifications fetched:', notifications);
    
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
    console.log('🧪 Testing admin functions...');
    
    const users = await api.admin.getAllUsers(1, 10);
    console.log('✅ All users fetched (admin):', users);
    
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
    console.log('🧪 Testing utility functions...');
    
    

    
    // Server info
    const info = await api.utility.getServerInfo();
    console.log('✅ Server info:', info);
    
    // Quick ping
    const ping = await api.quick.ping();
    console.log('✅ Quick ping:', ping);
    
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
    console.log('🔄 Starting complete workflow test...');
    
    // Step 1: Create user
    console.log('\n--- Step 1: Creating User ---');
    const userData = {
      username: "workflow_user_" + Date.now(),
      email: `workflow${Date.now()}@example.com`
    };
    
    const user = await api.auth.signUp(userData);
    console.log('✅ User created:', JSON.stringify(user, null, 2));
    
    // Step 2: Verify login status
    console.log('\n--- Step 2: Verifying Login Status ---');
    console.log('Is logged in:', api.auth.isLoggedIn());
    console.log('Current user:', api.auth.getCurrentUser());
    
    // Step 3: Create post using quick method
    console.log('\n--- Step 3: Creating Post ---');
    const post = await api.quick.post("Hello from complete workflow test! 🎉", {
      tags: ["workflow-test", "api-integration", "demo"],
      mentions: ["team", "developers"]
    });
    console.log('✅ Post created successfully');
    
    // Step 4: Fetch user's posts
    console.log('\n--- Step 4: Fetching User Posts ---');
    const userPosts = await api.posts.getUserPosts(user.user_id, 1, 5);
    console.log(`✅ Retrieved ${userPosts.posts?.length || 0} user posts`);
    
    // Step 5: Test storage management
    console.log('\n--- Step 5: Testing Storage ---');
    const storedSession = api.storage.getItem(api.storage.KEYS.USER_SESSION);
    console.log('✅ Stored session retrieved:', storedSession);
    
    // Step 6: Test utility functions
    console.log('\n--- Step 6: Testing Utilities ---');
    await testUtilityFunctions();
    
    console.log('\n🎉 Complete workflow test successful!');
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
    console.log('🧪 Testing ALL API endpoints...');
    
    const results = {};
    
    // Test user APIs
    console.log('\n=== Testing User APIs ===');
    results.userCreation = await testUserCreation();
    results.userLogin = await testUserLogin({ username: results.userCreation.username });
    
    // Test post APIs
    console.log('\n=== Testing Post APIs ===');
    results.postCreation = await testPostCreation();
    
    // Test quick methods
    console.log('\n=== Testing Quick Methods ===');
    results.quickMethods = await testQuickMethods();
    
    // Test utility functions
    console.log('\n=== Testing Utility Functions ===');
    results.utilities = await testUtilityFunctions();
    
    // Test media upload (will likely fail without actual file)
    console.log('\n=== Testing Media Upload ===');
    try {
      results.mediaUpload = await testMediaUpload();
    } catch (error) {
      console.log('⚠️ Media upload test skipped (expected in demo)');
    }
    
    // Test notifications
    console.log('\n=== Testing Notifications ===');
    try {
      results.notifications = await testNotifications();
    } catch (error) {
      console.log('⚠️ Notifications test skipped (may not be implemented)');
    }
    
    // Test admin functions
    console.log('\n=== Testing Admin Functions ===');
    try {
      results.admin = await testAdminFunctions();
    } catch (error) {
      console.log('⚠️ Admin functions test skipped (requires admin privileges)');
    }
    
    console.log('\n🎉 All endpoint tests completed!');
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
  console.log('🧹 Clearing test data...');
  api.storage.clearAllData();
  console.log('✅ Test data cleared');
};

/**
 * Show current API status
 */
export const showAPIStatus = () => {
  console.log('📊 Current API Status:');
  console.log('- Base URL:', api.config.BASE_URL);
  console.log('- Timeout:', api.config.TIMEOUT);
  console.log('- Logged in:', api.auth.isLoggedIn());
  console.log('- Current user ID:', api.user.getCurrentUserId());
  console.log('- User session:', api.auth.getCurrentUser());
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
