import React from 'react';
import CommentItem from './CommentItem';
import CommentReply from './CommentReply';
import MentionInput from '../Editor/MentionInput';

const CommentsSection = ({ 
  showComments,
  isPublicView,
  isAdmin = false, // Add admin prop
  commentText,
  setCommentText,
  commentMentions = [],
  handleCommentMentionsChange = () => {},
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
  const userIsAdmin = user?.is_admin === true || user?.is_admin === "true" || isAdmin;

  return (
    <div className="space-y-3 mt-4 border-t border-gray-100 pt-4">
      {/* Show comment input box when comments are open and allowed */}
      {!isPublicView && commentsAllowed && !userIsAdmin && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex-1">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                onMentionsChange={handleCommentMentionsChange}
                placeholder={userBlocked ? "Blocked users cannot comment" : "Add a comment..."}
                className="w-full"
                isAdmin={isAdmin}
                rows={2}
                maxLength={500}
                disabled={userBlocked}
              />
            </div>
            <div className="flex justify-end sm:self-start">
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || userBlocked}
                className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-friendly"
                style={{ backgroundColor: '#9f7aea' }}
              >
                <span className="hidden sm:inline">Post Comment</span>
                <span className="sm:hidden">Post</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show message when user is admin */}
      {userIsAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 text-center">
            🛡️ Admin users cannot comment on posts
          </p>
        </div>
      )}

      {/* Show message when comments are disabled */}
      {!commentsAllowed && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            💬 Comments have been disabled for this post
          </p>
        </div>
      )}
      
      {/* If no comments - only show encouraging message when comments are allowed */}
      {Array.isArray(normalizedPost.comments) && normalizedPost.comments.length === 0 && commentsAllowed && (
        <div className="text-sm text-gray-500 text-center py-4 border border-gray-200 rounded-lg bg-gray-50">
          💭 No comments yet. Be the first to share your thoughts!
        </div>
      )}
      
      {/* Render each comment with full UI */}
      {Array.isArray(normalizedPost.comments) && normalizedPost.comments.length > 0 && (
        <div className="space-y-3">
          {normalizedPost.comments.map((comment, idx) => {
      
            return (
              <div key={comment.comment_id || comment.id || idx} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <CommentItem
                  comment={comment}
                  user={user}
                  isPublicView={isPublicView}
                  isAdmin={isAdmin}
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
          })}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
