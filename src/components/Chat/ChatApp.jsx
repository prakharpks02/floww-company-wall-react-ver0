import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Maximize2, Send, Phone, Video, Info, ArrowLeft, Search, Users, Plus, Paperclip } from 'lucide-react';
import { dummyEmployees, getEmployeeById, getConversationPartner, formatMessageTime } from './utils/dummyData';
import { useChat } from '../../contexts/ChatContext';
import ChatSidebar from './ChatSidebar';
import CreateGroupModal from './CreateGroupModal';
import GroupDetailsModal from './GroupDetailsModal';
import UserProfileModal from './UserProfileModal';
import AttachmentMenu from './AttachmentMenu';
import PollCreationModal from './PollCreationModal';
import PollMessage from './PollMessage';

const ChatApp = ({ isMinimized, onToggleMinimize, onClose }) => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showMobilePlusMenu, setShowMobilePlusMenu] = useState(false);
  const [showCompactPlusMenu, setShowCompactPlusMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const mobilePlusMenuRef = useRef(null);
  const compactPlusMenuRef = useRef(null);
  
  const {
    conversations,
    setConversations,
    messages,
    setMessages,
    isCompactMode,
    isFullScreenMobile,
    setActiveConversation: setGlobalActiveConversation,
    sendMessage,
    createConversation,
    createGroup,
    markConversationAsRead,
    toggleCompactMode,
    toggleFullScreenMobile,
    closeChat
  } = useChat();
  
  const currentUser = dummyEmployees[0]; // Shreyansh Shandilya

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobilePlusMenuRef.current && !mobilePlusMenuRef.current.contains(event.target)) {
        setShowMobilePlusMenu(false);
      }
      if (compactPlusMenuRef.current && !compactPlusMenuRef.current.contains(event.target)) {
        setShowCompactPlusMenu(false);
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
      conv.type === 'direct' && conv.participants.includes(employee.id) && conv.participants.includes(currentUser.id)
    );

    if (existingConv) {
      setActiveConversation(existingConv);
      setGlobalActiveConversation(existingConv);
    } else {
      const newConv = createConversation([currentUser.id, employee.id], 'direct');
      setActiveConversation(newConv);
      setGlobalActiveConversation(newConv);
    }
    setShowUserList(false);
    setSearchQuery('');
  };

  const handleCreateGroup = (name, description, participants, createdBy) => {
    const newGroup = createGroup(name, description, participants, createdBy);
    setActiveConversation(newGroup);
    setGlobalActiveConversation(newGroup);
    setShowCreateGroup(false);
  };

  const handleShowInfo = () => {
    if (activeConversation.type === 'group') {
      setShowGroupDetails(true);
    } else {
      const partner = getConversationPartner(activeConversation, currentUserId);
      if (partner) {
        setSelectedUserId(partner.id);
        setShowUserProfile(true);
      }
    }
  };

  const handleUpdateGroup = (groupId, updates) => {
    // Update group logic would go here
    console.log('Update group:', groupId, updates);
  };

  const handleLeaveGroup = (groupId) => {
    // Leave group logic would go here
    console.log('Leave group:', groupId);
    setShowGroupDetails(false);
    setActiveConversation(null);
  };

  const handleRemoveMember = (groupId, memberId) => {
    // Remove member logic would go here
    console.log('Remove member:', groupId, memberId);
  };

  const handleStartChatFromProfile = (user) => {
    handleStartNewChat(user);
  };

  const handleAttachmentSelect = (type) => {
    setShowAttachmentMenu(false);
    
    switch (type) {
      case 'photos-videos':
        // Create file input for images and videos
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*';
        fileInput.multiple = true;
        fileInput.onchange = (e) => {
          const files = Array.from(e.target.files);
          console.log('Selected files:', files);
          // Here you would handle file upload
        };
        fileInput.click();
        break;
        
      case 'camera':
        // Open camera
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment';
        cameraInput.onchange = (e) => {
          const file = e.target.files[0];
          console.log('Camera capture:', file);
          // Here you would handle camera capture
        };
        cameraInput.click();
        break;
        
      case 'document':
        // Open document picker
        const docInput = document.createElement('input');
        docInput.type = 'file';
        docInput.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
        docInput.onchange = (e) => {
          const file = e.target.files[0];
          console.log('Selected document:', file);
          // Here you would handle document upload
        };
        docInput.click();
        break;
        
      case 'poll':
        setShowPollModal(true);
        break;
        
      default:
        break;
    }
  };

  const handleCreatePoll = (pollData) => {
    console.log('handleCreatePoll called with:', pollData);
    console.log('activeConversation:', activeConversation);
    console.log('setMessages function:', typeof setMessages);
    console.log('setConversations function:', typeof setConversations);
    
    if (!activeConversation) return;
    
    const pollMessage = {
      id: Date.now(),
      type: 'poll',
      senderId: currentUser.id,
      timestamp: new Date(),
      read: true,
      poll: {
        ...pollData,
        id: `poll_${Date.now()}`,
        createdAt: new Date(),
        votes: pollData.options.reduce((acc, _, index) => {
          acc[index] = [];
          return acc;
        }, {})
      }
    };

    // Add message directly to state instead of using sendMessage
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), pollMessage]
    }));

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { ...conv, lastMessage: { id: pollMessage.id, text: 'Poll created', timestamp: pollMessage.timestamp } }
        : conv
    ));
    
    setShowPollModal(false);
  };

  const handlePollVote = (messageId, optionIndexes) => {
    if (!activeConversation || !messageId) return;
    
    setMessages(prevMessages => ({
      ...prevMessages,
      [activeConversation.id]: prevMessages[activeConversation.id].map(message => {
        if (message.id === messageId && message.type === 'poll') {
          const updatedPoll = { ...message.poll };
          
          // Remove user's previous votes
          Object.keys(updatedPoll.votes).forEach(optionIndex => {
            updatedPoll.votes[optionIndex] = updatedPoll.votes[optionIndex].filter(
              voterId => voterId !== currentUser.id
            );
          });
          
          // Add new votes
          optionIndexes.forEach(optionIndex => {
            if (!updatedPoll.votes[optionIndex]) {
              updatedPoll.votes[optionIndex] = [];
            }
            updatedPoll.votes[optionIndex].push(currentUser.id);
          });
          
          return {
            ...message,
            poll: updatedPoll
          };
        }
        return message;
      })
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Check if we're on mobile/small screen
  const isMobile = window.innerWidth < 1024;

  // Minimized state - just the toggle button
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 transform"
        >
          <MessageCircle className="h-6 w-6" />
          {conversations.reduce((total, conv) => total + conv.unreadCount, 0) > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Full-screen mobile view
  if (isFullScreenMobile && isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Mobile Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white safe-area-inset-top">
          <div className="flex items-center gap-3">
            {activeConversation ? (
              <>
                <button
                  onClick={() => setActiveConversation(null)}
                  className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-semibold">
                    {getConversationPartner(activeConversation, currentUser.id)?.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)}`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {getConversationPartner(activeConversation, currentUser.id)?.name}
                  </h3>
                  <p className="text-sm text-purple-200">
                    {getConversationPartner(activeConversation, currentUser.id)?.status === 'online' ? 'Active now' : 
                     getConversationPartner(activeConversation, currentUser.id)?.status}
                  </p>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={closeChat}
                  className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="font-semibold text-white text-lg">Messages</h3>
              </>
            )}
          </div>
          
          {activeConversation ? (
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200">
                <Video className="h-5 w-5" />
              </button>
              <button 
                onClick={handleShowInfo}
                className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="relative" ref={mobilePlusMenuRef}>
              <button
                onClick={() => setShowMobilePlusMenu(!showMobilePlusMenu)}
                className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
              </button>
              
              {/* Mobile Plus Menu */}
              {showMobilePlusMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowUserList(true);
                        setShowMobilePlusMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                      <span>New Chat</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateGroup(true);
                        setShowMobilePlusMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
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
          )}
        </div>

        {/* Mobile Chat Content */}
        {!activeConversation ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Search */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowUserList(e.target.value.length > 0);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all duration-200"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {showUserList ? (
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Start New Chat</h4>
                  <div className="space-y-3">
                    {filteredEmployees.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => handleStartNewChat(employee)}
                        className="w-full flex items-center gap-4 p-3 hover:bg-white rounded-lg transition-all duration-200"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                            {employee.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(employee.status)}`}></div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium text-base truncate">{employee.name}</div>
                          <div className="text-sm text-gray-500 truncate">{employee.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {filteredConversations.length > 0 ? (
                    <div className="space-y-3">
                      {filteredConversations.map(conversation => {
                        const partner = getConversationPartner(conversation, currentUser.id);
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            className="w-full flex items-center gap-4 p-3 hover:bg-white rounded-lg transition-all duration-200"
                          >
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                                {partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium text-base truncate">{partner?.name}</div>
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
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-20">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No conversations yet</p>
                      <p className="text-sm">Search for colleagues to start chatting</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(messages[activeConversation.id] || []).map(message => {
                const isOwnMessage = message.senderId === currentUser.id;
                const sender = getEmployeeById(message.senderId);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`${message.type === 'poll' ? 'max-w-xl lg:max-w-2xl' : 'max-w-xs lg:max-w-md'} ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && activeConversation.type === 'group' && (
                        <div className="text-xs text-purple-600 mb-1 ml-1 font-medium">{sender?.name}</div>
                      )}
                      {!isOwnMessage && activeConversation.type === 'direct' && (
                        <div className="text-xs text-gray-500 mb-1 ml-1">{sender?.name}</div>
                      )}
                      <div
                        className={`${message.type === 'poll' ? 'p-3' : 'px-4 py-3'} rounded-2xl text-base ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        {message.type === 'poll' ? (
                          <PollMessage
                            poll={message.poll}
                            currentUserId={currentUser.id}
                            onVote={(optionIndexes) => handlePollVote(message.id, optionIndexes)}
                            isOwnMessage={isOwnMessage}
                            isCompact={false}
                          />
                        ) : (
                          message.text
                        )}
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
            <div className="relative p-4 bg-white border-t border-gray-200 safe-area-inset-bottom">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAttachmentMenu(true)}
                  className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              
              {/* Attachment Menu positioned relative to this container */}
              <AttachmentMenu
                isOpen={showAttachmentMenu}
                onClose={() => setShowAttachmentMenu(false)}
                onSelect={handleAttachmentSelect}
                isGroup={activeConversation?.type === 'group'}
                isCompact={false}
              />
            </div>
          </div>
        )}
        </div>
        
        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
          currentUserId={currentUser.id}
        />
        
        {/* Group Details Modal */}
        <GroupDetailsModal
          isOpen={showGroupDetails}
          onClose={() => setShowGroupDetails(false)}
          conversation={activeConversation}
          currentUserId={currentUser.id}
          onUpdateGroup={handleUpdateGroup}
          onLeaveGroup={handleLeaveGroup}
          onRemoveMember={handleRemoveMember}
        />
        
        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId}
          onStartChat={handleStartChatFromProfile}
        />

        {/* Poll Creation Modal */}
        <PollCreationModal
          isOpen={showPollModal}
          onClose={() => setShowPollModal(false)}
          onCreatePoll={handleCreatePoll}
        />
      </>
    );
  }

  // Compact mode - small popup chat (like normal chat window)
  if (isCompactMode || (isMobile && !isFullScreenMobile)) {
    return (
      <>
        <div className="fixed bottom-4 right-4 w-[450px] h-[580px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col transform transition-all duration-500 ease-out animate-slideUp chat-window-glass">
        {/* Header - Mac-like with traffic light buttons */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            {activeConversation && (
              <button
                onClick={() => setActiveConversation(null)}
                className="p-1 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="font-semibold truncate">
              {activeConversation 
                ? getConversationPartner(activeConversation, currentUser.id)?.name 
                : 'Chat'
              }
            </h3>
          </div>
          
          {/* Mac-like window controls */}
          <div className="flex items-center gap-2">
            {activeConversation ? (
              <>
                <button className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110">
                  <Video className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleShowInfo}
                  className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
                >
                  <Info className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="relative" ref={compactPlusMenuRef}>
                <button
                  onClick={() => setShowCompactPlusMenu(!showCompactPlusMenu)}
                  className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
                  title="New chat options"
                >
                  <Plus className="h-4 w-4" />
                </button>
                
                {/* Compact Plus Menu */}
                {showCompactPlusMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setShowUserList(true);
                          setShowCompactPlusMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Plus className="h-3 w-3 text-white" />
                        </div>
                        <span>New Chat</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateGroup(true);
                          setShowCompactPlusMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"
                      >
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                        <span>Create Group</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Normal control buttons */}
            <div className="flex items-center gap-1 ml-2">
              {/* Single toggle button for expand/minimize */}
              {!isMobile && (
                <button
                  onClick={toggleCompactMode}
                  className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
                  title={isCompactMode ? "Expand to full chat" : "Minimize to compact"}
                >
                  {isCompactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              )}
              
              {/* Minimize to icon button */}
              {/* <button
                onClick={onToggleMinimize}
                className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
                title="Minimize to icon"
              >
                <Minimize2 className="h-4 w-4" />
              </button> */}
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-red-600 rounded-full transition-all duration-200 transform hover:scale-110"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Conversations List or User Search Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100% - 60px)' }}>
              {showUserList ? (
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Start New Chat</h4>
                  <div className="space-y-1">
                    {filteredEmployees.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => handleStartNewChat(employee)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                            {employee.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(employee.status)} transition-all duration-200`}></div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium text-sm truncate">{employee.name}</div>
                          <div className="text-xs text-gray-500 truncate">{employee.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.length > 0 ? (
                    <div className="space-y-1">
                      {filteredConversations.map(conversation => {
                        const partner = getConversationPartner(conversation, currentUser.id);
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                          >
                            <div className="relative">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                                {partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(partner?.status)} transition-all duration-200`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm truncate">{partner?.name}</div>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage?.text || 'No messages yet'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300 animate-pulse" />
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
            {/* Messages - Scrollable area between header and input */}
            <div className="overflow-y-auto overflow-x-hidden custom-scrollbar p-1.5 pb-3 space-y-1" style={{ height: '400px' }}>
              {(messages[activeConversation.id] || []).map(message => {
                const isOwnMessage = message.senderId === currentUser.id;
                const sender = getEmployeeById(message.senderId);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div className={`${message.type === 'poll' ? 'w-full max-w-[280px]' : 'max-w-xs'} ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && activeConversation.type === 'group' && (
                        <div className="text-xs text-purple-600 mb-1 font-medium">{sender?.name}</div>
                      )}
                      {!isOwnMessage && activeConversation.type === 'direct' && (
                        <div className="text-xs text-gray-500 mb-1">{sender?.name}</div>
                      )}
                      <div
                        className={`${message.type === 'poll' ? 'p-0.5 overflow-hidden' : 'px-3 py-2'} rounded-lg text-sm transition-all duration-200 ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white rounded-br-sm message-bubble-own'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm message-bubble'
                        }`}
                      >
                        {message.type === 'poll' ? (
                          <PollMessage
                            poll={message.poll}
                            currentUserId={currentUser.id}
                            onVote={(optionIndexes) => handlePollVote(message.id, optionIndexes)}
                            isOwnMessage={isOwnMessage}
                            isCompact={true}
                          />
                        ) : (
                          message.text
                        )}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className="relative p-2 border-t border-gray-200 bg-white rounded-b-xl" style={{ minHeight: '60px' }}>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAttachmentMenu(true)}
                  className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              {/* Attachment Menu positioned relative to this container */}
              <AttachmentMenu
                isOpen={showAttachmentMenu}
                onClose={() => setShowAttachmentMenu(false)}
                onSelect={handleAttachmentSelect}
                isGroup={activeConversation?.type === 'group'}
                isCompact={true}
              />
            </div>
          </div>
        )}
        </div>
        
        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
          currentUserId={currentUser.id}
        />
        
        {/* Group Details Modal */}
        <GroupDetailsModal
          isOpen={showGroupDetails}
          onClose={() => setShowGroupDetails(false)}
          conversation={activeConversation}
          currentUserId={currentUser.id}
          onUpdateGroup={handleUpdateGroup}
          onLeaveGroup={handleLeaveGroup}
          onRemoveMember={handleRemoveMember}
        />
        
        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId}
          onStartChat={handleStartChatFromProfile}
        />

        {/* Poll Creation Modal */}
        <PollCreationModal
          isOpen={showPollModal}
          onClose={() => setShowPollModal(false)}
          onCreatePoll={handleCreatePoll}
        />
      </>
    );
  }

  // Full desktop layout with sidebar
  return (
    <div className="fixed top-16 right-0 w-[800px] h-[calc(100vh-4rem)] bg-white border-l border-gray-200 shadow-2xl z-40 flex transform transition-all duration-700 ease-in-out scale-100">
      {/* Chat Sidebar */}
      <ChatSidebar 
        onSelectConversation={handleSelectConversation}
        onStartNewChat={handleStartNewChat}
        onCreateGroup={() => setShowCreateGroup(true)}
        activeConversation={activeConversation}
      />
      
      {/* Chat Content */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col border-l border-gray-200">
          {/* Chat Header - Mac-like with traffic light buttons */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-semibold backdrop-blur-sm">
                  {getConversationPartner(activeConversation, currentUser.id)?.avatar}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)} transition-all duration-200`}></div>
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {getConversationPartner(activeConversation, currentUser.id)?.name}
                </h3>
                <p className="text-sm text-purple-200">
                  {getConversationPartner(activeConversation, currentUser.id)?.status === 'online' ? 'Active now' : 
                   getConversationPartner(activeConversation, currentUser.id)?.status}
                </p>
              </div>
            </div>
            
            {/* Mac-like window controls */}
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110">
                <Video className="h-5 w-5" />
              </button>
              <button 
                onClick={handleShowInfo}
                className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
              >
                <Info className="h-5 w-5" />
              </button>
              
              <div className="w-px h-6 bg-purple-500 mx-2"></div>
              
              {/* Normal control buttons */}
              <div className="flex items-center gap-2">
                {/* Single toggle button for compact/full mode */}
                <button
                  onClick={toggleCompactMode}
                  className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
                  title={isCompactMode ? "Expand to full chat" : "Switch to compact view"}
                >
                  {isCompactMode ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
                </button>
                
                {/* Minimize to icon button */}
                {/* <button
                  onClick={onToggleMinimize}
                  className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
                  title="Minimize to icon"
                >
                  <Minimize2 className="h-5 w-5" />
                </button> */}
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-600 rounded-full transition-all duration-200 transform hover:scale-110"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {(messages[activeConversation.id] || []).map(message => {
              const isOwnMessage = message.senderId === currentUser.id;
              const sender = getEmployeeById(message.senderId);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`${message.type === 'poll' ? 'max-w-xl' : 'max-w-md'} ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage && activeConversation.type === 'group' && (
                      <div className="text-xs text-purple-600 mb-1 ml-1 font-medium">{sender?.name}</div>
                    )}
                    {!isOwnMessage && activeConversation.type === 'direct' && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">{sender?.name}</div>
                    )}
                    <div
                      className={`${message.type === 'poll' ? 'p-3' : 'px-4 py-3'} rounded-2xl text-sm transition-all duration-200 transform hover:scale-[1.02] ${
                        isOwnMessage
                          ? 'bg-purple-600 text-white rounded-br-md shadow-lg'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {message.type === 'poll' ? (
                        <PollMessage
                          poll={message.poll}
                          currentUserId={currentUser.id}
                          onVote={(optionIndexes) => handlePollVote(message.id, optionIndexes)}
                          isOwnMessage={isOwnMessage}
                          isCompact={false}
                        />
                      ) : (
                        message.text
                      )}
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
          <div className="relative p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAttachmentMenu(true)}
                className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200 shadow-sm focus:shadow-md"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            {/* Attachment Menu positioned relative to this container */}
            <AttachmentMenu
              isOpen={showAttachmentMenu}
              onClose={() => setShowAttachmentMenu(false)}
              onSelect={handleAttachmentSelect}
              isGroup={activeConversation?.type === 'group'}
              isCompact={false}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-sm">Choose from your existing conversations or start a new one</p>
          </div>
        </div>
      )}
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
        currentUserId={currentUser.id}
      />
      
      {/* Group Details Modal */}
      <GroupDetailsModal
        isOpen={showGroupDetails}
        onClose={() => setShowGroupDetails(false)}
        conversation={activeConversation}
        currentUserId={currentUser.id}
        onUpdateGroup={handleUpdateGroup}
        onLeaveGroup={handleLeaveGroup}
        onRemoveMember={handleRemoveMember}
      />
      
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId}
        onStartChat={handleStartChatFromProfile}
      />

      {/* Poll Creation Modal */}
      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreatePoll={handleCreatePoll}
      />
    </div>
  );
};

export default ChatApp;
