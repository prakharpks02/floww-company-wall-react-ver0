import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './../contexts/AuthContext';
import { usePost } from './../contexts/PostContext';
import { postsAPI } from '../services/api.jsx';
import { debounce } from '../utils/requestUtils.jsx';

const FALLBACK_AVATAR_URL = import.meta.env.VITE_FALLBACK_AVATAR_URL;

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
    hasUserReacted,
    hasUserReactedToComment
  } = usePost();

  // State management
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentMentions, setCommentMentions] = useState([]);
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
  const [showShareAlert, setShowShareAlert] = useState(false);
  const [commentReactionsTimeouts, setCommentReactionsTimeouts] = useState({});
  const [reportType, setReportType] = useState('post');
  const [reportTargetId, setReportTargetId] = useState(null);

  // Check if this post belongs to the current user
  const isCurrentUserPost = (() => {
    if (!user || !post) return false;
    
    // Convert to strings for comparison to avoid type mismatches
    const userIds = [user.id, user.employee_id, user.user_id].filter(Boolean).map(id => String(id));
    const authorIds = [
      post.author?.employee_id,
      post.author?.user_id, 
      post.author?.id,
      post.author_id,
      post.user_id
    ].filter(Boolean).map(id => String(id));

    return userIds.some(userId => authorIds.includes(userId));
  })();


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
    // Skip normalization for optimistic posts that are already properly formatted
    if (rawPost.isOptimistic && rawPost.images && Array.isArray(rawPost.images) && 
        rawPost.images.length > 0 && rawPost.images[0].url) {
      return rawPost; // Return as-is since it's already properly formatted
    }
    
    // CRITICAL: Handle reactions normalization properly
    let normalizedReactions = {};
    
    // Backend only provides aggregate reaction counts, no user-specific data
    // We'll rely on local PostContext state for user reaction tracking
    
    // Handle reaction_counts format (most common from backend)
    if (rawPost.reaction_counts && typeof rawPost.reaction_counts === 'object') {
      Object.entries(rawPost.reaction_counts).forEach(([reactionType, count]) => {
        if (count > 0) {
          normalizedReactions[reactionType] = { count, users: [] };
        }
      });
    }
    // Handle reactions object format 
    else if (rawPost.reactions && typeof rawPost.reactions === 'object' && !Array.isArray(rawPost.reactions)) {
      Object.entries(rawPost.reactions).forEach(([reactionType, reactionData]) => {
        if (reactionData.count > 0) {
          normalizedReactions[reactionType] = {
            count: reactionData.count,
            users: reactionData.users || []
          };
        }
      });
    }
    // Handle old reactions array format
    else if (Array.isArray(rawPost.reactions)) {
      normalizedReactions = {};
      rawPost.reactions.forEach((reaction) => {
        const type = reaction.reaction_type || reaction.type;
        const userId = String(reaction.user_id || reaction.userId || reaction.employee_id);
        
        if (!normalizedReactions[type]) {
          normalizedReactions[type] = { users: [], count: 0 };
        }
        if (!normalizedReactions[type].users.includes(userId)) {
          normalizedReactions[type].users.push(userId);
          normalizedReactions[type].count++;
        }
      });
    } 
    // Already in correct format or no reactions
    else {
      normalizedReactions = rawPost.reactions || {};
    }
    
    const normalized = {
      ...rawPost,
      // Preserve the complete author object while ensuring fallbacks for display fields
      author: rawPost.author ? {
        ...rawPost.author,
        // Ensure display fields have fallbacks but keep all original data
        username: rawPost.author.username || rawPost.author.name,
        name: rawPost.author.name || rawPost.author.username,
        // Keep is_blocked status as-is from the backend
        is_blocked: rawPost.author.is_blocked
      } : null,
      // Use backend author data if available, otherwise fall back to current user data
      authorName: rawPost.author?.username || 
                  rawPost.author?.name || 
                  rawPost.author?.employee_name || 
                  rawPost.authorName || 
                  rawPost.author_name || 
                  rawPost.username || 
                  (isCurrentUserPost ? (user?.name || user?.username) : (user?.is_admin ? 'Admin' : 'Employee User')),
      authorAvatar: rawPost.author?.avatar || rawPost.authorAvatar || rawPost.author_avatar || rawPost.avatar || 
                    (isCurrentUserPost ? user?.profile_picture_link : FALLBACK_AVATAR_URL),
      authorPosition: rawPost.author?.position || 
                      rawPost.author?.job_title || 
                      rawPost.authorPosition || 
                      rawPost.author_position || 
                      rawPost.position || 
                      (isCurrentUserPost ? (user?.position || user?.job_title || 'Employee') : (user?.position || user?.job_title || 'Employee')),
      authorEmail: rawPost.author?.email || rawPost.authorEmail || rawPost.author_email,
      // Ensure consistent timestamp field - backend uses created_at
      timestamp: rawPost.timestamp || rawPost.created_at || rawPost.createdAt || new Date().toISOString(),
      // Ensure consistent ID field - backend uses post_id as primary field
      id: rawPost.post_id || rawPost.id || `post-${Date.now()}`,
      post_id: rawPost.post_id || rawPost.id, // Keep original post_id for backend operations
      // Ensure other fields have fallbacks
      content: rawPost.content || rawPost.post_content || '',
      tags: rawPost.tags || [],
      // Handle media array - split into different types
      images: (() => {
        const images = (rawPost.images || []).filter(Boolean); // Filter out null/undefined elements
        
        // If images array already exists and has data, don't process media array to avoid duplicates
        // This happens when PostContext has already normalized the media array
        if (images.length > 0) {
          return images;
        }
        
        const mediaImages = (rawPost.media || []).filter(item => {
          if (!item || !item.link) return false;
          
          // Parse JSON-encoded links from backend or handle simple URLs
          let actualUrl = item.link;
          if (typeof item.link === 'string') {
            if (item.link.startsWith("{'link'") || item.link.startsWith('{"link"')) {
              // Old format - JSON string
              try {
                const fixedJson = item.link.replace(/'/g, '"');
                const parsed = JSON.parse(fixedJson);
                actualUrl = parsed.link;
              } catch (e) {
                return false;
              }
            } else {
              // New format - simple URL string
              actualUrl = item.link;
            }
          }
          
          // Decode URL to handle encoded characters like %20
          const decodedUrl = decodeURIComponent(actualUrl);
          // More robust image detection - handle URLs with query parameters and spaces
          const urlWithoutQuery = decodedUrl.split('?')[0].split('#')[0];
          // Normalize spaces and special characters for extension matching
          const normalizedUrl = urlWithoutQuery.toLowerCase().trim();
          const isImageByExtension = normalizedUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i);
          const isImageByType = item.type === 'image';
          const isImageByMimeType = item.mime_type && item.mime_type.startsWith('image/');
          
          // Additional check: if the URL contains image-related patterns
          const hasImagePattern = normalizedUrl.includes('image') || 
                                 normalizedUrl.includes('photo') || 
                                 normalizedUrl.includes('pic');
          
          // If no explicit type is set but URL looks like an image, assume it's an image
          const likelyImage = !item.type && (isImageByExtension || hasImagePattern);
          
          
          return isImageByExtension || isImageByType || isImageByMimeType || likelyImage;
        }).map(item => {
          let actualUrl = item.link;
          if (typeof item.link === 'string') {
            if (item.link.startsWith("{'link'") || item.link.startsWith('{"link"')) {
              // Old format - JSON string
              try {
                const fixedJson = item.link.replace(/'/g, '"');
                const parsed = JSON.parse(fixedJson);
                actualUrl = parsed.link;
              } catch (e) {
                actualUrl = item.link;
              }
            } else {
              // New format - simple URL string
              actualUrl = item.link;
            }
          }
          
          return { 
            url: actualUrl, 
            name: item.name || 'Image',
            id: item.id,
            type: item.type || 'image'
          };
        }).filter(img => img && img.url); // Filter out any items without valid URLs
        
        // Combine images and media images, removing duplicates by URL
        const allImages = [...images, ...mediaImages];
        const uniqueImages = allImages.filter((image, index, self) => 
          image && image.url && index === self.findIndex(img => img && img.url === image.url)
        );
        
        return uniqueImages;
      })(),
      videos: (() => {
        const videos = (rawPost.videos || []).filter(Boolean); // Filter out null/undefined elements
        
        // If videos array already exists and has data, don't process media array to avoid duplicates
        if (videos.length > 0) {
          return videos;
        }
        
        const mediaVideos = (rawPost.media || []).filter(item => {
          if (!item || !item.link) return false;
          
          // Parse JSON-encoded links from backend
          let actualUrl = item.link;
          if (typeof item.link === 'string' && item.link.startsWith("{'link'")) {
            try {
              const fixedJson = item.link.replace(/'/g, '"');
              const parsed = JSON.parse(fixedJson);
              actualUrl = parsed.link;
            } catch (e) {
              return false;
            }
          }
          
          const decodedUrl = decodeURIComponent(actualUrl);
          const isVideoByExtension = decodedUrl.match(/\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i);
          const isVideoByType = item.type === 'video';
          const isVideoByMimeType = item.mime_type && item.mime_type.startsWith('video/');
          return isVideoByExtension || isVideoByType || isVideoByMimeType;
        }).map(item => {
          let actualUrl = item.link;
          if (typeof item.link === 'string' && item.link.startsWith("{'link'")) {
            try {
              const fixedJson = item.link.replace(/'/g, '"');
              const parsed = JSON.parse(fixedJson);
              actualUrl = parsed.link;
            } catch (e) {
              actualUrl = item.link;
            }
          }
          
          return { 
            url: actualUrl, 
            name: item.name || 'Video',
            id: item.id,
            type: item.type || 'video',
            thumbnail: item.thumbnail
          };
        }).filter(vid => vid && vid.url); // Filter out any items without valid URLs
        
        // Combine videos and media videos, removing duplicates by URL
        const allVideos = [...videos, ...mediaVideos];
        const uniqueVideos = allVideos.filter((video, index, self) => 
          video && video.url && index === self.findIndex(vid => vid && vid.url === video.url)
        );
        
        return uniqueVideos;
      })(),
      documents: (() => {
        const documents = (rawPost.documents || []).filter(Boolean); // Filter out null/undefined elements
        
        // If documents array already exists and has data, don't process media array to avoid duplicates
        if (documents.length > 0) {
          return documents;
        }
        
        const mediaDocuments = (rawPost.media || []).filter(item => {
          if (!item || !item.link) return false;
          
          // Parse JSON-encoded links from backend
          let actualUrl = item.link;
          if (typeof item.link === 'string' && item.link.startsWith("{'link'")) {
            try {
              const fixedJson = item.link.replace(/'/g, '"');
              const parsed = JSON.parse(fixedJson);
              actualUrl = parsed.link;
            } catch (e) {
              return false;
            }
          }
          
          const decodedUrl = decodeURIComponent(actualUrl);
          const isDocumentByExtension = decodedUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/i);
          const isDocumentByType = item.type === 'document';
          const isDocumentByMimeType = item.mime_type && (
            item.mime_type.includes('pdf') || 
            item.mime_type.includes('document') || 
            item.mime_type.includes('spreadsheet') ||
            item.mime_type.includes('presentation')
          );
          return isDocumentByExtension || isDocumentByType || isDocumentByMimeType;
        }).map(item => {
          let actualUrl = item.link;
          if (typeof item.link === 'string' && item.link.startsWith("{'link'")) {
            try {
              const fixedJson = item.link.replace(/'/g, '"');
              const parsed = JSON.parse(fixedJson);
              actualUrl = parsed.link;
            } catch (e) {
              actualUrl = item.link;
            }
          }
          
          return { 
            url: actualUrl, 
            name: item.name || 'Document',
            id: item.id,
            type: item.type || 'document',
            isPDF: actualUrl.toLowerCase().includes('.pdf'),
            size: item.size
          };
        }).filter(doc => doc && doc.url); // Filter out any items without valid URLs
        
        // Combine documents and media documents, removing duplicates by URL
        const allDocuments = [...documents, ...mediaDocuments];
        const uniqueDocuments = allDocuments.filter((doc, index, self) => 
          doc && doc.url && index === self.findIndex(d => d && d.url === doc.url)
        );
        
        return uniqueDocuments;
      })(),
      links: (() => {
        const links = (rawPost.links || []).filter(Boolean); // Filter out null/undefined elements
        const mediaLinks = (rawPost.media || []).filter(item => {
          if (!item || !item.link) return false;
          
          // Parse JSON-encoded links from backend
          let actualUrl = item.link;
          if (typeof item.link === 'string' && item.link.startsWith("{'link'")) {
            try {
              const fixedJson = item.link.replace(/'/g, '"');
              const parsed = JSON.parse(fixedJson);
              actualUrl = parsed.link;
            } catch (e) {
              return false;
            }
          }
          
          const decodedUrl = decodeURIComponent(actualUrl);
          // Only include as links if they're NOT images, videos, or documents
          const isImage = decodedUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) || item.type === 'image' || (item.mime_type && item.mime_type.startsWith('image/'));
          const isVideo = decodedUrl.match(/\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i) || item.type === 'video' || (item.mime_type && item.mime_type.startsWith('video/'));
          const isDocument = decodedUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/i) || item.type === 'document' || (item.mime_type && (item.mime_type.includes('pdf') || item.mime_type.includes('document')));
          return !isImage && !isVideo && !isDocument;
        }).map(item => {
          let actualUrl = item.link;
          if (typeof item.link === 'string' && item.link.startsWith("{'link'")) {
            try {
              const fixedJson = item.link.replace(/'/g, '"');
              const parsed = JSON.parse(fixedJson);
              actualUrl = parsed.link;
            } catch (e) {
              actualUrl = item.link;
            }
          }
          
          return { 
            url: actualUrl, 
            name: item.name || 'Link',
            id: item.id,
            type: item.type || 'link',
            title: item.title,
            description: item.description
          };
        }).filter(link => link && link.url); // Filter out any items without valid URLs
        
        // Combine links and media links, removing duplicates by URL
        const allLinks = [...links, ...mediaLinks];
        const uniqueLinks = allLinks.filter((link, index, self) => 
          link && link.url && index === self.findIndex(l => l && l.url === link.url)
        );
        
        return uniqueLinks;
      })(),
      mentions: rawPost.mentions || [],
      // Use comments as-is since PostContext already normalizes them
      comments: rawPost.comments || [],
      reactions: normalizedReactions,
      likes: rawPost.likes || [],
      // Backend doesn't provide user_reaction field, rely on local state
      user_reaction: null
    };
    
    return normalized;
  };

  const normalizedPost = normalizePost(post);

  // Clear any cached state to fix currentUserReaction error
  // Helper function to get the correct post ID
  const getPostId = () => {
    const postId = normalizedPost.post_id || normalizedPost.id || post.post_id || post.id;
    return postId;
  };

  // Check if user has liked the post
  const checkIsLiked = () => {
    const postId = getPostId();
    
    // First check if backend provides user_reaction field (most reliable after refresh)
    const hasUserReactionFromBackend = normalizedPost.user_reaction !== null && normalizedPost.user_reaction !== undefined;
    
    // Check local user reaction tracking (most reliable for current session)
    const hasReactedLocally = hasUserReacted ? hasUserReacted(postId, 'love') : false;
    
    // Check if user has ANY type of reaction locally (including emoji reactions)
    const hasAnyReactionLocally = hasUserReacted ? 
      ['love', 'like', 'thumbs_up', 'happy', 'laugh', 'wow', 'sad', 'angry', 'celebrate'].some(reaction => 
        hasUserReacted(postId, reaction)) : false;
    
    // Then check various fallback methods - check both 'love' and 'like' for backward compatibility
    const isInLikesArray = normalizedPost.likes?.includes(user?.id) || 
                          normalizedPost.likes?.includes(user?.user_id) ||
                          normalizedPost.likes?.includes(user?.employee_id);
                          
    const isInLoveReactionUsers = normalizedPost.reactions?.love?.users?.includes(user?.id) ||
                                 normalizedPost.reactions?.love?.users?.includes(user?.user_id) ||
                                 normalizedPost.reactions?.love?.users?.includes(user?.employee_id);
                                 
    const isInLikeReactionUsers = normalizedPost.reactions?.like?.users?.includes(user?.id) ||
                                 normalizedPost.reactions?.like?.users?.includes(user?.user_id) ||
                                 normalizedPost.reactions?.like?.users?.includes(user?.employee_id);
    
    // Check if user has any reaction type in the reactions users arrays
    let hasAnyUserReaction = false;
    if (normalizedPost.reactions) {
      for (const [reactionType, reaction] of Object.entries(normalizedPost.reactions)) {
        const isInReactionUsers = reaction.users?.includes(user?.id) || 
                                 reaction.users?.includes(user?.user_id) ||
                                 reaction.users?.includes(user?.employee_id);
        
        if (isInReactionUsers) {
          hasAnyUserReaction = true;
          break;
        }
      }
    }
    
    // FALLBACK: If post has any reactions and we can't determine user's state, show filled heart
    // This gives better UX than empty heart when reactions exist
    const postHasReactions = normalizedPost.reactions && 
      Object.values(normalizedPost.reactions).some(reaction => reaction.count > 0);
    
    const liked = hasUserReactionFromBackend ||
                 hasReactedLocally || 
                 hasAnyReactionLocally ||
                 isInLikesArray || 
                 isInLoveReactionUsers ||
                 isInLikeReactionUsers ||
                 hasAnyUserReaction ||
                 postHasReactions; // Show filled if post has any reactions
    
    return liked;
  };

  // Check if user has any reaction (for heart icon state)
  const checkHasAnyReaction = () => {
    const postId = getPostId();
    
    if (!normalizedPost.reactions || !user) return false;
    
    // Check each reaction type to see if user has reacted
    for (const [reactionType, reaction] of Object.entries(normalizedPost.reactions)) {
      // Check local tracking first
      if (hasUserReacted && hasUserReacted(postId, reactionType)) {
        return true;
      }
      
      // Check reaction users array
      if (reaction.users && (
        reaction.users.includes(user.id) || 
        reaction.users.includes(user.user_id) ||
        reaction.users.includes(user.employee_id)
      )) {
        return true;
      }
    }
    
    return false;
  };

  const isLiked = checkIsLiked();
  const hasAnyReaction = checkHasAnyReaction();
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
    
    // For love reactions, we can use the checkIsLiked function
    const checkIsLikedForLove = () => {
      return checkIsLiked() ? 'love' : null;
    };
    
    addReaction(postId, 'love', '❤️', activeView, checkIsLikedForLove);
  };

  const handleComment = () => {
    const postId = getPostId();
    
    if (commentText.trim() && postId) {
      const commentData = { 
        content: commentText.trim(),
        mentions: commentMentions
      };
      addComment(postId, commentData);
      setCommentText('');
      setCommentMentions([]);
    }
  };

  const handleDelete = () => {
    deletePost(normalizedPost.post_id || normalizedPost.id);
    setShowConfirmDelete(false);
  };

  const handleCommentLike = (commentId) => {
    // Find the comment to create a reaction detection function
    const findComment = (comments) => {
      for (const comment of comments || []) {
        if (comment.id === commentId || comment.comment_id === commentId) {
          return comment;
        }
        // Check replies
        if (comment.replies) {
          for (const reply of comment.replies) {
            if (reply.id === commentId || reply.comment_id === commentId) {
              return reply;
            }
          }
        }
      }
      return null;
    };
    
    const targetComment = findComment(normalizedPost.comments);
    const getCommentLikeReaction = () => {
      if (!targetComment) return null;
      const userReaction = getCommentUserReaction(targetComment);
      return userReaction === 'like' ? 'like' : null;
    };
    
    addCommentReaction(commentId, 'love', '❤️', getCommentLikeReaction);
  };

  const handleCommentReaction = (commentId, reactionType, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Find the comment to create a reaction detection function
    const findComment = (comments) => {
      for (const comment of comments || []) {
        if (comment.id === commentId || comment.comment_id === commentId) {
          return comment;
        }
        // Check replies
        if (comment.replies) {
          for (const reply of comment.replies) {
            if (reply.id === commentId || reply.comment_id === commentId) {
              return reply;
            }
          }
        }
      }
      return null;
    };
    
    const targetComment = findComment(normalizedPost.comments);
    const getSpecificCommentReaction = () => {
      if (!targetComment) return null;
      const userReaction = getCommentUserReaction(targetComment);
      return userReaction === reactionType ? reactionType : null;
    };
    
    addCommentReaction(commentId, reactionType, null, getSpecificCommentReaction);
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

  const handleEditComment = (commentId, contentOrData) => {
    // Handle both string content and object data
    if (typeof contentOrData === 'string') {
      // Legacy: just content string
      if (contentOrData.trim()) {
        editComment(commentId, contentOrData.trim());
      }
    } else if (typeof contentOrData === 'object' && contentOrData.content) {
      // New: object with content and mentions
      if (contentOrData.content.trim()) {
        editComment(commentId, contentOrData);
      }
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
    // Get the current application URL dynamically
    const baseUrl = window.location.origin;
    const postId = normalizedPost.post_id || normalizedPost.id;
    
    // Create a user-friendly share URL that goes to the main application
    const shareUrl = `${baseUrl}/post/${postId}`;
    
    // Try native sharing first (mobile browsers)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      navigator.share({
        url: shareUrl,
      }).then(() => {
        setShareCount(prev => prev + 1);
      }).catch(err => {
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard copy for desktop
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url) => {
    // Check if clipboard API is available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setShareCount(prev => prev + 1);
        setShowShareAlert(true);
        setTimeout(() => setShowShareAlert(false), 3000);
      }).catch(() => {
        // Fallback if clipboard API fails
        fallbackCopyTextToClipboard(url);
      });
    } else {
      // Use fallback for older browsers or non-secure contexts
      fallbackCopyTextToClipboard(url);
    }
  };

  const fallbackCopyTextToClipboard = (url) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setShareCount(prev => prev + 1);
      }
      setShowShareAlert(true);
      setTimeout(() => setShowShareAlert(false), 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Still show the alert to indicate the action was attempted
      setShowShareAlert(true);
      setTimeout(() => setShowShareAlert(false), 3000);
    }
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
    addReaction(postId, reactionType, emoji, activeView, getUserReaction);
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
    // First check if backend provides user_reaction field (most reliable after refresh)
    if (normalizedPost.user_reaction !== null && normalizedPost.user_reaction !== undefined) {
      return normalizedPost.user_reaction;
    }
    
    const postId = getPostId();
    
    // Check local state first (most reliable during active session)
    if (hasUserReacted) {
      const reactionTypes = ['love', 'like', 'thumbs_up', 'happy', 'laugh', 'wow', 'sad', 'angry', 'celebrate'];
      for (const reactionType of reactionTypes) {
        if (hasUserReacted(postId, reactionType)) {
          return reactionType;
        }
      }
    }
    
    // Fallback to checking reactions object
    if (!normalizedPost.reactions) return null;
    
    for (const [reactionType, reaction] of Object.entries(normalizedPost.reactions)) {
      const isInReactionUsers = reaction.users?.includes(user?.id) || 
                               reaction.users?.includes(user?.user_id) ||
                               reaction.users?.includes(user?.employee_id);
      
      if (isInReactionUsers) {
        return reactionType;
      }
    }
    return null;
  };

  const getCommentUserReaction = (comment) => {
    if (!comment.reactions) {
     return null;
    }
    
    if (Object.keys(comment.reactions).length === 0) {
      return null;
    }
    
    // Get current user IDs to check against
    const currentUserIds = [user?.id, user?.user_id, user?.userId, user?.employee_id].filter(Boolean);
    const commentId = comment.comment_id || comment.id;
    
    for (const [reactionType, reaction] of Object.entries(comment.reactions)) {
      // Check local state first
      const hasReactedLocally = hasUserReactedToComment ? hasUserReactedToComment(commentId, reactionType) : false;
      
      // Handle different reaction data formats
      let hasReaction = false;
      
      if (Array.isArray(reaction)) {
        // Format: [{ user_id: 123 }, { user_id: 456 }] (from optimistic updates)
        hasReaction = reaction.some(r => 
          currentUserIds.includes(r.user_id) || 
          currentUserIds.includes(r.id)
        );
      } else if (reaction.users && Array.isArray(reaction.users)) {
        // Format: { users: [123, 456], count: 2 } (from API)
        hasReaction = reaction.users.some(userId => {
          const match = currentUserIds.includes(userId);
                   return match;
        });
      } else if (reaction.count > 0) {
        // For reaction_counts format, we cannot reliably determine if user has it
        // without explicit user data, so skip this assumption
        hasReaction = false;
      }
      
      const userHasReaction = hasReactedLocally || hasReaction;
      
      if (userHasReaction) {
        return reactionType;
      }
    }
    
    return null;
  };

  const getTotalLikes = () => {
    const likesArrayCount = normalizedPost.likes?.length || 0;
    const likeReactionCount = normalizedPost.reactions?.like?.count || 0;
    const loveReactionCount = normalizedPost.reactions?.love?.count || 0;
    
    // Use the highest count between like and love reactions, or fall back to likes array
    const reactionCount = Math.max(likeReactionCount, loveReactionCount);
    if (reactionCount > 0) {
      return reactionCount;
    }
    return likesArrayCount;
  };

  const getTotalReactions = () => {
    if (!normalizedPost.reactions) return 0;
    return Object.entries(normalizedPost.reactions)
      .filter(([reactionType]) => reactionType !== 'like' && reactionType !== 'love')
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

  // Get all reactions including likes for unified display
  const getAllReactions = () => {
    if (!normalizedPost.reactions) return [];
    
    return Object.entries(normalizedPost.reactions)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3)
      .map(([type, reaction]) => ({
        type,
        emoji: (type === 'like' || type === 'love') ? '❤️' : (emojiReactions.find(r => r.name === type)?.emoji || '👍'),
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

  // Handle mentions change
  const handleCommentMentionsChange = (mentions) => {
    setCommentMentions(mentions);
  };

  return {
    // State
    normalizedPost,
    showComments,
    setShowComments,
    commentText,
    setCommentText,
    commentMentions,
    handleCommentMentionsChange,
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
    showShareAlert,
    setShowShareAlert,

    // Computed values
    isLiked,
    hasAnyReaction,
    isAuthor,
    isBlocked: user?.is_blocked === true || user?.is_blocked === "true",
    isAdmin: user?.is_admin === true || user?.is_admin === "true",
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
    getAllReactions,
    getCommentTopReactions,
    getCommentTotalReactions,
    getTotalComments,
    hasUserReacted
  };
};
