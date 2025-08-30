import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Maximize2, Send, Phone, Video, Info, ArrowLeft, Search, Users, Plus, Paperclip, Reply, Forward, Pin, Filter, Edit2, Check, Home, Calendar, FileText, Star, Mic, Smile, Image, MoreHorizontal } from 'lucide-react';
import { dummyEmployees, getEmployeeById, getConversationPartner, formatMessageTime } from './utils/dummyData';
import { useChat } from '../../contexts/ChatContext';
import ChatSidebar from './ChatSidebar';
import CreateGroupModal from './CreateGroupModal';
import ChatInfo from './ChatInfo';
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
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showMobilePlusMenu, setShowMobilePlusMenu] = useState(false);
  const [showCompactPlusMenu, setShowCompactPlusMenu] = useState(false);
  const [showCompactKebabMenu, setShowCompactKebabMenu] = useState(false);
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
  const [favouriteChats, setFavouriteChats] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [chatFilter, setChatFilter] = useState('all'); // 'all', 'direct', 'groups'
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [showFavouritesFilter, setShowFavouritesFilter] = useState(false);
  const mobilePlusMenuRef = useRef(null);
  const compactPlusMenuRef = useRef(null);
  const compactKebabMenuRef = useRef(null);
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
      // Skip if the target is within the pin chat button (including text/icons)
      const pinChatButton = event.target.closest('[data-pin-chat="true"]');
      if (pinChatButton) {
    
        return;
      }
      
   
      
      if (mobilePlusMenuRef.current && !mobilePlusMenuRef.current.contains(event.target)) {
        setShowMobilePlusMenu(false);
      }
      if (compactPlusMenuRef.current && !compactPlusMenuRef.current.contains(event.target)) {
        setShowCompactPlusMenu(false);
      }
      if (compactKebabMenuRef.current && !compactKebabMenuRef.current.contains(event.target)) {
        setShowCompactKebabMenu(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ show: false, x: 0, y: 0, message: null });
      }
      
      // Close chat context menu when clicking outside
      const chatContextMenuElement = event.target.closest('.chat-context-menu');
      if (!chatContextMenuElement) {
       
        setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
      } else {
        console.log('Not closing chat context menu - clicked inside');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [chatContextMenu.show, showMobilePlusMenu, showCompactPlusMenu, showCompactKebabMenu, contextMenu.show]);

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

  // Clean up expired pinned items
  useEffect(() => {
    const cleanupExpiredPins = () => {
      const now = new Date();
      
      // Clean up expired pinned messages
      setPinnedMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(conversationId => {
          if (updated[conversationId]?.expiry && new Date(updated[conversationId].expiry) <= now) {
            delete updated[conversationId];
          }
        });
        return updated;
      });
      
      // Clean up expired pinned chats
      setPinnedChats(prev => 
        prev.filter(chat => !chat.expiry || new Date(chat.expiry) > now)
      );
    };
    
    // Run cleanup every minute
    const interval = setInterval(cleanupExpiredPins, 60000);
    
    // Run cleanup on mount
    cleanupExpiredPins();
    
    return () => clearInterval(interval);
  }, []);

 


  // Filter employees for search
  const filteredEmployees = dummyEmployees.filter(emp => 
    emp.id !== currentUser.id && 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Global search: search both conversations and messages
  const getMessageSearchResults = () => {
    if (!searchQuery.trim()) return [];
    
    console.log('🔍 Search query:', searchQuery);
    console.log('📋 Available conversations:', conversations);
    console.log('💬 Available messages:', messages);
    
    const results = [];
    conversations.forEach(conv => {
      const partner = getConversationPartner(conv, currentUser.id);
      const conversationMessages = messages[conv.id] || [];
      
      console.log(`💭 Checking conversation ${conv.id}:`, conversationMessages);
      
      conversationMessages.forEach(msg => {
        if ((msg.text || '').toLowerCase().includes(searchQuery.toLowerCase())) {
          console.log('✅ Found matching message:', msg.text);
          results.push({
            id: `${conv.id}-${msg.id}`,
            message: msg,
            conversation: conv,
            sender: getEmployeeById(msg.senderId),
            partner: partner,
            timestamp: msg.timestamp
          });
        }
      });
    });
    
    console.log('🎯 Final search results:', results);
    // Sort by timestamp (newest first)
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const messageSearchResults = getMessageSearchResults();
  console.log('🔍 Message search results count:', messageSearchResults.length);

  const filteredConversations = conversations.filter(conv => {
    const partner = getConversationPartner(conv, currentUser.id);
    const nameMatch = partner?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const messageMatch = (messages[conv.id] || []).some(msg =>
      (msg.text || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    let matchesSearch = nameMatch || messageMatch;
    // Apply favourites filter if active
    if (showFavouritesFilter) {
      const isFavourite = favouriteChats.find(fav => fav.id === conv.id);
      return isFavourite && matchesSearch;
    }
    // Apply group filter if active
    if (showGroupFilter) {
      return conv.type === 'group' && matchesSearch;
    }
    // Apply chat filter
    if (chatFilter === 'direct') {
      return conv.type === 'direct' && matchesSearch;
    } else if (chatFilter === 'groups') {
      return conv.type === 'group' && matchesSearch;
    }
    return matchesSearch; // 'all' filter
  });

  const handleSendMessage = () => {
    // If editing a message, save the edit instead
    if (editingMessage) {
      handleSaveEdit();
      return;
    }
    
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
      if (editingMessage) {
        handleSaveEdit();
      } else {
        handleSendMessage();
      }
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
    setShowChatInfo(true);
  };

  const handleUpdateGroup = (groupId, updates) => {

  };

  const handleLeaveGroup = (groupId) => {
    // Leave group logic would go here

    setShowChatInfo(false);
    setActiveConversation(null);
  };

  const handleRemoveMember = (groupId, memberId) => {
    // Remove member logic would go here
  
  };

  const handleStartChatFromProfile = (user) => {
    handleStartNewChat(user);
  };

  // Helper function to check if a message can be edited (within 5 minutes)
  const canEditMessage = (message) => {
    if (!message || message.senderId !== currentUser.id) return false;
    const messageTime = new Date(message.timestamp);
    const currentTime = new Date();
    const timeDifference = currentTime - messageTime;
    const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds
    return timeDifference <= fiveMinutesInMs;
  };

  // Handle starting message edit
  const handleStartEdit = (message) => {
    setEditingMessage(message);
    setEditMessageText(message.text || '');
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  // Handle saving edited message
  const handleSaveEdit = () => {
  
    if (!editingMessage || !editMessageText.trim()) return;

    const updatedMessages = { ...messages };
    const conversationMessages = updatedMessages[activeConversation.id] || [];
    
    const messageIndex = conversationMessages.findIndex(msg => msg.id === editingMessage.id);
   
    if (messageIndex !== -1) {
      const oldMessage = conversationMessages[messageIndex];
      conversationMessages[messageIndex] = {
        ...conversationMessages[messageIndex],
        text: editMessageText.trim(),
        edited: true,
        editedAt: new Date().toISOString()
      };
      setMessages(updatedMessages);
    }

    // Clear editing state
    setEditingMessage(null);
    setEditMessageText('');
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditMessageText('');
    setNewMessage('');
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
        text: `${messageToForward.text}`,
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
    
    if (!conversation || !conversation.id) {
      console.error('HANDLE PIN CHAT - Invalid conversation object:', conversation);
      return;
    }
    
    // Close context menu first
    setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
    
    // Set the data and show modal
    setMessageToPinOrChat(conversation);
    setPinType('chat');
    
    // Use a small delay to ensure state updates are processed
    setTimeout(() => {
    
      setShowPinModal(true);
    }, 50);
    

  };

  const handlePinConfirm = (duration) => {

    
    if (!messageToPinOrChat || !messageToPinOrChat.id) {
   
      setShowPinModal(false);
      setMessageToPinOrChat(null);
      return;
    }
    
    // Force the type to be 'chat' if we're pinning a conversation object
    const actualPinType = messageToPinOrChat?.participants || messageToPinOrChat?.type ? 'chat' : pinType;
   
    
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

    if (actualPinType === 'message' && messageToPinOrChat && activeConversation) {
      setPinnedMessages(prev => ({
        ...prev,
        [activeConversation.id]: {
          message: messageToPinOrChat,
          expiry: pinExpiry
        }
      }));
    } else if (actualPinType === 'chat' && messageToPinOrChat) {
     
      // Remove if already pinned, then add to beginning
      setPinnedChats(prev => {
        console.log('PIN CONFIRM - setPinnedChats called, prev:', prev.map(c => c.id));
        const filtered = prev.filter(p => p.id !== messageToPinOrChat.id);
        const newPinned = [{
          ...messageToPinOrChat,
          pinnedAt: new Date(),
          expiry: pinExpiry
        }, ...filtered];
      
        return newPinned;
      });
    } else {
      console.log('PIN CONFIRM - PIN FAILED - Conditions not met', { 
        actualPinType, 
        hasMessageToPinOrChat: !!messageToPinOrChat, 
        hasActiveConversation: !!activeConversation,
        messageToPinOrChatId: messageToPinOrChat?.id
      });
    }
 

    // Clean up state
    setShowPinModal(false);
    setMessageToPinOrChat(null);
    setPinType('message');
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

  const handleUnpinMessage = (conversationId) => {
    handleUnpin('message', conversationId);
  };

  const handleUnpinChat = (conversationId) => {
    handleUnpin('chat', conversationId);
  };

  const handleAddToFavourites = (conversation) => {
    if (!conversation || !conversation.id) {
      console.error('Invalid conversation for favourites:', conversation);
      return;
    }

    // Check if already in favourites
    const isAlreadyFavourite = favouriteChats.find(fav => fav.id === conversation.id);
    if (isAlreadyFavourite) {
      console.log('Chat already in favourites');
      return;
    }

    setFavouriteChats(prev => [...prev, conversation]);
    setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
  };

  const handleRemoveFromFavourites = (conversationId) => {
    setFavouriteChats(prev => prev.filter(chat => chat.id !== conversationId));
    setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
  };

  const handleChatContextMenu = (e, conversation) => {
    e.preventDefault();
    
  
    
    if (!conversation || !conversation.id) {
      console.error('CHAT CONTEXT MENU - Invalid conversation object:', conversation);
      return;
    }
    
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
          className="relative p-4 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#8b5cf6] text-white rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.4)] hover:shadow-[0_20px_80px_rgba(109,40,217,0.5)] transition-all duration-300 hover:scale-110 backdrop-blur-xl"
        >
          <MessageCircle className="h-6 w-6" />
          {conversations.reduce((total, conv) => total + conv.unreadCount, 0) > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#86efac] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-[0_8px_32px_rgba(134,239,172,0.4)] animate-pulse">
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
        <div className="fixed inset-0 bg-gradient-to-br from-[#f7f4ff] to-[#ede7f6] z-50 flex flex-col font-['Inter',sans-serif]">
        {/* Mobile Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/30 bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white safe-area-inset-top shadow-[0_8px_32px_rgba(109,40,217,0.3)]">
          <div className="flex items-center gap-3">
            {activeConversation ? (
              <>
                <button
                  onClick={() => setActiveConversation(null)}
                  className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-semibold shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]">
                    {getConversationPartner(activeConversation, currentUser.id)?.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)} shadow-sm`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {getConversationPartner(activeConversation, currentUser.id)?.name}
                  </h3>
                  <p className="text-sm text-white/80">
                    {getConversationPartner(activeConversation, currentUser.id)?.status === 'online' ? 'Active now' : 
                     getConversationPartner(activeConversation, currentUser.id)?.status}
                  </p>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={closeChat}
                  className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="font-semibold text-white text-lg">Atom Link</h3>
                  <p className="text-sm text-white/80">Messages</p>
                </div>
              </>
            )}
          </div>
          
          {activeConversation ? (
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110">
                <Video className="h-5 w-5" />
              </button>
              <button 
                onClick={handleShowInfo}
                className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110"
              >
                <Info className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-white/30 mx-1"></div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-500/20 rounded-2xl transition-all duration-200 hover:scale-110"
                title="Close Chat"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative" ref={mobilePlusMenuRef}>
                <button
                  onClick={() => setShowMobilePlusMenu(!showMobilePlusMenu)}
                  className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110"
                >
                  <Plus className="h-5 w-5" />
                </button>
              
              {/* Mobile Plus Menu */}
              {showMobilePlusMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.2)] z-50 overflow-hidden">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowUserList(true);
                        setShowMobilePlusMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#6d28d9]/10 hover:text-[#6d28d9] flex items-center gap-3 text-sm text-[#1f2937] transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                      <span>New Chat</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateGroup(true);
                        setShowMobilePlusMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#6d28d9]/10 hover:text-[#6d28d9] flex items-center gap-3 text-sm text-[#1f2937] transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(109,40,217,0.3)]">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span>Create Group</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-500/20 rounded-2xl transition-all duration-200 hover:scale-110"
                title="Close Chat"
              >
                <X className="h-5 w-5 text-white" />
              </button>
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
                    // Don't automatically show user list - let the search results determine what to show
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all duration-200"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {searchQuery && messageSearchResults.length > 0 ? (
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Messages
                  </h4>
                  {messageSearchResults.map(result => (
                    <button
                      key={result.id}
                      onClick={() => {
                        handleSelectConversation(result.conversation);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-start gap-4 p-3 hover:bg-white rounded-lg transition-all duration-200 mb-3"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                          {result.partner?.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(result.partner?.status)}`}></div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-base truncate">{result.partner?.name}</div>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(result.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-purple-600">
                            {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                            part.toLowerCase() === searchQuery.toLowerCase() ? 
                              <span key={index} className="bg-yellow-200 font-medium">{part}</span> : 
                              part
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Show conversation results below message results */}
                  {filteredConversations.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mt-6 mb-4">
                        Conversations
                      </h4>
                      {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
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
                    </>
                  )}
                </div>
              ) : searchQuery && filteredConversations.length > 0 ? (
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Conversations
                  </h4>
                  {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
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
              ) : searchQuery && messageSearchResults.length === 0 && filteredConversations.length === 0 ? (
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
                

                  {/* Pinned Conversations */}
                  {pinnedChats.length > 0 && !searchQuery && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                        Pinned Chats
                      </h4>
                      <div className="space-y-2">
                        {pinnedChats
                          .sort((a, b) => new Date(b.pinnedAt || 0) - new Date(a.pinnedAt || 0))
                          .map(conversation => {
                          const partner = getConversationPartner(conversation, currentUser.id);
                          return (
                            <button
                              key={conversation.id}
                              onClick={() => handleSelectConversation(conversation)}
                              onTouchStart={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget;
                                target.touchStartTime = Date.now();
                                target.touchStartX = touch.clientX;
                                target.touchStartY = touch.clientY;
                                
                                // Add visual feedback after 500ms
                                target.feedbackTimer = setTimeout(() => {
                                  target.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                                  // Haptic feedback if available
                                  if (navigator.vibrate) {
                                    navigator.vibrate(50);
                                  }
                                }, 500);
                                
                                // Long press after 1000ms
                                target.touchTimer = setTimeout(() => {
                                  e.preventDefault();
                                  handleChatContextMenu(e, conversation);
                                  target.style.backgroundColor = '';
                                }, 1000);
                              }}
                              onTouchEnd={(e) => {
                                const target = e.currentTarget;
                                if (target.touchTimer) {
                                  clearTimeout(target.touchTimer);
                                }
                                if (target.feedbackTimer) {
                                  clearTimeout(target.feedbackTimer);
                                }
                                target.style.backgroundColor = '';
                              }}
                              onTouchMove={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget;
                                const moveThreshold = 10;
                                
                                if (target.touchStartX && target.touchStartY) {
                                  const deltaX = Math.abs(touch.clientX - target.touchStartX);
                                  const deltaY = Math.abs(touch.clientY - target.touchStartY);
                                  
                                  if (deltaX > moveThreshold || deltaY > moveThreshold) {
                                    if (target.touchTimer) {
                                      clearTimeout(target.touchTimer);
                                    }
                                    if (target.feedbackTimer) {
                                      clearTimeout(target.feedbackTimer);
                                    }
                                    target.style.backgroundColor = '';
                                  }
                                }
                              }}
                              onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                              className="w-full flex items-center gap-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg transition-all duration-200 select-none"
                            >
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold">
                                  {partner?.avatar}
                                </div>
                                <div className="absolute -top-1 -right-1">
                                  <Pin className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-bold text-base truncate">{partner?.name}</div>
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
                      <div className="border-b border-gray-200 my-4"></div>
                    </div>
                  )}

                  {/* Favourite Chats */}

                  

                  {searchQuery && messageSearchResults.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                        Messages
                      </h4>
                      {messageSearchResults.map(result => (
                        <button
                          key={result.id}
                          onClick={() => {
                            handleSelectConversation(result.conversation);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-start gap-4 p-3 hover:bg-white rounded-lg transition-all duration-200"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                              {result.partner?.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(result.partner?.status)}`}></div>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-base truncate">{result.partner?.name}</div>
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(result.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-purple-600">
                                {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                                part.toLowerCase() === searchQuery.toLowerCase() ? 
                                  <span key={index} className="bg-yellow-200 font-medium">{part}</span> : 
                                  part
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Show conversation results below message results */}
                      {filteredConversations.length > 0 && (
                        <>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mt-6">
                            Conversations
                          </h4>
                          {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                            const partner = getConversationPartner(conversation, currentUser.id);
                            return (
                              <button
                                key={conversation.id}
                                onClick={() => handleSelectConversation(conversation)}
                                onTouchStart={(e) => {
                                  const touch = e.touches[0];
                                  const target = e.currentTarget;
                                  target.touchStartTime = Date.now();
                                  target.touchStartX = touch.clientX;
                                  target.touchStartY = touch.clientY;
                                  
                                  // Add visual feedback after 500ms
                                  target.feedbackTimer = setTimeout(() => {
                                    target.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                                  }, 500);
                                }}
                                onTouchEnd={(e) => {
                                  const target = e.currentTarget;
                                  if (target.feedbackTimer) {
                                    clearTimeout(target.feedbackTimer);
                                  }
                                  target.style.backgroundColor = '';
                                  
                                  const touchDuration = Date.now() - (target.touchStartTime || 0);
                                  const touch = e.changedTouches[0];
                                  const deltaX = Math.abs(touch.clientX - (target.touchStartX || 0));
                                  const deltaY = Math.abs(touch.clientY - (target.touchStartY || 0));
                                  
                                  // If long press (> 500ms) and minimal movement, show context menu
                                  if (touchDuration > 500 && deltaX < 10 && deltaY < 10) {
                                    e.preventDefault();
                                    handleChatContextMenu(e, conversation);
                                  }
                                }}
                                onContextMenu={(e) => handleChatContextMenu(e, conversation)}
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
                        </>
                      )}
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="space-y-3">
                      {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                        const partner = getConversationPartner(conversation, currentUser.id);
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            onTouchStart={(e) => {
                              const touch = e.touches[0];
                              const target = e.currentTarget;
                              target.touchStartTime = Date.now();
                              target.touchStartX = touch.clientX;
                              target.touchStartY = touch.clientY;
                              
                              // Add visual feedback after 500ms
                              target.feedbackTimer = setTimeout(() => {
                                target.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                                // Haptic feedback if available
                                if (navigator.vibrate) {
                                  navigator.vibrate(50);
                                }
                              }, 500);
                              
                              // Long press after 1000ms
                              target.touchTimer = setTimeout(() => {
                                e.preventDefault();
                                handleChatContextMenu(e, conversation);
                                target.style.backgroundColor = '';
                              }, 1000);
                            }}
                            onTouchEnd={(e) => {
                              const target = e.currentTarget;
                              if (target.touchTimer) {
                                clearTimeout(target.touchTimer);
                              }
                              if (target.feedbackTimer) {
                                clearTimeout(target.feedbackTimer);
                              }
                              target.style.backgroundColor = '';
                            }}
                            onTouchMove={(e) => {
                              const touch = e.touches[0];
                              const target = e.currentTarget;
                              const moveThreshold = 10;
                              
                              if (target.touchStartX && target.touchStartY) {
                                const deltaX = Math.abs(touch.clientX - target.touchStartX);
                                const deltaY = Math.abs(touch.clientY - target.touchStartY);
                                
                                if (deltaX > moveThreshold || deltaY > moveThreshold) {
                                  if (target.touchTimer) {
                                    clearTimeout(target.touchTimer);
                                  }
                                  if (target.feedbackTimer) {
                                    clearTimeout(target.feedbackTimer);
                                  }
                                  target.style.backgroundColor = '';
                                }
                              }
                            }}
                            onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                            className="w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200 select-none"
                          >
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold">
                                {partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-bold text-base truncate">{partner?.name}</div>
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
            {!showChatInfo ? (
              <>
                {/* Pinned Message */}
                {activeConversation && pinnedMessages[activeConversation.id] && (
                  <div className="mx-4 mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Pin className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">Pinned Message</span>
                        </div>
                        <div className="text-sm text-gray-700 bg-white p-2 rounded">
                          {pinnedMessages[activeConversation.id].message.text}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnpinMessage(activeConversation.id)}
                        className="text-gray-400 hover:text-gray-600 ml-2 p-1"
                        title="Unpin message"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
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
                          <>
                            {message.replyTo && (
                              <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-purple-400">
                                <div className="text-xs text-purple-600 font-medium mb-1">
                                  {message.replyTo.senderName}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {message.replyTo.text}
                                </div>
                              </div>
                            )}
                            <div 
                              onTouchStart={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget;
                                target.touchStartTime = Date.now();
                                target.touchStartX = touch.clientX;
                                target.touchStartY = touch.clientY;
                                
                                // Add visual feedback after 500ms
                                target.feedbackTimer = setTimeout(() => {
                                  target.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                                  // Haptic feedback if available
                                  if (navigator.vibrate) {
                                    navigator.vibrate(50);
                                  }
                                }, 500);
                                
                                // Long press after 1000ms
                                target.touchTimer = setTimeout(() => {
                                  e.preventDefault();
                                  handleContextMenu(e, message);
                                  target.style.backgroundColor = '';
                                }, 1000);
                              }}
                              onTouchEnd={(e) => {
                                const target = e.currentTarget;
                                if (target.touchTimer) {
                                  clearTimeout(target.touchTimer);
                                }
                                if (target.feedbackTimer) {
                                  clearTimeout(target.feedbackTimer);
                                }
                                target.style.backgroundColor = '';
                              }}
                              onTouchMove={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget;
                                const moveThreshold = 10;
                                
                                if (target.touchStartX && target.touchStartY) {
                                  const deltaX = Math.abs(touch.clientX - target.touchStartX);
                                  const deltaY = Math.abs(touch.clientY - target.touchStartY);
                                  
                                  if (deltaX > moveThreshold || deltaY > moveThreshold) {
                                    if (target.touchTimer) {
                                      clearTimeout(target.touchTimer);
                                    }
                                    if (target.feedbackTimer) {
                                      clearTimeout(target.feedbackTimer);
                                    }
                                    target.style.backgroundColor = '';
                                  }
                                }
                              }}
                              onContextMenu={(e) => handleContextMenu(e, message)}
                              className="cursor-pointer select-none transition-colors duration-200"
                            >
                              {editingMessage && editingMessage.id === message.id ? (
                                editMessageText
                              ) : (
                                message.text
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right mr-1' : 'text-left ml-1'}`}>
                        {formatMessageTime(message.timestamp)}
                        {message.edited && (
                          <span className="ml-1 text-gray-400 italic">edited</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="relative p-4 bg-white border-t border-gray-200 safe-area-inset-bottom">
              {/* Edit UI */}
              {editingMessage && (
                <div className="mb-3 bg-yellow-50 border-l-4 border-yellow-500 p-2 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-yellow-600">
                        Editing message
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {editingMessage.text}
                      </div>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Reply UI */}
              {replyToMessage && !editingMessage && (
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
              
              <div className="flex items-center gap-3">
                {!editingMessage && (
                  <button
                    onClick={() => setShowAttachmentMenu(true)}
                    className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                )}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                    value={editingMessage ? editMessageText : newMessage}
                    onChange={(e) => editingMessage ? setEditMessageText(e.target.value) : setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all duration-200"
                  />
                </div>
                {editingMessage ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                      title="Cancel edit"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editMessageText.trim()}
                      className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Save changes"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                )}
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
          </>
        ) : (
          /* Chat Info inline for desktop mode */
          <div className="flex-1 overflow-y-auto">
            <ChatInfo
              isOpen={true}
              onClose={() => setShowChatInfo(false)}
              conversation={activeConversation}
              currentUserId={currentUser.id}
              onUpdateGroup={handleUpdateGroup}
              onLeaveGroup={handleLeaveGroup}
              onRemoveMember={handleRemoveMember}
              isCompact={false}
              isInline={true}
            />
          </div>
        )}
          </div>
        )}
        </div>
        
        {/* Context Menu for Mobile */}
        {contextMenu.show && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[60] py-2 min-w-[150px]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 250)
            }}
          >
            <button
              onClick={handleContextMenuReply}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
            >
              <Reply className="h-4 w-4" />
              <span>Reply</span>
            </button>
            
            <button
              onClick={handleContextMenuForward}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
            >
              <Forward className="h-4 w-4" />
              <span>Forward</span>
            </button>

            <button
              onClick={() => {
                handlePin(contextMenu.message);
                setContextMenu({ show: false, x: 0, y: 0, message: null });
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
            >
              <Pin className="h-4 w-4" />
              <span>Pin</span>
            </button>

            {contextMenu.message && canEditMessage(contextMenu.message) && (
              <button
                onClick={() => {
                  handleStartEdit(contextMenu.message);
                  setContextMenu({ show: false, x: 0, y: 0, message: null });
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        )}

        {/* Chat Context Menu for Mobile */}
        {chatContextMenu.show && (
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[60] py-2 min-w-[150px] chat-context-menu"
            style={{
              left: Math.min(chatContextMenu.x, window.innerWidth - 200),
              top: Math.min(chatContextMenu.y, window.innerHeight - 150)
            }}
          >
            {(() => {
              const isPinned = pinnedChats.find(p => p.id === chatContextMenu.conversation?.id);
              const isFavourite = favouriteChats.find(f => f.id === chatContextMenu.conversation?.id);
              
              return (
                <div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (chatContextMenu.conversation) {
                        if (isPinned) {
                          handleUnpinChat(chatContextMenu.conversation.id);
                          setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                        } else {
                          handlePinChat(chatContextMenu.conversation);
                          setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                        }
                      } else {
                        console.error('No conversation found in chatContextMenu for mobile');
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                    data-pin-chat="true"
                  >
                    <Pin className="h-4 w-4" />
                    <span>{isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (chatContextMenu.conversation) {
                        if (isFavourite) {
                          handleRemoveFromFavourites(chatContextMenu.conversation.id);
                        } else {
                          handleAddToFavourites(chatContextMenu.conversation);
                        }
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                  >
                    <Star className="h-4 w-4" />
                    <span>{isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}</span>
                  </button>
            </div>
              );
            })()}
          </div>
        )}

        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
          currentUserId={currentUser.id}
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
          message={messageToForward}
          conversations={conversations.filter(conv => conv.id !== activeConversation?.id)}
          currentUserId={currentUser.id}
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
      </>
    );
  }

  // Compact mode - small popup chat (like normal chat window)
  if (isCompactMode || (isMobile && !isFullScreenMobile)) {
    return (
      <>
        <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.3)] border border-white/30 z-50 flex flex-col font-['Inter',sans-serif] overflow-hidden">
        {/* Header - Modern neumorphic design */}
        <div className="flex items-center justify-between p-4 border-b border-white/30 bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            {activeConversation && (
              <button
                onClick={() => setActiveConversation(null)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex-1 flex items-center justify-center mx-3">
            <h3 className="font-semibold text-sm text-center truncate">
              {activeConversation 
                ? getConversationPartner(activeConversation, currentUser.id)?.name 
                : 'Atom Link'
              }
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            {activeConversation ? (
              <div className="relative" ref={compactKebabMenuRef}>
                <button 
                  onClick={() => setShowCompactKebabMenu(!showCompactKebabMenu)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  title="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                
                {/* Compact Kebab Menu */}
                {showCompactKebabMenu && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.2)] z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                        onClick={() => setShowCompactKebabMenu(false)}
                      >
                        <Phone className="h-3 w-3" />
                        <span>Call</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                        onClick={() => setShowCompactKebabMenu(false)}
                      >
                        <Video className="h-3 w-3" />
                        <span>Video Call</span>
                      </button>
                      <button
                        onClick={() => {
                          handleShowInfo();
                          setShowCompactKebabMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                      >
                        <Info className="h-3 w-3" />
                        <span>Chat Info</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={compactPlusMenuRef}>
                <button
                  onClick={() => setShowCompactPlusMenu(!showCompactPlusMenu)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  title="New chat options"
                >
                  <Plus className="h-4 w-4" />
                </button>
                
                {/* Compact Plus Menu */}
                {showCompactPlusMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.2)] z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setShowUserList(true);
                          setShowCompactPlusMenu(false);
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center">
                          <Plus className="h-3 w-3 text-white" />
                        </div>
                        <span>New Chat</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateGroup(true);
                          setShowCompactPlusMenu(false);
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-xl flex items-center justify-center">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                        <span>Create Group</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="w-px h-4 bg-white/30 mx-2"></div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCompactMode}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                title={isCompactMode ? "Expand to full chat" : "Minimize to compact"}
              >
                {isCompactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-105"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Chat Content */}
        {!activeConversation ? (
          <div className="flex-1 flex flex-col bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm">
            {/* Search */}
            <div className="p-3 border-b border-white/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Don't automatically show user list - let the search results determine what to show
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-sm text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] transition-all duration-300"
                />
              </div>
              
              {/* Filter Buttons for Compact Mode */}
              {!showUserList && (
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => setChatFilter('all')}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      chatFilter === 'all' 
                        ? 'bg-gradient-to-r from-[#86efac] to-[#4ade80] text-white border-[#86efac] shadow-[0_4px_16px_rgba(134,239,172,0.3)]' 
                        : 'bg-white/70 text-[#6b7280] border-white/30 hover:bg-white/80'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatFilter('direct')}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      chatFilter === 'direct' 
                        ? 'bg-gradient-to-r from-[#86efac] to-[#4ade80] text-white border-[#86efac] shadow-[0_4px_16px_rgba(134,239,172,0.3)]' 
                        : 'bg-white/70 text-[#6b7280] border-white/30 hover:bg-white/80'
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    onClick={() => setChatFilter('groups')}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      chatFilter === 'groups' 
                        ? 'bg-gradient-to-r from-[#86efac] to-[#4ade80] text-white border-[#86efac] shadow-[0_4px_16px_rgba(134,239,172,0.3)]' 
                        : 'bg-white/70 text-[#6b7280] border-white/30 hover:bg-white/80'
                    }`}
                  >
                    Groups
                  </button>
                  <button
                    onClick={() => setShowFavouritesFilter(f => !f)}
                    className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${
                      showFavouritesFilter
                        ? 'bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white border-[#f59e0b] shadow-[0_4px_16px_rgba(245,158,11,0.2)]'
                        : 'bg-white/70 text-[#f59e0b] border-white/30 hover:bg-white/80'
                    }`}
                    title="Favourites"
                  >
                    <Star className="w-3 h-3" />
                    <span>Favourites</span>
                  </button>
                </div>
              )}
            </div>

            {/* Conversations List or User Search Results */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '380px' }}>
              {showUserList ? (
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2 px-1">Start New Chat</h4>
                  <div className="space-y-1">
                    {filteredEmployees.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => handleStartNewChat(employee)}
                        className="w-full flex items-center gap-3 p-3 bg-white/70 backdrop-blur-sm hover:bg-white/80 hover:scale-105 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)] transition-all duration-300"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white text-xs font-bold shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                            {employee.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(employee.status)} transition-all duration-200`}></div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium text-sm text-[#1f2937] truncate">{employee.name}</div>
                          <div className="text-xs text-[#6b7280] truncate">{employee.role}</div>
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
                      <div className="px-2 py-1 text-xs font-medium text-[#6b7280] uppercase tracking-wide flex items-center gap-1">
                        <Pin className="w-3 h-3 text-[#86efac]" />
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
                              className="w-full flex items-center gap-2 p-3 bg-gradient-to-r from-[#86efac]/20 to-[#4ade80]/20 backdrop-blur-sm border-l-4 border-[#86efac] rounded-r-2xl transition-all duration-200"
                            >
                              <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white text-xs font-bold">
                                  {partner?.avatar}
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#86efac] rounded-full flex items-center justify-center">
                                  <Pin className="w-1.5 h-1.5 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-bold text-xs text-[#1f2937] truncate">{partner?.name}</div>
                                <div className="text-xs text-[#6b7280] truncate">
                                  {conversation.lastMessage?.text || 'No messages yet'}
                                </div>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="bg-[#86efac] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1rem] text-center font-medium">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-b border-white/30 my-2"></div>
                    </div>
                  )}

                  {/* Favourite Chats */}
                  {/* Favourites section removed from main chat list as per requirements */}

                  {/* Regular Conversations */}
                  {searchQuery && messageSearchResults.length > 0 ? (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                        Messages
                      </div>
                      {messageSearchResults.map(result => (
                        <button
                          key={result.id}
                          onClick={() => {
                            handleSelectConversation(result.conversation);
                            setSearchQuery('');
                          }}
                          className="w-full p-2 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all duration-200"
                        >
                          <div className="flex items-start gap-2">
                            <div className="relative flex-shrink-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white text-xs font-bold">
                                {result.partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(result.partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-bold text-xs text-[#1f2937] truncate">
                                  {result.partner?.name}
                                </p>
                                <span className="text-xs text-[#6b7280]">
                                  {formatMessageTime(result.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs font-medium text-[#6d28d9]">
                                  {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                                </span>
                              </div>
                              <p className="text-xs text-[#6b7280] line-clamp-2">
                                {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                                  part.toLowerCase() === searchQuery.toLowerCase() ? 
                                    <span key={index} className="bg-yellow-200 font-medium">{part}</span> : 
                                    part
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Show conversation results below message results */}
                      {filteredConversations.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-[#6b7280] uppercase tracking-wide mt-2">
                            Conversations
                          </div>
                          {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                            const partner = getConversationPartner(conversation, currentUser.id);
                            return (
                              <button
                                key={conversation.id}
                                onClick={() => handleSelectConversation(conversation)}
                                onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                                className="w-full flex items-center gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-2xl transition-all duration-200"
                              >
                                <div className="relative">
                                  <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white text-xs font-bold">
                                    {partner?.avatar}
                                  </div>
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="font-bold text-sm text-[#1f2937] truncate">{partner?.name}</div>
                                    {conversation.unreadCount > 0 && (
                                      <span className="bg-[#86efac] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                                        {conversation.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-[#6b7280] truncate">
                                    {conversation.lastMessage?.text || 'No messages yet'}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="space-y-1">
                      {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                        const partner = getConversationPartner(conversation, currentUser.id);
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                            className="w-full flex items-center gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-2xl transition-all duration-200"
                          >
                            <div className="relative">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white text-xs font-bold">
                                {partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-sm text-[#1f2937] truncate">{partner?.name}</div>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-[#86efac] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#6b7280] truncate">
                                {conversation.lastMessage?.text || 'No messages yet'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-[#6b7280] mt-8 px-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#c084fc]/20 to-[#d8b4fe]/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                        <MessageCircle className="h-8 w-8 text-[#c084fc]" />
                      </div>
                      <p className="text-sm font-medium text-[#1f2937] mb-1">No conversations yet</p>
                      <p className="text-xs text-[#6b7280]">Search for colleagues to start chatting</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {!showChatInfo ? (
              <>
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
                            <span className="italic">Forwarded</span>
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
                        {message.edited && (
                          <span className="ml-1 text-gray-400 italic">edited</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="relative px-3 pt-3 pb-2 border-t border-gray-200">
              {/* Edit UI */}
              {editingMessage && (
                <div className="mb-3 bg-yellow-50 border-l-4 border-yellow-500 p-2 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-yellow-600">
                        Editing message
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {editingMessage.text}
                      </div>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Reply UI */}
              {replyToMessage && !editingMessage && (
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
                {!editingMessage && (
                  <button
                    onClick={() => setShowAttachmentMenu(true)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                )}
                <input
                  type="text"
                  placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                  value={editingMessage ? editMessageText : newMessage}
                  onChange={(e) => editingMessage ? setEditMessageText(e.target.value) : setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200"
                />
                {editingMessage ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editMessageText.trim()}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
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
          </>
        ) : (
          /* Chat Info inline for compact mode */
          <div className="flex-1 overflow-y-auto">
            <ChatInfo
              isOpen={true}
              onClose={() => setShowChatInfo(false)}
              conversation={activeConversation}
              currentUserId={currentUser.id}
              onUpdateGroup={handleUpdateGroup}
              onLeaveGroup={handleLeaveGroup}
              onRemoveMember={handleRemoveMember}
              isCompact={true}
              isInline={true}
            />
          </div>
        )}
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
            {canEditMessage(contextMenu.message) && (
              <button
                onClick={() => handleStartEdit(contextMenu.message)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
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
            {(() => {
              const isPinned = pinnedChats.find(p => p.id === chatContextMenu.conversation?.id);
              const isFavourite = favouriteChats.find(f => f.id === chatContextMenu.conversation?.id);
              
              return (
                <div>
                  <button
                    onClick={(e) => {
                   
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (chatContextMenu.conversation) {
                        if (isPinned) {
                          handleUnpinChat(chatContextMenu.conversation.id);
                          setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                        } else {
                          handlePinChat(chatContextMenu.conversation);
                          setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                        }
                      } else {
                        console.error('No conversation found in chatContextMenu for compact');
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    data-pin-chat="true"
                  >
                    <Pin className="h-4 w-4" />
                    {isPinned ? 'Unpin Chat' : 'Pin Chat'}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (chatContextMenu.conversation) {
                        if (isFavourite) {
                          handleRemoveFromFavourites(chatContextMenu.conversation.id);
                        } else {
                          handleAddToFavourites(chatContextMenu.conversation);
                        }
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                  </button>
            </div>
              );
            })()}
          </div>
        )}
      </>
    );
  }

  // Desktop expanded popup layout
  return (
    <>
      <div className="fixed bottom-4 right-4 w-[790px] h-[790px] max-w-[85vw] max-h-[85vh] bg-gradient-to-br from-[#f7f4ff] to-[#ede7f6] z-40 flex font-['Inter',sans-serif] rounded-3xl shadow-[0_25px_80px_rgba(109,40,217,0.25)] border border-white/40 backdrop-blur-xl overflow-hidden neo-glassmorphism animate-in zoom-in-95 duration-300">
        {/* Left Sidebar - App Navigation */}
        <div className="w-16 h-full bg-white/70 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)] rounded-l-3xl">
          {/* App Header */}
          <div className="p-3 border-b border-white/30">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-2xl shadow-[0_8px_32px_rgba(109,40,217,0.3)] flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            
            {/* Navigation Items */}
            <nav className="space-y-2">
              {/* <button className="relative w-full flex items-center justify-center p-2 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white shadow-[0_4px_16px_rgba(109,40,217,0.3)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(109,40,217,0.4)] hover:scale-105 group">
                <MessageCircle className="h-4 w-4" />
                {conversations.reduce((total, conv) => total + conv.unreadCount, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
                  </span>
                )}
                <div className="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Messages
                </div>
              </button> */}
              
              <button 
                onClick={() => setShowGroupFilter(!showGroupFilter)}
                className={`relative w-full flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:scale-105 group ${
                  showGroupFilter 
                    ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white shadow-[0_4px_16px_rgba(109,40,217,0.3)]' 
                    : 'text-[#6b7280] hover:bg-white/40 hover:text-[#1f2937] hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.5)]'
                }`}
              >
                <Users className="h-4 w-4" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {showGroupFilter ? 'Show All' : 'Groups Only'}
                </div>
              </button>
              
              <button 
                onClick={() => setShowFavouritesFilter(!showFavouritesFilter)}
                className={`relative w-full flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:scale-105 group ${
                  showFavouritesFilter 
                    ? 'bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white shadow-[0_4px_16px_rgba(245,158,11,0.3)]' 
                    : 'text-[#6b7280] hover:bg-white/40 hover:text-[#1f2937] hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.5)]'
                }`}
              >
                <Star className="h-4 w-4" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {showFavouritesFilter ? 'Show All' : 'Favourites Only'}
                </div>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex h-full rounded-r-3xl overflow-hidden">
          {/* Chat List Sidebar */}
          <div className="w-64 bg-white/50 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]">
            {/* Chat Header */}
            <div className="p-3 border-b border-white/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-[#1f2937]">Atom Link</h2>
                  <p className="text-xs text-[#6b7280]">Stay connected with your team</p>
                </div>
                <button 
                  onClick={() => setShowCreateGroup(true)}
                  className="p-2 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl shadow-[0_8px_32px_rgba(192,132,252,0.3)] hover:shadow-[0_12px_40px_rgba(192,132,252,0.4)] transition-all duration-300 hover:scale-105"
                  title="Create Group"
                >
                  <Plus className="h-4 w-4 text-white" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-[#6b7280]" />
                </div>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Don't automatically show user list - let the search results determine what to show
                  }}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-sm text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300"
                />
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {/* Pinned Chats */}
              {pinnedChats.length > 0 && !searchQuery && (
                <div className="p-3 border-b border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Pin className="h-3 w-3 text-[#86efac]" />
                    <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Pinned Chats</h3>
                  </div>
                  <div className="space-y-1">
                    {pinnedChats.map(conversation => {
                      const partner = getConversationPartner(conversation, currentUser.id);
                      const isActive = activeConversation?.id === conversation.id;
                      
                      return (
                        <button
                          key={`pinned-${conversation.id}`}
                          onClick={() => handleSelectConversation(conversation)}
                          onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                          className={`w-full p-2 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white' 
                              : 'bg-white/70 backdrop-blur-sm border-l-4 border-[#86efac]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="w-9 h-9 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                {partner?.avatar}
                              </div>
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#86efac] rounded-full flex items-center justify-center">
                                <Pin className="h-2 w-2 text-white" />
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                                  {partner?.name}
                                </p>
                                {conversation.lastMessage && (
                                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                    {formatMessageTime(conversation.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className={`text-xs truncate ${isActive ? 'text-white/90' : 'text-[#6b7280]'}`}>
                                  {conversation.lastMessage?.text || 'No messages yet'}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="ml-1 bg-[#86efac] text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Favourite Chats */}
              {/* Favourites section removed from main chat list as per requirements */}
              
              {/* All Chats */}
              <div className="p-3">
                <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">All Chats</h3>
                <div className="space-y-1">
                  {showUserList ? (
                    <div className="space-y-2">
                      {filteredEmployees.map(employee => (
                        <button
                          key={employee.id}
                          onClick={() => handleStartNewChat(employee)}
                          className="w-full p-4 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white/80 hover:scale-105 shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)] transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-bold shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                                {employee.avatar}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(employee.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-semibold text-[#1f2937] truncate">{employee.name}</p>
                              <p className="text-sm text-[#6b7280] truncate">{employee.role}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery && messageSearchResults.length > 0 ? (
                    <div className="space-y-2">
                      <div className="px-2 py-1 text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                        Messages
                      </div>
                      {messageSearchResults.map(result => (
                        <button
                          key={result.id}
                          onClick={() => {
                            handleSelectConversation(result.conversation);
                            setSearchQuery('');
                          }}
                          className="w-full p-3 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-bold text-sm">
                                {result.partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(result.partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-bold text-sm text-[#1f2937] truncate">
                                  {result.partner?.name}
                                </p>
                                <span className="text-xs text-[#6b7280]">
                                  {formatMessageTime(result.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-[#6d28d9]">
                                  {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                                </span>
                              </div>
                              <p className="text-xs text-[#6b7280] line-clamp-2">
                                {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                                  part.toLowerCase() === searchQuery.toLowerCase() ? 
                                    <span key={index} className="bg-yellow-200 font-medium">{part}</span> : 
                                    part
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Show conversation results below message results */}
                      {filteredConversations.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-[#6b7280] uppercase tracking-wide mt-4">
                            Conversations
                          </div>
                          {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                            const partner = getConversationPartner(conversation, currentUser.id);
                            const isActive = activeConversation?.id === conversation.id;
                            
                            return (
                              <button
                                key={conversation.id}
                                onClick={() => handleSelectConversation(conversation)}
                                onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                                className={`w-full p-2 rounded-xl transition-all duration-200 ${
                                  isActive 
                                    ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white' 
                                    : 'bg-white/70 backdrop-blur-sm'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <div className="w-9 h-9 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                      {partner?.avatar}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                                        {partner?.name}
                                      </p>
                                      {conversation.lastMessage && (
                                        <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                          {formatMessageTime(conversation.lastMessage.timestamp)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className={`text-xs truncate ${isActive ? 'text-white/90' : 'text-[#6b7280]'}`}>
                                        {conversation.lastMessage?.text || 'No messages yet'}
                                      </p>
                                      {conversation.unreadCount > 0 && (
                                        <span className="ml-1 bg-[#86efac] text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                          {conversation.unreadCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  ) : (
                    filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                      const partner = getConversationPartner(conversation, currentUser.id);
                      const isActive = activeConversation?.id === conversation.id;
                      
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation)}
                          onContextMenu={(e) => handleChatContextMenu(e, conversation)}
                          className={`w-full p-2 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white' 
                              : 'bg-white/70 backdrop-blur-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="w-9 h-9 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                {partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                                  {partner?.name}
                                </p>
                                {conversation.lastMessage && (
                                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                    {formatMessageTime(conversation.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className={`text-xs truncate ${isActive ? 'text-white/90' : 'text-[#6b7280]'}`}>
                                  {conversation.lastMessage?.text || 'No messages yet'}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="ml-1 bg-[#86efac] text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Content */}
          {activeConversation ? (
            <div className="flex-1 flex flex-col bg-white/30 backdrop-blur-xl rounded-r-3xl overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/30 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                        {getConversationPartner(activeConversation, currentUser.id)?.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)}`}></div>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1f2937]">
                        {getConversationPartner(activeConversation, currentUser.id)?.name}
                      </h2>
                      <p className="text-sm text-[#6b7280] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)}`}></span>
                        {getConversationPartner(activeConversation, currentUser.id)?.status === 'online' ? 'Active now' : 
                         getConversationPartner(activeConversation, currentUser.id)?.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105">
                      <Phone className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <button className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105">
                      <Video className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <button 
                      onClick={handleShowInfo}
                      className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
                    >
                      <Info className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <div className="w-px h-6 bg-white/30 mx-2"></div>
                    <button
                      onClick={toggleCompactMode}
                      className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
                      title="Switch to compact view"
                    >
                      <Minimize2 className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 bg-red-100/80 backdrop-blur-sm hover:bg-red-200/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-105"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              {!showChatInfo ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Pinned Message */}
                    {activeConversation && pinnedMessages[activeConversation.id] && (
                      <div className="bg-gradient-to-r from-[#86efac]/20 to-[#4ade80]/20 backdrop-blur-sm border border-[#86efac]/30 p-4 rounded-2xl shadow-[inset_0_0_20px_rgba(134,239,172,0.2)]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Pin className="h-4 w-4 text-[#86efac]" />
                              <span className="text-sm font-semibold text-[#86efac]">Pinned Message</span>
                            </div>
                            <p className="text-[#1f2937]">
                              {pinnedMessages[activeConversation.id].message.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUnpin('message', activeConversation.id)}
                            className="p-2 hover:bg-white/30 rounded-xl transition-colors"
                          >
                            <X className="h-4 w-4 text-[#6b7280]" />
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
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            {!isOwnMessage && activeConversation.type === 'group' && (
                              <div className="text-xs font-medium text-[#6d28d9] mb-2 ml-2">{sender?.name}</div>
                            )}
                            <div
                              className={`relative group ${message.type === 'poll' ? 'p-4' : 'px-6 py-4'} rounded-2xl transition-all duration-300 hover:scale-105 ${
                                isOwnMessage
                                  ? `bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] text-white shadow-[0_8px_32px_rgba(109,40,217,0.3)] ${isOwnMessage ? 'rounded-br-lg' : ''}`
                                  : `bg-white/80 backdrop-blur-sm text-[#1f2937] border border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)] ${!isOwnMessage ? 'rounded-bl-lg' : ''}`
                              }`}
                              onContextMenu={(e) => handleContextMenu(e, message)}
                            >
                              {/* Reply indicator */}
                              {message.replyTo && (
                                <div className={`mb-3 p-3 rounded-xl border-l-4 ${
                                  isOwnMessage 
                                    ? 'bg-white/20 border-white/40 backdrop-blur-sm' 
                                    : 'bg-[#6d28d9]/10 border-[#6d28d9]/30'
                                }`}>
                                  <div className={`text-xs font-medium mb-1 ${
                                    isOwnMessage ? 'text-white/90' : 'text-[#6d28d9]'
                                  }`}>
                                    {message.replyTo.senderName}
                                  </div>
                                  <div className={`text-sm ${
                                    isOwnMessage ? 'text-white/80' : 'text-[#6b7280]'
                                  }`}>
                                    {message.replyTo.text}
                                  </div>
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
                                <p className="leading-relaxed">{message.text}</p>
                              )}
                            </div>
                            <div className={`text-xs text-[#6b7280] mt-2 ${isOwnMessage ? 'text-right mr-2' : 'text-left ml-2'}`}>
                              {formatMessageTime(message.timestamp)}
                              {message.edited && (
                                <span className="ml-1 italic opacity-75">edited</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-white/30 bg-white/50 backdrop-blur-sm">
                    {/* Reply UI */}
                    {replyToMessage && (
                      <div className="mb-4 bg-gradient-to-r from-[#c084fc]/20 to-[#d8b4fe]/20 backdrop-blur-sm border border-[#c084fc]/30 p-4 rounded-2xl">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#6d28d9] mb-1">
                              Replying to {getEmployeeById(replyToMessage.senderId)?.name}
                            </div>
                            <div className="text-sm text-[#6b7280] truncate">
                              {replyToMessage.text}
                            </div>
                          </div>
                          <button
                            onClick={handleCancelReply}
                            className="p-2 hover:bg-white/30 rounded-xl transition-colors"
                          >
                            <X className="h-4 w-4 text-[#6b7280]" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAttachmentMenu(true)}
                        className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
                      >
                        <Paperclip className="h-4 w-4 text-[#6d28d9]" />
                      </button>
                      
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                          value={editingMessage ? editMessageText : newMessage}
                          onChange={(e) => editingMessage ? setEditMessageText(e.target.value) : setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-sm text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] focus:shadow-[inset_0_0_15px_rgba(255,255,255,0.9),0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300"
                        />
                      </div>
                      
                      {editingMessage ? (
                        <div className="flex gap-1">
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-red-50/70 backdrop-blur-sm hover:bg-red-100/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editMessageText.trim()}
                            className="p-2 bg-gradient-to-br from-[#86efac] to-[#4ade80] text-white rounded-xl shadow-[0_4px_16px_rgba(134,239,172,0.3)] hover:shadow-[0_6px_20px_rgba(134,239,172,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="p-2 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] text-white rounded-xl shadow-[0_4px_16px_rgba(109,40,217,0.3)] hover:shadow-[0_6px_20px_rgba(109,40,217,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Typing Indicator */}
                    <div className="mt-3 text-sm text-[#6b7280] ml-4 opacity-0 transition-opacity">
                      <span className="inline-flex items-center gap-1">
                        <span>Someone is typing</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-[#6b7280] rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-[#6b7280] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-1 h-1 bg-[#6b7280] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </span>
                    </div>
                    
                    <AttachmentMenu
                      isOpen={showAttachmentMenu}
                      onClose={() => setShowAttachmentMenu(false)}
                      onSelect={handleAttachmentSelect}
                      isGroup={activeConversation?.type === 'group'}
                      isCompact={false}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto bg-white/30">
                  <ChatInfo
                    isOpen={true}
                    onClose={() => setShowChatInfo(false)}
                    conversation={activeConversation}
                    currentUserId={currentUser.id}
                    onUpdateGroup={handleUpdateGroup}
                    onLeaveGroup={handleLeaveGroup}
                    onRemoveMember={handleRemoveMember}
                    isCompact={false}
                    isInline={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white/30 backdrop-blur-xl rounded-r-3xl">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_16px_64px_rgba(192,132,252,0.3)]">
                  <MessageCircle className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1f2937] mb-3">Select a conversation</h3>
                <p className="text-[#6b7280] max-w-md mx-auto">
                  Choose from your existing conversations or start a new one to begin chatting with your team
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
        currentUserId={currentUser.id}
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

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.2)] py-2 z-[60] min-w-[150px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          {canEditMessage(contextMenu.message) && (
            <button
              onClick={() => handleStartEdit(contextMenu.message)}
              className="w-full px-4 py-3 text-left text-sm text-[#1f2937] hover:bg-[#6d28d9]/10 hover:text-[#6d28d9] transition-colors flex items-center gap-3 first:rounded-t-2xl"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
          <button
            onClick={handleContextMenuReply}
            className="w-full px-4 py-3 text-left text-sm text-[#1f2937] hover:bg-[#6d28d9]/10 hover:text-[#6d28d9] transition-colors flex items-center gap-3"
          >
            <Reply className="h-4 w-4" />
            Reply
          </button>
          <button
            onClick={handleContextMenuForward}
            className="w-full px-4 py-3 text-left text-sm text-[#1f2937] hover:bg-[#6d28d9]/10 hover:text-[#6d28d9] transition-colors flex items-center gap-3"
          >
            <Forward className="h-4 w-4" />
            Forward
          </button>
          <button
            onClick={() => handlePin(contextMenu.message)}
            className="w-full px-4 py-3 text-left text-sm text-[#1f2937] hover:bg-[#6d28d9]/10 hover:text-[#6d28d9] transition-colors flex items-center gap-3 last:rounded-b-2xl"
          >
            <Pin className="h-4 w-4" />
            Pin
          </button>
        </div>
      )}

      {/* Chat Context Menu for Desktop */}
      {chatContextMenu.show && (
        <div
          className="fixed bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.2)] py-2 z-[60] min-w-[120px] chat-context-menu"
          style={{
            left: `${chatContextMenu.x}px`,
            top: `${chatContextMenu.y}px`,
          }}
        >
          {(() => {
            const isPinned = pinnedChats.find(p => p.id === chatContextMenu.conversation?.id);
            const isFavourite = favouriteChats.find(f => f.id === chatContextMenu.conversation?.id);
            return (
              <div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (chatContextMenu.conversation) {
                      if (isPinned) {
                        handleUnpinChat(chatContextMenu.conversation.id);
                        setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                      } else {
                        handlePinChat(chatContextMenu.conversation);
                        setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                      }
                    } else {
                      console.error('No conversation found in chatContextMenu for desktop');
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[#1f2937] hover:bg-[#6d28d9]/10 hover:text-[#6d28d9] transition-colors flex items-center gap-3 first:rounded-t-2xl"
                  data-pin-chat="true"
                >
                  <Pin className="h-4 w-4" />
                  {isPinned ? 'Unpin Chat' : 'Pin Chat'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (chatContextMenu.conversation) {
                      if (isFavourite) {
                        handleRemoveFromFavourites(chatContextMenu.conversation.id);
                      } else {
                        handleAddToFavourites(chatContextMenu.conversation);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[#1f2937] hover:bg-[#f59e0b]/10 hover:text-[#f59e0b] transition-colors flex items-center gap-3 last:rounded-b-2xl"
                >
                  <Star className="h-4 w-4" />
                  {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default ChatApp;
