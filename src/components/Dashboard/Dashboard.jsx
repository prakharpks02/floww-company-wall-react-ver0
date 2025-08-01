import React, { useState, useEffect, useRef } from 'react';
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
  const { getFilteredPosts, loadAllPosts, reloadPosts } = usePost();

  // Pagination state
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
  const visiblePosts = sortedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const feedContainerRef = useRef(null);

  // Reset pagination when filters or view change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters, activeView]);

  // Infinite scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (!feedContainerRef.current || isLoadingMore || !hasMore) return;
      const { bottom } = feedContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      if (bottom - windowHeight < 200) { // 200px from bottom
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(c => Math.min(c + PAGE_SIZE, filteredPosts.length));
          setIsLoadingMore(false);
        }, 600); // Simulate loading delay
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore, filteredPosts.length]);

  // Load appropriate posts based on active view
  useEffect(() => {
    if (activeView === 'home') {
      loadAllPosts(); // Load all posts for home feed
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
        <div ref={feedContainerRef}>
          <PostFeed posts={visiblePosts} activeView={activeView} />
        </div>

        {/* Loader for infinite scroll */}
        {hasMore && (
          <div className="flex justify-center my-6">
            {isLoadingMore ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span className="text-blue-600 font-medium">Loading more posts...</span>
              </div>
            ) : null}
          </div>
        )}
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
