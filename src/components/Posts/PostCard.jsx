import React, { useState } from 'react';
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

const PostCard = ({ post, showAuthorInfo = true, isPublicView = false }) => {
  const { user } = useAuth();
  
  // Check if this post belongs to the current user (moved outside normalizePost for component-level access)
  const isCurrentUserPost = post.author?.user_id === user?.user_id || 
                            post.author_id === user?.user_id || 
                            post.author_id === user?.id ||
                            post.user_id === user?.user_id ||
                            post.user_id === user?.id;
  
  // Normalize post data to handle different field names from backend
  const normalizePost = (rawPost) => {
    console.log('🔍 Checking if current user post:', {
      'rawPost.author?.user_id': rawPost.author?.user_id,
      'rawPost.author?.username': rawPost.author?.username,
      'rawPost.author_id': rawPost.author_id,
      'rawPost.user_id': rawPost.user_id, 
      'user?.user_id': user?.user_id,
      'user?.id': user?.id,
      'user?.name': user?.name,
      'isCurrentUserPost': isCurrentUserPost,
      'backend_has_author': !!rawPost.author
    });
    
    // Temporary debug alert to see user data
    if (!user) {
      console.log('❌ No user found in PostCard!');
    } else {
      console.log('✅ User found in PostCard:', user);
    }
    
    return {
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
      // Ensure consistent ID field - backend uses post_id
      id: rawPost.id || rawPost.post_id || `post-${Date.now()}`,
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
      reactions: rawPost.reactions || rawPost.reaction_counts || {},
      likes: rawPost.likes || []
    };
  };

  const normalizedPost = normalizePost(post);
  
  console.log('🔍 PostCard - Original post:', post);
  console.log('🔍 PostCard - Normalized post:', normalizedPost);
  console.log('🔍 Current user:', user);
  const { likePost, deletePost, addComment, likeComment, deleteComment, addReply, deleteReply, addReaction } = usePost();
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
  const [showCommentReactions, setShowCommentReactions] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [shareCount, setShareCount] = useState(0);

  const isLiked = normalizedPost.likes?.includes(user?.id);
  const isAuthor = isCurrentUserPost;

  // Available emoji reactions
  const emojiReactions = [
    { emoji: '👍', name: 'like', label: 'Like' },
    { emoji: '❤️', name: 'love', label: 'Love' },
    { emoji: '😊', name: 'happy', label: 'Happy' },
    { emoji: '😂', name: 'laugh', label: 'Laugh' },
    { emoji: '😮', name: 'wow', label: 'Wow' },
    { emoji: '😢', name: 'sad', label: 'Sad' },
    { emoji: '😡', name: 'angry', label: 'Angry' },
    { emoji: '🎉', name: 'celebrate', label: 'Celebrate' }
  ];

  const handleLike = () => {
    if (isPublicView || !user) return;
    // If user has an emoji reaction, remove it first
    if (getUserReaction()) {
      addReaction(post.id, getUserReaction()); // This will remove the existing reaction
    }
    likePost(post.id);
  };

  const handleComment = () => {
    if (isPublicView || !user) return;
    if (commentText.trim()) {
      addComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleDelete = () => {
    console.log('🔍 Deleting post:', normalizedPost);
    console.log('🔍 Post ID for deletion:', normalizedPost.id);
    console.log('🔍 Post post_id for deletion:', normalizedPost.post_id);
    
    // Use post_id for backend operations
    deletePost(normalizedPost.post_id || normalizedPost.id);
    setShowConfirmDelete(false);
  };

  const handleCommentLike = (commentId) => {
    if (isPublicView || !user) return;
    likeComment(post.id, commentId);
  };

  const handleCommentReaction = (commentId, reactionType) => {
    if (isPublicView || !user) return;
    // This would need to be implemented in PostContext
    console.log('Comment reaction:', commentId, reactionType);
    setShowCommentReactions(prev => ({ ...prev, [commentId]: false }));
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
    
    for (const [reactionType, reaction] of Object.entries(comment.reactions)) {
      if (reaction.users?.includes(user?.id)) {
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

  const handleReaction = (reactionType) => {
    if (isPublicView || !user) return;
    // If user has liked the post traditionally, remove the like first
    if (isLiked) {
      likePost(post.id); // This will remove the traditional like
    }
    addReaction(post.id, reactionType);
    setShowReactions(false);
  };

  const getUserReaction = () => {
    if (!normalizedPost.reactions) return null;
    
    for (const [reactionType, reaction] of Object.entries(normalizedPost.reactions)) {
      if (reaction.users?.includes(user?.id)) {
        return reactionType;
      }
    }
    return null;
  };

  const getTotalReactions = () => {
    if (!normalizedPost.reactions) return 0;
    return Object.values(normalizedPost.reactions).reduce((total, reaction) => total + reaction.count, 0);
  };

  const getTopReactions = () => {
    if (!normalizedPost.reactions) return [];
    
    return Object.entries(normalizedPost.reactions)
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
            {normalizedPost.images.map((image) => (
              <div key={image.id} className="relative group">
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
            {normalizedPost.videos.map((video) => (
              <VideoPlayer
                key={video.id}
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
            {normalizedPost.documents.map((doc) => (
              <div key={doc.id}>
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
            {normalizedPost.links.map((link) => (
              <div key={link.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                      console.log('🔍 Opening edit modal for post:', normalizedPost);
                      console.log('🔍 Post ID for editing:', normalizedPost.id);
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
                key={tagKey}
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
          {normalizedPost.mentions.map((mention) => (
            <span
              key={mention.id}
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
        {getTotalReactions() > 0 && (
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center space-x-4">
              {/* Emoji Reactions */}
              <div className="flex items-center space-x-1">
                {getTopReactions().map((reaction, index) => (
                  <div key={reaction.type} className="flex items-center">
                    <span className="text-lg">{reaction.emoji}</span>
                    {index === getTopReactions().length - 1 && (
                      <span className="ml-1 text-gray-600">{getTotalReactions()}</span>
                    )}
                  </div>
                ))}
              </div>
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
            {/* Traditional Like Button */}
            <button
              onClick={handleLike}
              disabled={isPublicView}
              title={isPublicView ? "Login to like posts" : "Like this post"}
              className={`flex items-center space-x-2 text-sm ${
                isLiked && !getUserReaction()
                  ? 'text-red-600'
                  : isPublicView 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-500 hover:text-red-600'
              } transition-colors`}
            >
              <Heart className={`h-5 w-5 ${isLiked && !getUserReaction() ? 'fill-current' : ''}`} />
              <span>Like</span>
              {normalizedPost.likes?.length > 0 && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {normalizedPost.likes.length}
                </span>
              )}
            </button>

            {/* Emoji Reactions Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => !isPublicView && setShowReactions(!showReactions)}
                onMouseEnter={() => !isPublicView && setShowReactions(true)}
                disabled={isPublicView}
                title={isPublicView ? "Login to react to posts" : "React to this post"}
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  getUserReaction()
                    ? 'text-purple-600'
                    : isPublicView
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-purple-600'
                }`}
              >
                {getUserReaction() ? (
                  <span className="text-lg">
                    {emojiReactions.find(r => r.name === getUserReaction())?.emoji || '�'}
                  </span>
                ) : (
                  <span className="text-lg">😊</span>
                )}
                <span>React</span>
              </button>

              {/* Reactions Dropdown */}
              {showReactions && !isPublicView && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-2 flex items-center space-x-1 z-20"
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {emojiReactions.map((reaction) => (
                    <button
                      key={reaction.name}
                      onClick={() => handleReaction(reaction.name)}
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
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Login prompt for public users */}
          {isPublicView && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 text-center">
              <p className="text-purple-800 mb-2">Join the conversation!</p>
              <p className="text-sm text-purple-600 mb-3">Login to comment, like, and interact with posts.</p>
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{ backgroundColor: '#9f7aea' }}
              >
                Login to Comment
              </a>
            </div>
          )}
          
          {/* Add Comment - only show for logged in users */}
          {!isPublicView && (
            <div className="flex space-x-3 mb-4">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2 text-sm"
                    style={{ 
                      '--tw-ring-color': '#9f7aea',
                      'borderColor': 'var(--focus-border, #d1d5db)'
                    }}
                    onFocus={(e) => e.target.style.setProperty('--focus-border', '#9f7aea')}
                    onBlur={(e) => e.target.style.setProperty('--focus-border', '#d1d5db')}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-opacity"
                    style={{ backgroundColor: '#9f7aea' }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {normalizedPost.comments?.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
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
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>

                  {/* Comment Reactions Display */}
                  {getCommentTotalReactions(comment) > 0 && (
                    <div className="flex items-center space-x-2 mt-1 mb-2">
                      <div className="flex items-center space-x-1">
                        {getCommentTopReactions(comment).map((reaction, index) => (
                          <div key={reaction.type} className="flex items-center">
                            <span className="text-sm">{reaction.emoji}</span>
                            {index === getCommentTopReactions(comment).length - 1 && (
                              <span className="ml-1 text-xs text-gray-600">{getCommentTotalReactions(comment)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4 mt-2">
                    {/* Like Button */}
                    <button
                      onClick={() => handleCommentLike(comment.id)}
                      disabled={isPublicView}
                      title={isPublicView ? "Login to like comments" : "Like this comment"}
                      className={`text-xs ${
                        comment.likes?.includes(user?.id)
                          ? 'text-red-600'
                          : isPublicView
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-500 hover:text-red-600'
                      } transition-colors flex items-center space-x-1`}
                    >
                      <Heart className={`h-3 w-3 ${
                        comment.likes?.includes(user?.id) ? 'fill-current' : ''
                      }`} />
                      <span>Like</span>
                      {comment.likes?.length > 0 && (
                        <span className="bg-gray-200 px-1 rounded text-xs">
                          {comment.likes.length}
                        </span>
                      )}
                    </button>

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

                    {/* React Button */}
                    <div className="relative">
                      <button
                        onClick={() => !isPublicView && setShowCommentReactions(prev => ({ 
                          ...prev, 
                          [comment.id]: !prev[comment.id] 
                        }))}
                        onMouseEnter={() => !isPublicView && setShowCommentReactions(prev => ({ 
                          ...prev, 
                          [comment.id]: true 
                        }))}
                        disabled={isPublicView}
                        title={isPublicView ? "Login to react to comments" : "React to this comment"}
                        className={`text-xs transition-colors flex items-center space-x-1 ${
                          getCommentUserReaction(comment)
                            ? 'text-purple-600'
                            : isPublicView
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-500 hover:text-purple-600'
                        }`}
                      >
                        {getCommentUserReaction(comment) ? (
                          <span className="text-sm">
                            {emojiReactions.find(r => r.name === getCommentUserReaction(comment))?.emoji || '😊'}
                          </span>
                        ) : (
                          <span className="text-sm">😊</span>
                        )}
                        <span>React</span>
                      </button>

                      {/* Comment Reactions Dropdown */}
                      {showCommentReactions[comment.id] && !isPublicView && (
                        <div 
                          className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 flex items-center space-x-1 z-20"
                          onMouseLeave={() => setShowCommentReactions(prev => ({ 
                            ...prev, 
                            [comment.id]: false 
                          }))}
                        >
                          {emojiReactions.map((reaction) => (
                            <button
                              key={reaction.name}
                              onClick={() => handleCommentReaction(comment.id, reaction.name)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors transform hover:scale-110"
                              title={reaction.label}
                            >
                              <span className="text-sm">{reaction.emoji}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-2">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                  console.log('Reporting post:', { postId: post.id, reason: reportReason, description: reportDescription });
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
