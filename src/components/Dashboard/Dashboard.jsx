import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import PostFeed from '../Posts/PostFeed';
import CreatePost from '../Posts/CreatePost';
import MyPosts from './MyPosts';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import ScrollToTop from './ScrollToTop';
import { usePost } from '../../contexts/PostContext';

const Dashboard = () => {
  const [filters, setFilters] = useState({
    tag: 'all',
    search: ''
  });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home' or 'myposts'
  const { posts, getFilteredPosts, loadAllPosts, reloadPosts } = usePost();

  // Sort comments and replies so that the latest are on top
  const filteredPosts = getFilteredPosts(filters);
  // For each post, sort its comments and replies by created_at descending
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
  }, [activeView]);

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
    if (activeView === 'myposts') {
      return <MyPosts />;
    }

    // Default home view
    return (
      <>
        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 mb-6 border border-gray-200">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            Welcome to Atom HR Community Wall 👋
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Share updates, collaborate with colleagues, and stay connected with the HR team.
          </p>
        </div>

        {/* Quick Create Post Button */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="text-gray-500 text-sm lg:text-base">
              What's on your mind? Share with the HR team...
            </span>
          </button>
        </div>

        {/* Posts Feed */}
        <div>
          <PostFeed 
            posts={sortedPosts} 
            activeView={activeView} 
            showPagination={true}
          />
        </div>
      </>
    );
  };

  return (
    <ResponsiveLayout 
      header={headerComponent}
      sidebar={sidebarComponent}
    >
      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost onClose={() => setShowCreatePost(false)} />
      )}

      {renderMainContent()}
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </ResponsiveLayout>
  );
};

export default Dashboard;
