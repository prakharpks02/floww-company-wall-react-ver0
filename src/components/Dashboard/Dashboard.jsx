import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import PostFeed from '../Posts/PostFeed';
import CreatePost from '../Posts/CreatePost';
import MyPosts from './MyPosts';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import { usePost } from '../../contexts/PostContext';

const Dashboard = () => {
  const [filters, setFilters] = useState({
    tag: 'all',
    search: ''
  });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home' or 'myposts'
  const { getFilteredPosts } = usePost();

  const filteredPosts = getFilteredPosts(filters);

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
        <PostFeed posts={filteredPosts} />
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
    </ResponsiveLayout>
  );
};

export default Dashboard;
