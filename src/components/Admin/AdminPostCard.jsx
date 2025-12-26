import React, { useState, useMemo } from 'react';
import { ExternalLink, Image, Pin, MessageSquareOff, UserX, UserCheck, Trash2, MoreHorizontal } from 'lucide-react';
import { usePostCard } from '../../hooks/usePostCard';
import CreatePost from '../Posts/CreatePost';
import VideoPlayer from '../Media/VideoPlayer';
import PDFPreview from '../Media/PDFPreview';
import DocumentViewer from '../Media/DocumentViewer';
import ImageViewer from '../Media/ImageViewer';
import PostHeader from '../Posts/PostHeader';
import PostTags from '../Posts/PostTags';
import PostContent from '../Posts/PostContent';
import PostMentions from '../Posts/PostMentions';
import PostStats from '../Posts/PostStats';
import PostActions from '../Posts/PostActions';
import CommentsSection from '../Posts/CommentsSection';
import PostModals from '../Posts/PostModals';

const AdminPostCard = ({ 
  post, 
  onTogglePin, 
  onToggleComments, 
  onDeleteComment, 
  onDeleteReply,
  onBlockUser, 
  onDeletePost, 
  onReaction, 
  onAddComment, 
  onSharePost, 
  isPinned 
}) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const {
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
    isBlocked,
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
  } = usePostCard(post, 'admin');

  // Memoize block status to ensure re-renders when it changes
  const isUserBlocked = useMemo(() => {
    const blocked = normalizedPost.author?.is_blocked === true || normalizedPost.author?.is_blocked === "true";
  
  
    return blocked;
  }, [normalizedPost.author?.is_blocked, normalizedPost.author?.user_id]);

  // Override handlers with admin-specific ones
  const adminHandleLike = () => {
    // Admins cannot react to posts

    return;
  };

  const adminHandleReaction = (reactionType) => {
    // Admins cannot react to posts
 
    return;
  };

  const adminHandleComment = (commentText) => {
    if (onAddComment) {
      onAddComment(normalizedPost.post_id, commentText);
    } else {
      handleComment(commentText);
    }
  };

  const adminHandleShare = () => {
    if (onSharePost) {
      onSharePost(normalizedPost.post_id);
    } else {
      handleShare();
    }
  };

  const adminHandleDeleteComment = (commentId) => {
    if (onDeleteComment) {
      onDeleteComment(commentId);
    } else {
      handleDeleteComment(commentId);
    }
  };

  const adminHandleDeleteReply = (postId, commentId, replyId) => {
    if (onDeleteReply) {
      onDeleteReply(postId, commentId, replyId);
    } else {
      handleDeleteReply(postId, commentId, replyId);
    }
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
                    setSelectedImageIndex(idx);
                    // Use setTimeout to ensure state update completes before opening
                    setTimeout(() => setImageViewerOpen(true), 0);
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
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                    <div className="h-80">
                      <PDFPreview url={doc.url} />
                    </div>
                  </div>
                ) : (
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

        {/* Links - Additional feature for Admin view */}
        {normalizedPost.links?.length > 0 && (
          <div className="space-y-2">
            {normalizedPost.links.map((link, idx) => {
              let url = link.url || link.link;
              let title = link.title;
              let description = link.description;

              if (typeof url === 'string' && url.trim().startsWith("{'link'")) {
                try {
                  const fixed = url.replace(/'/g, '"');
                  const parsed = JSON.parse(fixed);
                  url = parsed.link || url;
                  if (!title) title = url;
                } catch (e) {
                  // fallback: show as-is
                }
              }
              if (!title) title = url;

              return (
                <div key={link.id || url || idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ExternalLink className="h-6 w-6 text-blue-600" />
                      <div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-900 hover:underline"
                        >
                          {title}
                        </a>
                        <p className="text-sm text-blue-600 break-all">{url}</p>
                        {description && (
                          <p className="text-sm text-gray-600 mt-1">{description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(url, '_blank')}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Custom admin header with admin actions
  const renderAdminHeader = () => {
    // Debug log to check author object structure
   
    return (
      <div className="flex items-center justify-between mb-4">
        {/* Custom header without PostHeader's menu */}
        <div className="flex items-center space-x-3">
          <img
            src={normalizedPost.authorAvatar}
            alt={normalizedPost.authorName}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{normalizedPost.authorName}</h3>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{normalizedPost.authorPosition}</span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(normalizedPost.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
        {/* Only Pin button and admin ellipse menu visible */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTogglePin(normalizedPost.post_id)}
            className={`p-2 rounded-full transition-colors ${
              isPinned || normalizedPost.is_pinned
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isPinned || normalizedPost.is_pinned ? 'Unpin post' : 'Pin post'}
          >
            <Pin className="h-4 w-4" />
          </button>
          {/* Ellipse menu for all other admin controls */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="More admin actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                <button
                  onClick={() => { onToggleComments(normalizedPost.post_id); setShowMenu(false); }}
                  className={`w-full px-4 py-2 text-sm flex flex-row-reverse items-center gap-2 font-medium justify-end ${
                    normalizedPost.is_comments_allowed === false || normalizedPost.is_comments_allowed === "false"
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <MessageSquareOff className="h-4 w-4" />
                  {normalizedPost.is_comments_allowed === false || normalizedPost.is_comments_allowed === "false" ? 'Enable comments' : 'Disable comments'}
                </button>
                {normalizedPost.author && (
                  <button
                    onClick={() => { 
                    
                      // Debug: Log all possible IDs from the author object
                      
                      
                      // Try different ID formats - use employee_id first, fallback to user_id
                      const userIdToBlock = normalizedPost.author.employee_id || normalizedPost.author.user_id;
                   
                      
                      if (!userIdToBlock) {
                        alert('Error: Cannot identify user to block');
                        return;
                      }
                      
                      onBlockUser(userIdToBlock); 
                      setShowMenu(false); 
                    }}
                    className={`w-full px-4 py-2 text-sm flex flex-row-reverse items-center gap-2 font-medium justify-end transition-colors ${
                      isUserBlocked
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isUserBlocked ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                    {isUserBlocked ? 'Unblock user' : 'Block user'}
                  </button>
                )}
                <button
                  onClick={() => { onDeletePost(normalizedPost.post_id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-sm flex flex-row-reverse items-center gap-2 font-medium justify-end text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Admin Post Indicator */}
      <div className="mb-3 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-xs text-purple-800 font-medium">
          🛡️ Admin View
        </p>
      </div>

      {/* Pinned Post Indicator */}
      {(normalizedPost.is_pinned === true || normalizedPost.is_pinned === "true" || isPinned) && (
        <div className="mb-3 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium">
            📌 Pinned Post
          </p>
        </div>
      )}
      
      {/* Admin Header */}
      {renderAdminHeader()}

      {/* Tags */}
      <PostTags tags={normalizedPost.tags} />

      {/* Post Content */}
      <PostContent content={normalizedPost.content} />

      {/* Attachments */}
      {renderAttachments()}

      {/* Mentions */}
      <PostMentions mentions={normalizedPost.mentions} />

      {/* Post Actions */}
      <div className="pt-4 border-t border-gray-100">
        {/* Reactions Display */}
        <PostStats
          totalLikes={getTotalLikes()}
          totalReactions={getTotalReactions()}
          totalComments={getTotalComments()}
          // shareCount={shareCount}
          getTopReactions={getTopReactions}
        />

        <div className="flex items-center justify-between">
          <PostActions
            isLiked={isLiked}
            isPublicView={false}
            isAdmin={true}
            isBlocked={isBlocked}
            handleLike={adminHandleLike}
            totalLikes={getTotalLikes()}
            getUserReaction={getUserReaction}
            emojiReactions={emojiReactions}
            showReactions={showReactions}
            setShowComments={setShowComments}
            showComments={showComments}
            handleShare={adminHandleShare}
            shareCount={shareCount}
            handleReactionsMouseEnter={handleReactionsMouseEnter}
            handleReactionsMouseLeave={handleReactionsMouseLeave}
            handleReaction={adminHandleReaction}
          />
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection
        showComments={showComments}
        isPublicView={false}
        isAdmin={true} // Set admin flag to true for admin panel
        commentText={commentText}
        setCommentText={setCommentText}
        handleComment={adminHandleComment}
        normalizedPost={normalizedPost}
        user={user}
        emojiReactions={emojiReactions}
        handleDeleteComment={adminHandleDeleteComment}
        handleEditComment={handleEditComment}
        handleCommentReply={handleCommentReply}
        getCommentUserReaction={getCommentUserReaction}
        getCommentTopReactions={getCommentTopReactions}
        getCommentTotalReactions={getCommentTotalReactions}
        handleCommentReactionsMouseEnter={handleCommentReactionsMouseEnter}
        handleCommentReactionsMouseLeave={handleCommentReactionsMouseLeave}
        showCommentReactions={showCommentReactions}
        handleCommentLike={handleCommentLike}
        handleCommentReaction={handleCommentReaction}
        hasUserReacted={hasUserReacted}
        setReplyingTo={setReplyingTo}
        replyingTo={replyingTo}
        replyText={replyText}
        setReplyText={setReplyText}
        handleReply={handleReply}
        handleDeleteReply={adminHandleDeleteReply}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <CreatePost
          editingPost={normalizedPost}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Modals */}
      <PostModals
        showConfirmDelete={showConfirmDelete}
        setShowConfirmDelete={setShowConfirmDelete}
        handleDelete={handleDelete}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportDescription={reportDescription}
        setReportDescription={setReportDescription}
        showBlockModal={showBlockModal}
        setShowBlockModal={setShowBlockModal}
        post={normalizedPost}
      />

      {/* Image Viewer Modal */}
      <ImageViewer
        images={normalizedPost.images || []}
        initialIndex={selectedImageIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        authorName={normalizedPost.authorName || normalizedPost.name}
        authorAvatar={normalizedPost.authorAvatar || normalizedPost.author?.avatar || normalizedPost.profile_picture}
        timestamp={new Date(normalizedPost.created_at || normalizedPost.timestamp).toLocaleString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })}
      />
    </div>
  );
};

export default AdminPostCard;
