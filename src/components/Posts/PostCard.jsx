import React, { useState } from 'react';
import { Image } from 'lucide-react';
import { usePostCard } from '../../hooks/usePostCard';
import CreatePost from './CreatePost';
import VideoPlayer from '../Media/VideoPlayer';
import PDFPreview from '../Media/PDFPreview';
import DocumentViewer from '../Media/DocumentViewer';
import ImageViewer from '../Media/ImageViewer';
import PostHeader from './PostHeader';
import PostTags from './PostTags';
import PostContent from './PostContent';
import PostMentions from './PostMentions';
import PostStats from './PostStats';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import PostModals from './PostModals';
import Alert from '../UI/Alert';

const PostCard = ({ 
  post, 
  showAuthorInfo = true, 
  isPublicView = false, 
  activeView = 'home', 
  showOptimisticState = false,
  // Admin props for broadcasts
  isAdminView = false,
  onAdminEdit,
  onAdminDelete
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
    isBlocked,
    isAdmin,
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
    getAllReactions,
    getCommentTopReactions,
    getCommentTotalReactions,
    getTotalComments,
    hasUserReacted
  } = usePostCard(post, activeView);
  
  const renderAttachments = () => {
    const hasAttachments = 
      normalizedPost.images?.length > 0 || 
      normalizedPost.videos?.length > 0 || 
      normalizedPost.documents?.length > 0 || 
      normalizedPost.links?.length > 0;

    if (!hasAttachments) return null;

    return (
      <div className="mt-2 space-y-2 max-w-full overflow-hidden">
        {/* Images - Compact responsive grid */}
        {normalizedPost.images?.length > 0 && (
          <div className={`grid gap-1 max-w-full ${
            normalizedPost.images.length === 1 
              ? 'grid-cols-1' 
              : normalizedPost.images.length === 2 
                ? 'grid-cols-2' 
                : normalizedPost.images.length === 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : normalizedPost.images.length === 4
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
          }`}>
            {normalizedPost.images.slice(0, 8).map((image, idx) => {
              // Smart URL encoding - check if already encoded to avoid double encoding
              let encodedUrl = image.url;
              try {
                // If URL can be decoded and is different, it means it's already encoded
                const decoded = decodeURIComponent(image.url);
                if (decoded !== image.url) {
                  // Already encoded - use as is
                  encodedUrl = image.url;
                
                } else {
                  // Not encoded - encode only if needed
                  const needsEncoding = decoded.includes(' ') || decoded.includes('(') || decoded.includes(')');
                  encodedUrl = needsEncoding ? encodeURI(decoded) : decoded;
               
                }
              } catch (e) {
                // If decoding fails, URL might have special characters - use encodeURI
                encodedUrl = encodeURI(image.url);
            
              }
              
              return (
                <div key={image.id || image.url || idx} className="relative group overflow-hidden min-w-0">
                  {/* Show "+X more" overlay for additional images */}
                  {idx === 7 && normalizedPost.images.length > 8 && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10 text-white font-semibold text-xs">
                      +{normalizedPost.images.length - 8} more
                    </div>
                  )}
                  <img
                    src={encodedUrl}
                    alt={image.name || `Image ${idx + 1}`}
                    className={`w-full h-full object-cover rounded cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 ${
                      normalizedPost.images.length === 1 
                        ? 'aspect-video max-h-48 sm:max-h-64' 
                        : normalizedPost.images.length === 2
                          ? 'aspect-square max-h-32 sm:max-h-40'
                          : 'aspect-square max-h-24 sm:max-h-32'
                    }`}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      // Use setTimeout to ensure state update completes before opening
                      setTimeout(() => setImageViewerOpen(true), 0);
                    }}
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image failed to load:', encodedUrl, e);
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                  
                    }}
                  />
                  {/* Image overlay with name */}
                  <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white px-1 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity max-w-[80%]">
                    <Image className="h-2 w-2 inline mr-1" />
                    <span className="hidden sm:inline truncate">
                      {image.name || `Image ${idx + 1}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Videos - Enhanced height for better viewing */}
        {normalizedPost.videos?.length > 0 && (
          <div className="space-y-2">
            {normalizedPost.videos.map((video, idx) => (
              <div key={video.id || video.url || idx} className="w-full">
                <div className="relative bg-black rounded overflow-hidden">
                  <VideoPlayer
                    src={video.url}
                    poster={video.thumbnail}
                    className="w-full h-48 sm:h-56 lg:h-64 rounded"
                  />
                  {/* Video label */}
                  {video.name && (
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded text-xs max-w-[80%] truncate">
                      {video.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documents - Compact layout */}
        {normalizedPost.documents?.length > 0 && (
          <div className="space-y-2">
            {normalizedPost.documents.map((doc, idx) => (
              <div key={doc.id || doc.url || idx} className="w-full">
                {doc.isPDF && doc.url ? (
                  <div className="border border-gray-200 rounded overflow-hidden bg-white">
                    {/* PDF Header - Compact layout */}
                    <div className="flex items-center justify-between p-2 bg-red-50 border-b border-gray-200">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">PDF</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-red-900 truncate text-sm">
                            {doc.name || 'PDF Document'}
                          </p>
                          <p className="text-xs text-red-600">PDF Document</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-100 rounded-full flex-shrink-0 ml-2"
                        aria-label="Open PDF in new tab"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                    {/* PDF Preview - Enhanced height for better readability */}
                    <div className="h-48 sm:h-56 lg:h-64 bg-gray-100">
                      <PDFPreview url={doc.url} />
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded overflow-hidden bg-white">
                    <DocumentViewer
                      file={{
                        name: doc.name,
                        url: doc.url,
                        size: doc.size,
                        type: doc.type,
                        uploadedAt: doc.uploadedAt
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Links - Compact layout */}
        {normalizedPost.links?.length > 0 && (
          <div className="space-y-2">
            {normalizedPost.links.map((link, idx) => (
              <div key={link.id || link.url || idx} className="border border-gray-200 rounded overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                <a 
                  href={link.url || link.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-2 hover:no-underline"
                >
                  <div className="flex items-start space-x-2">
                    {/* Link icon */}
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {link.title || link.url || link.link}
                      </p>
                      {link.description && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-blue-600 mt-0.5 truncate">
                        {link.url || link.link}
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 ${
        showOptimisticState ? 'opacity-75' : ''
      }`}
      style={{ 
        maxWidth: '100%', 
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%'
      }}
    >
      {/* Share Alert - Compact layout */}
      {showShareAlert && (
        <div className="mb-2">
          <Alert
            type="success"
            message="Post URL copied to clipboard!"
            onClose={() => setShowShareAlert(false)}
          />
        </div>
      )}
      
      {/* Pinned Post Indicator - Compact styling */}
      {(normalizedPost.is_pinned === true || normalizedPost.is_pinned === "true") && (
        <div className="mb-2 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800 font-medium flex items-center">
            <span className="mr-1">📌</span>
            <span>Pinned Post</span>
          </p>
        </div>
      )}

      {/* Optimistic State Indicator - Compact styling */}
      {showOptimisticState && (
        <div className="mb-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-600 flex items-center">
            <span className="mr-1">
              {post.isOptimistic ? '📤' : post.isUpdating ? '🔄' : '⏳'}
            </span>
            <span>
              {post.isOptimistic ? 'Posting...' : post.isUpdating ? 'Updating...' : 'Processing...'}
            </span>
          </p>
        </div>
      )}
      
      {/* Post Header - Compact spacing */}
      <div className="mb-2">
        <PostHeader
          post={normalizedPost}
          isAuthor={isAuthor}
          isAdmin={isAdmin}
          isPublicView={isPublicView}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          setShowEditModal={setShowEditModal}
          setShowConfirmDelete={setShowConfirmDelete}
          setShowReportModal={setShowReportModal}
          setShowBlockModal={setShowBlockModal}
          // Admin props for broadcasts
          isAdminView={isAdminView}
          onAdminEdit={onAdminEdit}
          onAdminDelete={onAdminDelete}
        />
      </div>

      {/* Tags - Only show with minimal spacing if they exist */}
      {normalizedPost.tags?.length > 0 && (
        <div className="mb-2">
          <PostTags tags={normalizedPost.tags} />
        </div>
      )}

      {/* Post Content - Compact spacing */}
      <div className="mb-2">
        <PostContent content={normalizedPost.content} />
      </div>

      {/* Attachments */}
      {renderAttachments()}

      {/* Mentions - Only show with minimal spacing if they exist */}
      {normalizedPost.mentions?.length > 0 && (
        <div className="mt-2">
          <PostMentions mentions={normalizedPost.mentions} />
        </div>
      )}

      {/* Post Actions - Compact bottom section */}
      <div className="pt-2 border-t border-gray-100 mt-3">
        {/* Reactions Display */}
        <div className="mb-2">
          <PostStats
            totalLikes={getTotalLikes()}
            totalReactions={getTotalReactions()}
            totalComments={getTotalComments()}
            shareCount={shareCount}
            getTopReactions={getTopReactions}
            getAllReactions={getAllReactions}
          />
        </div>

        {/* Action Buttons - Compact touch targets */}
        <div className="flex items-center justify-between">
          <PostActions
            isLiked={isLiked}
            hasAnyReaction={hasAnyReaction}
            isPublicView={isPublicView}
            isBlocked={isBlocked}
            isAdmin={user?.is_admin}
            handleLike={handleLike}
            totalLikes={getTotalLikes()}
            getAllReactions={getAllReactions}
            getUserReaction={getUserReaction}
            emojiReactions={emojiReactions}
            showReactions={showReactions}
            setShowComments={setShowComments}
            showComments={showComments}
            handleShare={handleShare}
            shareCount={shareCount}
            handleReactionsMouseEnter={handleReactionsMouseEnter}
            handleReactionsMouseLeave={handleReactionsMouseLeave}
            handleReaction={handleReaction}
            handleReport={() => handleReport('post', normalizedPost.post_id || normalizedPost.id)}
            isOwnPost={isAuthor}
          />
        </div>

        {/* Comments Section - Enhanced height for better visibility */}
        {showComments && (
          <div className="mt-2 max-h-96 overflow-y-auto">
            <CommentsSection
              showComments={showComments}
              isPublicView={isPublicView}
              isAdmin={user?.is_admin}
              commentText={commentText}
              setCommentText={setCommentText}
              commentMentions={commentMentions}
              handleCommentMentionsChange={handleCommentMentionsChange}
              handleComment={handleComment}
              normalizedPost={normalizedPost}
              user={user}
              emojiReactions={emojiReactions}
              handleDeleteComment={handleDeleteComment}
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
              handleDeleteReply={handleDeleteReply}
            />
          </div>
        )}
      </div>

      {/* Edit Modal - Responsive */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <CreatePost
              editingPost={normalizedPost}
              onClose={() => setShowEditModal(false)}
            />
          </div>
        </div>
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

export default PostCard;