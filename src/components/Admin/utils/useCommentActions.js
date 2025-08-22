// Custom hooks for comment and user management
import { adminAPI } from '../../../services/adminAPI';
import { postsAPI } from '../../../services/api';

export const useCommentActions = (posts, setPosts, pinnedPosts, setPinnedPosts, setError) => {
  
  const handleAddComment = async (postId, commentText, parentCommentId = null) => {
    try {
      let newComment;
      if (parentCommentId) {
        // For replies, still use regular postsAPI as admin API doesn't have reply endpoint
        newComment = await postsAPI.addCommentReply(postId, parentCommentId, commentText);
      } else {
        // Use admin API for top-level comments
        newComment = await adminAPI.addPostComment(postId, { content: commentText });
      }
      
      const updateComments = (posts) => posts.map(post => {
        if (post.post_id === postId) {
          const updatedComments = [...(post.comments || [])];
          if (parentCommentId) {
            // Add as reply
            const parentIndex = updatedComments.findIndex(c => c.comment_id === parentCommentId);
            if (parentIndex >= 0) {
              updatedComments[parentIndex].replies = [...(updatedComments[parentIndex].replies || []), newComment];
            }
          } else {
            // Add as top-level comment
            updatedComments.push(newComment);
          }
          return { ...post, comments: updatedComments };
        }
        return post;
      });
      
      setPosts(prev => updateComments(prev));
      setPinnedPosts(prev => updateComments(prev));
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(`Failed to add comment: ${error.message}`);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      // Use admin API to delete comment (admin can delete any comment)
      await adminAPI.adminDeleteComment(commentId);
      
      const updateComments = (posts) => posts.map(post => ({
        ...post,
        comments: post.comments ? post.comments.filter(comment => {
          if (comment.comment_id === commentId) return false;
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply => reply.comment_id !== commentId);
          }
          return true;
        }) : []
      }));
      
      setPosts(prev => updateComments(prev));
      setPinnedPosts(prev => updateComments(prev));
      
      console.log('✅ Admin comment deleted successfully:', commentId);
    } catch (error) {
      console.error('❌ Admin delete comment error:', error);
      setError(`Failed to delete comment: ${error.message}`);
    }
  };

  const handleDeleteReply = async (postId, commentId, replyId) => {
    try {
      // Use admin API to delete reply (admin can delete any reply)
      await adminAPI.adminDeleteReply(postId, commentId, replyId);
      
      const updateReplies = (posts) => posts.map(post => {
        if (post.post_id === postId) {
          return {
            ...post,
            comments: post.comments ? post.comments.map(comment => {
              if (comment.comment_id === commentId || comment.id === commentId) {
                return {
                  ...comment,
                  replies: (comment.replies || []).filter(reply => 
                    reply.id !== replyId && reply.reply_id !== replyId && reply.comment_id !== replyId
                  )
                };
              }
              return comment;
            }) : []
          };
        }
        return post;
      });
      
      setPosts(prev => updateReplies(prev));
      setPinnedPosts(prev => updateReplies(prev));
      
      console.log('✅ Admin reply deleted successfully:', replyId);
    } catch (error) {
      console.error('❌ Admin delete reply error:', error);
      setError(`Failed to delete reply: ${error.message}`);
    }
  };

  return {
    handleAddComment,
    handleDeleteComment,
    handleDeleteReply
  };
};
