import React, { useState } from 'react';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { dummyEmployees, getConversationPartner, formatMessageTime } from './utils/dummyData';
import { useChat } from '../../contexts/ChatContext';

const ChatSidebar = ({ onSelectConversation, onStartNewChat, activeConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  const { conversations, totalUnreadMessages } = useChat();
  const currentUser = dummyEmployees[0]; // Shreyansh Shandilya

  // Filter employees for search
  const filteredEmployees = dummyEmployees.filter(emp => 
    emp.id !== currentUser.id && 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter conversations for search
  const filteredConversations = conversations.filter(conv => {
    const partner = getConversationPartner(conv, currentUser.id);
    return partner?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowUserSearch(value.length > 0);
  };

  const startNewConversation = (employee) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      conv.participants.includes(employee.id) && conv.participants.includes(currentUser.id)
    );

    if (existingConv) {
      onSelectConversation(existingConv);
    } else {
      onStartNewChat(employee);
    }
    setShowUserSearch(false);
    setSearchQuery('');
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-[#f0f2f5] px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-[#f0f2f5] border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {showUserSearch ? (
          <div className="p-2">
            <div className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              CONTACTS
            </div>
            {filteredEmployees.map(employee => (
              <button
                key={employee.id}
                onClick={() => startNewConversation(employee)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {employee.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(employee.status)}`}></div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-gray-900 truncate">{employee.name}</div>
                  <div className="text-sm text-gray-500 truncate">{employee.role} • {employee.department}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conversation => {
                const partner = getConversationPartner(conversation, currentUser.id);
                const isActive = activeConversation?.id === conversation.id;
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`w-full flex items-center gap-3 p-3 transition-colors ${
                      isActive 
                        ? 'bg-gray-100 border-r-4 border-green-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {partner?.avatar}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900 truncate">{partner?.name}</div>
                        <div className="flex items-center gap-1">
                          {conversation.lastMessage && (
                            <div className="text-xs text-gray-500">
                              {formatMessageTime(conversation.lastMessage.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 truncate flex-1">
                          {conversation.lastMessage?.text || 'No messages yet'}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="bg-green-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium ml-2">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center text-gray-500 mt-12 px-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-500">
                  Start a conversation by searching for colleagues above
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
