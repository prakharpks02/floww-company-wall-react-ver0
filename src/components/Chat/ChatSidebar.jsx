import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, MoreVertical, Users, Pin, Filter } from 'lucide-react';
import { dummyEmployees, getConversationPartner, formatMessageTime } from './utils/dummyData';
import { useChat } from '../../contexts/ChatContext';

const ChatSidebar = ({ onSelectConversation, onStartNewChat, activeConversation, onCreateGroup, onChatContextMenu, pinnedChats = [], chatFilter = 'all', onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showPlusDropdown, setShowPlusDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const { conversations, totalUnreadMessages } = useChat();
  const currentUser = dummyEmployees[0]; // Shreyansh Shandilya

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPlusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter employees for search
  const filteredEmployees = dummyEmployees.filter(emp => 
    emp.id !== currentUser.id && 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter conversations for search and type
  const filteredConversations = conversations.filter(conv => {
    const partner = getConversationPartner(conv, currentUser.id);
    const matchesSearch = partner?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply chat filter
    if (chatFilter === 'direct') {
      return conv.type === 'direct' && matchesSearch;
    } else if (chatFilter === 'groups') {
      return conv.type === 'group' && matchesSearch;
    }
    
    return matchesSearch; // 'all' filter
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
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowPlusDropdown(!showPlusDropdown)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Plus className="h-5 w-5 text-gray-600" />
              </button>
              
              {/* Dropdown Menu */}
              {showPlusDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowUserSearch(true);
                        setShowPlusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                      <span>New Chat</span>
                    </button>
                    <button
                      onClick={() => {
                        onCreateGroup();
                        setShowPlusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm"
                    >
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span>Create Group</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
        
        {/* Filter Buttons */}
        {!showUserSearch && (
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => onFilterChange && onFilterChange('all')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                chatFilter === 'all' 
                  ? 'bg-[#FFAD46] text-white border-[#FFAD46]' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onFilterChange && onFilterChange('direct')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                chatFilter === 'direct' 
                  ? 'bg-[#FFAD46] text-white border-[#FFAD46]' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => onFilterChange && onFilterChange('groups')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                chatFilter === 'groups' 
                  ? 'bg-[#FFAD46] text-white border-[#FFAD46]' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Groups
            </button>
          </div>
        )}
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
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
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
            {/* Pinned Chats Section */}
            {pinnedChats.length > 0 && !searchQuery && (
              <div className="mb-4">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Pin className="w-3 h-3" />
                  Pinned
                </div>
                {pinnedChats.map(conversation => {
                  const partner = getConversationPartner(conversation, currentUser.id);
                  const isActive = activeConversation?.id === conversation.id;
                  
                  return (
                    <button
                      key={`pinned-${conversation.id}`}
                      onClick={() => onSelectConversation(conversation)}
                      onContextMenu={(e) => onChatContextMenu && onChatContextMenu(e, conversation)}
                      className={`w-full flex items-center gap-3 p-3 transition-colors bg-orange-50 border-l-4 border-[#FFAD46] ${
                        isActive 
                          ? 'bg-orange-100 border-r-4 border-green-500' 
                          : 'hover:bg-orange-100'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {partner?.avatar}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFAD46] rounded-full flex items-center justify-center">
                          <Pin className="w-2 h-2 text-white" />
                        </div>
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
                          <div className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage?.text || 'No messages yet'}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <div className="border-b border-gray-200 my-2"></div>
              </div>
            )}

            {/* Regular Conversations */}
            {filteredConversations.length > 0 ? (
              filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                const partner = getConversationPartner(conversation, currentUser.id);
                const isActive = activeConversation?.id === conversation.id;
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    onContextMenu={(e) => onChatContextMenu && onChatContextMenu(e, conversation)}
                    className={`w-full flex items-center gap-3 p-3 transition-colors ${
                      isActive 
                        ? 'bg-gray-100 border-r-4 border-green-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
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
