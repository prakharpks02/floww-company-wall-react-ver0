import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import CreatePost from './CreatePost';
import VideoPlayer from '../Media/VideoPlayer';
import DocumentViewer from '../Media/DocumentViewer';
import PDFPreview from '../Media/PDFPreview';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit3,
  Trash2,
  Hash,
  AtSign,
  Image,
  Video,
  FileText,
  ExternalLink,
  Download,
  Flag,
  UserX,
  AlertTriangle
} from 'lucide-react';

const PostCard = ({ post, showAuthorInfo = true, isPublicView = false, activeView = 'home' }) => {
  const { user } = useAuth();
  
  // Check if this post belongs to the current user (moved outside normalizePost for component-level access)
  const isCurrentUserPost = post.author?.user_id === user?.user_id || 
                            post.author_id === user?.user_id || 
                            post.author_id === user?.id ||
                            post.user_id === user?.user_id ||
                            post.user_id === user?.id;
  
  // Normalize post data to handle different field names from backend
  const normalizePost = (rawPost) => {
    // console.log('🔍 PostCard - Raw post data:', rawPost);
    // console.log('🔍 PostCard - Raw reactions:', rawPost.reactions);
    // console.log('🔍 PostCard - Raw reaction_counts:', rawPost.reaction_counts);
    // console.log('🔍 PostCard - Raw reactions type:', typeof rawPost.reactions);
    // console.log('🔍 PostCard - Raw reactions is array:', Array.isArray(rawPost.reactions));
    
    // CRITICAL: Handle reactions normalization properly
    let normalizedReactions = {};
    
    // Handle new reaction_counts format first (takes priority)
    if (rawPost.reaction_counts && typeof rawPost.reaction_counts === 'object') {
      // console.log('🔍 PostCard - Converting reaction_counts to object...');
      Object.entries(rawPost.reaction_counts).forEach(([reactionType, count]) => {
        if (count > 0) {
          normalizedReactions[reactionType] = {
            users: [], // We don't have user list in reaction_counts format
            count: count
          };
          // console.log(`🔍 PostCard - Added ${reactionType} with count ${count} for reaction_counts format`);
        }
      });
      // console.log('🔍 PostCard - Final normalized reactions from reaction_counts:', normalizedReactions);
    }
    // Fallback to old reactions array format
    else if (Array.isArray(rawPost.reactions)) {
      // console.log('🔍 PostCard - Converting reactions array to object...');
      normalizedReactions = {};
      
      rawPost.reactions.forEach((reaction, index) => {
        // console.log(`🔍 PostCard - Processing reaction ${index}:`, reaction);
        const reactionType = reaction.reaction_type;
        const userId = reaction.user_id;
        
        if (!normalizedReactions[reactionType]) {
          normalizedReactions[reactionType] = {
            users: [],
            count: 0
          };
        }
        
        if (!normalizedReactions[reactionType].users.includes(userId)) {
          normalizedReactions[reactionType].users.push(userId);
          normalizedReactions[reactionType].count++;
          // console.log(`🔍 PostCard - Added user ${userId} to ${reactionType}, count now: ${normalizedReactions[reactionType].count}`);
        }
      });
      
      // console.log('🔍 PostCard - Final normalized reactions from array:', normalizedReactions);
    } 
    // Already in object format or no reactions
    else {
      normalizedReactions = rawPost.reactions || {};
      // console.log('🔍 PostCard - Reactions already in object format or empty:', normalizedReactions);
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
      comments: rawPost.comments || [],
      reactions: normalizedReactions,
      likes: rawPost.likes || []
    };
    
    // console.log('🔍 PostCard - Final normalized post:', normalized);
    return normalized;
  };

  const normalizedPost = normalizePost(post);
  
  // console.log('🔍 PostCard - Normalized post:', normalizedPost);
  // console.log('🔍 PostCard - Normalized reactions:', normalizedPost.reactions);
  
  // Helper function to get the correct post ID
  const getPostId = () => {
    // Prioritize post_id from backend, then normalized id, then fallbacks
    const postId = normalizedPost.post_id || normalizedPost.id || post.post_id || post.id;
    // console.log('🔍 getPostId - Checking IDs:', {
    //   'normalizedPost.post_id': normalizedPost.post_id,
    //   'normalizedPost.id': normalizedPost.id,
    //   'post.post_id': post.post_id,
    //   'post.id': post.id,
    //   'final postId': postId
    // });
    return postId;
  };
  // console.log('🔍 Current user:', user);
  const { deletePost, addComment, addReply, deleteComment, deleteReply, addCommentReaction, addReaction, hasUserReacted } = usePost();
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
    const [newCommentText, setNewCommentText] = useState('');

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reactionsTimeout) {
        clearTimeout(reactionsTimeout);
      }
    };
  }, [reactionsTimeout]);

  const handleAddNewComment = () => {
  if (!newCommentText.trim()) return;

  const newComment = {
    id: Date.now(),
    content: newCommentText.trim(),
    authorName: user.name,
    authorAvatar: user.avatar,
    authorId: user.id,
    timestamp: new Date().toISOString(),
    reactions: {},
    replies: [],
  };

  // Add to post comments
  const updatedPost = {
    ...normalizedPost,
    comments: [...(normalizedPost.comments || []), newComment],
  };

  // Update state (assuming you have a setter for post)
  setNormalizedPost(updatedPost);

  setNewCommentText('');
};


  // Improved hover handlers for reactions
  const handleReactionsMouseEnter = () => {
    if (reactionsTimeout) {
      clearTimeout(reactionsTimeout);
    }
    if (!isPublicView) {
      setShowReactions(true);
    }
  };

  const handleReactionsMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowReactions(false);
    }, 300); // 300ms delay before hiding
    setReactionsTimeout(timeout);
  };

  // Check if user has liked the post - moved after getPostId function is defined
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
    // This is a reasonable assumption since most users like their own posts
    const hasLikeCount = normalizedPost.reactions?.like?.count > 0;
    const isOwnPost = isCurrentUserPost;
    const likelyUserLikedOwnPost = hasLikeCount && isOwnPost;
    
    // CRITICAL: For posts where we have reaction_counts but no user data,
    // we need to make an educated guess. If it's the user's own post and has likes,
    // they probably liked it themselves
    const liked = hasReactedLocally || 
                 isInLikesArray || 
                 isInLikeReactionUsers || 
                 likelyUserLikedOwnPost;
    
    // Debug logging for like status
    // console.log('🔍 PostCard isLiked calculation:', {
    //   postId: postId,
    //   userId: user?.id,
    //   userUserId: user?.user_id,
    //   hasUserReactedFunction: typeof hasUserReacted,
    //   hasReactedLocally: hasReactedLocally,
    //   likesArray: normalizedPost.likes,
    //   likeReaction: normalizedPost.reactions?.like,
    //   likeReactionUsers: normalizedPost.reactions?.like?.users,
    //   isInLikesArray: isInLikesArray,
    //   isInLikeReactionUsers: isInLikeReactionUsers,
    //   hasLikeCount: hasLikeCount,
    //   isOwnPost: isOwnPost,
    //   likelyUserLikedOwnPost: likelyUserLikedOwnPost,
    //   finalIsLiked: liked,
    //   allReactions: normalizedPost.reactions
    // });
    
    return liked;
  };
  
  const isLiked = checkIsLiked();
  
  
  const isAuthor = isCurrentUserPost;

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

  const handleLike = (event) => {
    // Prevent any default behavior that might cause page refresh
    event.preventDefault();
    event.stopPropagation();
    
    if (isPublicView || !user) return;
    
    const postId = getPostId();
    // console.log('🔍 PostCard handleLike - Using post ID:', postId);
    // console.log('🔍 PostCard handleLike - Current isLiked:', isLiked);
    // console.log('🔍 PostCard handleLike - Current like count:', getTotalLikes());
    // console.log('🔍 PostCard handleLike - Post reactions:', normalizedPost.reactions);
    // console.log('🔍 PostCard handleLike - Post likes array:', normalizedPost.likes);
    
    if (!postId) {
      console.error('❌ No valid post ID found for like action');
      return;
    }
    
    // Use reaction system for likes - this will add/remove like reaction
    // and automatically increase/decrease the like count for each user
    addReaction(postId, 'like', '❤️', activeView);
  };

  const handleComment = () => {
    if (isPublicView || !user) return;
    const postId = getPostId();
    if (commentText.trim() && postId) {
      addComment(postId, { user_id: user.id, comment: commentText });
      setCommentText('');
    }
  };

  const handleDelete = () => {
   
    
    // Use post_id for backend operations
    deletePost(normalizedPost.post_id || normalizedPost.id);
    setShowConfirmDelete(false);
  };

  const handleCommentLike = (commentId) => {
    if (isPublicView || !user) return;
    addCommentReaction(commentId, 'like');
  };

const handleCommentReaction = (commentId, reactionType, event) => {
  // Prevent any default behavior that might cause page refresh
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  if (isPublicView || !user) return;

  // Send the selected reaction to the backend
  addCommentReaction(commentId, reactionType);

  setShowCommentReactions(prev => ({ ...prev, [commentId]: false }));
};

  const handleCommentReactionsMouseEnter = (commentId) => {
    // Cancel any pending timeout for this comment
    if (commentReactionsTimeouts[commentId]) {
      clearTimeout(commentReactionsTimeouts[commentId]);
      setCommentReactionsTimeouts((prev) => ({ ...prev, [commentId]: null }));
    }
    setShowCommentReactions((prev) => ({ ...prev, [commentId]: true }));
  };

  const handleCommentReactionsMouseLeave = (commentId) => {
    // Set a timeout to hide the dropdown after 300ms
    const timeout = setTimeout(() => {
      setShowCommentReactions((prev) => ({ ...prev, [commentId]: false }));
      setCommentReactionsTimeouts((prev) => ({ ...prev, [commentId]: null }));
    }, 300);
    setCommentReactionsTimeouts((prev) => ({ ...prev, [commentId]: timeout }));
  };

  const handleReply = (commentId) => {
    if (isPublicView || !user) return;
    if (replyText.trim()) {
      addReply(post.id, commentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const handleDeleteComment = (commentId) => {
    if (isPublicView || !user) return;
    deleteComment(post.id, commentId);
  };

  const handleDeleteReply = (commentId, replyId) => {
    if (isPublicView || !user) return;
    deleteReply(post.id, commentId, replyId);
  };

  const getCommentUserReaction = (comment) => {
    if (!comment.reactions) return null;
    
    const postId = getPostId();
    const commentId = comment.id;
    
    for (const [reactionType, reaction] of Object.entries(comment.reactions)) {
      // First check local user reaction tracking for comments (if implemented)
      // For now, we'll use the existing user list checking since comments might not be tracked locally yet
      const isInReactionUsers = reaction.users?.includes(user?.id) || reaction.users?.includes(user?.user_id);
      
      // For reaction_counts format on comments, if there's a reaction count > 0 and it's user's own comment,
      // assume they reacted (similar logic to posts)
      const hasReactionCount = reaction.count > 0;
      const isOwnComment = comment.authorId === user?.id || comment.author?.user_id === user?.user_id;
      const likelyUserReactedOwnComment = hasReactionCount && isOwnComment;
      
      // Check if user has this reaction on the comment
      const userHasReaction = isInReactionUsers || likelyUserReactedOwnComment;
      
      if (userHasReaction) {
        // console.log('🔍 PostCard getCommentUserReaction - Found user comment reaction:', {
        //   postId: postId,
        //   commentId: commentId,
        //   reactionType: reactionType,
        //   isInReactionUsers: isInReactionUsers,
        //   isOwnComment: isOwnComment,
        //   likelyUserReactedOwnComment: likelyUserReactedOwnComment,
        //   userHasReaction: userHasReaction
        // });
        return reactionType;
      }
    }
    return null;
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

  const handleShare = () => {
    setShareCount(prev => prev + 1);
    
    // Create share URL
    const shareUrl = `${window.location.origin}/post/${normalizedPost.id}`;
    const shareText = `Check out this post by ${normalizedPost.authorName}: ${normalizedPost.content.replace(/<[^>]*>/g, '').substring(0, 100)}...`;
    
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Post by ${normalizedPost.authorName}`,
        text: shareText,
        url: shareUrl,
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard copy
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    });
  };

  const getTotalComments = () => {
    let total = post.comments?.length || 0;
    // Add replies count
    post.comments?.forEach(comment => {
      total += comment.replies?.length || 0;
    });
    return total;
  };

  const handleReaction = (reactionType, event) => {
    // Prevent any default behavior that might cause page refresh
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (isPublicView || !user) return;
    const postId = getPostId();
    if (!postId) return;
    
    // Get the emoji for this reaction type
    const emoji = emojiReactions.find(r => r.name === reactionType)?.emoji || '👍';
    
    // Add the emoji reaction (likes are handled separately by the heart button)
    addReaction(postId, reactionType, emoji, activeView);
    setShowReactions(false);
  };

  const getUserReaction = () => {
    if (!normalizedPost.reactions) return null;
    
    const postId = getPostId();
    for (const [reactionType, reaction] of Object.entries(normalizedPost.reactions)) {
      // Exclude 'like' reactions from showing in the emoji reaction display
      // since likes are handled by the heart button
      if (reactionType !== 'like') {
        // First check local user reaction tracking (most reliable for current session)
        const hasReactedLocally = hasUserReacted ? hasUserReacted(postId, reactionType) : false;
        
        // Then check if user is in the users array (fallback for old format)
        const isInReactionUsers = reaction.users?.includes(user?.id) || reaction.users?.includes(user?.user_id);
        
        // For reaction_counts format, if there's a reaction count > 0 and it's user's own post,
        // assume they reacted (similar logic to likes)
        const hasReactionCount = reaction.count > 0;
        const isOwnPost = isCurrentUserPost;
        const likelyUserReactedOwnPost = hasReactionCount && isOwnPost;
        
        // Check if user has this reaction
        const userHasReaction = hasReactedLocally || isInReactionUsers || likelyUserReactedOwnPost;
        
        if (userHasReaction) {
          // console.log('🔍 PostCard getUserReaction - Found user reaction:', {
          //   postId: postId,
          //   reactionType: reactionType,
          //   hasReactedLocally: hasReactedLocally,
          //   isInReactionUsers: isInReactionUsers,
          //   likelyUserReactedOwnPost: likelyUserReactedOwnPost,
          //   userHasReaction: userHasReaction
          // });
          return reactionType;
        }
      }
    }
    return null;
  };

  // Get total like count from both likes array and like reactions
  const getTotalLikes = () => {
    const likesArrayCount = normalizedPost.likes?.length || 0;
    const likeReactionCount = normalizedPost.reactions?.like?.count || 0;
    
    // If both exist, prioritize the reaction count as it's more current
    if (likeReactionCount > 0) {
      return likeReactionCount;
    }
    return likesArrayCount;
  };

  const getTotalReactions = () => {
    if (!normalizedPost.reactions) return 0;
    // Exclude 'like' reactions from the total count since they're shown in the heart button
    return Object.entries(normalizedPost.reactions)
      .filter(([reactionType]) => reactionType !== 'like')
      .reduce((total, [, reaction]) => total + reaction.count, 0);
  };

  const getTopReactions = () => {
    if (!normalizedPost.reactions) return [];
    
    return Object.entries(normalizedPost.reactions)
      .filter(([reactionType]) => reactionType !== 'like') // Exclude likes
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3)
      .map(([type, reaction]) => ({
        type,
        emoji: emojiReactions.find(r => r.name === type)?.emoji || '👍',
        count: reaction.count
      }));
  };

  const renderContent = (content) => {
    return (
      <div 
        className="prose prose-sm max-w-none text-gray-900"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{ color: '#111827' }}
      />
    );
  };

  const renderAttachments = () => {
    const hasAttachments = 
      normalizedPost.images?.length > 0 || 
      normalizedPost.videos?.length > 0 || 
      normalizedPost.documents?.length > 0 || 
      normalizedPost.links?.length > 0;

    if (!hasAttachments) return null;

    return (
      <div className="mt-4 space-y-4">
        {/* Images */}
        {normalizedPost.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {normalizedPost.images.map((image, idx) => (
              <div key={image.id || image.url || idx} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    // Open lightbox or modal for full view
                    window.open(image.url, '_blank');
                  }}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <Image className="h-3 w-3 inline mr-1" />
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Videos */}
        {normalizedPost.videos?.length > 0 && (
          <div className="space-y-4">
            {normalizedPost.videos.map((video, idx) => (
              <VideoPlayer
                key={video.id || video.url || idx}
                src={video.url}
                poster={video.thumbnail}
                className="w-full max-w-2xl"
              />
            ))}
          </div>
        )}

        {/* Documents */}
        {normalizedPost.documents?.length > 0 && (
          <div className="space-y-4">
            {normalizedPost.documents.map((doc, idx) => (
              <div key={doc.id || doc.url || idx}>
                {doc.isPDF && doc.url ? (
                  // PDF Preview (like video)
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center justify-between p-3 bg-red-50 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">PDF</span>
                        </div>
                        <div>
                          <p className="font-medium text-red-900">{doc.name}</p>
                          <p className="text-sm text-red-600">PDF Document</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="h-80">
                      <PDFPreview url={doc.url} />
                    </div>
                  </div>
                ) : (
                  // Regular document viewer
                  <DocumentViewer
                    file={{
                      name: doc.name,
                      url: doc.url,
                      size: doc.size,
                      type: doc.type,
                      uploadedAt: doc.uploadedAt
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {normalizedPost.links?.length > 0 && (
          <div className="space-y-2">
            {normalizedPost.links.map((link, idx) => (
              <div key={link.id || link.url || idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{link.title || link.url}</p>
                      <p className="text-sm text-blue-600">{link.url}</p>
                      {link.description && (
                        <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(link.url, '_blank')}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={normalizedPost.authorAvatar}
            alt={normalizedPost.authorName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{normalizedPost.authorName}</h3>
            <p className="text-sm text-gray-500">{normalizedPost.authorPosition}</p>
            <p className="text-xs text-gray-400">
              {normalizedPost.timestamp && !isNaN(new Date(normalizedPost.timestamp)) 
                ? formatDistanceToNow(new Date(normalizedPost.timestamp), { addSuffix: true })
                : 'Just now'
              }
              {normalizedPost.updatedAt && ' • edited'}
            </p>
          </div>
        </div>

        {/* Menu */}
        {!isPublicView && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              {isAuthor ? (
                <>
                  <button
                    onClick={() => {
                      // console.log('🔍 Opening edit modal for post:', normalizedPost);
                      // console.log('🔍 Post ID for editing:', normalizedPost.id);
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmDelete(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowReportModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Report Post</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowBlockModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <UserX className="h-4 w-4" />
                    <span>Block User</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Tags */}
      {normalizedPost.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {normalizedPost.tags.map((tag, index) => {
            // Handle both string tags and object tags from backend
            const tagName = typeof tag === 'string' ? tag : tag.tag_name || tag.name || 'tag';
            const tagKey = typeof tag === 'string' ? tag : tag.tag_name || tag.name || `tag-${index}`;
            return (
              <span
                key={tagKey || index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: '#9f7aea' }}
              >
                <Hash className="h-3 w-3 mr-1" />
                {tagName}
              </span>
            );
          })}
        </div>
      )}

      {/* Post Content */}
      <div className="mb-4">
        {renderContent(normalizedPost.content)}
      </div>

      {/* Attachments */}
      {renderAttachments()}

      {/* Mentions */}
      {normalizedPost.mentions?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {normalizedPost.mentions.map((mention, idx) => (
            <span
              key={mention.id || mention.name || idx}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
            >
              <AtSign className="h-3 w-3 mr-1" />
              {mention.name}
            </span>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="pt-4 border-t border-gray-100">
        {/* Reactions Display */}
        {(getTotalReactions() > 0 || getTotalLikes() > 0) && (
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center space-x-4">
              {/* Like Count */}
              {getTotalLikes() > 0 && (
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                  <span className="text-gray-600">{getTotalLikes()}</span>
                </div>
              )}
              
              {/* Emoji Reactions */}
              {getTotalReactions() > 0 && (
                <div className="flex items-center space-x-1">
                  {getTopReactions().map((reaction, index) => (
                    <div key={reaction.type || index} className="flex items-center">
                      <span className="text-lg">{reaction.emoji}</span>
                      {index === getTopReactions().length - 1 && (
                        <span className="ml-1 text-gray-600">{getTotalReactions()}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 text-gray-500">
              <span>{getTotalComments()} {getTotalComments() === 1 ? 'comment' : 'comments'}</span>
              {shareCount > 0 && (
                <span>{shareCount} {shareCount === 1 ? 'share' : 'shares'}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Like Button with Hover Reactions */}
            <div 
              className="relative"
              onMouseEnter={handleReactionsMouseEnter}
              onMouseLeave={handleReactionsMouseLeave}
            >
              <button
                onClick={handleLike}
                disabled={isPublicView}
                title={isPublicView ? "Login to like posts" : "Like this post"}
                className={`flex items-center space-x-2 text-sm ${
                  isLiked
                    ? 'text-red-600'
                    : isPublicView 
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-red-600'
                } transition-colors`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>Like</span>
                {getTotalLikes() > 0 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {getTotalLikes()}
                  </span>
                )}
                {/* Show user's emoji reaction if they have one */}
                {getUserReaction() && (
                  <span className="text-lg">
                    {emojiReactions.find(r => r.name === getUserReaction())?.emoji || ''}
                  </span>
                )}
              </button>

              {/* Hover Reactions Dropdown */}
              {showReactions && !isPublicView && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-2 flex items-center space-x-1 z-20"
                  onMouseEnter={handleReactionsMouseEnter}
                  onMouseLeave={handleReactionsMouseLeave}
                >
                  {emojiReactions.map((reaction) => (
                    <button
                      key={reaction.name}
                      onClick={(event) => handleReaction(reaction.name, event)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors transform hover:scale-110"
                      title={reaction.label}
                    >
                      <span className="text-xl">{reaction.emoji}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowComments(!showComments)}
              title={isPublicView ? "View comments (login to interact)" : "View comments"}
              className={`flex items-center space-x-2 text-sm transition-colors ${
                isPublicView 
                  ? 'text-gray-500'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Comment</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <span>Share</span>
              {shareCount > 0 && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {shareCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
{showComments && (
  <div className="space-y-3">
    {/* Always show comment input box when comments are open */}
    {!isPublicView && (
      <div className="flex space-x-3 mb-2">
        <img
          src={user?.avatar}
          alt={user?.name}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div className="flex-1 flex space-x-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            onKeyPress={(e) => e.key === 'Enter' && handleComment()}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim()}
            className="px-3 py-1 text-white rounded text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: '#9f7aea' }}
          >
            Post
          </button>
        </div>
      </div>
    )}
    {/* If no comments */}
    {Array.isArray(normalizedPost.comments) && normalizedPost.comments.length === 0 && (
      <div className="text-sm text-gray-500">No comments yet. Be the first to comment!</div>
    )}
    {/* Render each comment with full UI */}
    {Array.isArray(normalizedPost.comments) && normalizedPost.comments.length > 0 && (
      normalizedPost.comments.map((comment, idx) => {
        // Normalize comment reactions array to object
        let normalizedComment = { ...comment };
        if (Array.isArray(comment.reactions)) {
          const reactionsObj = {};
          comment.reactions.forEach(reaction => {
            const type = reaction.reaction_type;
            if (!reactionsObj[type]) {
              reactionsObj[type] = { users: [], count: 0 };
            }
            if (!reactionsObj[type].users.includes(reaction.user_id)) {
              reactionsObj[type].users.push(reaction.user_id);
              reactionsObj[type].count++;
            }
          });
          normalizedComment.reactions = reactionsObj;
        }
        return (
          <div key={comment.id || idx} className="flex space-x-3">
            <img
              src={comment.authorAvatar}
              alt={comment.authorName}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {comment.timestamp && !isNaN(new Date(comment.timestamp))
                        ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })
                        : 'Just now'
                      }
                    </span>
                  </div>
                  {/* Delete button for comment author */}
                  {!isPublicView && comment.authorId === user?.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700">{comment.content ?? ''}</p>
              </div>
              {/* Comment Reactions Display */}
              {getCommentTotalReactions(normalizedComment) > 0 && (
                <div className="flex items-center space-x-2 mt-1 mb-2">
                  <div className="flex items-center space-x-1">
                    {getCommentTopReactions(normalizedComment).map((reaction, index) => (
                      <div key={reaction.type} className="flex items-center">
                        <span className="text-sm">{reaction.emoji}</span>
                        {index === getCommentTopReactions(normalizedComment).length - 1 && (
                          <span className="ml-1 text-xs text-gray-600">{getCommentTotalReactions(normalizedComment)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Comment Actions */}
              <div className="flex items-center space-x-4 mt-2">
                {/* Like Button with Hover Reactions for Comments */}
                <div
                  className="relative"
                  onMouseEnter={() => handleCommentReactionsMouseEnter(comment.id)}
                  onMouseLeave={() => handleCommentReactionsMouseLeave(comment.id)}
                >
                  <button
                    onClick={() => handleCommentLike(comment.id)}
                    disabled={isPublicView}
                    title={isPublicView ? "Login to like or react to comments" : "Like or react to this comment"}
                    className={`text-xs ${
                      getCommentUserReaction(comment) || hasUserReacted(`comment_${comment.id}`, 'like')
                        ? 'text-red-600'
                        : isPublicView
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:text-red-600'
                    } transition-colors flex items-center space-x-1`}
                  >
                    {getCommentUserReaction(comment) ? (
                      <span className="text-lg">
                        {emojiReactions.find(r => r.name === getCommentUserReaction(comment))?.emoji || '😊'}
                      </span>
                    ) : (
                      <Heart className={`h-3 w-3 ${hasUserReacted(`comment_${comment.id}`, 'like') ? 'fill-current' : ''}`} />
                    )}
                    <span>Like</span>
                    {(() => {
                      const reaction = getCommentUserReaction(comment) || 'like';
                      return comment.reactions?.[reaction]?.count > 0 ? (
                        <span className="bg-gray-200 px-1 rounded text-xs">
                          {comment.reactions[reaction].count}
                        </span>
                      ) : null;
                    })()}
                  </button>
                  {showCommentReactions[comment.id] && !isPublicView && (
                    <div
                      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-2 flex items-center space-x-1 z-20"
                    >
                      {emojiReactions.map((reaction) => (
                        <button
                          key={reaction.name}
                          onClick={(event) => handleCommentReaction(comment.id, reaction.name, event)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors transform hover:scale-110"
                          title={reaction.label}
                        >
                          <span className="text-xl">{reaction.emoji}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Reply Button */}
                <button
                  onClick={() => !isPublicView && setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  disabled={isPublicView}
                  title={isPublicView ? "Login to reply to comments" : "Reply to this comment"}
                  className={`text-xs transition-colors flex items-center space-x-1 ${
                    isPublicView
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Reply</span>
                </button>
              </div>
              {/* Reply Input - only show for logged in users */}
              {replyingTo === comment.id && !isPublicView && (
                <div className="mt-3 flex space-x-2">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.authorName}...`}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleReply(comment.id)}
                    />
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="px-3 py-1 text-white rounded text-xs hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      style={{ backgroundColor: '#9f7aea' }}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-3 py-1 text-gray-600 bg-gray-200 rounded text-xs hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {/* Replies (if any) */}
              {comment.replies?.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                  {comment.replies.map((reply, idx) => {
                    // Normalize reply reactions array to object
                    let normalizedReply = { ...reply };
                    if (Array.isArray(reply.reactions)) {
                      const reactionsObj = {};
                      reply.reactions.forEach(reaction => {
                        const type = reaction.reaction_type;
                        if (!reactionsObj[type]) {
                          reactionsObj[type] = { users: [], count: 0 };
                        }
                        if (!reactionsObj[type].users.includes(reaction.user_id)) {
                          reactionsObj[type].users.push(reaction.user_id);
                          reactionsObj[type].count++;
                        }
                      });
                      normalizedReply.reactions = reactionsObj;
                    }
                    return (
                      <div key={reply.id || idx} className="flex space-x-2">
                        <img
                          src={reply.authorAvatar}
                          alt={reply.authorName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-xs text-gray-900">
                                  {reply.authorName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {reply.timestamp && !isNaN(new Date(reply.timestamp))
                                    ? formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })
                                    : 'Just now'
                                  }
                                </span>
                              </div>
                              {/* Delete button for reply author */}
                              {!isPublicView && reply.authorId === user?.id && (
                                <button
                                  onClick={() => handleDeleteReply(comment.id, reply.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                                  title="Delete reply"
                                >
                                  <Trash2 className="h-2 w-2" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-700">{reply.content}</p>
                          </div>
                          {/* Show reply reactions just like for comments */}
                          {getCommentTotalReactions(normalizedReply) > 0 && (
                            <div className="flex items-center space-x-1 mt-1">
                              {getCommentTopReactions(normalizedReply).map((reaction, index) => (
                                <span key={reaction.type} className="text-sm">{reaction.emoji}</span>
                              ))}
                              <span className="ml-1 text-xs text-gray-600">{getCommentTotalReactions(normalizedReply)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
)}



      {/* Edit Modal */}
      {showEditModal && (
        <CreatePost
          editingPost={normalizedPost}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Post
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Flag className="h-5 w-5 text-orange-500 mr-2" />
              Report Post
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reporting:
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="misinformation">False information</option>
                <option value="violence">Violence or threats</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional details (optional):
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide more details about why you're reporting this post..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle report submission
                  // console.log('Reporting post:', { postId: post.id, reason: reportReason, description: reportDescription });
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  // Show success message
                  alert('Report submitted successfully. Our team will review it shortly.');
                }}
                disabled={!reportReason}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserX className="h-5 w-5 text-red-500 mr-2" />
              Block User
            </h3>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Before you block:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• You won't see their posts or comments</li>
                    <li>• They won't be able to mention you</li>
                    <li>• This action can be undone later</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to block <strong>{post.authorName}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle block user
                  console.log('Blocking user:', post.authorId);
                  setShowBlockModal(false);
                  // Show success message
                  alert(`You have blocked ${post.authorName}. You can unblock them anytime from your settings.`);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default PostCard;
