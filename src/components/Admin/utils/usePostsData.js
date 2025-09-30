// Custom hook for loading posts data
import { useState } from 'react';
import { adminAPI } from '../../../services/adminAPI.jsx';
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

        
        if (response?.posts && Array.isArray(response.posts)) {
          // Transform posts and filter out broadcast posts (they should only appear in broadcast view)
          const transformedPosts = response.posts.map(transformPostMedia);
          
         
          
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
        
          nextId = null;
        }
      } while (nextId);
      

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

  // Load pinned posts - always ensure they are loaded first
  const loadPinnedPosts = async () => {
    try {

      setError(null);
      
      // Always try to load pinned posts first
      const pins = await fetchPinnedPosts(adminAPI);
   
      
      // Set pinned posts immediately
      setPinnedPosts(pins);
      
 
      
      return pins; // Return for sequential loading
    } catch (error) {
      console.error('❌ Error loading pinned posts:', error);
      setError(`Failed to load pinned posts: ${error.message}`);
      setPinnedPosts([]); // Set empty array on error
      return []; // Return empty array on error
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
