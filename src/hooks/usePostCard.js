import { useState, useEffect } from 'react';
import { useAuth } from './../contexts/AuthContext';
import { usePost } from './../contexts/PostContext';
import { postsAPI } from '../services/api';

export const usePostCard = (post, activeView = 'home') => {
  const { user } = useAuth();
  const { 
    deletePost, 
    addComment, 
    editComment,
    addReply, 
    addCommentReply,
    deleteComment, 
    deleteReply, 
    addCommentReaction, 
    addReaction, 
    hasUserReacted 
  } = usePost();

  // State management
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [reactionsTimeout, setReactionsTimeout] = useState(null);
  const [showCommentReactions, setShowCommentReactions] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [shareCount, setShareCount] = useState(0);
  const [commentReactionsTimeouts, setCommentReactionsTimeouts] = useState({});
  const [reportType, setReportType] = useState('post');
  const [reportTargetId, setReportTargetId] = useState(null);

  // Check if this post belongs to the current user
  const isCurrentUserPost = post.author?.user_id === user?.user_id || 
                            post.author_id === user?.user_id || 
                            post.author_id === user?.id ||
                            post.user_id === user?.user_id ||
                            post.user_id === user?.id;

  // Available emoji reactions - using backend-compatible reaction type names
  const emojiReactions = [
    { emoji: '👍', name: 'thumbs_up', label: 'Good' },
    { emoji: '❤️', name: 'love', label: 'Love' },
    { emoji: '😊', name: 'happy', label: 'Happy' },
    { emoji: '😂', name: 'laugh', label: 'Laugh' },
    { emoji: '😮', name: 'wow', label: 'Wow' },
    { emoji: '😢', name: 'sad', label: 'Sad' },
    { emoji: '😡', name: 'angry', label: 'Angry' },
    { emoji: '🎉', name: 'celebrate', label: 'Celebrate' }
  ];

  // Normalize post data to handle different field names from backend
  const normalizePost = (rawPost) => {
    // CRITICAL: Handle reactions normalization properly
    let normalizedReactions = {};
    
    // Handle new reaction_counts format first (takes priority)
    if (rawPost.reaction_counts && typeof rawPost.reaction_counts === 'object') {
      Object.entries(rawPost.reaction_counts).forEach(([reactionType, count]) => {
        if (count > 0) {
          normalizedReactions[reactionType] = { count, users: [] };
        }
      });
    }
    // Fallback to old reactions array format
    else if (Array.isArray(rawPost.reactions)) {
      normalizedReactions = {};
      rawPost.reactions.forEach((reaction) => {
        const type = reaction.reaction_type || reaction.type;
        if (!normalizedReactions[type]) {
          normalizedReactions[type] = { users: [], count: 0 };
        }
        if (!normalizedReactions[type].users.includes(reaction.user_id)) {
          normalizedReactions[type].users.push(reaction.user_id);
          normalizedReactions[type].count++;
        }
      });
    } 
    // Already in object format or no reactions
    else {
      normalizedReactions = rawPost.reactions || {};
    }
    
    const normalized = {
      ...rawPost,
      // Use backend author data if available, otherwise fall back to current user data
      authorName: rawPost.author?.username || rawPost.authorName || rawPost.author_name || rawPost.username || 
                  (isCurrentUserPost ? (user?.name || user?.username) : 'Unknown User'),
      authorAvatar: rawPost.author?.avatar || rawPost.authorAvatar || rawPost.author_avatar || rawPost.avatar || 
                    (isCurrentUserPost ? user?.avatar : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
      authorPosition: rawPost.author?.position || rawPost.authorPosition || rawPost.author_position || rawPost.position || 
                      (isCurrentUserPost ? (user?.position || 'Employee') : 'Employee'),
      authorEmail: rawPost.author?.email || rawPost.authorEmail || rawPost.author_email,
      // Ensure consistent timestamp field - backend uses created_at
      timestamp: rawPost.timestamp || rawPost.created_at || rawPost.createdAt || new Date().toISOString(),
      // Ensure consistent ID field - backend uses post_id as primary field
      id: rawPost.post_id || rawPost.id || `post-${Date.now()}`,
      post_id: rawPost.post_id || rawPost.id, // Keep original post_id for backend operations
      // Ensure other fields have fallbacks
      content: rawPost.content || rawPost.post_content || '',
      tags: rawPost.tags || [],
      images: rawPost.images || rawPost.media || [],
      videos: rawPost.videos || [],
      documents: rawPost.documents || [],
      links: rawPost.links || [],
      mentions: rawPost.mentions || [],
      // Use comments as-is since PostContext already normalizes them
      comments: rawPost.comments || [],
      reactions: normalizedReactions,
      likes: rawPost.likes || []
    };
    
    return normalized;
  };

  const normalizedPost = normalizePost(post);

  // Helper function to get the correct post ID
  const getPostId = () => {
    const postId = normalizedPost.post_id || normalizedPost.id || post.post_id || post.id;
    return postId;
  };

  // Check if user has liked the post
  const checkIsLiked = () => {
    const postId = getPostId();
    
    // First check local user reaction tracking (most reliable for current session)
    const hasReactedLocally = hasUserReacted ? hasUserReacted(postId, 'like') : false;
    
    // Then check various fallback methods
    const isInLikesArray = normalizedPost.likes?.includes(user?.id) || 
                          normalizedPost.likes?.includes(user?.user_id);
                          
    const isInLikeReactionUsers = normalizedPost.reactions?.like?.users?.includes(user?.id) ||
                                 normalizedPost.reactions?.like?.users?.includes(user?.user_id);
    
    // For reaction_counts format, if there's a like count > 0, check if it's the user's own post
    const hasLikeCount = normalizedPost.reactions?.like?.count > 0;
    const isOwnPost = isCurrentUserPost;
    const likelyUserLikedOwnPost = hasLikeCount && isOwnPost;
    
    const liked = hasReactedLocally || 
                 isInLikesArray || 
                 isInLikeReactionUsers || 
                 likelyUserLikedOwnPost;
    
    return liked;
  };

  const isLiked = checkIsLiked();
  const isAuthor = isCurrentUserPost;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reactionsTimeout) {
        clearTimeout(reactionsTimeout);
      }
    };
  }, [reactionsTimeout]);

  // Event handlers
  const handleLike = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const postId = getPostId();
    if (!postId) return;
    
    addReaction(postId, 'like', '❤️', activeView);
  };

  const handleComment = () => {
    const postId = getPostId();
    if (commentText.trim() && postId) {
      console.log('🔍 Adding comment with data:', {
        postId,
        commentData: { content: commentText.trim() },
        user: user,
        commentText: commentText.trim()
      });
      addComment(postId, { content: commentText.trim() });
      setCommentText('');
    }
  };

  const handleDelete = () => {
    deletePost(normalizedPost.post_id || normalizedPost.id);
    setShowConfirmDelete(false);
  };

  const handleCommentLike = (commentId) => {
    addCommentReaction(commentId, 'like');
  };

  const handleCommentReaction = (commentId, reactionType, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    addCommentReaction(commentId, reactionType);
    setShowCommentReactions(prev => ({ ...prev, [commentId]: false }));
  };

  const handleReply = (commentId) => {
    if (replyText.trim()) {
      addReply(post.id, commentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const handleCommentReply = (commentId, replyContent) => {
    const postId = getPostId();
    if (replyContent.trim() && postId) {
      addCommentReply(postId, commentId, replyContent.trim());
    }
  };

  const handleEditComment = (commentId, newContent) => {
    if (newContent.trim()) {
      editComment(commentId, newContent.trim());
    }
  };

  const handleDeleteComment = (commentId) => {
    deleteComment(post.id, commentId);
  };

  const handleDeleteReply = (commentId, replyId) => {
    // Use normalizedPost.post_id or normalizedPost.id for postId
    const postId = normalizedPost.post_id || normalizedPost.id || post.post_id || post.id;
    deleteReply(postId, commentId, replyId);
  };

  const handleShare = () => {
    setShareCount(prev => prev + 1);
    
    // Use the actual post ID from the API (post_id format)
    const actualPostId = normalizedPost.post_id || normalizedPost.id;
    const shareUrl = `${window.location.origin}/post/${actualPostId}`;
    const shareText = `Check out this post by ${normalizedPost.authorName}: ${normalizedPost.content.replace(/<[^>]*>/g, '').substring(0, 100)}...`;
    
    console.log('🔍 Share - Post ID:', actualPostId);
    console.log('🔍 Share - Share URL:', shareUrl);
    console.log('🔍 Share - Share Text:', shareText);
    
    if (navigator.share) {
      navigator.share({
        title: `Post by ${normalizedPost.authorName}`,
        text: shareText,
        url: shareUrl,
      }).catch(err => {
        console.log('Error sharing via navigator.share:', err);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
    
    // Show success message
    console.log('✅ Share link copied:', shareUrl);
  };

  const copyToClipboard = (text) => {
    console.log('🔍 Copying to clipboard:', text);
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Shareable link copied to clipboard! You can now share this post with anyone.');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Shareable link copied to clipboard! You can now share this post with anyone.');
    });
  };

  const handleReport = (type, id) => {
    setShowReportModal(true);
    setReportType(type);
    setReportTargetId(id);
  };

  const submitReport = async (reason, description = '') => {
    try {
      const reportData = {
        reason,
        description: description || reason
      };

      if (reportType === 'post') {
        await postsAPI.reportPost(reportTargetId, reportData);
      } else if (reportType === 'comment') {
        await postsAPI.reportComment(reportTargetId, reportData);
      }

      setShowReportModal(false);
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleReaction = (reactionType, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const postId = getPostId();
    if (!postId) return;
    
    const emoji = emojiReactions.find(r => r.name === reactionType)?.emoji || '👍';
    addReaction(postId, reactionType, emoji, activeView);
    setShowReactions(false);
  };

  // Reaction hover handlers
  const handleReactionsMouseEnter = () => {
    if (reactionsTimeout) {
      clearTimeout(reactionsTimeout);
    }
    setShowReactions(true);
  };

  const handleReactionsMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowReactions(false);
    }, 300);
    setReactionsTimeout(timeout);
  };

  const handleCommentReactionsMouseEnter = (commentId) => {
    if (commentReactionsTimeouts[commentId]) {
      clearTimeout(commentReactionsTimeouts[commentId]);
      setCommentReactionsTimeouts((prev) => ({ ...prev, [commentId]: null }));
    }
    setShowCommentReactions((prev) => ({ ...prev, [commentId]: true }));
  };

  const handleCommentReactionsMouseLeave = (commentId) => {
    const timeout = setTimeout(() => {
      setShowCommentReactions((prev) => ({ ...prev, [commentId]: false }));
      setCommentReactionsTimeouts((prev) => ({ ...prev, [commentId]: null }));
    }, 300);
    setCommentReactionsTimeouts((prev) => ({ ...prev, [commentId]: timeout }));
  };

  // Utility functions
  const getUserReaction = () => {
    if (!normalizedPost.reactions) return null;
    
    const postId = getPostId();
    for (const [reactionType, reaction] of Object.entries(normalizedPost.reactions)) {
      if (reactionType !== 'like') {
        const hasReactedLocally = hasUserReacted ? hasUserReacted(postId, reactionType) : false;
        const isInReactionUsers = reaction.users?.includes(user?.id) || reaction.users?.includes(user?.user_id);
        const hasReactionCount = reaction.count > 0;
        const isOwnPost = isCurrentUserPost;
        const likelyUserReactedOwnPost = hasReactionCount && isOwnPost;
        
        const userHasReaction = hasReactedLocally || isInReactionUsers || likelyUserReactedOwnPost;
        
        if (userHasReaction) {
          return reactionType;
        }
      }
    }
    return null;
  };

  const getCommentUserReaction = (comment) => {
    console.log('🔍 getCommentUserReaction called with:', {
      commentId: comment.comment_id || comment.id,
      reactions: comment.reactions,
      reactionsType: typeof comment.reactions,
      reactionsKeys: comment.reactions ? Object.keys(comment.reactions) : 'no reactions',
      reactionsEntries: comment.reactions ? Object.entries(comment.reactions) : 'no reactions',
      currentUser: { id: user?.id, user_id: user?.user_id },
      authorId: comment.authorId
    });
    
    if (!comment.reactions) {
      console.log('🔍 No reactions object found');
      return null;
    }
    
    if (Object.keys(comment.reactions).length === 0) {
      console.log('🔍 Reactions object is empty');
      return null;
    }
    
    // Get current user IDs to check against
    const currentUserIds = [user?.id, user?.user_id, user?.userId].filter(Boolean);
    console.log('🔍 Current user IDs:', currentUserIds);
    
    for (const [reactionType, reaction] of Object.entries(comment.reactions)) {
      console.log('🔍 Checking reaction type:', reactionType, 'with data:', reaction);
      
      // Handle different reaction data formats
      let hasReaction = false;
      
      if (Array.isArray(reaction)) {
        // Format: [{ user_id: 123 }, { user_id: 456 }] (from optimistic updates)
        hasReaction = reaction.some(r => 
          currentUserIds.includes(r.user_id) || 
          currentUserIds.includes(r.id)
        );
        console.log('🔍 Array format - checking user IDs in reaction array');
      } else if (reaction.users && Array.isArray(reaction.users)) {
        // Format: { users: [123, 456], count: 2 } (from API)
        hasReaction = reaction.users.some(userId => {
          const match = currentUserIds.includes(userId);
          console.log('🔍 Checking userId:', userId, 'against currentUserIds:', currentUserIds, 'match:', match);
          return match;
        });
      } else if (reaction.count > 0) {
        // For reaction_counts format, if there's a reaction count > 0 and it's user's own comment,
        // assume they reacted (similar logic to posts)
        const isOwnComment = currentUserIds.includes(comment.authorId) || 
                            currentUserIds.includes(comment.author?.user_id) ||
                            currentUserIds.includes(comment.author?.id);
        hasReaction = isOwnComment;
        console.log('🔍 Count format - own comment reaction check');
      }
      
      console.log('🔍 Reaction check results:', {
        reactionType,
        hasReaction,
        reactionFormat: Array.isArray(reaction) ? 'array' : 'object',
        reaction
      });
      
      if (hasReaction) {
        console.log('🔍 User has reaction:', reactionType);
        return reactionType;
      }
    }
    
    console.log('🔍 User has no reactions');
    return null;
  };

  const getTotalLikes = () => {
    const likesArrayCount = normalizedPost.likes?.length || 0;
    const likeReactionCount = normalizedPost.reactions?.like?.count || 0;
    
    if (likeReactionCount > 0) {
      return likeReactionCount;
    }
    return likesArrayCount;
  };

  const getTotalReactions = () => {
    if (!normalizedPost.reactions) return 0;
    return Object.entries(normalizedPost.reactions)
      .filter(([reactionType]) => reactionType !== 'like')
      .reduce((total, [, reaction]) => total + reaction.count, 0);
  };

  const getTopReactions = () => {
    if (!normalizedPost.reactions) return [];
    
    return Object.entries(normalizedPost.reactions)
      .filter(([reactionType]) => reactionType !== 'like')
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3)
      .map(([type, reaction]) => ({
        type,
        emoji: emojiReactions.find(r => r.name === type)?.emoji || '👍',
        count: reaction.count
      }));
  };

  const getCommentTopReactions = (comment) => {
    if (!comment.reactions) return [];
    
    return Object.entries(comment.reactions)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3)
      .map(([type, reaction]) => ({
        type,
        emoji: emojiReactions.find(r => r.name === type)?.emoji || '👍',
        count: reaction.count
      }));
  };

  const getCommentTotalReactions = (comment) => {
    if (!comment.reactions) return 0;
    return Object.values(comment.reactions).reduce((total, reaction) => total + reaction.count, 0);
  };

  const getTotalComments = () => {
    let total = post.comments?.length || 0;
    post.comments?.forEach(comment => {
      total += comment.replies?.length || 0;
    });
    return total;
  };

  return {
    // State
    normalizedPost,
    showComments,
    setShowComments,
    commentText,
    setCommentText,
    showMenu,
    setShowMenu,
    showEditModal,
    setShowEditModal,
    showConfirmDelete,
    setShowConfirmDelete,
    showReportModal,
    setShowReportModal,
    showBlockModal,
    setShowBlockModal,
    reportReason,
    setReportReason,
    reportDescription,
    setReportDescription,
    reportType,
    setReportType,
    reportTargetId,
    setReportTargetId,
    showReactions,
    showCommentReactions,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    shareCount,

    // Computed values
    isLiked,
    isAuthor,
    isBlocked: user?.is_blocked === true || user?.is_blocked === "true",
    emojiReactions,
    user,

    // Event handlers
    handleLike,
    handleComment,
    handleDelete,
    handleCommentLike,
    handleCommentReaction,
    handleReply,
    handleCommentReply,
    handleEditComment,
    handleDeleteComment,
    handleDeleteReply,
    handleShare,
    handleReport,
    submitReport,
    handleReaction,
    handleReactionsMouseEnter,
    handleReactionsMouseLeave,
    handleCommentReactionsMouseEnter,
    handleCommentReactionsMouseLeave,

    // Utility functions
    getUserReaction,
    getCommentUserReaction,
    getTotalLikes,
    getTotalReactions,
    getTopReactions,
    getCommentTopReactions,
    getCommentTotalReactions,
    getTotalComments,
    hasUserReacted
  };
};
