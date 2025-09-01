import React from 'react';
import { Pin, Star, MoreVertical } from 'lucide-react';

const MobileConversationItem = ({
  conversation,
  partner,
  isPinned,
  isFavorite,
  onSelect,
  onContextMenu,
  formatMessageTime,
  getStatusColor
}) => {
  const handleLongPress = (e) => {
    const timeoutId = setTimeout(() => {
      e.preventDefault();
      const touch = e.touches[0];
      onContextMenu({
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY
      }, conversation);
    }, 500);
    
    const handleTouchEnd = () => {
      clearTimeout(timeoutId);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchEnd);
  };

  const handleThreeDotsClick = (e) => {
    e.stopPropagation();
    onContextMenu(e, conversation);
  };

  return (
    <div className="relative">
      <button
        onClick={() => onSelect(conversation)}
        onContextMenu={(e) => onContextMenu(e, conversation)}
        onTouchStart={handleLongPress}
        className="w-full flex items-center gap-4 p-3 hover:bg-white rounded-lg transition-all duration-200"
      >
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg shadow-md">
            {partner?.avatar}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div>
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="text-base font-normal truncate">{partner?.name}</div>
              {isPinned && (
                <Pin className="h-4 w-4 text-purple-600 flex-shrink-0" />
              )}
              {isFavorite && (
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {conversation.lastMessage && (
                <span className="text-xs text-gray-500">
                  {formatMessageTime(conversation.lastMessage.timestamp)}
                </span>
              )}
              {conversation.unreadCount > 0 && (
                <span className="bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500 truncate">
            {conversation.lastMessage?.text || 'No messages yet'}
          </div>
        </div>
      </button>
      
      {/* Mobile-only three dots menu */}
      <button
        onClick={handleThreeDotsClick}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 md:hidden"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MobileConversationItem;
