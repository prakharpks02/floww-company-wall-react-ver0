import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import { postsAPI } from '../../services/api';
import PostCard from './PostCard';
import { ArrowLeft, Home, Loader } from 'lucide-react';

const SinglePostView = () => {
  const { postId } = useParams();
  const { posts } = usePost();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to find post in local state
        const localPost = posts.find(p => 
          p.id === postId || 
          p.post_id === postId ||
          String(p.id) === postId || 
          String(p.post_id) === postId
        );
        
        if (localPost) {
          console.log('🔍 SinglePostView - Found post in local state:', localPost);
          
          // Ensure the local post has proper avatar structure
          const normalizedLocalPost = {
            ...localPost,
            authorAvatar: localPost.author?.avatar || localPost.authorAvatar || localPost.author_avatar || 
                         'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            authorName: localPost.author?.username || localPost.authorName || localPost.author_name || 'Anonymous',
            authorPosition: localPost.author?.position || localPost.authorPosition || localPost.author_position || 'Employee'
          };
          
          setPost(normalizedLocalPost);
          setLoading(false);
          return;
        }
        
        // If not found locally, fetch from API
        console.log('🔍 SinglePostView - Fetching post from API with ID:', postId);
        console.log('🔍 SinglePostView - API URL will be:', `http://localhost:8000/api/wall/posts/${postId}/get_single_post`);
        
        const response = await postsAPI.getPostById(postId);
        
        console.log('🔍 SinglePostView - API Response:', response);
        console.log('🔍 SinglePostView - Response Status:', response?.status);
        console.log('🔍 SinglePostView - Response Data:', response?.data);
        console.log('🔍 SinglePostView - Response Posts:', response?.data?.posts);
        
        if (response && response.data) {
          console.log('🔍 SinglePostView - Post data found:', response.data);

          // Split media array by file extension
          const media = response.data.media || [];
          const images = [];
          const videos = [];
          const documents = [];
          const links = [];
          media.forEach((mediaItem, idx) => {
            if (!mediaItem || !mediaItem.link) return;
            const url = mediaItem.link;
            const mediaObj = {
              id: `media-${idx}-${Date.now()}`,
              url: url,
              name: url.split('/').pop() || 'Media file'
            };
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              images.push(mediaObj);
            } else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
              videos.push(mediaObj);
            } else if (url.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i)) {
              documents.push(mediaObj);
            } else {
              links.push(mediaObj);
            }
          });

          // Normalize the post data to ensure proper structure
          const normalizedPost = {
            ...response.data,
            id: response.data.post_id,
            post_id: response.data.post_id,
            content: response.data.content,
            authorName: response.data.author?.username || 'Anonymous',
            authorAvatar: response.data.author?.avatar ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            authorPosition: response.data.author?.position || 'Employee',
            timestamp: response.data.created_at || new Date().toISOString(),
            media,
            mentions: response.data.mentions || [],
            tags: response.data.tags || [],
            comments: response.data.comments || [],
            reactions: response.data.reaction_counts || {},
            likes: [],
            images,
            videos,
            documents,
            links
          };

          console.log('🔍 SinglePostView - Normalized post:', normalizedPost);
          setPost(normalizedPost);
        } else if (response && response.posts) {
          console.log('🔍 SinglePostView - Post found directly in response.posts:', response.posts);
          setPost(response.posts);
        } else if (response) {
          console.log('🔍 SinglePostView - Using full response as post:', response);
          setPost(response);
        } else {
          console.log('❌ SinglePostView - No post data found in response');
          throw new Error('Post not found');
        }
        
      } catch (err) {
        console.error('❌ SinglePostView - Error fetching post:', err);
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, posts]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-purple-600 mr-3" />
              <span className="text-gray-600">Loading post...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state or post not found
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Feed</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Login</span>
                </Link>
              )}
              <Link
                to={user ? "/dashboard" : "/login"}
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
              {error || "The post you're looking for doesn't exist or may have been deleted."}
            </p>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#9f7aea' }}
            >
              <Home className="h-4 w-4 mr-2" />
              {user ? 'Go to Dashboard' : 'Login to Join'}
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
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Feed</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Login</span>
              </Link>
            )}
            <div className="text-sm text-gray-500">
              {user ? 'Shared Post' : 'Public Post'}
            </div>
            <Link
              to={user ? "/dashboard" : "/login"}
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
            {user ? 'View More Posts' : 'Login to Join'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SinglePostView;