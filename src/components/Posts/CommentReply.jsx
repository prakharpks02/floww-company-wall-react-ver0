import React from 'react';
import { Trash2, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentReply = ({ 
  reply, 
  user,
  isPublicView,
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
        return reactionsObj;
      }
      return reply.reactions || {};
    })(),
    content: reply.content || '',
    author: reply.author?.username || reply.authorName || 'Anonymous',
    comment_id: reply.comment_id || reply.id || reply.reply_id, // Use proper reply ID
    created_at: reply.created_at || reply.timestamp
  };

  const handleReplyReaction = (reactionType) => {
    if (isPublicView) return;
    // Use the reply's own ID for reactions, not the parent comment ID
    const replyId = reply.comment_id || reply.id || reply.reply_id;
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
            {/* Delete button for reply author */}
            {!isPublicView && (reply.author?.user_id === user?.user_id || reply.authorId === user?.id) && (
              <button
                onClick={() => handleDeleteReply(commentId, reply.id)}
                className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                title="Delete reply"
              >
                <Trash2 className="h-2 w-2" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-700">{reply.content}</p>
          
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
                disabled={isPublicView}
                className={`flex items-center space-x-1 text-xs ${
                  isPublicView 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-500 hover:text-red-600'
                } transition-colors`}
              >
                {(() => {
                  const userReaction = getCommentUserReaction(normalizedReply);
                  
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
                    const userReaction = getCommentUserReaction(normalizedReply);
                    if (userReaction && userReaction !== 'like') {
                      // Show the reaction name
                      const reaction = emojiReactions.find(r => r.name === userReaction);
                      return reaction?.label || 'React';
                    }
                    return 'Like';
                  })()}
                </span>
                
                {/* Reaction Count */}
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
              {showCommentReactions?.[reply.comment_id || reply.id || reply.reply_id] && !isPublicView && (
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
        
        {/* Show Reaction Count Summary */}
        {(() => {
          const reactions = normalizedReply.reactions || {};
          const totalCount = Object.values(reactions).reduce((total, users) => {
            if (Array.isArray(users)) {
              return total + users.length;
            }
            return total;
          }, 0);
          
          return totalCount > 1 ? (
            <div className="mt-1 text-xs text-gray-500">
              {totalCount} reactions
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
};

export default CommentReply;
