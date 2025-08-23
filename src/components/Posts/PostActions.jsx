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
    <div className="flex items-center justify-between w-full">
      {/* Left side - Like and Comment */}
      <div className="flex items-center space-x-4 sm:space-x-6">
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
            className={`flex items-center space-x-1 sm:space-x-2 text-sm touch-friendly p-2 rounded-lg transition-all duration-200 ${
              isLiked
                ? 'text-red-600 bg-red-50'
                : isDisabled 
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline">Like</span>
            {totalLikes > 0 && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {totalLikes}
              </span>
            )}
            {/* Show user's emoji reaction if they have one */}
            {getUserReaction() && (
              <span className="text-base sm:text-lg">
                {emojiReactions.find(r => r.name === getUserReaction())?.emoji || ''}
              </span>
            )}
          </button>

          {/* Hover Reactions Dropdown */}
          {showReactions && !isDisabled && (
            <div 
              className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-2 flex items-center space-x-1 z-20 animate-scale-in"
              onMouseEnter={handleReactionsMouseEnter}
              onMouseLeave={handleReactionsMouseLeave}
            >
              {emojiReactions.map((reaction) => (
                <button
                  key={reaction.name}
                  onClick={(event) => handleReaction(reaction.name, event)}
                  className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-all duration-200 transform hover:scale-110 touch-friendly"
                  title={reaction.label}
                >
                  <span className="text-lg sm:text-xl">{reaction.emoji}</span>
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
          className={`flex items-center space-x-1 sm:space-x-2 text-sm touch-friendly p-2 rounded-lg transition-all duration-200 ${
            isDisabled 
              ? 'text-gray-400'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline">Comment</span>
        </button>
      </div>

      {/* Right side - Share and Report */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button 
          onClick={handleShare}
          className="flex items-center space-x-1 sm:space-x-2 text-sm text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 touch-friendly p-2 rounded-lg"
        >
          <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Share</span>
          {shareCount > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {/* {shareCount} */}
            </span>
          )}
        </button>

        {/* Report Button - Only show if not own post, user is logged in, and not blocked */}
        {!isOwnPost && !isPublicView && !isBlocked && handleReport && (
          <button 
            onClick={handleReport}
            className="flex items-center space-x-1 sm:space-x-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 touch-friendly p-2 rounded-lg"
            title="Report this post"
          >
            <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden lg:inline">Report</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PostActions;
