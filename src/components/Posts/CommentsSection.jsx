import React from 'react';
import CommentItem from './CommentItem';
import CommentReply from './CommentReply';

const CommentsSection = ({ 
  showComments,
  isPublicView,
  commentText,
  setCommentText,
  handleComment,
  normalizedPost,
  user,
  emojiReactions,
  handleDeleteComment,
  handleEditComment,
  handleCommentReply,
  getCommentUserReaction,
  getCommentTopReactions,
  getCommentTotalReactions,
  handleCommentReactionsMouseEnter,
  handleCommentReactionsMouseLeave,
  showCommentReactions,
  handleCommentLike,
  handleCommentReaction,
  hasUserReacted,
  setReplyingTo,
  replyingTo,
  replyText,
  setReplyText,
  handleReply,
  handleDeleteReply
}) => {
  if (!showComments) return null;

  // Check if comments are allowed on this post
  const commentsAllowed = normalizedPost.is_comments_allowed === true || normalizedPost.is_comments_allowed === "true";
  const userBlocked = user?.is_blocked === true || user?.is_blocked === "true";

  console.log('🔍 CommentsSection - Comment status check:', {
    postId: normalizedPost.post_id || normalizedPost.id,
    is_comments_allowed: normalizedPost.is_comments_allowed,
    is_comments_allowed_type: typeof normalizedPost.is_comments_allowed,
    commentsAllowed,
    userBlocked
  });

  return (
    <div className="space-y-3">
      {/* Show comment input box when comments are open and allowed */}
      {!isPublicView && commentsAllowed && (
        <div className="flex mb-2">
          <div className="flex-1 flex mt-6 space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={userBlocked ? "Blocked users cannot comment" : "Add a comment..."}
              className="flex-1  px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              disabled={userBlocked}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || userBlocked}
              className="px-3 py-1 text-white rounded text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: '#9f7aea' }}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Show message when comments are disabled */}
      {!commentsAllowed && (
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            💬 Comments have been disabled for this post
          </p>
        </div>
      )}
      
      {/* If no comments */}
      {Array.isArray(normalizedPost.comments) && normalizedPost.comments.length === 0 && (
        <div className="text-sm text-gray-500">No comments yet. Be the first to comment!</div>
      )}
      
      {/* Render each comment with full UI */}
      {Array.isArray(normalizedPost.comments) && normalizedPost.comments.length > 0 && (
        normalizedPost.comments.map((comment, idx) => {
   
          
          return (
            <div key={comment.comment_id || comment.id || idx}>
              <CommentItem
                comment={comment}
                user={user}
              isPublicView={isPublicView}
              emojiReactions={emojiReactions}
              handleDeleteComment={handleDeleteComment}
              handleEditComment={handleEditComment}
              handleReactToComment={handleCommentReaction}
              handleCommentReply={handleCommentReply}
              handleDeleteReply={handleDeleteReply}
              getCommentUserReaction={getCommentUserReaction}
              getCommentTopReactions={getCommentTopReactions}
              getCommentTotalReactions={getCommentTotalReactions}
              handleCommentReactionsMouseEnter={handleCommentReactionsMouseEnter}
              handleCommentReactionsMouseLeave={handleCommentReactionsMouseLeave}
              showCommentReactions={showCommentReactions}
              handleCommentLike={handleCommentLike}
              hasUserReacted={hasUserReacted}
              onToggleReply={setReplyingTo}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
            />
          </div>
          );
        })
      )}
    </div>
  );
};

export default CommentsSection;
