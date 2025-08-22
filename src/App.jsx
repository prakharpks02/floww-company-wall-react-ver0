
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard/Dashboard';
import SinglePostView from './components/Posts/SinglePostView';

import './App.css';
import NotFound from './components/NotFound';

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  // Check if user is authenticated with token
  if (!isAuthenticated()) {
    // Redirect to Floww if not authenticated
    window.location.href = 'https://dev.gofloww.co';
    return null;
  }

  return (
    <Routes>
      <Route 
        path="/dashboard" 
        element={<Dashboard />} 
      />
      <Route 
        path="/dashboard/admin" 
        element={<Dashboard />} 
      />
      <Route 
        path="/post/:postId" 
        element={<SinglePostView />} 
      />
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" />} 
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
              <div className="min-h-screen bg-gray-50">
                <AppRoutes />
              </div>
            </NotificationProvider>
          </PostProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
