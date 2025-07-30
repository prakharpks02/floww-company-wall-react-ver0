import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import PostCard from '../Posts/PostCard';
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
  const { deletePost, getUserPosts, posts: allPosts } = usePost();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's posts
  const fetchMyPosts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use user.id as author_id for API call
      // console.log('Fetching posts for user:', user.id);
      // const userPosts = await getUserPosts(user.id);
      // console.log('Fetched posts:', userPosts);
      // console.log('Post structure check - first post:', userPosts[0]);
      // console.log('Post fields in first post:', userPosts[0] ? Object.keys(userPosts[0]) : 'No posts');
      // console.log('Author fields:', {
      //   authorName: userPosts[0]?.authorName,
      //   author_name: userPosts[0]?.author_name,
      //   username: userPosts[0]?.username,
      //   authorAvatar: userPosts[0]?.authorAvatar,
      //   author_avatar: userPosts[0]?.author_avatar,
      //   avatar: userPosts[0]?.avatar
      // });
      // console.log('Timestamp fields:', {
      //   timestamp: userPosts[0]?.timestamp,
      //   created_at: userPosts[0]?.created_at,
      //   createdAt: userPosts[0]?.createdAt
      // });
      // console.log('Post IDs:', userPosts.map(p => ({ id: p.id, post_id: p.post_id, timestamp: p.timestamp })));
      setMyPosts(userPosts);
    } catch (apiError) {
      console.log('Failed to fetch user posts:', apiError);
      
      // Fallback to filtering local posts by author_id or user_id
      const userPosts = allPosts.filter(post => 
        post.authorId === user.id || 
        post.author_id === user.id ||
        post.user_id === user.id
      );
      console.log('Using local posts fallback:', userPosts);
      setMyPosts(userPosts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user?.id]); // Add user.id as dependency

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
      // console.log('Post deleted successfully locally');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const getPostStats = (post) => {
    const likes = post.likes?.length || Object.values(post.reactions || {}).reduce((sum, count) => sum + count, 0) || 0;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2" style={{ color: '#9f7aea' }} />
            My Posts
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and view all your posts in one place
          </p>
        </div>
        
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900">
                {myPosts.reduce((sum, post) => sum + getPostStats(post).likes, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Likes</p>
            </div>
          </div>
        </div>

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

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Share2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900">
                {myPosts.reduce((sum, post) => sum + getPostStats(post).shares, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Shares</p>
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
          myPosts.map((post, index) => (
            <div key={post.id || post.post_id || `post-${index}`} className="relative">
              <PostCard 
                post={post} 
                showAuthorInfo={false}
              />
              
              {/* Action buttons overlay */}
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                  title="Delete Post"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePost 
          onClose={() => {
            setShowCreateModal(false);
            // Refresh posts when modal closes to show newly created post
            fetchMyPosts();
          }} 
        />
      )}
    </div>
  );
};

export default MyPosts;
