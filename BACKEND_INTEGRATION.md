# Backend API Integration Guide

This document explains how the frontend application integrates with the backend API for user management and post creation.

## Overview

The application now supports both backend API integration and frontend-only fallback modes. When the backend is available, it will use the API endpoints. If the backend is unavailable, it falls back to local storage operations.

## API Endpoints

### User Management

#### 1. Create User
- **Endpoint**: `POST http://localhost:8000/api/wall/create_user`
- **Request Body**:
```json
{
    "username": "john_doe",
    "email": "john.doe@example.com"
}
```
- **Response**: User object with `user_id`
- **Storage**: `user_id` is automatically stored in localStorage

#### 2. Login
- **Endpoint**: `POST http://localhost:8000/api/wall/login`
- **Request Body** (with username):
```json
{
    "username": "john_doe"
}
```
- **Request Body** (with email):
```json
{
    "email": "john.doe@example.com"
}
```
- **Response**: User session data
- **Storage**: User session is stored in localStorage

### Posts Management

#### 3. Create Post
- **Endpoint**: `POST http://localhost:8000/api/wall/posts/create_post`
- **Request Body**:
```json
{
    "author_id": "your_user_id_here",
    "content": "This is my first post on the company wall!",
    "media": [
        "https://example.com/image1.jpg",
        "https://example.com/video1.mp4"
    ],
    "mentions": [
        "john_doe",
        "jane_smith"
    ],
    "tags": [
        "announcement",
        "team",
        "project"
    ]
}
```
- **Note**: `author_id` is automatically retrieved from stored user session

## Implementation Files

### 1. API Service (`src/services/api.js`)
Contains all API communication logic:
- `userAPI.createUser()` - Create new user
- `userAPI.login()` - User login
- `userAPI.getCurrentUserId()` - Get stored user ID
- `postsAPI.createPost()` - Create new post

### 2. Auth Context (`src/contexts/AuthContext.jsx`)
Updated to integrate with backend API:
- Tries backend API first
- Falls back to frontend-only mode if backend unavailable
- Automatically stores user data in localStorage

### 3. Post Context (`src/contexts/PostContext.jsx`)
Updated to integrate with backend API:
- Uses stored `author_id` from user session
- Tries backend API for post creation
- Falls back to local storage if backend unavailable

## User Flow

### Registration & Login Flow
1. **User Registration**:
   - Frontend calls `userAPI.createUser()`
   - Backend creates user and returns `user_id`
   - `user_id` stored in localStorage
   - User automatically logged in

2. **User Login**:
   - Frontend calls `userAPI.login()` with username or email
   - Backend validates and returns user data
   - User session stored in localStorage

### Post Creation Flow
1. **User creates post**:
   - Frontend retrieves `author_id` from localStorage
   - Calls `postsAPI.createPost()` with post data
   - Backend creates post with stored `author_id`
   - Post displayed in frontend

## Data Storage

### localStorage Keys
- `userId` - Current user's ID
- `userSession` - Complete user session data
- `hrUser` - Frontend user object (for compatibility)
- `hrPosts` - Cached posts data

### User Session Structure
```json
{
  "user_id": "generated_user_id",
  "username": "john_doe",
  "email": "john.doe@example.com",
  "logged_in_at": "2025-07-29T10:00:00.000Z"
}
```

## Error Handling

The application handles various error scenarios:

1. **Backend Unavailable**: Falls back to frontend-only mode
2. **User Not Found**: Shows appropriate error message
3. **Invalid Credentials**: Returns error from backend or frontend validation
4. **Network Errors**: Catches and displays user-friendly messages

## Testing

### API Demo Component
- Located at `src/components/Debug/APIDemo.jsx`
- Available in development mode
- Provides interactive testing of all API endpoints
- Access via Dashboard → "Test Backend APIs" button

### Test Functions
```javascript
import { testUserCreation, testLogin, testPostCreation } from '../utils/apiTester';

// Test user creation
await testUserCreation();

// Test login
await testLogin({ username: "john_doe" });

// Test post creation
await testPostCreation();
```

## Development Setup

1. **Start Backend Server**: Ensure your backend is running at `http://localhost:8000`

2. **Start Frontend**: 
```bash
npm run dev
```

3. **Test Integration**: 
   - Navigate to Dashboard
   - Click "Test Backend APIs" button (development mode only)
   - Run complete workflow test

## Environment Configuration

The API base URL is configured in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/wall';
```

For production, update this to your production API URL.

## Fallback Behavior

When backend API is unavailable:
- User registration/login works with localStorage
- Posts are stored locally
- All functionality remains available
- Data persists in browser storage

## Security Considerations

1. **User ID Storage**: User IDs are stored in localStorage for development purposes
2. **Production**: Consider using secure HTTP-only cookies for production
3. **CORS**: Ensure backend has proper CORS configuration
4. **Validation**: Backend should validate all input data

## Troubleshooting

### Common Issues

1. **CORS Errors**: 
   - Check backend CORS configuration
   - Ensure `http://localhost:3000` is allowed

2. **Network Errors**:
   - Verify backend server is running
   - Check API endpoint URLs

3. **User ID Missing**:
   - Clear localStorage and re-login
   - Check browser developer tools for stored data

### Debug Tools

1. **Browser Console**: Check for API call logs
2. **Network Tab**: Monitor API requests/responses  
3. **Application Tab**: Inspect localStorage data
4. **API Demo Component**: Interactive testing interface

## Migration from Frontend-Only

Existing users and posts will continue to work:
- Old localStorage data is preserved
- New API calls are additive
- Gradual migration to backend storage
- No data loss during transition
