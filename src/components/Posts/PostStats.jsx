import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

const PostStats = ({ totalLikes, totalReactions, totalComments, shareCount, getTopReactions }) => {
  if (totalReactions === 0 && totalLikes === 0 && totalComments === 0 && shareCount === 0) return null;

  return (
    <div className="flex items-center justify-between mb-3 text-sm">
      <div className="flex items-center space-x-4">
        {/* Like Count */}
        {totalLikes > 0 && (
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span className="text-gray-600">{totalLikes}</span>
          </div>
        )}
        
        {/* Emoji Reactions */}
        {totalReactions > 0 && (
          <div className="flex items-center space-x-1">
            {getTopReactions().map((reaction, index) => (
              <div key={reaction.type || index} className="flex items-center">
                <span className="text-lg">{reaction.emoji}</span>
                {index === getTopReactions().length - 1 && (
                  <span className="ml-1 text-gray-600">{totalReactions}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Always show the right side if there are comments or shares */}
      {(totalComments > 0 || shareCount > 0) && (
        <div className="flex items-center space-x-4 text-gray-500">
          {totalComments > 0 && (
            <span>{totalComments} {totalComments === 1 ? 'comment' : 'comments'}</span>
          )}
          {shareCount > 0 && (
            <span>{shareCount} {shareCount === 1 ? 'share' : 'shares'}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PostStats;
