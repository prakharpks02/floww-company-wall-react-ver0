import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Heart, MessageCircle, Edit, MoreHorizontal, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentReply from './CommentReply';
import ReportModal from './ReportModal';
import MentionInput from '../Editor/MentionInput';
import { formatTextForDisplay, highlightMentions } from '../../utils/htmlUtils';

const CommentItem = ({ 
  comment, 
  user,
  isPublicView,
  isAdmin = false, // Add admin prop
  emojiReactions,
  handleDeleteComment,
  handleEditComment,
  handleReactToComment,
  handleCommentReply,
  handleDeleteReply,
  getCommentUserReaction,
  hasUserReacted,
  onToggleReply,
  showCommentReactions,
  handleCommentReactionsMouseEnter,
  handleCommentReactionsMouseLeave,
  replyingTo
}) => {
  // Local state for editing and replying
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [editMentions, setEditMentions] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);




  // Helper function to get display name from author data
  const getAuthorDisplayName = (author) => {
    if (!author) return 'Anonymous';
    
    // If this comment is from the current user, use their display name
    if (user && (
      author.employee_id === user.employee_id ||
      author.employee_id === user.id ||
      author.employee_username === user.username ||
      author.employee_username === user.employee_username
    )) {
   
      return user.name || user.username || 'Current User';
    }
    
    // Priority order for display name
    const displayName = author.username || 
                       author.employee_name || 
                       author.employee_username || 
                       author.personal_email || 
                       author.company_email || 
                       'Anonymous';
    
   
    return displayName;
  };

  // Check if the current user is the comment author
  const isCommentAuthor = user && comment.author && (
    // Check by employee_id (most reliable)
    comment.author.employee_id === user.employee_id ||
    comment.author.employee_id === user.id ||
    comment.author.user_id === user.employee_id ||
    comment.author.user_id === user.id ||
    // Check by username/employee_username
    comment.author.username === user.username ||
    comment.author.username === user.employee_username ||
    comment.author.employee_username === user.username ||
    comment.author.employee_username === user.employee_username ||
    // Check by name
    comment.author.employee_name === user.name ||
    comment.author.name === user.name ||
    // Additional fallback checks
    comment.author.id === user.id ||
    comment.author.id === user.employee_id
  );

  // Normalize the comment data to ensure consistent structure
  const normalizedComment = {
    ...comment,
    // Handle reactions: convert array to object format for UI
    reactions: (() => {
      if (Array.isArray(comment.reactions)) {
        const reactionsObj = {};
        comment.reactions.forEach(reaction => {
          const reactionType = reaction.reaction_type;
          if (!reactionsObj[reactionType]) {
            reactionsObj[reactionType] = { users: [], count: 0 };
          }
          // Handle both user_id and employee_id from API
          const userId = reaction.user_id || reaction.employee_id;
          if (userId && !reactionsObj[reactionType].users.includes(userId)) {
            reactionsObj[reactionType].users.push(userId);
            reactionsObj[reactionType].count++;
          }
        });
        return reactionsObj;
      }
      return comment.reactions || {};
    })(),
    content: comment.content || '',
    author: comment.author?.username || 
            comment.author?.employee_name || 
            comment.author?.personal_email || 
            comment.author?.company_email || 
            'Anonymous',
    comment_id: comment.comment_id || comment.id,
    created_at: comment.created_at || comment.createdAt || comment.timestamp
  };


  const handleCommentReaction = (reactionType) => {
    if (isPublicView) return;
  
    
    handleReactToComment(comment.comment_id || comment.id, reactionType);
  };

  const handleReply = () => {
    if (isPublicView) return;
    if (onToggleReply) {
      onToggleReply(replyingTo === (comment.comment_id || comment.id) ? null : (comment.comment_id || comment.id));
    }
  };

  const handleDelete = () => {
    if (isPublicView) return;
    handleDeleteComment(comment.comment_id || comment.id);
  };

  const handleEdit = () => {
    if (isPublicView || !isCommentAuthor) return;
    setIsEditing(true);
    setEditContent(comment.content || '');
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    console.log('🔍 CommentItem handleSaveEdit - editContent:', editContent);
    console.log('🔍 CommentItem handleSaveEdit - editMentions:', editMentions);
    
    if (editContent.trim() && editContent !== comment.content) {
      // Pass both content and mentions to the edit handler
      const editData = {
        content: editContent.trim(),
        mentions: editMentions
      };
      console.log('🔍 CommentItem handleSaveEdit - sending editData:', editData);
      handleEditComment(comment.comment_id || comment.id, editData);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content || '');
    setEditMentions([]);
  };

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      handleCommentReply(comment.comment_id || comment.id, replyContent.trim());
      setReplyContent('');
      if (onToggleReply) {
        onToggleReply(null);
      }
    }
  };

  const handleCancelReply = () => {
    setReplyContent('');
    if (onToggleReply) {
      onToggleReply(null);
    }
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg mb-2">
      {/* Comment Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {(() => {
                const authorName = getAuthorDisplayName(comment.author);
                return (typeof authorName === 'string' ? authorName : 'A')[0].toUpperCase();
              })()}
            </span>
          </div>
          <div>
            <span className="font-medium text-sm text-gray-900">
              {getAuthorDisplayName(comment.author)}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Just now'}
            </span>
          </div>
        </div>
        
        {/* Action Menu */}
        <div className="flex items-center space-x-2">
          {/* Report button for non-authors */}
          {!isPublicView && !isCommentAuthor && (
            <button
              onClick={() => setShowReportModal(true)}
              className="text-gray-400 hover:text-red-600 transition-colors p-1"
              title="Report comment"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
          
          {/* Author menu for comment owner or admin */}
          {!isPublicView && (isCommentAuthor || isAdmin) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  {/* Edit option only for comment author */}
                  {isCommentAuthor && (
                    <button
                      onClick={handleEdit}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                  {/* Delete option for comment author or admin */}
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-2">
            <MentionInput
              value={editContent}
              onChange={setEditContent}
              onMentionsChange={setEditMentions}
              placeholder="Edit your comment..."
              className="w-full"
              isAdmin={isAdmin}
              rows={3}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Display Mode */
          (() => {
            const content = comment.content;
            
            if (content && content.toString().trim()) {
              const highlightedContent = highlightMentions(content.toString().trim());
              
              return (
                <div>
                  <div 
                    className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightedContent }}
                  />
                  {comment.edited && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      (edited)
                    </p>
                  )}
                </div>
              );
            } else {
              return (
                <p className="text-gray-400 text-sm italic">
                  {content === null ? 'Comment content is empty' : 'No content available'}
                </p>
              );
            }
          })()
        )}
      </div>

      {/* Comment Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Like/Reaction Button with Hover */}
          <div 
            className="relative"
            onMouseEnter={() => handleCommentReactionsMouseEnter?.(comment.comment_id || comment.id)}
            onMouseLeave={() => handleCommentReactionsMouseLeave?.(comment.comment_id || comment.id)}
          >
            <button
              onClick={() => {
                const userReaction = getCommentUserReaction(normalizedComment);
                if (userReaction) {
                  // User has a reaction, remove it (toggle off)
                  handleCommentReaction(userReaction);
                } else {
                  // User has no reaction, add like
                  handleCommentReaction('like');
                }
              }}
              disabled={isPublicView || isAdmin}
              title={
                isAdmin ? "Admin users cannot react to comments" :
                isPublicView ? "Login to react to comments" : 
                "React to this comment"
              }
              className={`flex items-center space-x-2 text-sm ${
                (isPublicView || isAdmin)
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-500 hover:text-red-600'
              } transition-colors`}
            >
              {(() => {
                const userReaction = getCommentUserReaction(normalizedComment);
         
                if (userReaction && userReaction !== 'like' && userReaction !== 'love') {
                  // Show the emoji for the user's reaction
                  const reaction = emojiReactions.find(r => r.name === userReaction);
                  return (
                    <span className="text-lg">
                      {reaction?.emoji || '👍'}
                    </span>
                  );
                } else {
                  // Show heart for love/like or default state
         
                  return (
                    <Heart className={`h-4 w-4 ${
                      (userReaction === 'like' || userReaction === 'love')
                        ? 'fill-current text-red-600' 
                        : ''
                    }`} />
                  );
                }
              })()}
              {/* Removed reaction name text - just show emoji */}
              
              {/* Reaction Count */}
              {(() => {
                const reactions = normalizedComment.reactions || {};
                const totalCount = Object.values(reactions).reduce((total, reaction) => {
                  if (Array.isArray(reaction)) {
                    // Handle old array format
                    return total + reaction.length;
                  } else if (reaction && typeof reaction === 'object' && reaction.count) {
                    // Handle new object format {users: [], count: 0}
                    return total + reaction.count;
                  }
                  return total;
                }, 0);
                
                return totalCount > 0 ? (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {totalCount}
                  </span>
                ) : null;
              })()}
            </button>

            {/* Hover Reactions Dropdown */}
            {showCommentReactions?.[comment.comment_id || comment.id] && !isPublicView && !isAdmin && (
              <div 
                className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-2 flex items-center space-x-1 z-20"
                onMouseEnter={() => handleCommentReactionsMouseEnter?.(comment.comment_id || comment.id)}
                onMouseLeave={() => handleCommentReactionsMouseLeave?.(comment.comment_id || comment.id)}
              >
                {emojiReactions.map((reaction) => (
                  <button
                    key={reaction.name}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCommentReaction(reaction.name);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors transform hover:scale-110"
                    title={reaction.label}
                  >
                    <span className="text-lg">{reaction.emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply Button */}
          <button
            onClick={handleReply}
            disabled={isPublicView || isAdmin}
            title={
              isAdmin ? "Admin users cannot reply to comments" :
              isPublicView ? "Login to reply to comments" : 
              "Reply to this comment"
            }
            className={`flex items-center space-x-2 text-sm ${
              (isPublicView || isAdmin)
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-500 hover:text-blue-600'
            } transition-colors`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Reply</span>
          </button>
        </div>
      </div>

      {/* Show Reaction Count Only (no detailed breakdown) */}
      {(() => {
        const reactions = normalizedComment.reactions || {};
        const totalCount = Object.values(reactions).reduce((total, users) => {
          if (Array.isArray(users)) {
            return total + users.length;
          }
          return total;
        }, 0);
        
        // Only show total count if there are reactions, but no detailed breakdown
        return totalCount > 1 ? (
          <div className="mt-2 text-xs text-gray-500">
            {totalCount} reactions
          </div>
        ) : null;
      })()}

      {/* Reply Input (if replying to this comment and user is not admin) */}
      {replyingTo === (comment.comment_id || comment.id) && !isAdmin && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {(() => {
                  const authorName = getAuthorDisplayName(comment.author);
                  return (typeof authorName === 'string' ? authorName : 'A')[0].toUpperCase();
                })()}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Replying to <span className="font-medium">
                {getAuthorDisplayName(comment.author)}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <MentionInput
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Write a reply..."
              className="w-full"
              isAdmin={isAdmin}
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSubmitReply}
                disabled={!replyContent.trim()}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
              <button 
                onClick={handleCancelReply}
                className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-purple-200 space-y-2">
        
          {comment.replies.map((reply, idx) => (
            <CommentReply
              key={reply.comment_id || reply.id || reply.reply_id || `reply-${idx}`}
              reply={reply}
              user={user}
              isPublicView={isPublicView}
              isAdmin={isAdmin}
              commentId={comment.comment_id || comment.id}
              emojiReactions={emojiReactions}
              // For deleting a reply, use the same delete endpoint as comments, passing reply.comment_id
              handleDeleteReply={() => handleDeleteComment(reply.comment_id)}
              // For editing a reply, use the same edit endpoint as comments
              handleEditReply={(newContent) => handleEditComment(reply.comment_id, newContent)}
              handleReactToComment={handleReactToComment}
              getCommentUserReaction={getCommentUserReaction}
              showCommentReactions={showCommentReactions}
              handleCommentReactionsMouseEnter={handleCommentReactionsMouseEnter}
              handleCommentReactionsMouseLeave={handleCommentReactionsMouseLeave}
            />
          ))}
        </div>
      )}
      
      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        commentId={comment.comment_id || comment.id}
        type="comment"
      />
    </div>
  );
};

export default CommentItem;
