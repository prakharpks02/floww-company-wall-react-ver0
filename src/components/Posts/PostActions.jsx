import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Flag } from 'lucide-react';
import { useLongPress } from '../../hooks/useLongPress';

const PostActions = ({ 
  isLiked,
  hasAnyReaction,
  isPublicView,
  isBlocked = false,
  isAdmin = false, // Add admin prop
  handleLike,
  totalLikes,
  getAllReactions,
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
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileReactions, setShowMobileReactions] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Long press handlers for mobile
  const longPressHandlers = useLongPress(
    (event) => {
      // Long press - show reactions menu on mobile
      if (isMobile && !isDisabled) {
        event.preventDefault();
        setShowMobileReactions(true);
      }
    },
    (event) => {
      // Short press - quick like
      if (!showMobileReactions) {
        handleLike(event);
      }
    },
    300 // 300ms for long press
  );

  // Close mobile reactions when tapping outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileReactions && !event.target.closest('.mobile-reactions')) {
        setShowMobileReactions(false);
      }
    };

    if (showMobileReactions) {
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileReactions]);
  
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Like and Comment */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Like Button with Hover/Long Press Reactions */}
        <div 
          className="relative"
          onMouseEnter={!isMobile ? handleReactionsMouseEnter : undefined}
          onMouseLeave={!isMobile ? handleReactionsMouseLeave : undefined}
        >
          <button
            {...(isMobile ? longPressHandlers : { 
              onClick: (() => {
                const userReaction = getUserReaction();
                if (userReaction && userReaction !== 'love' && userReaction !== 'like') {
                  // User has a non-love reaction, so clicking should toggle that reaction
                  return (event) => handleReaction(userReaction, event);
                } else {
                  // User has no reaction or love reaction, so clicking should toggle love
                  return handleLike;
                }
              })()
            })}
            disabled={isDisabled}
            title={
              isAdmin ? "Admin users cannot react to posts" :
              isBlocked ? "Blocked users cannot like posts" :
              isPublicView ? "Login to like posts" : 
              isMobile ? "Tap to like, hold for more reactions" :
              (() => {
                const userReaction = getUserReaction();
                if (userReaction && userReaction !== 'love' && userReaction !== 'like') {
                  return `Remove ${emojiReactions.find(r => r.name === userReaction)?.label || 'reaction'}`;
                } else {
                  return "Like this post";
                }
              })()
            }
            className={`flex items-center space-x-1 sm:space-x-2 text-sm touch-friendly p-2 rounded-lg transition-all duration-200 select-none ${
              isLiked
                ? 'text-red-600 bg-red-50'
                : isDisabled 
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            {/* Show user's current reaction or heart */}
            {(() => {
              const userReaction = getUserReaction();
              if (userReaction && userReaction !== 'love' && userReaction !== 'like') {
                // Show the emoji reaction the user has
                const reactionEmoji = emojiReactions.find(r => r.name === userReaction)?.emoji;
                return <span className="text-lg">{reactionEmoji}</span>;
              } else {
                // Show heart (filled if user has liked or any reaction)
                return <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? 'fill-current' : ''}`} />;
              }
            })()}
            <span className="hidden xs:inline">
              {(() => {
                const userReaction = getUserReaction();
                if (userReaction && userReaction !== 'love' && userReaction !== 'like') {
                  // Show the reaction name
                  const reactionLabel = emojiReactions.find(r => r.name === userReaction)?.label;
                  return reactionLabel || 'React';
                } else {
                  return 'Like';
                }
              })()}
            </span>
          </button>

          {/* Desktop Hover Reactions Dropdown */}
          {showReactions && !isDisabled && !isMobile && (
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

          {/* Mobile Reactions Modal */}
          {showMobileReactions && !isDisabled && isMobile && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black bg-opacity-25 z-40" />
              
              {/* Modal */}
              <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl p-6 z-50 mobile-reactions animate-slide-up">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>
                
                <h3 className="text-lg font-semibold text-center mb-6">Choose your reaction</h3>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {emojiReactions.map((reaction) => (
                    <button
                      key={reaction.name}
                      onClick={(event) => {
                        handleReaction(reaction.name, event);
                        setShowMobileReactions(false);
                      }}
                      className="flex flex-col items-center p-4 rounded-2xl hover:bg-gray-100 transition-all duration-200 transform active:scale-95"
                    >
                      <span className="text-3xl mb-2">{reaction.emoji}</span>
                      <span className="text-xs font-medium text-gray-600">{reaction.label}</span>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowMobileReactions(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
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
