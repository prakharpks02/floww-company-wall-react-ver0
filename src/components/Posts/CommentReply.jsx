import React, { useState } from 'react';
import { Trash2, Heart, MessageCircle, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReportModal from './ReportModal';

const CommentReply = ({ 
  reply, 
  user,
  isPublicView,
  isAdmin = false, // Add admin prop
  commentId,
  emojiReactions,
  handleDeleteReply,
  handleReactToComment,
  getCommentUserReaction,
  showCommentReactions,
  handleCommentReactionsMouseEnter,
  handleCommentReactionsMouseLeave,
  getCommentTopReactions,
  getCommentTotalReactions
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Check if current user is the reply author
  const isReplyAuthor = user && (
    reply.author?.user_id === user?.user_id || 
    reply.authorId === user?.id ||
    reply.author?.username === user?.username
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
            reactionsObj[reactionType] = [];
          }
          reactionsObj[reactionType].push({ user_id: reaction.user_id });
        });
        console.log('🔍 CommentReply - Normalized reactions from array:', {
          originalReactions: reply.reactions,
          normalizedReactions: reactionsObj,
          replyId: reply.comment_id || reply.id || reply.reply_id
        });
        return reactionsObj;
      }
      console.log('🔍 CommentReply - Using existing reactions object:', reply.reactions);
      return reply.reactions || {};
    })(),
    content: reply.content || reply.comment || reply.text || reply.reply_content || '',
    author: reply.author?.username || reply.authorName || 'Anonymous',
    comment_id: reply.comment_id || reply.id || reply.reply_id, // Use proper reply ID
    created_at: reply.created_at || reply.timestamp
  };

  // Debug logging for content
  console.log('🔍 CommentReply - Reply data:', {
    originalReply: reply,
    normalizedContent: normalizedReply.content,
    availableFields: Object.keys(reply)
  });

  const handleReplyReaction = (reactionType) => {
    if (isPublicView) return;
    // Use the reply's own ID for reactions, not the parent comment ID
    const replyId = reply.comment_id || reply.id || reply.reply_id;
    console.log('🔍 CommentReply - handleReplyReaction called:', {
      reactionType,
      replyId,
      originalReply: reply,
      normalizedReply: normalizedReply
    });
    handleReactToComment(replyId, reactionType);
  };

  return (
    <div className="flex space-x-2">
      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
        <span className="text-xs font-medium text-white">
          {(reply.author?.username || reply.authorName || 'U')[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-xs text-gray-900">
                {reply.author?.username || reply.authorName || 'Anonymous'}
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
              
              {/* Delete button for reply author or admin */}
              {!isPublicView && (isReplyAuthor || isAdmin) && (
                <button
                  onClick={() => handleDeleteReply(commentId, reply.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                  title="Delete reply"
                >
                  <Trash2 className="h-2 w-2" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-700">{normalizedReply.content}</p>
          
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
                  console.log('🔍 CommentReply - User reaction check:', {
                    userReaction,
                    normalizedReply,
                    replyId: normalizedReply.comment_id
                  });
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
                  if (userReaction && userReaction !== 'like') {
                    // Show the emoji for the user's reaction
                    const reaction = emojiReactions.find(r => r.name === userReaction);
                    return (
                      <span className="text-sm">
                        {reaction?.emoji || '👍'}
                      </span>
                    );
                  } else {
                    // Show heart for like or default state
                    return (
                      <Heart className={`h-3 w-3 ${
                        userReaction === 'like' 
                          ? 'fill-current text-red-600' 
                          : ''
                      }`} />
                    );
                  }
                })()}
                <span>
                  {(() => {
                    if (isPublicView) {
                      return 'Like';
                    }
                    const userReaction = getCommentUserReaction(normalizedReply);
                    if (userReaction && userReaction !== 'like') {
                      // Show the reaction name
                      const reaction = emojiReactions.find(r => r.name === userReaction);
                      return reaction?.label || 'React';
                    }
                    return 'Like';
                  })()}
                </span>
                
                {/* Reaction Count - Always show if there are reactions */}
                {(() => {
                  const reactions = normalizedReply.reactions || {};
                  const totalCount = Object.values(reactions).reduce((total, users) => {
                    if (Array.isArray(users)) {
                      return total + users.length;
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
        
        {/* Show Reaction Count Summary - Always show if reactions exist */}
        {(() => {
          const reactions = normalizedReply.reactions || {};
          const totalCount = Object.values(reactions).reduce((total, users) => {
            if (Array.isArray(users)) {
              return total + users.length;
            }
            return total;
          }, 0);
          
          if (totalCount > 0) {
            // Show reaction summary with emojis
            const reactionSummary = Object.entries(reactions)
              .filter(([_, users]) => Array.isArray(users) && users.length > 0)
              // .map(([reactionType, users]) => {
              //   const reactionInfo = emojiReactions.find(r => r.name === reactionType);
              //   return {
              //     // emoji: reactionInfo?.emoji || '👍',
              //     // count: users.length
              //   };
              // });
            
            return (
              <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  {reactionSummary.map((reaction, index) => (
                    <span key={index} className="flex items-center">
                      <span className="text-sm">{reaction.emoji}</span>
                      <span className="ml-1">{reaction.count}</span>
                    </span>
                  ))}
                </div>
                {totalCount > 1 && (
                  <span>• {totalCount} reactions</span>
                )}
              </div>
            );
          }
          
          return null;
        })()}
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
