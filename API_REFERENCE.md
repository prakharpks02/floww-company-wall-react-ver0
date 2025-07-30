# Complete API Reference Guide

This document provides a comprehensive overview of all available API methods in the centralized API service.

## Table of Contents

1. [Getting Started](#getting-started)
2. [API Structure](#api-structure)
3. [User Management APIs](#user-management-apis)
4. [Posts Management APIs](#posts-management-apis)
5. [Media Management APIs](#media-management-apis)
6. [Notifications APIs](#notifications-apis)
7. [Admin APIs](#admin-apis)
8. [Utility APIs](#utility-apis)
9. [Quick Access Methods](#quick-access-methods)
10. [Storage Management](#storage-management)
11. [Error Handling](#error-handling)
12. [Usage Examples](#usage-examples)

## Getting Started

```javascript
import api from './services/api';
// or import specific APIs
import { userAPI, postsAPI } from './services/api';
```

## API Structure

The API is organized into the following modules:

- **`api.user`** - User management (registration, login, profile)
- **`api.posts`** - Posts management (CRUD operations)
- **`api.media`** - File upload and media management
- **`api.notifications`** - User notifications
- **`api.admin`** - Administrative functions

- **`api.auth`** - Convenience authentication methods
- **`api.quick`** - Quick access methods for common operations
- **`api.storage`** - Local storage management

## User Management APIs

### Core Methods

```javascript
// Create new user
const user = await api.user.createUser({
  username: "john_doe",
  email: "john@example.com"
});

// Login user
const session = await api.user.login({
  username: "john_doe"  // or email: "john@example.com"
});

// Logout user
await api.user.logout();

// Update user profile
const updated = await api.user.updateProfile(userId, {
  name: "John Doe",
  position: "Developer"
});

// Get user by ID
const user = await api.user.getUserById(userId);
```

### Utility Methods

```javascript
// Get current user ID
const userId = api.user.getCurrentUserId();

// Get full user session
const session = api.user.getUserSession();

// Clear session data
api.user.clearSession();
```

## Posts Management APIs

### Core Methods

```javascript
// Create post
const post = await api.posts.createPost({
  content: "Hello world!",
  tags: ["announcement", "team"],
  mentions: ["john_doe"],
  media: ["image_url.jpg"]
});

// Get all posts (with pagination)
const posts = await api.posts.getPosts(page = 1, limit = 20);

// Get user's posts
const userPosts = await api.posts.getUserPosts(userId, page = 1, limit = 20);

// Get single post
const post = await api.posts.getPostById(postId);

// Update post
const updated = await api.posts.updatePost(postId, {
  content: "Updated content"
});

// Delete post
await api.posts.deletePost(postId);
```

### Interaction Methods

```javascript
// Like/Unlike post
const result = await api.posts.toggleLike(postId);

// Add post reaction
const reaction = await api.posts.addReaction(postId, 'love', '❤️');
// Available reaction types: 'like', 'love', 'laugh', 'angry', 'sad', etc.

// Remove post reaction
await api.posts.removeReaction(postId, 'love');

// Add comment
const comment = await api.posts.addComment(postId, {
  content: "Great post!"
});

// Get comments
const comments = await api.posts.getComments(postId, page = 1, limit = 10);
```

## Media Management APIs

```javascript
// Upload single file
const fileResult = await api.media.uploadFile(file, 'image');

// Upload multiple files
const filesResult = await api.media.uploadFiles([file1, file2], 'image');

// Delete file
await api.media.deleteFile(fileUrl);
```

## Notifications APIs

```javascript
// Get notifications
const notifications = await api.notifications.getNotifications(page = 1, limit = 20);

// Mark notification as read
await api.notifications.markAsRead(notificationId);

// Mark all as read
await api.notifications.markAllAsRead();
```

## Admin APIs

```javascript
// Get all users (admin only)
const users = await api.admin.getAllUsers(page = 1, limit = 50);

// Block/Unblock user
await api.admin.toggleUserBlock(userId, true); // block
await api.admin.toggleUserBlock(userId, false); // unblock

// Delete post (admin)
await api.admin.deletePostAdmin(postId);
```

## Utility APIs

```javascript



// Get server info
const info = await api.utility.getServerInfo();
```

## Quick Access Methods

### Authentication Shortcuts

```javascript
// Check if user is logged in
const isLoggedIn = api.auth.isLoggedIn();

// Get current user
const user = api.auth.getCurrentUser();

// Quick signup
const user = await api.auth.signUp({ username: "john", email: "john@example.com" });

// Quick signin
const session = await api.auth.signIn({ username: "john" });

// Quick signout
await api.auth.signOut();
```

### Quick Operations

```javascript
// Quick post
const post = await api.quick.post("Hello world!", {
  tags: ["announcement"],
  mentions: ["team"]
});

// Quick user lookup
const user = await api.quick.getUser(userId);

// Quick feed fetch
const posts = await api.quick.getFeed(page = 1);


```

## Storage Management

```javascript
// Get stored data
const userData = api.storage.getItem(api.storage.KEYS.USER_SESSION);

// Store data
api.storage.setItem(api.storage.KEYS.USER_SESSION, sessionData);

// Remove data
api.storage.removeItem(api.storage.KEYS.USER_ID);

// Clear user data
api.storage.clearUserData();

// Clear all app data
api.storage.clearAllData();
```

### Storage Keys

```javascript
api.storage.KEYS = {
  USER_ID: 'userId',
  USER_SESSION: 'userSession',
  HR_USER: 'hrUser',
  HR_POSTS: 'hrPosts',
  REGISTERED_USERS: 'registeredUsers'
}
```

## Error Handling

### Error Types

```javascript
api.errors = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR'
}
```

### Error Handling Pattern

```javascript
try {
  const result = await api.posts.createPost(postData);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
  
  // Handle specific error types
  if (error.message.includes('timeout')) {
    // Handle timeout
  } else if (error.message.includes('not logged in')) {
    // Handle auth error
  }
}
```

## Usage Examples

### Complete User Registration and Post Creation

```javascript
// Step 1: Register user
try {
  const user = await api.auth.signUp({
    username: "new_user",
    email: "user@example.com"
  });
  console.log('User registered:', user);
  
  // Step 2: Create a post
  const post = await api.quick.post("My first post!", {
    tags: ["introduction", "new-member"],
    mentions: ["team"]
  });
  console.log('Post created:', post);
  
} catch (error) {
  console.error('Error:', error.message);
}
```

### Login and Fetch User's Posts

```javascript
// Login
try {
  await api.auth.signIn({ username: "existing_user" });
  
  // Check if logged in
  if (api.auth.isLoggedIn()) {
    const userId = api.user.getCurrentUserId();
    const userPosts = await api.posts.getUserPosts(userId);
    console.log('User posts:', userPosts);
  }
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### File Upload with Post Creation

```javascript
// Upload image and create post
try {
  const fileInput = document.getElementById('file-input');
  const file = fileInput.files[0];
  
  // Upload file
  const uploadResult = await api.media.uploadFile(file, 'image');
  
  // Create post with uploaded image
  const post = await api.posts.createPost({
    content: "Check out this image!",
    media: [uploadResult.url],
    tags: ["photo", "share"]
  });
  
  console.log('Post with image created:', post);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### Admin Operations

```javascript
// Admin: Get all users and manage them
try {
  const users = await api.admin.getAllUsers();
  // console.log('All users:', users);
  
  // Block a user
  await api.admin.toggleUserBlock('user123', true);
  // console.log('User blocked');
  
  // Delete inappropriate post
  await api.admin.deletePostAdmin('post456');
  // console.log('Post deleted by admin');
  
} catch (error) {
  console.error('Admin operation failed:', error.message);
}
```

## Configuration

### API Base URL

```javascript
// Current configuration
api.config.BASE_URL; // 'http://localhost:8000/api/wall'

// Update for production
api.config.BASE_URL = 'https://your-api-domain.com/api/wall';
```

### Timeout Settings

```javascript
// Current timeout (10 seconds)
api.config.TIMEOUT; // 10000

// Update timeout
api.config.TIMEOUT = 15000; // 15 seconds
```

## Development Tips

1. **Check Connection**: API automatically pings server on load
2. **Logging**: All API calls are logged in development mode
3. **Fallback**: System falls back to local storage if backend unavailable
4. **Error Recovery**: Always handle network errors gracefully
5. **Storage**: Use `api.storage` for consistent data management

## Testing

Use the API Demo component to test all endpoints:

```javascript
import APIDemo from './components/Debug/APIDemo';

// Available in development mode via Dashboard → "Test Backend APIs"
```

This centralized API structure makes it easy to:
- Find and use any API method
- Handle errors consistently
- Manage user sessions and storage
- Add new endpoints in organized sections
- Maintain backward compatibility
