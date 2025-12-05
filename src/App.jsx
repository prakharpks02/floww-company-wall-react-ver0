
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

function AppRoutes() {
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
        path="/post/:postId" 
        element={<SinglePostView />} 
      />
      <Route 
        path="/" 
        element={<Navigate to="/employee/dashboard" />} 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <PostProvider>
            <NotificationProvider>
              <ChatProvider>
                <div className="min-h-screen bg-gray-50">
                  <AppRoutes />
                </div>
              </ChatProvider>
            </NotificationProvider>
          </PostProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
