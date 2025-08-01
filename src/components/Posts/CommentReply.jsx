import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentReply = ({ 
  reply, 
  user,
  isPublicView,
  commentId,
  handleDeleteReply,
  getCommentTopReactions,
  getCommentTotalReactions
}) => {
  // Normalize reply reactions array to object
  let normalizedReply = { ...reply };
  if (Array.isArray(reply.reactions)) {
    const reactionsObj = {};
    reply.reactions.forEach(reaction => {
      const type = reaction.reaction_type;
      if (!reactionsObj[type]) {
        reactionsObj[type] = { users: [], count: 0 };
      }
      if (!reactionsObj[type].users.includes(reaction.user_id)) {
        reactionsObj[type].users.push(reaction.user_id);
        reactionsObj[type].count++;
      }
    });
    normalizedReply.reactions = reactionsObj;
  }

  return (
    <div className="flex space-x-2">
      <img
        src={reply.authorAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(reply.authorName || 'User') + '&background=random'}
        alt={reply.authorName}
        className="h-6 w-6 rounded-full object-cover bg-gray-200"
        onError={e => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(reply.authorName || 'User') + '&background=random'; }}
      />
      <div className="flex-1">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-xs text-gray-900">
                {reply.authorName}
              </span>
              <span className="text-xs text-gray-500">
                {reply.timestamp && !isNaN(new Date(reply.timestamp))
                  ? formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })
                  : 'Just now'
                }
              </span>
            </div>
            {/* Delete button for reply author */}
            {!isPublicView && reply.authorId === user?.id && (
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
        </div>
        {/* Show reply reactions just like for comments */}
        {getCommentTotalReactions(normalizedReply) > 0 && (
          <div className="flex items-center space-x-1 mt-1">
            {getCommentTopReactions(normalizedReply).map((reaction, index) => (
              <span key={reaction.type} className="text-sm">{reaction.emoji}</span>
            ))}
            <span className="ml-1 text-xs text-gray-600">{getCommentTotalReactions(normalizedReply)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentReply;
