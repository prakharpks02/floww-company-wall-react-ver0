import React, { useEffect, useCallback, useState } from 'react';
import { Loader } from 'lucide-react';
import AdminPostCard from './AdminPostCard';
import Alert from '../UI/Alert';
import { usePostsData } from './utils/usePostsData';
import { usePostActions } from './utils/usePostActions';
import { useCommentActions } from './utils/useCommentActions';
import { useUserActions } from './utils/useUserActions';

const AdminAllPosts = () => {
  // State for success messages
  const [successMessage, setSuccessMessage] = useState(null);

  // Use custom hooks for data management
  const {
    posts,
    setPosts,
    pinnedPosts,
    setPinnedPosts,
    isLoading,
    nextCursor,
    hasMore,
    error,
    setError,
    loadAllPosts,
    loadPinnedPosts
  } = usePostsData();

  // Use custom hooks for actions
  const postActions = usePostActions(posts, setPosts, pinnedPosts, setPinnedPosts, setError, setSuccessMessage);
  const commentActions = useCommentActions(posts, setPosts, pinnedPosts, setPinnedPosts, setError);
  const userActions = useUserActions(posts, setPosts, pinnedPosts, setPinnedPosts, setError);

  // Auto-load more posts when scrolling near the bottom
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 &&
      hasMore &&
      !isLoading
    ) {
      loadAllPosts(nextCursor);
    }
  }, [hasMore, isLoading, nextCursor, loadAllPosts]);

  useEffect(() => {
    console.log('🚀 AdminAllPosts - Initial load starting...');
    const loadData = async () => {
      await loadPinnedPosts();
      await loadAllPosts();
    };
    loadData();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Posts</h1>
        <p className="text-gray-600">Manage all posts in the system</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => {
              setError(null);
              loadAllPosts(null, true);
            }}
            className="ml-2 text-red-800 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <Alert
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        </div>
      )}

      <div className="space-y-6">
        {console.log('🔍 Rendering posts. Pinned:', pinnedPosts.length, 'Regular:', posts.length)}
        {console.log('🔍 Pinned posts data:', pinnedPosts)}
        {console.log('🔍 Regular posts data:', posts.slice(0, 3))} 
        
        {/* Debug info for development
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-800">Debug Info:</h3>
            <p className="text-sm text-yellow-700">
              Pinned Posts: {pinnedPosts.length} | Regular Posts: {posts.length} | Loading: {isLoading ? 'Yes' : 'No'}
            </p>
            {pinnedPosts.length > 0 && (
              <p className="text-sm text-yellow-700">
                Pinned IDs: {pinnedPosts.map(p => p.post_id).join(', ')}
              </p>
            )}
          </div>
        )} */}
        
        {/* Pinned posts always on top, unique keys */}
        {pinnedPosts.map((post) => (
          <AdminPostCard
            key={`pinned-${post.post_id}-${post.author?.is_blocked || 'unblocked'}`}
            post={post}
            onTogglePin={postActions.handleTogglePin}
            onToggleComments={postActions.handleToggleComments}
            onDeleteComment={commentActions.handleDeleteComment}
            onDeleteReply={commentActions.handleDeleteReply}
            onBlockUser={userActions.handleBlockUser}
            onDeletePost={postActions.handleDeletePost}
            onReaction={postActions.handleReaction}
            onAddComment={commentActions.handleAddComment}
            onSharePost={postActions.handleSharePost}
            isPinned={true}
          />
        ))}
        {/* Non-pinned posts, filter out any that are already in pinnedPosts */}
        {posts.filter(
          (post) => !pinnedPosts.some((p) => p.post_id === post.post_id)
        ).map((post) => {
          console.log('Rendering post:', post.post_id, 'Author blocked:', post.author?.is_blocked);
          return (
            <AdminPostCard
              key={`post-${post.post_id}-${post.author?.is_blocked || 'unblocked'}`}
              post={post}
              onTogglePin={postActions.handleTogglePin}
              onToggleComments={postActions.handleToggleComments}
              onDeleteComment={commentActions.handleDeleteComment}
              onDeleteReply={commentActions.handleDeleteReply}
              onBlockUser={userActions.handleBlockUser}
              onDeletePost={postActions.handleDeletePost}
              onReaction={postActions.handleReaction}
              onAddComment={commentActions.handleAddComment}
              onSharePost={postActions.handleSharePost}
              isPinned={false}
            />
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader className="animate-spin h-8 w-8 text-purple-600" />
          <span className="ml-3 text-gray-600">Loading posts...</span>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center text-gray-500 mt-8 py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>You've reached the end</span>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}

      {!isLoading && posts.length === 0 && !error && (
        <div className="text-center text-gray-500 py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600">There are no posts to display at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default AdminAllPosts;
