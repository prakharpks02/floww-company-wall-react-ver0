import React from 'react';
import { MessageCircle } from 'lucide-react';

const PostStats = ({ totalLikes, totalReactions, totalComments, shareCount, getTopReactions, getAllReactions }) => {
  // Get all reactions for display
  const allReactions = getAllReactions ? getAllReactions() : [];
  
  // Filter out reactions with zero counts and make sure we have actual reactions
  const activeReactions = allReactions.filter(reaction => reaction && reaction.count > 0);
  
  // Calculate total reaction count
  const totalReactionCount = activeReactions.reduce((sum, reaction) => sum + reaction.count, 0);
  
  // Only show reactions if there are actual reactions
  const hasReactions = totalReactionCount > 0 && activeReactions.length > 0;
  const hasComments = totalComments > 0;
  
  if (!hasReactions && !hasComments) return null;

  // Build tooltip text for reactions
  const reactionTooltip = activeReactions
    .map(r => `${r.emoji} ${r.count}`)
    .join(', ');

  return (
    <div className="flex items-center justify-between py-2 px-4 text-sm border-b border-gray-100">
      {/* Left side - Reactions (LinkedIn style) */}
      {hasReactions && (
        <div className="flex items-center space-x-2">
          {/* LinkedIn-style stacked reaction emojis with circular backgrounds */}
          <div className="flex items-center">
            <div className="flex items-center -space-x-1">
              {activeReactions.slice(0, 3).map((reaction, index) => (
                <div
                  key={reaction.type}
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-white shadow-sm"
                  style={{ 
                    zIndex: activeReactions.length - index,
                    fontSize: '0.7rem'
                  }}
                  title={`${reaction.emoji} ${reaction.count}`}
                >
                  {reaction.emoji}
                </div>
              ))}
            </div>
            <span 
              className="ml-2 text-sm text-gray-600 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
              title={reactionTooltip}
            >
              {totalReactionCount}
            </span>
          </div>
        </div>
      )}
      
      {/* Right side - Comments */}
      {hasComments && (
        <div className="flex items-center text-gray-600 hover:text-blue-600 hover:underline cursor-pointer transition-colors ml-auto">
          <span className="text-sm">
            {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      )}
    </div>
  );
};

export default PostStats;
