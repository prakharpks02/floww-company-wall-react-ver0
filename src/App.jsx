
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard/Dashboard';
import SinglePostView from './components/Posts/SinglePostView';

import './App.css';
import NotFound from './components/NotFound';

// Protected routes that require authentication
function ProtectedRoutes() {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated with token
  if (!isAuthenticated()) {
    // Show a brief message before redirect (redirect is handled in AuthContext)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/employee/dashboard" 
        element={<Dashboard />} 
      />
      <Route 
        path="/crm/dashboard" 
        element={<Dashboard />} 
      />
      <Route 
        path="/" 
        element={<Navigate to="/employee/dashboard" />} 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Main app routes including public access
function AppRoutes() {
  return (
    <Routes>
      {/* Public route - no authentication required, no AuthProvider */}
      <Route 
        path="/post/:postId" 
        element={<SinglePostViewPublic />} 
      />
      {/* All other routes require authentication */}
      <Route 
        path="/*" 
        element={
          <AuthProvider>
            <PostProvider>
              <NotificationProvider>
                <ChatProvider>
                  <ProtectedRoutes />
                </ChatProvider>
              </NotificationProvider>
            </PostProvider>
          </AuthProvider>
        } 
      />
    </Routes>
  );
}

// Public SinglePostView without any authentication context
const SinglePostViewPublic = () => {
  return <SinglePostView />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
