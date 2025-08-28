import React from 'react';
import { MessageCircle } from 'lucide-react';

const ChatToggleButton = ({ onClick, hasUnreadMessages = false, unreadCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50"
      title="Open Chat"
    >
      <MessageCircle className="h-6 w-6" />
      {hasUnreadMessages && unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatToggleButton;
