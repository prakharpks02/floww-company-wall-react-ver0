import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import PostCard from '../Posts/PostCard';
import PostFeed from '../Posts/PostFeed';
import CreatePost from '../Posts/CreatePost';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Edit,
  Trash2,
  Eye,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';

const MyPosts = () => {
  const { user } = useAuth();
  const { deletePost, posts, loading, reloadPosts } = usePost();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);

  // Since /api/wall/posts/me already returns filtered posts for current user,
  // we can use them directly without additional filtering
  const myPosts = posts || [];

  const handleCreatePost = async () => {
    // The CreatePost component will handle the post creation
    // We just need to refresh the posts after the modal closes
    setShowCreateModal(true);
  };

  const handleDeletePost = async (postId) => {
    try {
      // Delete locally (frontend only)
      deletePost(postId);
      setMyPosts(prev => prev.filter(post => 
        post.id !== postId && 
        post.post_id !== postId
      ));
    
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const getPostStats = (post) => {
    // Calculate likes more specifically - look for 'like' reactions first, then fallback to all reactions
    let likes = 0;
    if (post.likes?.length) {
      likes = post.likes.length;
    } else if (post.reactions?.like?.count) {
      likes = post.reactions.like.count;
    } else if (post.reactions) {
      // If no specific 'like' reaction, sum all reaction counts as a fallback
      likes = Object.values(post.reactions).reduce((sum, reaction) => {
        if (typeof reaction === 'object' && reaction.count) {
          return sum + reaction.count;
        } else if (typeof reaction === 'number') {
          return sum + reaction;
        }
        return sum;
      }, 0);
    }
    
    const comments = post.comments?.length || 0;
    const shares = post.shares || 0;
    
    return { likes, comments, shares };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
     <div className="flex items-center justify-between mb-6 mt-24">
  {/* Left Section - Heading and Subtext */}
  <div>
    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
      <FileText className="h-6 w-6 mr-2" style={{ color: '#9f7aea' }} />
      My Posts
    </h1>
    <p className="text-gray-600 mt-2">
      Manage and view all your posts in one place.
    </p>
  </div>

  {/* Right Section - New Post Button */}
  <button
    onClick={handleCreatePost}
    className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
    style={{ backgroundColor: '#9f7aea' }}
  >
    <Plus className="h-5 w-5" />
    <span>New Post</span>
  </button>
</div>


   {/* Stats */}
<div className="max-w-6xl mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {/* Total Posts */}
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center">
        <div className="p-2 rounded-lg" style={{ backgroundColor: '#f3f0ff' }}>
          <FileText className="h-5 w-5" style={{ color: '#9f7aea' }} />
        </div>
        <div className="ml-3">
          <p className="text-2xl font-semibold text-gray-900">{myPosts.length}</p>
          <p className="text-sm text-gray-600">Total Posts</p>
        </div>
      </div>
    </div>

    {/* Total Reactions */}
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center">
        <div className="p-2 bg-red-100 rounded-lg">
          <Heart className="h-5 w-5 text-red-600" />
        </div>
        <div className="ml-3">
          <p className="text-2xl font-semibold text-gray-900">
            {myPosts.reduce((sum, post) => sum + getPostStats(post).likes, 0)}
          </p>
          <p className="text-sm text-gray-600">Total Reactions</p>
        </div>
      </div>
    </div>

    {/* Total Comments */}
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
          <MessageCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div className="ml-3">
          <p className="text-2xl font-semibold text-gray-900">
            {myPosts.reduce((sum, post) => sum + getPostStats(post).comments, 0)}
          </p>
          <p className="text-sm text-gray-600">Total Comments</p>
        </div>
      </div>
    </div>
  </div>
</div>


      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {myPosts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">
              Start sharing your thoughts and ideas with the community!
            </p>
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#9f7aea' }}
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Post</span>
            </button>
          </div>
        ) : (
          <PostFeed 
            posts={myPosts} 
            activeView="myposts"
            showPagination={false}
          />
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePost 
          onClose={() => {
            setShowCreateModal(false);
            // Refresh posts when modal closes to show newly created post
            filterMyPosts();
          }} 
        />
      )}
    </div>
  );
};

export default MyPosts;
