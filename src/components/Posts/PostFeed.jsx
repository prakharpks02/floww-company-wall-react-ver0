import React, { useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import { usePost } from '../../contexts/PostContext';
import { Loader2 } from 'lucide-react';

const PostFeed = ({ posts, activeView = 'home', showPagination = true }) => {
  const { loadMorePosts, hasMorePosts, isLoadingMore } = usePost();
  const loadingRef = useRef(null);

  // Intersection Observer callback for infinite scroll
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMorePosts && !isLoadingMore) {
      console.log('🔄 Infinite scroll triggered - loading more posts...');
      loadMorePosts();
    }
  }, [hasMorePosts, isLoadingMore, loadMorePosts]);

  // Set up Intersection Observer
  useEffect(() => {
    const element = loadingRef.current;
    if (!element || !showPagination) return;

    const option = {
      root: null,
      rootMargin: '100px', // Start loading 100px before the element comes into view
      threshold: 0
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver, showPagination]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-500">
          Be the first to share something with the HR community!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <PostCard 
          key={post.id || post.post_id || `post-${index}`} 
          post={post} 
          activeView={activeView}
          showOptimisticState={post.isOptimistic || post.isUpdating}
        />
      ))}
      
      {/* Infinite Scroll Loader */}
      {showPagination && posts.length > 0 && (
        <div ref={loadingRef} className="flex flex-col items-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading more posts...</span>
            </div>
          ) : hasMorePosts ? (
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
              <span className="text-xs">Scroll down for more posts</span>
              <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 text-sm">No more posts to display.</p>
              <p className="text-gray-400 text-xs mt-1">You've reached the end!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
