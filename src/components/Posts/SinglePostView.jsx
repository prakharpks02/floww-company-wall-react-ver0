import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from './PostCard';
import { ArrowLeft, Home } from 'lucide-react';

const SinglePostView = () => {
  const { postId } = useParams();
  const { posts } = usePost();
  const { user } = useAuth();

  // Find the specific post
  const post = posts.find(p => p.id === postId);

  // If post not found, show error
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Feed</span>
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </div>
          </div>

          {/* Post Not Found */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-6">
              The post you're looking for doesn't exist or may have been deleted.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#9f7aea' }}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Feed</span>
            </Link>
            <div className="text-sm text-gray-500">
              Shared Post
            </div>
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Post Card */}
        <PostCard post={post} isPublicView={!user} />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            {user ? 'Want to see more posts like this?' : 'Join our community to interact with posts!'}
          </p>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="inline-flex items-center px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#9f7aea' }}
          >
            <Home className="h-4 w-4 mr-2" />
            {user ? 'Join the Community' : 'Login to Join'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SinglePostView;
