import React, { useEffect, useCallback, useState } from 'react';
import { Loader } from 'lucide-react';
import AdminPostCard from './AdminPostCard';
import PostSkeleton from '../Posts/PostSkeleton';
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
    const loadData = async () => {
      try {
        // Ensure pinned posts load first, then regular posts
        await loadPinnedPosts();
        await loadAllPosts();
      } catch (error) {
        setError(`Failed to load posts: ${error.message}`);
      }
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

      {/* Show skeleton loading while posts are being loaded */}
      {isLoading && posts.length === 0 && pinnedPosts.length === 0 && (
        <PostSkeleton count={5} />
      )}

      {/* Show posts only when not in initial loading state */}
      {(!isLoading || posts.length > 0 || pinnedPosts.length > 0) && (
        <div className="space-y-6 max-w-2xl mx-auto">
        
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
      )}

      {/* Loading indicator for additional posts */}
      {isLoading && (posts.length > 0 || pinnedPosts.length > 0) && (
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

      {/* Only show loader when loading is completely finished and no posts exist */}
      {!isLoading && posts.length === 0 && pinnedPosts.length === 0 && !error && (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin h-8 w-8 text-purple-600" />
          <span className="ml-3 text-gray-600">Loading posts...</span>
        </div>
      )}
    </div>
  );
};

export default AdminAllPosts;
