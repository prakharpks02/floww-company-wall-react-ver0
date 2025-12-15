import React from 'react';
import { MessageCircle, Share2 } from 'lucide-react';

const PostStats = ({ totalLikes, totalReactions, totalComments, shareCount, getTopReactions, getAllReactions }) => {
  // Get all reactions for display
  const allReactions = getAllReactions ? getAllReactions() : [];
  
  // Filter out reactions with zero counts and make sure we have actual reactions
  const activeReactions = allReactions.filter(reaction => reaction && reaction.count > 0);
  
  // Calculate total reaction count (exclude reactions that are just likes without specific emoji reactions)
  const totalReactionCount = activeReactions.reduce((sum, reaction) => sum + reaction.count, 0);
  
  // Only show reactions if there are actual emoji reactions (not just likes)
  const hasReactions = totalReactionCount > 0 && activeReactions.length > 0;
  const hasComments = totalComments > 0;
  
  if (!hasReactions && !hasComments) return null;

  return (
    <div className="flex items-center justify-between mb-3 text-sm">
      {/* Left side - Reactions (WhatsApp style) */}
      {hasReactions && (
        <div className="flex items-center space-x-2">
          {/* Single reaction indicator with total count */}
          <div
            className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 transition-colors cursor-pointer"
            title={`${totalReactionCount} reaction${totalReactionCount !== 1 ? 's' : ''}`}
          >
            {/* Show top 2-3 reaction emojis if multiple, otherwise just the top one */}
            <div className="flex items-center -space-x-0.5">
              {activeReactions.slice(0, Math.min(3, activeReactions.length)).map((reaction, index) => (
                <span 
                  key={reaction.type} 
                  className="text-sm"
                  style={{ zIndex: activeReactions.length - index }}
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
            <span className="text-xs font-medium text-gray-700 ml-1">
              {totalReactionCount}
            </span>
          </div>
        </div>
      )}
      
      {/* Right side - Comments */}
      {hasComments && (
        <div className="flex items-center space-x-4 text-gray-500 ml-auto">
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span>{totalComments}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostStats;
