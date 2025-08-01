import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Heart, MessageCircle, Edit, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ 
  comment, 
  user,
  isPublicView,
  emojiReactions,
  handleDeleteComment,
  handleEditComment,
  handleReactToComment,
  handleCommentReply,
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
  const [replyContent, setReplyContent] = useState('');
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

  // Check if current user is the comment author
  const isCommentAuthor = user && (
    comment.author?.user_id === user.user_id ||
    comment.author?.user_id === user.id ||
    comment.author?.username === user.username ||
    comment.author === user.username
  );

  console.log('🔍 CommentItem props debug:', {
    hasHandleEditComment: typeof handleEditComment,
    hasHandleCommentReply: typeof handleCommentReply,
    hasHandleDeleteComment: typeof handleDeleteComment,
    handleEditCommentFunction: handleEditComment,
    isCommentAuthor
  });

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

  const handleEdit = () => {
    if (isPublicView || !isCommentAuthor) return;
    setIsEditing(true);
    setEditContent(comment.content || '');
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    console.log('🔍 handleSaveEdit called:', {
      editContent: editContent.trim(),
      commentContent: comment.content,
      hasEditContent: !!editContent.trim(),
      contentChanged: editContent !== comment.content,
      handleEditComment: typeof handleEditComment,
      commentId: comment.comment_id || comment.id
    });
    
    if (editContent.trim() && editContent !== comment.content) {
      handleEditComment(comment.comment_id || comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content || '');
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
        
        {/* Action Menu (only show for comment author) */}
        {!isPublicView && isCommentAuthor && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
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

      {/* Comment Content */}
      <div className="mb-3">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows="3"
              placeholder="Edit your comment..."
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
            
            console.log('🔍 Comment content detection:', {
              commentId: comment.comment_id || comment.id,
              content: content,
              hasContent: !!(content && content.toString().trim()),
              author: comment.author
            });
            
            if (content && content.toString().trim()) {
              return (
                <div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {content.toString().trim()}
                  </p>
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
                      userReaction === 'like' 
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

      {/* Reply Input (if replying to this comment) */}
      {replyingTo === (comment.comment_id || comment.id) && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Replying to {comment.author?.username || comment.author || 'Anonymous'}</p>
          <div className="space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows="2"
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
        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id || reply.reply_id} className="bg-white p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">
                    {reply.author?.username || reply.author || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {reply.created_at ? formatDistanceToNow(new Date(reply.created_at), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;