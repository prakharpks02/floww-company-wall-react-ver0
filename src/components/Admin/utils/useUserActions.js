// Custom hook for user management (blocking/unblocking users)
import { adminAPI } from '../../../services/adminAPI';

export const useUserActions = (posts, setPosts, pinnedPosts, setPinnedPosts, setError) => {
  
  const handleBlockUser = async (userId) => {
    try {
      console.log('🔍 Blocking/Unblocking user:', userId);
      
      // Find current user status before toggling - use employee_id instead of user_id
      const currentUser = posts.find(post => 
        post.author?.user_id === userId || 
        post.author?.employee_id === userId
      )?.author;
      console.log('🔍 Current user before toggle:', currentUser);
      
      // Optimistic update - toggle the status immediately for better UX
      const currentBlockedStatus = currentUser?.is_blocked === true || currentUser?.is_blocked === "true";
      const optimisticNewStatus = !currentBlockedStatus;
      
      console.log('🔍 Optimistic update - Current status:', currentBlockedStatus, '-> New status:', optimisticNewStatus);
      
      // Update UI immediately (optimistic update) - check both user_id and employee_id
      const updateUserStatus = (posts, newStatus) => posts.map(post => ({
        ...post,
        author: (post.author?.user_id === userId || post.author?.employee_id === userId)
          ? { ...post.author, is_blocked: newStatus }
          : post.author,
        comments: post.comments ? post.comments.map(comment => ({
          ...comment,
          author: (comment.author?.user_id === userId || comment.author?.employee_id === userId)
            ? { ...comment.author, is_blocked: newStatus }
            : comment.author,
          replies: comment.replies ? comment.replies.map(reply => ({
            ...reply,
            author: (reply.author?.user_id === userId || reply.author?.employee_id === userId)
              ? { ...reply.author, is_blocked: newStatus }
              : reply.author
          })) : []
        })) : []
      }));
      
      // Apply optimistic update
      setPosts(prev => updateUserStatus(prev, optimisticNewStatus));
      setPinnedPosts(prev => updateUserStatus(prev, optimisticNewStatus));
      
      // Call the API with the correct ID format
      const result = await adminAPI.toggleBlockUser(userId);
      console.log('🔍 Toggle block result:', result);
      
      // Handle the response - the backend should return the new status
      let serverBlockedStatus;
      if (result.is_blocked !== undefined) {
        serverBlockedStatus = result.is_blocked === true || result.is_blocked === "true";
      } else if (result.new_status !== undefined) {
        serverBlockedStatus = result.new_status === true || result.new_status === "true";
      } else {
        console.log('⚠️ No status returned, keeping optimistic update');
        const action = optimisticNewStatus ? 'blocked' : 'unblocked';
        console.log(`✅ User ${userId} has been ${action} successfully (optimistic)`);
        return;
      }
      
      console.log('🔍 Server blocked status:', serverBlockedStatus);
      
      // If server response differs from optimistic update, correct it
      if (serverBlockedStatus !== optimisticNewStatus) {
        console.log('🔄 Correcting optimistic update with server response');
        setPosts(prev => updateUserStatus(prev, serverBlockedStatus));
        setPinnedPosts(prev => updateUserStatus(prev, serverBlockedStatus));
      }
      
      // Show success message
      const action = serverBlockedStatus ? 'blocked' : 'unblocked';
      console.log(`✅ User ${userId} has been ${action} successfully`);
      
    } catch (error) {
      console.error('Error blocking user:', error);
      setError(`Failed to toggle user block status: ${error.message}`);
      
      // Revert optimistic update on error - check both user_id and employee_id
      const revertStatus = currentUser?.is_blocked === true || currentUser?.is_blocked === "true";
      const updateUserStatus = (posts, newStatus) => posts.map(post => ({
        ...post,
        author: (post.author?.user_id === userId || post.author?.employee_id === userId)
          ? { ...post.author, is_blocked: newStatus }
          : post.author,
        comments: post.comments ? post.comments.map(comment => ({
          ...comment,
          author: (comment.author?.user_id === userId || comment.author?.employee_id === userId)
            ? { ...comment.author, is_blocked: newStatus }
            : comment.author,
          replies: comment.replies ? comment.replies.map(reply => ({
            ...reply,
            author: (reply.author?.user_id === userId || reply.author?.employee_id === userId)
              ? { ...reply.author, is_blocked: newStatus }
              : reply.author
          })) : []
        })) : []
      }));
      
      setPosts(prev => updateUserStatus(prev, revertStatus));
      setPinnedPosts(prev => updateUserStatus(prev, revertStatus));
    }
  };

  return {
    handleBlockUser
  };
};
