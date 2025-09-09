import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import { postsAPI } from '../../services/api.jsx';
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

const MyPosts = ({ filters = { tag: 'all', search: '' }, onPostsChange }) => {
  const { user } = useAuth();
  const { deletePost, tags, normalizePost } = usePost(); // Now includes normalizePost
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [userPosts, setUserPosts] = useState([]); // Local state for user posts
  const [loading, setLoading] = useState(false); // Local loading state
  const [isLoadingRef, setIsLoadingRef] = useState(false); // Ref to prevent duplicate requests

  // Track filter changes for debugging (can be removed in production)
  useEffect(() => {
    // Only log if not initial render
    if (userPosts.length > 0) {
      console.log('MyPosts filters changed:', filters);
    }
  }, [filters, userPosts.length]);

  // Apply tag filter from sidebar (matching sidebar logic exactly)
  const tagFilteredPosts = userPosts.filter(post => {
    if (filters.tag === 'all') return true;
    
    // Only show posts that have tags and match the selected tag
    if (!post.tags || !Array.isArray(post.tags)) return false;
    
    return post.tags.some(postTag => {
      const tagName = typeof postTag === 'string' ? postTag : postTag.tag_name || postTag.name;
      return tagName === filters.tag;
    });
  });

  // Apply search filter if there's a search term
  const myPosts = tagFilteredPosts.filter(post => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    const content = post.content?.toLowerCase() || '';
    const authorName = post.author?.name?.toLowerCase() || 
                      post.author?.employee_name?.toLowerCase() || 
                      post.authorName?.toLowerCase() || '';
    
    return content.includes(searchTerm) || authorName.includes(searchTerm);
  });

  useEffect(() => {
    // Load user's posts when component mounts
    const loadUserPosts = async () => {
      // Prevent duplicate requests
      if (isLoadingRef) {
        console.log('Request already in progress, skipping...');
        return;
      }
      
      try {
        setIsLoadingRef(true);
        setLoading(true);
        setError(null);
        
        // Add a small delay to avoid rapid duplicate requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Call the API for all posts and filter on frontend for current user
        const backendPosts = await postsAPI.getMyPosts();
        let postsData = [];

        // Check the response structure
        if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
          postsData = backendPosts.data.posts;
        } else if (Array.isArray(backendPosts.data)) {
          postsData = backendPosts.data;
        } else {
          postsData = [];
        }
        
        // Normalize posts to ensure consistent format
        const normalizedPosts = postsData.map(post => normalizePost(post));
        
        // Filter posts to show only current user's posts
        const currentUserId = user?.employee_id || user?.id;
        console.log('🔍 Current user ID for filtering:', currentUserId);
        console.log('🔍 Current user object:', user);
        
        const userFilteredPosts = normalizedPosts.filter(post => {
          // Check various possible author ID fields
          const authorId = post.author?.employee_id || 
                          post.author?.id || 
                          post.author?.user_id ||
                          post.author_id || 
                          post.user_id ||
                          post.employee_id;
          
          // Also check if the author object has username/name matching current user
          const authorName = post.author?.username || 
                            post.author?.employee_name || 
                            post.authorName ||
                            post.author_name;
          const currentUserName = user?.username || user?.name;
          
          // Debug first few posts
          if (normalizedPosts.indexOf(post) < 3) {
            console.log(`🔍 Post ${normalizedPosts.indexOf(post)} author data:`, {
              post_id: post.id,
              author: post.author,
              authorId,
              authorName,
              author_id: post.author_id,
              user_id: post.user_id,
              employee_id: post.employee_id
            });
          }
          
          const isMatch = authorId === currentUserId || 
                         (authorName && currentUserName && authorName === currentUserName);
          
          return isMatch;
        });
        
        console.log(`🔍 Filtered ${userFilteredPosts.length} posts out of ${normalizedPosts.length} total posts`);
        
        setUserPosts(userFilteredPosts);
        
        // Notify parent component about the filtered posts data for sidebar count updates
        if (onPostsChange) {
          onPostsChange(userFilteredPosts);
        }
        
      } catch (error) {
        console.error('Error loading user posts:', error);
        setError('Failed to load your posts');
      } finally {
        setLoading(false);
        setIsLoadingRef(false);
      }
    };
    
    loadUserPosts();
  }, []); // Only run once when component mounts

  const handleCreatePost = async () => {
    // The CreatePost component will handle the post creation
    // We need to refresh the posts after the modal closes
    setShowCreateModal(true);
  };

  const handlePostCreated = async () => {
    // Reload user posts after creating a new post
    if (isLoadingRef) {
      console.log('Request already in progress, skipping refresh...');
      return;
    }
    
    try {
      setIsLoadingRef(true);
      
      // Add a small delay to ensure the new post is saved
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const backendPosts = await postsAPI.getMyPosts();
      let postsData = [];

      if (backendPosts.data && Array.isArray(backendPosts.data.posts)) {
        postsData = backendPosts.data.posts;
      } else if (Array.isArray(backendPosts.data)) {
        postsData = backendPosts.data;
      } else {
        postsData = [];
      }
      
      const normalizedPosts = postsData.map(post => normalizePost(post));
      
      // Filter posts to show only current user's posts
      const currentUserId = user?.employee_id || user?.id;
      console.log('🔍 Current user ID for filtering (handlePostCreated):', currentUserId);
      
      const userFilteredPosts = normalizedPosts.filter(post => {
        // Check various possible author ID fields
        const authorId = post.author?.employee_id || 
                        post.author?.id || 
                        post.author?.user_id ||
                        post.author_id || 
                        post.user_id ||
                        post.employee_id;
        
        // Also check if the author object has username/name matching current user
        const authorName = post.author?.username || 
                          post.author?.employee_name || 
                          post.authorName ||
                          post.author_name;
        const currentUserName = user?.username || user?.name;
        
        const isMatch = authorId === currentUserId || 
                       (authorName && currentUserName && authorName === currentUserName);
        
        return isMatch;
      });
      
      console.log(`🔍 Filtered ${userFilteredPosts.length} posts out of ${normalizedPosts.length} total posts (handlePostCreated)`);
      
      setUserPosts(userFilteredPosts);
      
      // Notify parent component about the updated filtered posts data
      if (onPostsChange) {
        onPostsChange(userFilteredPosts);
      }
    } catch (error) {
      console.error('Error reloading user posts:', error);
    } finally {
      setIsLoadingRef(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      // Delete locally (frontend only)
      deletePost(postId);
    } catch (error) {
      // Error handled silently
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
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2 sm:space-y-3">
            <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
            <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
            <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
     <div className="flex items-center justify-between mb-4 sm:mb-6">
  {/* Left Section - Heading */}
  <div className="flex items-center space-x-4">
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2" style={{ color: '#9f7aea' }} />
        My Posts
      </h1>
      <p className="text-sm sm:text-base text-gray-600 mt-1">
        Manage and view all your posts. Use the sidebar filters to filter by category.
      </p>
    </div>
  </div>

  {/* Right Section - New Post Button */}
  <button
    onClick={handleCreatePost}
    className="flex items-center space-x-2 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-opacity hover:opacity-90"
    style={{ backgroundColor: '#9f7aea' }}
  >
    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
    <span className="hidden sm:inline">New Post</span>
    <span className="sm:hidden">New</span>
  </button>
</div>


   {/* Stats */}
<div className="max-w-6xl mx-auto mb-4 sm:mb-6 px-3 sm:px-4">
  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
    
    {/* Total Posts */}
    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-purple-100">
          <FileText className="h-6 w-6 text-purple-500" />
        </div>
        <div className="ml-3">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{myPosts.length}</p>
          <p className="text-sm sm:text-base text-gray-600">Total Posts</p>
        </div>
      </div>
    </div>

    {/* Total Reactions */}
    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-red-100">
          <Heart className="h-6 w-6 text-red-600" />
        </div>
        <div className="ml-3">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {myPosts.reduce((sum, post) => sum + getPostStats(post).likes, 0)}
          </p>
          <p className="text-sm sm:text-base text-gray-600">Total Reactions</p>
        </div>
      </div>
    </div>

    {/* Total Comments */}
    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-blue-100">
          <MessageCircle className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-3">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {myPosts.reduce((sum, post) => sum + getPostStats(post).comments, 0)}
          </p>
          <p className="text-sm sm:text-base text-gray-600">Total Comments</p>
        </div>
      </div>
    </div>

  </div>
</div>





      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-2 sm:space-y-3 max-w-2xl mx-auto">
        {myPosts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Start sharing your thoughts and ideas with the community!
            </p>
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center space-x-2 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#9f7aea' }}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Create Your First Post</span>
            </button>
          </div>
        ) : (
          <>
            <PostFeed 
              posts={myPosts} 
              activeView="myposts"
              showPagination={false}
            />
            
            {/* End of My Posts indicator */}
            {myPosts.length > 0 && (
              <div className="text-center py-6 sm:py-8 mt-4">
                <div className="flex items-center justify-center space-x-2 text-gray-400 mb-3">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <FileText className="h-4 w-4" />
                  <span className="text-xs px-2">All Your Posts</span>
                  <FileText className="h-4 w-4" />
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <p className="text-gray-500 text-sm">You've seen all your posts!</p>
                <p className="text-gray-400 text-xs mt-1">Create more to share your thoughts</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePost 
          onClose={() => {
            setShowCreateModal(false);
            // Refresh posts when modal closes to show newly created post
            handlePostCreated();
          }} 
        />
      )}
    </div>
  );
};

export default MyPosts;
