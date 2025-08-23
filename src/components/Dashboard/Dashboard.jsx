import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import PostFeed from '../Posts/PostFeed';
import CreatePost from '../Posts/CreatePost';
import MyPosts from './MyPosts';
import BroadcastView from './BroadcastView';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import ScrollToTop from './ScrollToTop';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';

// Admin Components
import AdminAllPosts from '../Admin/AdminAllPosts';
import AdminBlockedUsers from '../Admin/AdminBlockedUsers';
import AdminReportedContent from '../Admin/AdminReportedContent';
import AdminBroadcastMessage from '../Admin/AdminBroadcastMessage';

const Dashboard = () => {
  const [filters, setFilters] = useState({
    tag: 'all',
    search: ''
  });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home', 'broadcast', 'myposts', 'admin-posts', 'admin-users', 'admin-reports', 'admin-broadcast'
  const { posts, getFilteredPosts, loadAllPosts, reloadPosts, loading } = usePost();
  const { user } = useAuth();

  // Sort comments and replies so that the latest are on top
  const filteredPosts = getFilteredPosts(filters);
  
  // Sort comments and replies for each post (posts themselves are already sorted with pinned first)
  const sortedPosts = filteredPosts.map(post => ({
    ...post,
    comments: Array.isArray(post.comments)
      ? [...post.comments].sort((a, b) => new Date(b.created_at || b.createdAt || b.timestamp) - new Date(a.created_at || a.createdAt || a.timestamp))
        .map(comment => ({
          ...comment,
          replies: Array.isArray(comment.replies)
            ? [...comment.replies].sort((a, b) => new Date(b.created_at || b.createdAt || b.timestamp) - new Date(a.created_at || a.createdAt || a.timestamp))
            : comment.replies
        }))
      : post.comments
  }));

  // Load appropriate posts based on active view
  useEffect(() => {
    if (activeView === 'home') {
      loadAllPosts(true); // Reset pagination and load fresh posts for home feed
    } else if (activeView === 'myposts') {
      reloadPosts(); // Load user's posts only
    }
    // For broadcast view, data is fetched by BroadcastView component
  }, [activeView]);

  // Set default view for admin users
  useEffect(() => {
    if (user?.is_admin && activeView === 'home') {
      setActiveView('admin-posts');
    }
  }, [user]);

  const handleSearchChange = (searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const headerComponent = (
    <Header 
      onSearchChange={handleSearchChange}
      searchValue={filters.search}
    />
  );

  const sidebarComponent = (
    <Sidebar 
      filters={filters}
      setFilters={setFilters}
      onCreatePost={() => setShowCreatePost(true)}
      activeView={activeView}
      onViewChange={handleViewChange}
    />
  );

  const renderMainContent = () => {
    // Handle admin views
    if (user?.is_admin) {
      switch (activeView) {
        case 'admin-posts':
          return <AdminAllPosts />;
        case 'admin-users':
          return <AdminBlockedUsers />;
        case 'admin-reports':
          return <AdminReportedContent activeView={activeView} />;
        case 'admin-broadcast':
          return <AdminBroadcastMessage />;
      }
    }

    // Handle regular user views
    if (activeView === 'myposts') {
      return <MyPosts />;
    }
    
    if (activeView === 'broadcast') {
      return <BroadcastView />;
    }

    // Default home view
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            Welcome to Atom HR Community Wall 👋
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Share updates, collaborate with colleagues, and stay connected with the HR team.
          </p>
          {user?.is_admin && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                🛡️ <strong>Admin Access:</strong> You have administrative privileges. Use the admin panel in the sidebar to manage posts, users, and reports.
              </p>
            </div>
          )}
        </div>

        {/* Quick Create Post Button - Only show if user is not blocked and not admin */}
        {!(user?.is_blocked === true || user?.is_blocked === "true") && !user?.is_admin && (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors touch-friendly"
            >
              <span className="text-gray-500 text-sm lg:text-base">
                What's on your mind? Share with the HR team...
              </span>
            </button>
          </div>
        )}

        {/* Blocked User Notice */}
        {(user?.is_blocked === true || user?.is_blocked === "true") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Account Restricted</h3>
                <p className="text-sm text-red-800 mt-1">
                  Your account has been restricted. You can view and share posts but cannot create new posts or add comments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="max-w-3xl mx-auto">
          <PostFeed 
            posts={sortedPosts} 
            activeView={activeView} 
            showPagination={true}
            isLoading={loading}
          />
        </div>
      </div>
    );
  };

  return (
    <ResponsiveLayout 
      header={headerComponent}
      sidebar={sidebarComponent}
      activeView={activeView}
      onViewChange={handleViewChange}
      onCreatePost={() => setShowCreatePost(true)}
      user={user}
    >
      {/* Create Post Modal - Only show if user is not blocked and not admin */}
      {showCreatePost && !(user?.is_blocked === true || user?.is_blocked === "true") && !user?.is_admin && (
        <CreatePost onClose={() => setShowCreatePost(false)} />
      )}

      {renderMainContent()}
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </ResponsiveLayout>
  );
};

export default Dashboard;
