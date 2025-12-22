import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Heart, MessageCircle, Flag, Edit, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReportModal from './ReportModal';
import MentionInput from '../Editor/MentionInput';
import { highlightMentions } from '../../utils/htmlUtils';

const CommentReply = ({ 
  reply, 
  user,
  isPublicView,
  isAdmin = false, // Add admin prop
  commentId,
  emojiReactions,
  handleDeleteReply,
  handleEditReply, // Add edit handler
  handleReactToComment,
  getCommentUserReaction,
  showCommentReactions,
  handleCommentReactionsMouseEnter,
  handleCommentReactionsMouseLeave,
  getCommentTopReactions,
  getCommentTotalReactions
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content || '');
  const [showMenu, setShowMenu] = useState(false);
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
  
  // Check if current user is the reply author
  const isReplyAuthor = user && reply.author && (
    // Check by employee_id (most reliable)
    reply.author.employee_id === user.employee_id ||
    reply.author.employee_id === user.id ||
    reply.author.user_id === user.employee_id ||
    reply.author.user_id === user.id ||
    // Check by username/employee_username
    reply.author.username === user.username ||
    reply.author.username === user.employee_username ||
    reply.author.employee_username === user.username ||
    reply.author.employee_username === user.employee_username ||
    // Check by name
    reply.author.employee_name === user.name ||
    reply.author.name === user.name ||
    // Additional fallback checks
    reply.author.id === user.id ||
    reply.author.id === user.employee_id ||
    reply.authorId === user.id
  );
  
  // Normalize reply reactions array to object (same as comments)
  const normalizedReply = {
    ...reply,
    // Handle reactions: convert array to object format for UI
    reactions: (() => {
      if (Array.isArray(reply.reactions)) {
        const reactionsObj = {};
        reply.reactions.forEach(reaction => {
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
      return reply.reactions || {};
    })(),
    content: reply.content || reply.comment || reply.text || reply.reply_content || '',
    author: reply.author?.username || 
            reply.author?.employee_name || 
            reply.author?.employee_username || 
            reply.author?.personal_email || 
            reply.author?.company_email || 
            reply.authorName || 
            'Anonymous',
    comment_id: reply.comment_id || reply.id || reply.reply_id, // Use proper reply ID
    created_at: reply.created_at || reply.timestamp
  };

  const handleReplyReaction = (reactionType) => {
    if (isPublicView) return;
    // Use the reply's own ID for reactions, not the parent comment ID
    const replyId = reply.comment_id || reply.id || reply.reply_id;
   
    handleReactToComment(replyId, reactionType);
  };

  const handleEdit = () => {
    if (isPublicView || !isReplyAuthor) return;
    setIsEditing(true);
    setEditContent(reply.content || '');
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== reply.content && handleEditReply) {
      handleEditReply(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(reply.content || '');
  };

  return (
    <div className="flex space-x-2 overflow-hidden max-w-full">
      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-white">
          {(() => {
            const authorName = reply.author?.username || 
                             reply.author?.employee_name || 
                            
                             reply.author?.personal_email || 
                             reply.author?.company_email || 
                             reply.authorName || 
                             'User';
            return (typeof authorName === 'string' ? authorName : 'U')[0].toUpperCase();
          })()}
        </span>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="bg-white rounded-lg p-2 border border-gray-200 overflow-hidden max-w-full">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-xs text-gray-900">
                {reply.author?.username || 
                 reply.author?.employee_name || 
                 reply.author?.employee_username || 
                 reply.author?.personal_email || 
                 reply.author?.company_email || 
                 reply.authorName || 
                 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500">
                {(reply.created_at || reply.timestamp) && !isNaN(new Date(reply.created_at || reply.timestamp))
                  ? formatDistanceToNow(new Date(reply.created_at || reply.timestamp), { addSuffix: true })
                  : 'Just now'
                }
              </span>
            </div>
            {/* Action buttons for reply */}
            <div className="flex items-center space-x-1">
              {/* Report button for non-authors */}
              {!isPublicView && !isReplyAuthor && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                  title="Report reply"
                >
                  <Flag className="h-2 w-2" />
                </button>
              )}
              
              {/* Author menu for reply owner or admin */}
              {!isPublicView && (isReplyAuthor || isAdmin) && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                      {/* Edit option only for reply author */}
                      {isReplyAuthor && handleEditReply && (
                        <button
                          onClick={handleEdit}
                          className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                        >
                          <Edit className="h-2 w-2" />
                          Edit
                        </button>
                      )}
                      {/* Delete option for reply author or admin */}
                      <button
                        onClick={() => {
                          handleDeleteReply(commentId, reply.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-2 py-1 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 className="h-2 w-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Reply Content */}
          <div className="mb-2">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-2 overflow-hidden max-w-full">
                <MentionInput
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Edit your reply..."
                  className="w-full"
                  isAdmin={isAdmin}
                  rows={2}
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="overflow-hidden">
                <div 
                  className="text-xs text-gray-700 whitespace-pre-wrap"
                  style={{
                    wordBreak: 'break-all',
                    overflowWrap: 'anywhere',
                    maxWidth: '100%'
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightMentions(normalizedReply.content || '') }}
                />
                {reply.edited && (
                  <p className="text-xs text-gray-400 mt-1 italic">
                    (edited)
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Reply Actions - Same as comments */}
          <div className="flex items-center space-x-3 mt-2">
            {/* Like/Reaction Button with Hover */}
            <div 
              className="relative"
              onMouseEnter={() => handleCommentReactionsMouseEnter?.(reply.comment_id || reply.id || reply.reply_id)}
              onMouseLeave={() => handleCommentReactionsMouseLeave?.(reply.comment_id || reply.id || reply.reply_id)}
            >
              <button
                onClick={() => {
                  const userReaction = getCommentUserReaction(normalizedReply);
                 
                  if (userReaction) {
                    // User has a reaction, remove it (toggle off)
                    handleReplyReaction(userReaction);
                  } else {
                    // User has no reaction, add like
                    handleReplyReaction('like');
                  }
                }}
                disabled={isPublicView || isAdmin}
                title={
                  isAdmin ? "Admin users cannot react to replies" :
                  isPublicView ? "Login to react to replies" : 
                  "React to this reply"
                }
                className={`flex items-center space-x-1 text-xs ${
                  (isPublicView || isAdmin)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-500 hover:text-red-600'
                } transition-colors`}
              >
                {(() => {
                  const userReaction = isPublicView ? null : getCommentUserReaction(normalizedReply);
                  const reactions = normalizedReply.reactions || {};
                  
                  // For public view, show the most common reaction or heart
                  if (isPublicView) {
                    const reactionTypes = Object.keys(reactions);
                    if (reactionTypes.length > 0) {
                      // Show the first available reaction type
                      const firstReactionType = reactionTypes[0];
                      const reactionInfo = emojiReactions.find(r => r.name === firstReactionType);
                      if (reactionInfo) {
                        return (
                          <span className="text-sm">
                            {reactionInfo.emoji}
                          </span>
                        );
                      }
                    }
                    return <Heart className="h-3 w-3" />;
                  }
                  
                  // For logged-in users, show their specific reaction
                  if (userReaction && userReaction !== 'like' && userReaction !== 'love') {
                    // Show the emoji for the user's reaction
                    const reaction = emojiReactions.find(r => r.name === userReaction);
                    return (
                      <span className="text-sm">
                        {reaction?.emoji || '👍'}
                      </span>
                    );
                  } else {
                    // Show heart for love/like or default state
                    return (
                      <Heart className={`h-3 w-3 ${
                        (userReaction === 'like' || userReaction === 'love')
                          ? 'fill-current text-red-600' 
                          : ''
                      }`} />
                    );
                  }
                })()}
                {/* Removed reaction name text - just show emoji */}
                
                {/* Reaction Count - Always show if there are reactions */}
                {(() => {
                  const reactions = normalizedReply.reactions || {};
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
                    <span className="text-xs bg-gray-100 px-1 py-0.5 rounded-full">
                      {totalCount}
                    </span>
                  ) : null;
                })()}
              </button>

              {/* Hover Reactions Dropdown */}
              {showCommentReactions?.[reply.comment_id || reply.id || reply.reply_id] && !isPublicView && !isAdmin && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-2 flex items-center space-x-1 z-20"
                  onMouseEnter={() => handleCommentReactionsMouseEnter?.(reply.comment_id || reply.id || reply.reply_id)}
                  onMouseLeave={() => handleCommentReactionsMouseLeave?.(reply.comment_id || reply.id || reply.reply_id)}
                >
                  {emojiReactions.map((reaction) => (
                    <button
                      key={reaction.name}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleReplyReaction(reaction.name);
                      }}
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
        </div>
        
        {/* Removed duplicate reaction summary - reactions already shown in button */}
      </div>
      
      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        commentId={reply.comment_id || reply.id || reply.reply_id}
        type="comment"
      />
    </div>
  );
};

export default CommentReply;
