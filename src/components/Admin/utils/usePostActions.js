// Custom hooks for AdminAllPosts functionality
import { useState, useCallback } from 'react';
import { postsAPI } from '../../../services/api.jsx';
import { adminAPI } from '../../../services/adminAPI.jsx';

export const usePostActions = (posts, setPosts, pinnedPosts, setPinnedPosts, setError, setSuccessMessage) => {
  
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
      setError(`Failed to toggle pin status: ${error.message}`);
    }
  };

  const handleToggleComments = async (postId) => {
    try {
      const post = posts.find(p => p.post_id === postId);
    
      await adminAPI.togglePostComments(postId, post?.is_comments_allowed);
      // Update the post in the current list in real-time - convert to boolean for consistency
      const updateComments = (posts) => posts.map(post => 
        post.post_id === postId 
          ? { 
              ...post, 
              is_comments_allowed: post.is_comments_allowed === true || post.is_comments_allowed === "true" ? false : true
            }
          : post
      );
      
      setPosts(prev => updateComments(prev));
      setPinnedPosts(prev => updateComments(prev));
      
    } catch (error) {
      setError(`Failed to toggle comments: ${error.message}`);
    }
  };

  const handleLike = async (postId) => {
    try {
      await postsAPI.toggleLike(postId);
      
      const updateReactions = (posts) => posts.map(post => {
        if (post.post_id === postId) {
          const updatedReactions = { ...post.reactions };
          const userReacted = post.user_reaction === 'like';
          
          if (userReacted) {
            // Remove like
            updatedReactions.like = Math.max(0, (updatedReactions.like || 0) - 1);
            return { ...post, reactions: updatedReactions, user_reaction: null };
          } else {
            // Add like, remove old reaction if exists
            if (post.user_reaction) {
              updatedReactions[post.user_reaction] = Math.max(0, (updatedReactions[post.user_reaction] || 0) - 1);
            }
            updatedReactions.like = (updatedReactions.like || 0) + 1;
            return { ...post, reactions: updatedReactions, user_reaction: 'like' };
          }
        }
        return post;
      });
      
      setPosts(prev => updateReactions(prev));
      setPinnedPosts(prev => updateReactions(prev));
    } catch (error) {
      setError(`Failed to like post: ${error.message}`);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      // Get the corresponding emoji for the reaction type
      const emojiMap = {
        'like': '👍',
        'love': '❤️',
        'haha': '😆',
        'wow': '😮',
        'sad': '😢',
        'angry': '😠'
      };
      
      await postsAPI.addReaction(postId, reactionType, emojiMap[reactionType] || '👍');
      
      const updateReactions = (posts) => posts.map(post => {
        if (post.post_id === postId) {
          const updatedReactions = { ...post.reactions };
          const userReacted = post.user_reaction === reactionType;
          
          if (userReacted) {
            // Remove reaction
            updatedReactions[reactionType] = Math.max(0, (updatedReactions[reactionType] || 0) - 1);
            return { ...post, reactions: updatedReactions, user_reaction: null };
          } else {
            // Add new reaction, remove old one if exists
            if (post.user_reaction) {
              updatedReactions[post.user_reaction] = Math.max(0, (updatedReactions[post.user_reaction] || 0) - 1);
            }
            updatedReactions[reactionType] = (updatedReactions[reactionType] || 0) + 1;
            return { ...post, reactions: updatedReactions, user_reaction: reactionType };
          }
        }
        return post;
      });
      
      setPosts(prev => updateReactions(prev));
      setPinnedPosts(prev => updateReactions(prev));
    } catch (error) {
      setError(`Failed to react to post: ${error.message}`);
    }
  };

  const handleSharePost = async (postId) => {
    try {
      // Copy post URL to clipboard
      const postUrl = `${window.location.origin}/post/${postId}`;
      
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        // Use fallback for older browsers or non-secure contexts
        fallbackCopyTextToClipboard(postUrl);
      }
      
      // Show success message
      if (setSuccessMessage) {
        setSuccessMessage('Link copied to clipboard!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      // Try fallback method if clipboard API fails
      const postUrl = `${window.location.origin}/post/${postId}`;
      fallbackCopyTextToClipboard(postUrl);
      
      // Show success message even if clipboard API fails
      if (setSuccessMessage) {
        setSuccessMessage('Link copied to clipboard!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await adminAPI.deletePost(postId);
      // Remove the post from both posts and pinnedPosts state
      setPosts(prev => prev.filter(post => post.post_id !== postId));
      setPinnedPosts(prev => prev.filter(post => post.post_id !== postId));
    } catch (error) {
      setError(`Failed to delete post: ${error.message}`);
    }
  };

  return {
    handleTogglePin,
    handleToggleComments,
    handleLike,
    handleReaction,
    handleSharePost,
    handleDeletePost
  };
};
