import React from 'react';
import { Trash2, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ 
  comment, 
  user,
  isPublicView,
  emojiReactions,
  handleDeleteComment,
  handleReactToComment,
  getCommentUserReaction,
  hasUserReacted,
  onToggleReply,
  showCommentReactions,
  handleCommentReactionsMouseEnter,
  handleCommentReactionsMouseLeave,
  replyingTo
}) => {
  console.log('🔍 CommentItem rendering:', {
    commentId: comment.comment_id || comment.id,
    reactions: comment.reactions,
    author: comment.author,
    authorStructure: {
      hasAuthor: !!comment.author,
      authorType: typeof comment.author,
      authorKeys: comment.author ? Object.keys(comment.author) : 'no author',
      username: comment.author?.username,
      user_id: comment.author?.user_id
    },
    user: user?.username,
    content: comment.content,
    contentLength: comment.content ? comment.content.length : 0,
    fullComment: comment,
    allKeys: Object.keys(comment),
    allValues: Object.entries(comment)
  });

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
            reactionsObj[reactionType] = [];
          }
          reactionsObj[reactionType].push({ user_id: reaction.user_id });
        });
        return reactionsObj;
      }
      return comment.reactions || {};
    })(),
    content: comment.content || '',
    author: comment.author?.username || comment.author || 'Anonymous',
    comment_id: comment.comment_id || comment.id,
    created_at: comment.created_at || comment.createdAt || comment.timestamp
  };

  console.log('🔍 CommentItem normalized:', {
    commentId: normalizedComment.comment_id || normalizedComment.id,
    normalizedReactions: normalizedComment.reactions,
    hasReactions: Object.keys(normalizedComment.reactions || {}).length > 0,
    originalReactions: comment.reactions,
    reactionType: typeof comment.reactions,
    rawReactionData: comment.reactions,
    isReactionsArray: Array.isArray(comment.reactions),
    author: comment.author,
    content: comment.content,
    contentIsNull: comment.content === null
  });

  const handleCommentReaction = (reactionType) => {
    if (isPublicView) return;
    
    console.log('🔍 CommentItem handleCommentReaction called:', {
      commentId: comment.comment_id || comment.id,
      reactionType,
      currentUserReaction: getCommentUserReaction(normalizedComment)
    });
    
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

  return (
    <div className="bg-gray-50 p-3 rounded-lg mb-2">
      {/* Comment Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {(comment.author?.username || comment.author || 'A')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-medium text-sm text-gray-900">
              {comment.author?.username || comment.author || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Just now'}
            </span>
          </div>
        </div>
        
        {/* Delete Button (only show for comment author or post owner) */}
        {!isPublicView && user && (
          (comment.author?.username === user.username || 
           comment.author === user.username) && (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        {(() => {
          const content = comment.content;
          
          console.log('🔍 Comment content detection:', {
            commentId: comment.comment_id || comment.id,
            content: content,
            hasContent: !!(content && content.toString().trim()),
            author: comment.author
          });
          
          if (content && content.toString().trim()) {
            return (
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {content.toString().trim()}
              </p>
            );
          } else {
            return (
              <p className="text-gray-400 text-sm italic">
                {content === null ? 'Comment content is empty' : 'No content available'}
              </p>
            );
          }
        })()}
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
              onClick={() => handleCommentReaction('like')}
              disabled={isPublicView}
              className={`flex items-center space-x-2 text-sm ${
                isPublicView 
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-500 hover:text-red-600'
              } transition-colors`}
            >
              {(() => {
                const userReaction = getCommentUserReaction(normalizedComment);
                console.log('🔍 CommentItem emoji rendering:', {
                  commentId: comment.comment_id || comment.id,
                  userReaction,
                  normalizedReactions: normalizedComment.reactions
                });
                
                if (userReaction && userReaction !== 'like') {
                  // Show the emoji for the user's reaction
                  const reactionEmoji = emojiReactions.find(r => r.name === userReaction);
                  console.log('🔍 Found reaction emoji:', {
                    userReaction,
                    reactionEmoji,
                    emojiReactionsArray: emojiReactions
                  });
                  return (
                    <span className="text-lg">
                      {reactionEmoji?.emoji || '👍'}
                    </span>
                  );
                } else {
                  // Show heart for like or default state
                  console.log('🔍 Showing heart for like or default');
                  return (
                    <Heart className={`h-4 w-4 ${
                      userReaction === 'like' || hasUserReacted(`comment_${comment.comment_id || comment.id}`, 'like') 
                        ? 'fill-current text-red-600' 
                        : ''
                    }`} />
                  );
                }
              })()}
              <span>
                {(() => {
                  const userReaction = getCommentUserReaction(normalizedComment);
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
                const reactions = normalizedComment.reactions || {};
                const totalCount = Object.values(reactions).reduce((total, users) => {
                  if (Array.isArray(users)) {
                    return total + users.length;
                  }
                  return total;
                }, 0);
                
                console.log('🔍 Reaction count calculation:', {
                  commentId: comment.comment_id || comment.id,
                  reactions,
                  totalCount,
                  hasReactions: totalCount > 0
                });
                
                return totalCount > 0 ? (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {totalCount}
                  </span>
                ) : null;
              })()}
            </button>

            {/* Hover Reactions Dropdown */}
            {showCommentReactions?.[comment.comment_id || comment.id] && !isPublicView && (
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
            disabled={isPublicView}
            className={`flex items-center space-x-2 text-sm ${
              isPublicView 
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-500 hover:text-blue-600'
            } transition-colors`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Reply</span>
          </button>
        </div>
      </div>

      {/* Show Reaction Details */}
      {(() => {
        const reactions = normalizedComment.reactions || {};
        const hasValidReactions = Object.entries(reactions).some(([_, users]) => 
          Array.isArray(users) && users.length > 0
        );
        
        if (!hasValidReactions) return null;
        
        return (
          <div className="mt-2 text-xs text-gray-500">
            {Object.entries(reactions).map(([reactionType, users]) => {
              if (!Array.isArray(users) || users.length === 0) return null;
              const emoji = emojiReactions.find(r => r.name === reactionType)?.emoji || '👍';
              const count = users.length;
              return (
                <span key={reactionType} className="mr-3">
                  {emoji} {count} {count === 1 ? 'person' : 'people'}
                </span>
              );
            })}
          </div>
        );
      })()}

      {/* Reply Input (if replying to this comment) */}
      {replyingTo === (comment.comment_id || comment.id) && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Replying to {comment.author?.username || comment.author || 'Anonymous'}</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
              Reply
            </button>
            <button 
              onClick={() => onToggleReply(null)}
              className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentItem;