import React, { useState } from 'react';
import { MessageCircle, X, Minimize2, Send, Phone, Video, Info, ArrowLeft, Maximize2, Search } from 'lucide-react';
import { dummyEmployees, getEmployeeById, getConversationPartner, formatMessageTime } from './utils/dummyData';
import { useChat } from '../../contexts/ChatContext';
import ChatSidebar from './ChatSidebar';

const ChatApp = ({ isMinimized, onToggleMinimize, onClose }) => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCompactMode, setIsCompactMode] = useState(true); // Start in compact mode
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  
  const {
    conversations,
    messages,
    setActiveConversation: setGlobalActiveConversation,
    sendMessage,
    createConversation,
    markConversationAsRead
  } = useChat();
  
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    sendMessage(activeConversation.id, currentUser.id, newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    setGlobalActiveConversation(conversation);
    markConversationAsRead(conversation.id);
  };

  const handleStartNewChat = (employee) => {
    const existingConv = conversations.find(conv => 
      conv.participants.includes(employee.id) && conv.participants.includes(currentUser.id)
    );

    if (existingConv) {
      setActiveConversation(existingConv);
      setGlobalActiveConversation(existingConv);
    } else {
      const newConv = createConversation([currentUser.id, employee.id]);
      setActiveConversation(newConv);
      setGlobalActiveConversation(newConv);
    }
    setShowUserList(false);
    setSearchQuery('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const toggleCompactMode = () => {
    setIsCompactMode(!isCompactMode);
  };

  // Check if we're on mobile/small screen
  const isMobile = window.innerWidth < 1024;

  // Minimized state - just the toggle button
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
          {conversations.reduce((total, conv) => total + conv.unreadCount, 0) > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Compact mode - small popup chat (like normal chat window)
  if (isCompactMode || isMobile) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            {activeConversation && (
              <button
                onClick={() => setActiveConversation(null)}
                className="p-1 hover:bg-purple-700 rounded"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="font-semibold">
              {activeConversation 
                ? getConversationPartner(activeConversation, currentUser.id)?.name 
                : 'Chat'
              }
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {activeConversation && (
              <>
                <button className="p-1 hover:bg-purple-700 rounded">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-purple-700 rounded">
                  <Video className="h-4 w-4" />
                </button>
              </>
            )}
            {!isMobile && (
              <button
                onClick={toggleCompactMode}
                className="p-1 hover:bg-purple-700 rounded"
                title="Expand chat"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onToggleMinimize}
              className="p-1 hover:bg-purple-700 rounded"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-purple-700 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Compact Chat Content */}
        {!activeConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowUserList(e.target.value.length > 0);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Conversations List or User Search Results */}
            <div className="flex-1 overflow-y-auto">
              {showUserList ? (
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Start New Chat</h4>
                  {filteredEmployees.map(employee => (
                    <button
                      key={employee.id}
                      onClick={() => handleStartNewChat(employee)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {employee.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(employee.status)}`}></div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map(conversation => {
                      const partner = getConversationPartner(conversation, currentUser.id);
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {partner?.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm">{partner?.name}</div>
                              {conversation.lastMessage && (
                                <div className="text-xs text-gray-500">
                                  {formatMessageTime(conversation.lastMessage.timestamp)}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage?.text || 'No messages yet'}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Search for colleagues to start chatting</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {(messages[activeConversation.id] || []).map(message => {
                const isOwnMessage = message.senderId === currentUser.id;
                const sender = getEmployeeById(message.senderId);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && (
                        <div className="text-xs text-gray-500 mb-1">{sender?.name}</div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.text}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full desktop layout with sidebar
  return (
    <div className="fixed top-16 right-0 w-[800px] h-[calc(100vh-4rem)] bg-white border-l border-gray-200 shadow-lg z-40 flex">
      {/* Chat Sidebar */}
      <ChatSidebar 
        onSelectConversation={handleSelectConversation}
        onStartNewChat={handleStartNewChat}
        activeConversation={activeConversation}
      />
      
      {/* Chat Content */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col border-l border-gray-200">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getConversationPartner(activeConversation, currentUser.id)?.avatar}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)}`}></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {getConversationPartner(activeConversation, currentUser.id)?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {getConversationPartner(activeConversation, currentUser.id)?.status === 'online' ? 'Active now' : 
                   getConversationPartner(activeConversation, currentUser.id)?.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <Video className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <Info className="h-5 w-5" />
              </button>
              <button
                onClick={toggleCompactMode}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Minimize to small chat"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(messages[activeConversation.id] || []).map(message => {
              const isOwnMessage = message.senderId === currentUser.id;
              const sender = getEmployeeById(message.senderId);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">{sender?.name}</div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm ${
                        isOwnMessage
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right mr-1' : 'text-left ml-1'}`}>
                      {formatMessageTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-sm">Choose from your existing conversations or start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
