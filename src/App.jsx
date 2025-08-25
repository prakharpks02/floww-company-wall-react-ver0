
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard/Dashboard';
import SinglePostView from './components/Posts/SinglePostView';
import LoginPage from './components/Auth/LoginPage';

import './App.css';
import NotFound from './components/NotFound';

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={<LoginPage />} 
      />
      <Route 
        path="/employee/dashboard" 
        element={isAuthenticated() ? <Dashboard /> : <LoginPage />} 
      />
      <Route 
        path="/crm/dashboard" 
        element={isAuthenticated() ? <Dashboard /> : <LoginPage />} 
      />
      <Route 
        path="/post/:postId" 
        element={isAuthenticated() ? <SinglePostView /> : <LoginPage />} 
      />
      <Route 
        path="/" 
        element={isAuthenticated() ? <Navigate to="/employee/dashboard" /> : <LoginPage />} 
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
