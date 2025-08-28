import React, { createContext, useContext, useState, useEffect } from 'react';
import { dummyConversations, dummyMessages } from '../components/Chat/utils/dummyData';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState(dummyConversations);
  const [messages, setMessages] = useState(dummyMessages);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(true); // Start in compact mode
  const [isFullScreenMobile, setIsFullScreenMobile] = useState(false); // Full screen mobile mode

  // Calculate total unread messages
  const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // Mark conversation as read
  const markConversationAsRead = (conversationId) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  };

  // Send message
  const sendMessage = (conversationId, senderId, text, messageData = null) => {
    const newMessage = {
      id: Date.now(),
      senderId,
      text: text.trim(),
      timestamp: new Date(),
      read: true,
      ...(messageData?.attachments && { attachments: messageData.attachments }),
      ...(messageData?.poll && { poll: messageData.poll })
    };

    // Add message to the conversation
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    // Update last message in conversation
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessage: newMessage }
        : conv
    ));

    return newMessage;
  };

  // Create new conversation
  const createConversation = (participants, type = 'direct', groupData = null) => {
    const newConversation = {
      id: Date.now(),
      participants,
      type,
      lastMessage: null,
      unreadCount: 0,
      ...(type === 'group' && groupData ? {
        name: groupData.name,
        description: groupData.description,
        avatar: groupData.avatar,
        createdBy: groupData.createdBy,
        createdAt: new Date()
      } : {})
    };

    setConversations(prev => [newConversation, ...prev]);
    return newConversation;
  };

  // Create new group
  const createGroup = (name, description, participants, createdBy) => {
    const avatar = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    return createConversation(
      participants,
      'group',
      { name, description, avatar, createdBy }
    );
  };

  // Update poll vote
  const updatePollVote = (messageId, selectedOptions, userId) => {
    setMessages(prev => {
      const updatedMessages = { ...prev };
      
      // Find the message with the poll across all conversations
      for (const conversationId in updatedMessages) {
        const messageIndex = updatedMessages[conversationId].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          const message = updatedMessages[conversationId][messageIndex];
          if (message.poll) {
            const updatedPoll = { ...message.poll };
            
            // Initialize votes object if it doesn't exist
            if (!updatedPoll.votes) {
              updatedPoll.votes = {};
            }
            
            // Store the user's votes
            updatedPoll.votes[userId] = selectedOptions;
            
            updatedMessages[conversationId][messageIndex] = {
              ...message,
              poll: updatedPoll
            };
          }
          break;
        }
      }
      
      return updatedMessages;
    });
  };

  // Chat controls
  const openChat = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
    // Check if mobile and set full screen mode
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setIsFullScreenMobile(true);
      setIsCompactMode(false);
    } else {
      setIsCompactMode(true);
      setIsFullScreenMobile(false);
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
    setIsFullScreenMobile(false);
    setActiveConversation(null);
  };

  const minimizeChat = () => {
    setIsChatMinimized(true);
    setIsFullScreenMobile(false);
  };

  const maximizeChat = () => {
    setIsChatMinimized(false);
  };

  const toggleCompactMode = () => {
    setIsCompactMode(!isCompactMode);
  };

  const toggleFullScreenMobile = () => {
    setIsFullScreenMobile(!isFullScreenMobile);
  };

  const toggleChat = () => {
    if (!isChatOpen) {
      // If chat is closed, open it
      openChat();
    } else if (isChatMinimized) {
      // If chat is minimized, maximize it
      maximizeChat();
    } else {
      // If chat is open and not minimized, minimize it
      minimizeChat();
    }
  };

  const value = {
    // State
    conversations,
    messages,
    activeConversation,
    isChatOpen,
    isChatMinimized,
    isCompactMode,
    isFullScreenMobile,
    totalUnreadMessages,

    // Actions
    setConversations,
    setMessages,
    setActiveConversation,
    markConversationAsRead,
    sendMessage,
    createConversation,
    createGroup,
    updatePollVote,

    // Chat controls
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    toggleChat,
    toggleCompactMode,
    toggleFullScreenMobile
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
