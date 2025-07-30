import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import apiTester from '../../utils/apiTester';

const APIDemo = () => {
  const { user, login, register } = useAuth();
  const { createPost } = usePost();
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const logOutput = (message) => {
    setOutput(prev => prev + message + '\n');
    console.log(message);
  };

  const clearOutput = () => {
    setOutput('');
  };

  const testCreateUser = async () => {
    setLoading(true);
    clearOutput();
    try {
      await apiTester.testUserCreation();
    } catch (error) {
      logOutput(`❌ User creation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    clearOutput();
    try {
      await apiTester.testUserLogin({ username: "john_doe", email: "john.doe@example.com" });
    } catch (error) {
      logOutput(`❌ Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreatePost = async () => {
    setLoading(true);
    clearOutput();
    try {
      await apiTester.testPostCreation();
    } catch (error) {
      logOutput(`❌ Post creation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCompleteWorkflow = async () => {
    setLoading(true);
    clearOutput();
    try {
      await apiTester.testCompleteWorkflow();
    } catch (error) {
      logOutput(`❌ Workflow test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testQuickMethods = async () => {
    setLoading(true);
    clearOutput();
    try {
      logOutput('🧪 Testing quick access methods...');
      await apiTester.testQuickMethods();
    } catch (error) {
      logOutput(`❌ Quick methods test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    setLoading(true);
    clearOutput();
    try {
      logOutput('🧪 Testing ALL API endpoints...');
      await apiTester.testAllEndpoints();
    } catch (error) {
      logOutput(`❌ All endpoints test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showAPIStatus = () => {
    clearOutput();
    logOutput('📊 Current API Status:');
    logOutput(`- Base URL: ${api.config.BASE_URL}`);
    logOutput(`- Timeout: ${api.config.TIMEOUT}ms`);
    logOutput(`- Logged in: ${api.auth.isLoggedIn()}`);
    logOutput(`- Current user ID: ${api.user.getCurrentUserId() || 'None'}`);
    const session = api.auth.getCurrentUser();
    logOutput(`- User session: ${session ? JSON.stringify(session, null, 2) : 'None'}`);
  };

  const clearAllData = () => {
    clearOutput();
    logOutput('🧹 Clearing all stored data...');
    api.storage.clearAllData();
    logOutput('✅ All data cleared successfully');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Backend API Integration Demo
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4">API Tests</h2>
          <div className="space-y-2">
            <button
              onClick={testCreateUser}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Create User
            </button>
            
            <button
              onClick={testLogin}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Login
            </button>
            
            <button
              onClick={testCreatePost}
              disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Create Post
            </button>
            
            <button
              onClick={testQuickMethods}
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Quick Methods
            </button>
            
            <button
              onClick={testCompleteWorkflow}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Complete Workflow
            </button>
            
            <button
              onClick={testAllEndpoints}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test All Endpoints
            </button>
            
            <div className="border-t pt-2 mt-4">
              <button
                onClick={showAPIStatus}
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded disabled:opacity-50 mb-2"
              >
                Show API Status
              </button>
              
              <button
                onClick={clearOutput}
                disabled={loading}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50 mb-2"
              >
                Clear Output
              </button>
              
              <button
                onClick={clearAllData}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Clear All Data
              </button>
            </div>
          </div>
          </div>

          {/* Current User Status */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-2">Current User</h3>
            {user ? (
              <div className="text-sm text-gray-700">
                <p><strong>ID:</strong> {user.user_id}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            ) : (
              <p className="text-gray-500">Not logged in</p>
            )}
          </div>

          {/* API Endpoints */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-2">Available APIs</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>User APIs:</strong></p>
              <p className="ml-2">• POST /api/wall/create_user</p>
              <p className="ml-2">• POST /api/wall/login</p>
              <p className="ml-2">• PUT /api/wall/users/:id</p>
              
              <p className="mt-2"><strong>Post APIs:</strong></p>
              <p className="ml-2">• POST /api/wall/posts/create_post</p>
              <p className="ml-2">• GET /api/wall/posts</p>
              <p className="ml-2">• GET /api/wall/posts/user/:id</p>
              
              <p className="mt-2"><strong>Media APIs:</strong></p>
              <p className="ml-2">• POST /api/wall/media/upload</p>
              
              <p className="mt-2"><strong>Utility APIs:</strong></p>
              <p className="ml-2">• GET /api/wall/health</p>
              <p className="ml-2">• GET /api/wall/info</p>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-2">Configuration</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Base URL:</strong> {api.config.BASE_URL}</p>
              <p><strong>Timeout:</strong> {api.config.TIMEOUT}ms</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">Output</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs h-96 overflow-y-auto">
            {loading && (
              <div className="text-yellow-400 mb-2">⏳ Processing...</div>
            )}
            <pre className="whitespace-pre-wrap">{output || 'Click a button to test the API...'}</pre>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">API Test Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. <strong>Test Create User:</strong> Creates a new user via backend API</p>
          <p>2. <strong>Test Login:</strong> Attempts login with created user credentials</p>
          <p>3. <strong>Test Create Post:</strong> Creates a post using stored user session</p>
          <p>4. <strong>Test Quick Methods:</strong> Tests the quick access API methods</p>
          <p>5. <strong>Test Complete Workflow:</strong> Runs full registration → login → post creation</p>
          <p>6. <strong>Test All Endpoints:</strong> Comprehensive test of all available APIs</p>
          <p>7. <strong>Show API Status:</strong> Displays current configuration and session info</p>
          <p className="font-semibold mt-3">Features:</p>
          <p>• <strong>Automatic Fallback:</strong> Falls back to frontend-only mode if backend unavailable</p>
          <p>• <strong>Centralized Management:</strong> All API calls in one organized service</p>
          <p>• <strong>Error Handling:</strong> Comprehensive error catching and reporting</p>
          <p>• <strong>Session Management:</strong> Automatic storage and retrieval of user sessions</p>
        </div>
      </div>
    </div>
  );
};

export default APIDemo;
