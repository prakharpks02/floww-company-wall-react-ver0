import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import PostFeed from '../Posts/PostFeed';
import CreatePost from '../Posts/CreatePost';
import MyPosts from './MyPosts';
import BroadcastView from './BroadcastView';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import ScrollToTop from './ScrollToTop';
import ChatApp from '../Chat/ChatApp';
import ChatToggleButton from '../Chat/ChatToggleButton';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

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
  const [userPosts, setUserPosts] = useState([]); // Store user posts for sidebar count updates
  const { posts, getFilteredPosts, loadAllPosts, reloadPosts, loading, setIsDashboardManaged } = usePost();
  const { user } = useAuth();
  const { isChatOpen, isChatMinimized, isCompactMode, isFullScreenMobile, totalUnreadMessages, toggleChat, closeChat } = useChat();
  
  // Add refs to prevent multiple API calls
  const lastActiveView = useRef(activeView);
  const isInitialized = useRef(false);
  const isLoadingRef = useRef(false);

  // Set Dashboard as the posts manager on mount
  useEffect(() => {
    setIsDashboardManaged(true);
    return () => {
      setIsDashboardManaged(false); // Clean up on unmount
    };
  }, [setIsDashboardManaged]);

  // Create chat content for desktop integration
  const chatContent = isChatOpen && !isChatMinimized && !isCompactMode && !isFullScreenMobile ? (
    <ChatApp 
      isMinimized={isChatMinimized} 
      onToggleMinimize={toggleChat}
      onClose={closeChat}
      isIntegratedMode={true}
    />
  ) : null;

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

  // Load appropriate posts based on active view (with throttling)
  useEffect(() => {
    const loadData = async () => {
      // Prevent loading if already loading or same view
      if (isLoadingRef.current || lastActiveView.current === activeView) {
        return;
      }
      
      isLoadingRef.current = true;
      lastActiveView.current = activeView;
      
      try {
        if (activeView === 'home') {
          // Only load all posts for home feed - this manages the posts globally
          await loadAllPosts(true); // Reset pagination and load fresh posts for home feed
        }
        // For myposts view, let MyPosts component handle its own data loading
        // For broadcast view, data is fetched by BroadcastView component
      } catch (error) {
        console.error('Error loading data for view:', activeView, error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadData();
  }, [activeView, loadAllPosts, reloadPosts]);

  // Set default view for admin users (only once)
  useEffect(() => {
    if (user?.is_admin && activeView === 'home' && !isInitialized.current) {
      setActiveView('admin-posts');
      isInitialized.current = true;
    }
  }, [user?.is_admin]);

  const handleSearchChange = (searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    
    // Clear userPosts when leaving My Posts view
    if (view !== 'myposts') {
      setUserPosts([]);
    }
  };

  const handleUserPostsChange = (posts) => {
    setUserPosts(posts);
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
      userPosts={userPosts}
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
      return <MyPosts filters={filters} onPostsChange={handleUserPostsChange} />;
    }
    
    if (activeView === 'broadcast') {
      return <BroadcastView />;
    }

    // Default home view
    return (
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
  {/* Welcome Message */}
  <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
      Welcome to Atom Buzz👋
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
  <PostFeed 
    posts={sortedPosts} 
    activeView={activeView} 
    showPagination={true}
    isLoading={loading}
  />
</div>

    );
  };

  return (
    <>
      {/* Full Screen Mobile Chat - Render outside ResponsiveLayout */}
      {isFullScreenMobile && (
        <ChatApp 
          isMinimized={isChatMinimized} 
          onToggleMinimize={toggleChat}
          onClose={closeChat}
        />
      )}

      <ResponsiveLayout 
        header={headerComponent}
        sidebar={sidebarComponent}
        activeView={activeView}
        onViewChange={handleViewChange}
        onCreatePost={() => setShowCreatePost(true)}
        user={user}
        chatContent={chatContent}
      >
        {/* Create Post Modal - Only show if user is not blocked and not admin */}
        {showCreatePost && !(user?.is_blocked === true || user?.is_blocked === "true") && !user?.is_admin && (
          <CreatePost onClose={() => setShowCreatePost(false)} />
        )}

        {renderMainContent()}
        
        {/* Scroll to Top Button - Hide when chat is taking up layout space */}
        {!(isChatOpen && !isChatMinimized && !isCompactMode) && <ScrollToTop />}

      {/* Chat Components - Only render compact mode and mobile toggle */}
      {isChatOpen && !isFullScreenMobile && (isCompactMode || isChatMinimized) ? (
        <ChatApp 
          isMinimized={isChatMinimized} 
          onToggleMinimize={toggleChat}
          onClose={closeChat}
        />
      ) : (
        !isChatOpen && (
          <ChatToggleButton 
            onClick={toggleChat}
            hasUnreadMessages={totalUnreadMessages > 0}
            unreadCount={totalUnreadMessages}
          />
        )
      )}
      </ResponsiveLayout>
    </>
  );
};

export default Dashboard;
