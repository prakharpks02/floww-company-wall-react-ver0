// Custom hook for loading posts data
import { useState } from 'react';
import { adminAPI } from '../../../services/adminAPI';
import { transformPostMedia, fetchPinnedPosts, filterNonBroadcastPosts } from './postTransformUtils';

export const usePostsData = () => {
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
          // Transform posts and filter out broadcast posts (they should only appear in broadcast view)
          const transformedPosts = response.posts.map(transformPostMedia);
          
          // Debug logging to see post properties
          console.log('🔍 All posts before filtering:', transformedPosts.map(p => ({
            id: p.post_id,
            is_broadcast: p.is_broadcast,
            isBroadcast: p.isBroadcast,
            type: p.type,
            post_type: p.post_type,
            is_pinned: p.is_pinned,
            content_preview: p.content?.substring(0, 50)
          })));
          
          const nonBroadcastPosts = filterNonBroadcastPosts(transformedPosts);
          
         
          
          if (first && (replace || !lastPostId)) {
            allPosts = nonBroadcastPosts;
          } else {
            allPosts = [...allPosts, ...nonBroadcastPosts];
          }
          nextId = response.nextCursor || response.lastPostId;
          first = false;
          
          // If no more posts or hasMore is false, break
          if (!response.hasMore || !nextId || nonBroadcastPosts.length === 0) {
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
    try {
      console.log('🔄 Loading pinned posts...');
      setError(null);
      const pins = await fetchPinnedPosts(adminAPI);
      console.log('📌 Pinned posts loaded:', pins);
      console.log('📌 Number of pinned posts:', pins.length);
      setPinnedPosts(pins);
      
      if (pins.length === 0) {
        console.log('⚠️ No pinned posts found');
      }
    } catch (error) {
      console.error('❌ Error loading pinned posts:', error);
      setError(`Failed to load pinned posts: ${error.message}`);
      setPinnedPosts([]); // Set empty array on error
    }
  };

  return {
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
  };
};
