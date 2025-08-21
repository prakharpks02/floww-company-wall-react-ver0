import React from 'react';
import { Heart, MessageCircle, Share2, Flag } from 'lucide-react';

const PostActions = ({ 
  isLiked,
  isPublicView,
  isBlocked = false,
  isAdmin = false, // Add admin prop
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
  handleReaction,
  handleReport,
  isOwnPost = false
}) => {
  const isDisabled = isPublicView || isBlocked || isAdmin;
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
          disabled={isDisabled}
          title={
            isAdmin ? "Admin users cannot react to posts" :
            isBlocked ? "Blocked users cannot like posts" :
            isPublicView ? "Login to like posts" : 
            "Like this post"
          }
          className={`flex items-center space-x-2 text-sm ${
            isLiked
              ? 'text-red-600'
              : isDisabled 
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
        {showReactions && !isDisabled && (
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
        title={
          isAdmin ? "Admin users cannot comment on posts" :
          isBlocked ? "Blocked users cannot comment" :
          isPublicView ? "View comments (login to interact)" : 
          "View comments"
        }
        className={`flex items-center space-x-2 text-sm transition-colors ${
          isDisabled 
            ? 'text-gray-400'
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

      {/* Report Button - Only show if not own post, user is logged in, and not blocked */}
      {!isOwnPost && !isPublicView && !isBlocked && handleReport && (
        <button 
          onClick={handleReport}
          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          title="Report this post"
        >
          <Flag className="h-4 w-4" />
          <span>Report</span>
        </button>
      )}
    </div>
  );
};

export default PostActions;
