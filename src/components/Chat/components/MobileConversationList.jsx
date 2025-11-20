import React from 'react';
import { MessageCircle } from 'lucide-react';
import MobileConversationItem from './MobileConversationItem';

const MobileConversationList = ({
  filteredConversations,
  pinnedChats,
  favouriteChats,
  currentUser,
  getConversationPartner,
  formatMessageTime,
  getStatusColor,
  messageHandlers,
  navigationHandlers,
  contextMenuHandlers,
  setSearchQuery,
  conversationsLoading
}) => {
  // Show loading state
  if (conversationsLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg text-gray-700 mb-2">No conversations yet</h3>
        <p className="text-gray-500 mb-4">Start a new chat with your colleagues</p>
        <button
          onClick={() => setSearchQuery('contacts')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Start New Chat
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        {filteredConversations.map(conversation => {
          const partner = getConversationPartner(conversation, currentUser?.id || currentUser?.employeeId);
          const isPinned = pinnedChats.find(p => p.id === conversation.id);
          const isFavorite = favouriteChats.find(f => f.id === conversation.id);
          
          return (
            <MobileConversationItem
              key={conversation.id}
              conversation={conversation}
              partner={partner}
              isPinned={isPinned}
              isFavorite={isFavorite}
              onSelect={navigationHandlers.handleSelectConversation}
              onContextMenu={contextMenuHandlers.handleChatContextMenu}
              formatMessageTime={formatMessageTime}
              getStatusColor={getStatusColor}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MobileConversationList;
