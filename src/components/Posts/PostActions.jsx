import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

const PostActions = ({ 
  isLiked,
  isPublicView,
  handleLike,
  totalLikes,
  getUserReaction,
  emojiReactions,
  showReactions,
  setShowComments,
  showComments,
  handleShare,
  shareCount,
  handleReactionsMouseEnter,
  handleReactionsMouseLeave,
  handleReaction
}) => {
  return (
    <div className="flex items-center space-x-6">
      {/* Like Button with Hover Reactions */}
      <div 
        className="relative"
        onMouseEnter={handleReactionsMouseEnter}
        onMouseLeave={handleReactionsMouseLeave}
      >
        <button
          onClick={handleLike}
          disabled={isPublicView}
          title={isPublicView ? "Login to like posts" : "Like this post"}
          className={`flex items-center space-x-2 text-sm ${
            isLiked
              ? 'text-red-600'
              : isPublicView 
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-500 hover:text-red-600'
          } transition-colors`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          <span>Like</span>
          {totalLikes > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {totalLikes}
            </span>
          )}
          {/* Show user's emoji reaction if they have one */}
          {getUserReaction() && (
            <span className="text-lg">
              {emojiReactions.find(r => r.name === getUserReaction())?.emoji || ''}
            </span>
          )}
        </button>

        {/* Hover Reactions Dropdown */}
        {showReactions && !isPublicView && (
          <div 
            className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-2 flex items-center space-x-1 z-20"
            onMouseEnter={handleReactionsMouseEnter}
            onMouseLeave={handleReactionsMouseLeave}
          >
            {emojiReactions.map((reaction) => (
              <button
                key={reaction.name}
                onClick={(event) => handleReaction(reaction.name, event)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors transform hover:scale-110"
                title={reaction.label}
              >
                <span className="text-xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowComments(!showComments)}
        title={isPublicView ? "View comments (login to interact)" : "View comments"}
        className={`flex items-center space-x-2 text-sm transition-colors ${
          isPublicView 
            ? 'text-gray-500'
            : 'text-gray-500 hover:text-blue-600'
        }`}
      >
        <MessageCircle className="h-5 w-5" />
        <span>Comment</span>
      </button>

      <button 
        onClick={handleShare}
        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
      >
        <Share2 className="h-5 w-5" />
        <span>Share</span>
        {shareCount > 0 && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {shareCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default PostActions;
