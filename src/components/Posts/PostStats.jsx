import React from 'react';
import { MessageCircle, Share2 } from 'lucide-react';

const PostStats = ({ totalLikes, totalReactions, totalComments, shareCount, getTopReactions, getAllReactions }) => {
  // Only show comments and shares in stats, reactions moved to action button only
  if (totalComments === 0 && shareCount === 0) return null;

  return (
    <div className="flex items-center justify-end mb-3 text-sm">
      {/* Only show comments and shares */}
      <div className="flex items-center space-x-4 text-gray-500">
        {totalComments > 0 && (
          <span>{totalComments} {totalComments === 1 ? 'comment' : 'comments'}</span>
        )}
        {shareCount > 0 && (
          <span>{shareCount} {shareCount === 1 ? 'share' : 'shares'}</span>
        )}
      </div>
    </div>
  );
};

export default PostStats;
