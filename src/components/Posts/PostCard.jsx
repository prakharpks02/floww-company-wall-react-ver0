import React from 'react';
import { ExternalLink, Image } from 'lucide-react';
import { usePostCard } from '../../hooks/usePostCard';
import CreatePost from './CreatePost';
import VideoPlayer from '../Media/VideoPlayer';
import PDFPreview from '../Media/PDFPreview';
import DocumentViewer from '../Media/DocumentViewer';
import PostHeader from './PostHeader';
import PostTags from './PostTags';
import PostContent from './PostContent';
import PostMentions from './PostMentions';
import PostStats from './PostStats';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import PostModals from './PostModals';

const PostCard = ({ post, showAuthorInfo = true, isPublicView = false, activeView = 'home', showOptimisticState = false }) => {
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
  } = usePostCard(post, activeView);
  
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
            {normalizedPost.links.map((link, idx) => {
              // Handle cases where link.link is a stringified object: "{'link': 'gg.com'}"
              let url = link.url || link.link;
              let title = link.title;
              let description = link.description;

              // If url is a stringified object, parse it
              if (typeof url === 'string' && url.trim().startsWith("{'link'")) {
                try {
                  // Convert single quotes to double quotes for JSON.parse
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
      showOptimisticState ? 'opacity-75' : ''
    }`}>
      {/* Optimistic State Indicator */}
      {showOptimisticState && (
        <div className="mb-3 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-600">
            {post.isOptimistic ? '📤 Posting...' : post.isUpdating ? '🔄 Updating...' : '⏳ Processing...'}
          </p>
        </div>
      )}
      
      {/* Post Header */}
      <PostHeader
        post={normalizedPost}
        isAuthor={isAuthor}
        isPublicView={isPublicView}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        setShowEditModal={setShowEditModal}
        setShowConfirmDelete={setShowConfirmDelete}
        setShowReportModal={setShowReportModal}
        setShowBlockModal={setShowBlockModal}
      />

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
          shareCount={shareCount}
          getTopReactions={getTopReactions}
        />

        <div className="flex items-center justify-between">
          <PostActions
            isLiked={isLiked}
            isPublicView={isPublicView}
            handleLike={handleLike}
            totalLikes={getTotalLikes()}
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
          />
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection
        showComments={showComments}
        isPublicView={isPublicView}
        commentText={commentText}
        setCommentText={setCommentText}
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
    </div>
  );
};

export default PostCard;
