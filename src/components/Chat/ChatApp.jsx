import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Maximize2, Send, Phone, Video, Info, ArrowLeft, Search, Users, Plus, Paperclip, Reply, Forward, Pin, Filter } from 'lucide-react';
import { dummyEmployees, getEmployeeById, getConversationPartner, formatMessageTime } from './utils/dummyData';
import { useChat } from '../../contexts/ChatContext';
import ChatSidebar from './ChatSidebar';
import CreateGroupModal from './CreateGroupModal';
import GroupDetailsModal from './GroupDetailsModal';
import UserProfileModal from './UserProfileModal';
import AttachmentMenu from './AttachmentMenu';
import PollCreationModal from './PollCreationModal';
import PollMessage from './PollMessage';
import ForwardModal from './ForwardModal';
import PinModal from './PinModal';

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
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, message: null });
  const [chatContextMenu, setChatContextMenu] = useState({ show: false, x: 0, y: 0, conversation: null });
  const [showPinModal, setShowPinModal] = useState(false);
  const [messageToPinOrChat, setMessageToPinOrChat] = useState(null);
  const [pinType, setPinType] = useState('message'); // 'message' or 'chat'
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [pinnedChats, setPinnedChats] = useState([]);
  const [chatFilter, setChatFilter] = useState('all'); // 'all', 'direct', 'groups'
  const mobilePlusMenuRef = useRef(null);
  const compactPlusMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const contextMenuRef = useRef(null);
  
  const {
    conversations,
    messages,
    isCompactMode,
    isFullScreenMobile,
    setActiveConversation: setGlobalActiveConversation,
    sendMessage,
    createConversation,
    createGroup,
    markConversationAsRead,
    toggleCompactMode,
    toggleFullScreenMobile,
    closeChat,
    setConversations,
    setMessages
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
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ show: false, x: 0, y: 0, message: null });
      }
      // Close chat context menu when clicking outside
      if (!event.target.closest('.chat-context-menu')) {
        setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    if (activeConversation && messages[activeConversation.id]) {
      scrollToBottom();
    }
  }, [messages, activeConversation]);

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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    let messageData = {
      id: Date.now(),
      senderId: currentUser.id,
      text: newMessage.trim(),
      timestamp: new Date(),
      read: true
    };
    
    if (replyToMessage) {
      messageData.replyTo = {
        id: replyToMessage.id,
        text: replyToMessage.text,
        senderName: getEmployeeById(replyToMessage.senderId)?.name
      };
      setReplyToMessage(null);
    }
    
    // Add message directly to state like we do for polls
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), messageData]
    }));

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { ...conv, lastMessage: { text: messageData.text, timestamp: new Date() } }
        : conv
    ));
    
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
        ? { ...conv, lastMessage: { text: 'Poll created', timestamp: new Date() } }
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

  const handleReply = (message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleForward = (message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    
    // Calculate position to ensure menu stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 150; // Approximate menu width
    const menuHeight = 80; // Approximate menu height
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Adjust x position if menu would go off right edge
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    // Adjust y position if menu would go off bottom edge
    if (y + menuHeight > viewportHeight) {
      y = y - menuHeight;
    }
    
    setContextMenu({
      show: true,
      x: x,
      y: y,
      message: message
    });
  };

  const handleContextMenuReply = () => {
    handleReply(contextMenu.message);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handleContextMenuForward = () => {
    handleForward(contextMenu.message);
  };

  const handleForwardMessage = (selectedConversations) => {
    if (!messageToForward || !selectedConversations.length) return;

    selectedConversations.forEach(convId => {
      const forwardedMessage = {
        id: Date.now() + Math.random(),
        senderId: currentUser.id,
        text: `Forwarded: ${messageToForward.text}`,
        timestamp: new Date(),
        read: true,
        isForwarded: true,
        originalSender: getEmployeeById(messageToForward.senderId)?.name
      };

      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), forwardedMessage]
      }));

      // Update conversation last message
      setConversations(prev => prev.map(conv => 
        conv.id === convId 
          ? { ...conv, lastMessage: { text: forwardedMessage.text, timestamp: new Date() } }
          : conv
      ));
    });

    setShowForwardModal(false);
    setMessageToForward(null);
  };

  const handlePin = (message) => {
    setMessageToPinOrChat(message);
    setPinType('message');
    setShowPinModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handlePinChat = (conversation) => {
    setMessageToPinOrChat(conversation);
    setPinType('chat');
    setShowPinModal(true);
    setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
  };

  const handlePinConfirm = (duration) => {
    const pinExpiry = new Date();
    switch (duration) {
      case '24hours':
        pinExpiry.setHours(pinExpiry.getHours() + 24);
        break;
      case '7days':
        pinExpiry.setDate(pinExpiry.getDate() + 7);
        break;
      case '30days':
        pinExpiry.setDate(pinExpiry.getDate() + 30);
        break;
    }

    if (pinType === 'message' && messageToPinOrChat && activeConversation) {
      setPinnedMessages(prev => ({
        ...prev,
        [activeConversation.id]: {
          message: messageToPinOrChat,
          expiry: pinExpiry
        }
      }));
    } else if (pinType === 'chat' && messageToPinOrChat) {
      setPinnedChats(prev => [...prev.filter(p => p.id !== messageToPinOrChat.id), {
        ...messageToPinOrChat,
        pinnedAt: new Date(),
        expiry: pinExpiry
      }]);
    }

    setShowPinModal(false);
    setMessageToPinOrChat(null);
  };

  const handleUnpin = (type, id) => {
    if (type === 'message') {
      setPinnedMessages(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } else if (type === 'chat') {
      setPinnedChats(prev => prev.filter(chat => chat.id !== id));
    }
  };

  const handleChatContextMenu = (e, conversation) => {
    e.preventDefault();
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 150;
    const menuHeight = 80;
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }
    
    setChatContextMenu({
      show: true,
      x: x,
      y: y,
      conversation: conversation
    });
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
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
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
        <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col transform transition-all duration-500 ease-out animate-slideUp chat-window-glass">
        {/* Header - Mac-like with traffic light buttons */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-xl">
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
              
              {/* Filter Buttons for Compact Mode */}
              {!showUserList && (
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => setChatFilter('all')}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      chatFilter === 'all' 
                        ? 'bg-[#FFAD46] text-white border-[#FFAD46]' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatFilter('direct')}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      chatFilter === 'direct' 
                        ? 'bg-[#FFAD46] text-white border-[#FFAD46]' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    onClick={() => setChatFilter('groups')}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
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

            {/* Conversations List or User Search Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '380px' }}>
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
                  {/* Pinned Chats Section */}
                  {pinnedChats.length > 0 && !searchQuery && (
                    <div className="mb-3">
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Pin className="w-2 h-2" />
                        Pinned
                      </div>
                      <div className="space-y-1">
                        {pinnedChats.map(conversation => {
                          const partner = getConversationPartner(conversation, currentUser.id);
                          return (
                            <button
                              key={`pinned-compact-${conversation.id}`}
                              onClick={() => handleSelectConversation(conversation)}
                              onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                              className="w-full flex items-center gap-2 p-2 bg-orange-50 border-l-2 border-[#FFAD46] hover:bg-orange-100 rounded-r-lg transition-all duration-200"
                            >
                              <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                                  {partner?.avatar}
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFAD46] rounded-full flex items-center justify-center">
                                  <Pin className="w-1.5 h-1.5 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-medium text-xs truncate">{partner?.name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                  {conversation.lastMessage?.text || 'No messages yet'}
                                </div>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1rem] text-center">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-b border-gray-200 my-2"></div>
                    </div>
                  )}

                  {/* Regular Conversations */}
                  {filteredConversations.length > 0 ? (
                    <div className="space-y-1">
                      {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                        const partner = getConversationPartner(conversation, currentUser.id);
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            onContextMenu={(e) => handleChatContextMenu(e, conversation)}
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
          <div className="flex-1 flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 min-h-0" style={{ maxHeight: '320px' }}>
              {/* Pinned Message */}
              {activeConversation && pinnedMessages[activeConversation.id] && (
                <div className="bg-orange-50 border-l-4 border-[#FFAD46] p-2 rounded-r-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <Pin className="w-3 h-3 text-[#FFAD46]" />
                        <span className="text-xs font-medium text-[#FFAD46]">Pinned</span>
                      </div>
                      <div className="text-xs text-gray-700 truncate">
                        {pinnedMessages[activeConversation.id].message.text}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnpin('message', activeConversation.id)}
                      className="text-gray-400 hover:text-gray-600 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {(messages[activeConversation.id] || []).map(message => {
                const isOwnMessage = message.senderId === currentUser.id;
                const sender = getEmployeeById(message.senderId);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div className={`max-w-xs ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && activeConversation.type === 'group' && (
                        <div className="text-xs text-purple-600 mb-1 font-medium">{sender?.name}</div>
                      )}
                      {!isOwnMessage && activeConversation.type === 'direct' && (
                        <div className="text-xs text-gray-500 mb-1">{sender?.name}</div>
                      )}
                      <div
                        className={`relative group ${message.type === 'poll' ? 'p-2' : 'px-3 py-2'} rounded-lg text-sm transition-all duration-200 ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white rounded-br-sm message-bubble-own'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm message-bubble'
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, message)}
                      >
                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div className={`text-xs mb-2 p-2 rounded-md ${isOwnMessage ? 'bg-purple-700/30' : 'bg-gray-200'} border-l-4 ${isOwnMessage ? 'border-purple-300' : 'border-purple-500'}`}>
                            <div className={`font-medium text-xs ${isOwnMessage ? 'text-purple-200' : 'text-purple-600'}`}>
                              {message.replyTo.senderName}
                            </div>
                            <div className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-100' : 'text-gray-700'} line-clamp-2`}>
                              {message.replyTo.text.length > 50 ? `${message.replyTo.text.substring(0, 50)}...` : message.replyTo.text}
                            </div>
                          </div>
                        )}
                        
                        {/* Forward indicator */}
                        {message.isForwarded && (
                          <div className={`text-xs mb-2 ${isOwnMessage ? 'text-purple-200' : 'text-gray-600'}`}>
                            <span className="italic">Forwarded from {message.originalSender}</span>
                          </div>
                        )}
                        
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
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="relative px-3 pt-3 pb-2 border-t border-gray-200">
              {/* Reply UI */}
              {replyToMessage && (
                <div className="mb-3 bg-gray-50 border-l-4 border-purple-500 p-2 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-purple-600">
                        Replying to {getEmployeeById(replyToMessage.senderId)?.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {replyToMessage.text}
                      </div>
                    </div>
                    <button
                      onClick={handleCancelReply}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAttachmentMenu(true)}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
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

        {/* Forward Modal */}
        <ForwardModal
          isOpen={showForwardModal}
          onClose={() => setShowForwardModal(false)}
          onForward={handleForwardMessage}
          conversations={conversations.filter(conv => conv.id !== activeConversation?.id)}
          currentUserId={currentUser.id}
          message={messageToForward}
          isCompact={true}
        />

        {/* Pin Modal */}
        <PinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onPin={handlePinConfirm}
          type={pinType}
          item={messageToPinOrChat}
          isCompact={true}
        />

        {/* Context Menu */}
        {contextMenu.show && (
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              onClick={() => handleReply(contextMenu.message)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
            <button
              onClick={() => handleForward(contextMenu.message)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
            >
              <Forward className="w-4 h-4" />
              Forward
            </button>
            <button
              onClick={() => handlePin(contextMenu.message)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
            >
              <Pin className="w-4 h-4" />
              Pin
            </button>
          </div>
        )}

        {/* Chat Context Menu for Compact Mode */}
        {chatContextMenu.show && (
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[60] min-w-[120px] chat-context-menu"
            style={{
              left: `${chatContextMenu.x}px`,
              top: `${chatContextMenu.y}px`,
            }}
          >
            <button
              onClick={() => handlePinChat(chatContextMenu.conversation)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Pin className="h-4 w-4" />
              Pin Chat
            </button>
          </div>
        )}
      </>
    );
  }

  // Full desktop layout with sidebar
  return (
    <>
      <div className="fixed top-16 right-0 w-[800px] h-[calc(100vh-4rem)] bg-white border-l border-gray-200 shadow-2xl z-40 flex transform transition-all duration-700 ease-in-out scale-100">
      {/* Chat Sidebar */}
      <ChatSidebar 
        onSelectConversation={handleSelectConversation}
        onStartNewChat={handleStartNewChat}
        onCreateGroup={() => setShowCreateGroup(true)}
        activeConversation={activeConversation}
        onChatContextMenu={handleChatContextMenu}
        pinnedChats={pinnedChats}
        chatFilter={chatFilter}
        onFilterChange={setChatFilter}
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
            {/* Pinned Message */}
            {activeConversation && pinnedMessages[activeConversation.id] && (
              <div className="bg-orange-50 border-l-4 border-[#FFAD46] p-3 rounded-r-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pin className="w-4 h-4 text-[#FFAD46]" />
                      <span className="text-sm font-medium text-[#FFAD46]">Pinned Message</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {pinnedMessages[activeConversation.id].message.text}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnpin('message', activeConversation.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {(messages[activeConversation.id] || []).map(message => {
              const isOwnMessage = message.senderId === currentUser.id;
              const sender = getEmployeeById(message.senderId);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage && activeConversation.type === 'group' && (
                      <div className="text-xs text-purple-600 mb-1 ml-1 font-medium">{sender?.name}</div>
                    )}
                    {!isOwnMessage && activeConversation.type === 'direct' && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">{sender?.name}</div>
                    )}
                    <div
                      className={`relative group ${message.type === 'poll' ? 'p-3' : 'px-4 py-3'} rounded-2xl text-sm transition-all duration-200 transform hover:scale-[1.02] ${
                        isOwnMessage
                          ? 'bg-purple-600 text-white rounded-br-md shadow-lg'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, message)}
                    >
                      {/* Reply indicator */}
                      {message.replyTo && (
                        <div className={`text-sm mb-3 p-3 rounded-md ${isOwnMessage ? 'bg-purple-700/30' : 'bg-gray-100'} border-l-4 ${isOwnMessage ? 'border-purple-300' : 'border-purple-500'}`}>
                          <div className={`font-medium text-sm ${isOwnMessage ? 'text-purple-200' : 'text-purple-600'}`}>
                            {message.replyTo.senderName}
                          </div>
                          <div className={`text-sm mt-1 ${isOwnMessage ? 'text-purple-100' : 'text-gray-700'} line-clamp-3`}>
                            {message.replyTo.text.length > 80 ? `${message.replyTo.text.substring(0, 80)}...` : message.replyTo.text}
                          </div>
                        </div>
                      )}
                      
                      {/* Forward indicator */}
                      {message.isForwarded && (
                        <div className={`text-xs mb-2 ${isOwnMessage ? 'text-purple-200' : 'text-gray-600'}`}>
                          <span className="italic">Forwarded from {message.originalSender}</span>
                        </div>
                      )}
                      
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
            {/* Reply UI - Desktop */}
            {replyToMessage && (
              <div className="mb-4 bg-gray-50 border-l-4 border-purple-500 p-3 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-purple-600">
                      Replying to {getEmployeeById(replyToMessage.senderId)?.name}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {replyToMessage.text}
                    </div>
                  </div>
                  <button
                    onClick={handleCancelReply}
                    className="text-gray-400 hover:text-gray-600 ml-3"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
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

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={handleForwardMessage}
        conversations={conversations.filter(conv => conv.id !== activeConversation?.id)}
        currentUserId={currentUser.id}
        message={messageToForward}
      />

      {/* Pin Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onPin={handlePinConfirm}
        type={pinType}
        item={messageToPinOrChat}
      />
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[60] min-w-[120px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            onClick={handleContextMenuReply}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Reply className="h-4 w-4" />
            Reply
          </button>
          <button
            onClick={handleContextMenuForward}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Forward className="h-4 w-4" />
            Forward
          </button>
          <button
            onClick={() => handlePin(contextMenu.message)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Pin className="h-4 w-4" />
            Pin
          </button>
        </div>
      )}

      {/* Chat Context Menu */}
      {chatContextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[60] min-w-[120px] chat-context-menu"
          style={{
            left: `${chatContextMenu.x}px`,
            top: `${chatContextMenu.y}px`,
          }}
        >
          <button
            onClick={() => handlePinChat(chatContextMenu.conversation)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Pin className="h-4 w-4" />
            Pin Chat
          </button>
        </div>
      )}
    </>
  );
};

export default ChatApp;
