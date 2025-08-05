import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/adminAPI';
import AdminPostCard from './AdminPostCard';
import { Loader } from 'lucide-react';

// Helper to fetch pinned posts
const fetchPinnedPosts = async () => {
  try {
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    const userIdValue = userId ? JSON.parse(userId) : undefined;
    let endpoint = 'http://localhost:8000/api/wall/posts/pinned';
    if (userIdValue) {
      endpoint += `?user_id=${encodeURIComponent(userIdValue)}`;
    }
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    if (result.status === 'success' && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch (e) {
    console.error('Error fetching pinned posts:', e);
    return [];
  }
};

const AdminAllPosts = () => {
  const [posts, setPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Load all posts until lastPostId is null
  const loadAllPosts = async (lastPostId = null, replace = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      let allPosts = [];
      let nextId = lastPostId;
      let first = true;
      
      do {
        const response = await adminAPI.getAllPosts(nextId);
        console.log('AdminAllPosts response:', response);
        
        if (response?.posts && Array.isArray(response.posts)) {
          const newPosts = response.posts;
          if (first && (replace || !lastPostId)) {
            allPosts = newPosts;
          } else {
            allPosts = [...allPosts, ...newPosts];
          }
          nextId = response.nextCursor || response.lastPostId;
          first = false;
          
          // If no more posts or hasMore is false, break
          if (!response.hasMore || !nextId || newPosts.length === 0) {
            nextId = null;
          }
        } else {
          console.log('No posts found in response or invalid format');
          nextId = null;
        }
      } while (nextId);
      
      console.log('Final allPosts array:', allPosts);
      setPosts(allPosts);
      setNextCursor(null);
      setHasMore(false);
    } catch (error) {
      console.error('Error in loadAllPosts:', error);
      setError(`Failed to load posts: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load pinned posts
  const loadPinnedPosts = async () => {
    console.log('Loading pinned posts...');
    const pins = await fetchPinnedPosts();
    console.log('Pinned posts loaded:', pins);
    setPinnedPosts(pins);
  };

  const handleTogglePin = async (postId) => {
    try {
      await adminAPI.togglePinPost(postId);
      // Update the post in the current list in real-time
      setPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, is_pinned: !post.is_pinned }
          : post
      ));
      // Also update in pinned posts if it exists there
      setPinnedPosts(prev => {
        const existingIndex = prev.findIndex(p => p.post_id === postId);
        if (existingIndex >= 0) {
          // If currently pinned, remove from pinned posts
          return prev.filter(p => p.post_id !== postId);
        } else {
          // If being pinned, add to pinned posts (find from main posts)
          const postToPin = posts.find(p => p.post_id === postId);
          if (postToPin) {
            return [...prev, { ...postToPin, is_pinned: true }];
          }
        }
        return prev;
      });
    } catch (error) {
      console.error('Error toggling pin status:', error);
      setError(`Failed to toggle pin status: ${error.message}`);
    }
  };

  const handleToggleComments = async (postId) => {
    try {
      await adminAPI.toggleCommentsOnPost(postId);
      // Update the post in the current list in real-time
      setPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, is_comments_allowed: !post.is_comments_allowed }
          : post
      ));
      // Also update in pinned posts if it exists there
      setPinnedPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, is_comments_allowed: !post.is_comments_allowed }
          : post
      ));
    } catch (error) {
      console.error('Error toggling comments:', error);
      setError(`Failed to toggle comments: ${error.message}`);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await adminAPI.deleteComment(commentId);
      // Remove the comment from the posts state
      setPosts(prev => prev.map(post => ({
        ...post,
        comments: post.comments ? post.comments.filter(comment => {
          if (comment.comment_id === commentId) return false;
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply => reply.comment_id !== commentId);
          }
          return true;
        }) : []
      })));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(`Failed to delete comment: ${error.message}`);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await adminAPI.toggleBlockUser(userId);
      // Update the user's blocked status in all posts in real-time
      setPosts(prev => prev.map(post => ({
        ...post,
        author: post.author?.user_id === userId 
          ? { ...post.author, is_blocked: !post.author.is_blocked }
          : post.author,
        comments: post.comments ? post.comments.map(comment => ({
          ...comment,
          author: comment.author?.user_id === userId
            ? { ...comment.author, is_blocked: !comment.author.is_blocked }
            : comment.author,
          replies: comment.replies ? comment.replies.map(reply => ({
            ...reply,
            author: reply.author?.user_id === userId
              ? { ...reply.author, is_blocked: !reply.author.is_blocked }
              : reply.author
          })) : []
        })) : []
      })));
      // Also update in pinned posts
      setPinnedPosts(prev => prev.map(post => ({
        ...post,
        author: post.author?.user_id === userId 
          ? { ...post.author, is_blocked: !post.author.is_blocked }
          : post.author,
        comments: post.comments ? post.comments.map(comment => ({
          ...comment,
          author: comment.author?.user_id === userId
            ? { ...comment.author, is_blocked: !comment.author.is_blocked }
            : comment.author,
          replies: comment.replies ? comment.replies.map(reply => ({
            ...reply,
            author: reply.author?.user_id === userId
              ? { ...reply.author, is_blocked: !reply.author.is_blocked }
              : reply.author
          })) : []
        })) : []
      })));
    } catch (error) {
      console.error('Error blocking user:', error);
      setError(`Failed to block user: ${error.message}`);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await adminAPI.deletePost(postId);
      // Remove the post from both posts and pinnedPosts state
      setPosts(prev => prev.filter(post => post.post_id !== postId));
      setPinnedPosts(prev => prev.filter(post => post.post_id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(`Failed to delete post: ${error.message}`);
    }
  };

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
  }, [hasMore, isLoading, nextCursor]);

  useEffect(() => {
    loadPinnedPosts();
    loadAllPosts();
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

      <div className="space-y-6">
        {console.log('Rendering posts. Pinned:', pinnedPosts.length, 'Regular:', posts.length)}
        {/* Pinned posts always on top, unique keys */}
        {pinnedPosts.map((post) => (
          <AdminPostCard
            key={`pinned-${post.post_id}`}
            post={post}
            onTogglePin={handleTogglePin}
            onToggleComments={handleToggleComments}
            onDeleteComment={handleDeleteComment}
            onBlockUser={handleBlockUser}
            onDeletePost={handleDeletePost}
            isPinned={true}
          />
        ))}
        {/* Non-pinned posts, filter out any that are already in pinnedPosts */}
        {posts.filter(
          (post) => !pinnedPosts.some((p) => p.post_id === post.post_id)
        ).map((post) => {
          console.log('Rendering post:', post.post_id, post);
          return (
            <AdminPostCard
              key={`post-${post.post_id}`}
              post={post}
              onTogglePin={handleTogglePin}
              onToggleComments={handleToggleComments}
              onDeleteComment={handleDeleteComment}
              onBlockUser={handleBlockUser}
              onDeletePost={handleDeletePost}
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
