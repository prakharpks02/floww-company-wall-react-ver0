import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { dummyEmployees, getConversationPartner } from './dummyData';

export const useChatOperations = () => {
  const {
    conversations,
    messages,
    setActiveConversation: setGlobalActiveConversation,
    sendMessage,
    createConversation,
    markConversationAsRead
  } = useChat();

  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // Current user
  const currentUser = dummyEmployees[0]; // Shreyansh Shandilya

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !activeConversation) return;

    sendMessage(activeConversation.id, currentUser.id, newMessage.trim());
    setNewMessage('');
  }, [newMessage, activeConversation, sendMessage, currentUser.id]);

  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setGlobalActiveConversation(conversation);
    markConversationAsRead(conversation.id);
  }, [setGlobalActiveConversation, markConversationAsRead]);

  const handleStartNewConversation = useCallback((employee) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      conv.participants.includes(employee.id) && conv.participants.includes(currentUser.id)
    );

    if (existingConv) {
      handleSelectConversation(existingConv);
    } else {
      // Create new conversation
      const newConv = createConversation([currentUser.id, employee.id]);
      handleSelectConversation(newConv);
    }
  }, [conversations, currentUser.id, createConversation, handleSelectConversation]);

  const handleBackToList = useCallback(() => {
    setActiveConversation(null);
    setGlobalActiveConversation(null);
  }, [setGlobalActiveConversation]);

  const getCurrentMessages = useCallback(() => {
    if (!activeConversation) return [];
    return messages[activeConversation.id] || [];
  }, [activeConversation, messages]);

  const getConversationPartnerInfo = useCallback(() => {
    if (!activeConversation) return null;
    return getConversationPartner(activeConversation, currentUser.id);
  }, [activeConversation, currentUser.id]);

  return {
    // State
    activeConversation,
    newMessage,
    setNewMessage,
    currentUser,
    conversations,
    
    // Computed values
    currentMessages: getCurrentMessages(),
    conversationPartner: getConversationPartnerInfo(),
    
    // Actions
    handleSendMessage,
    handleSelectConversation,
    handleStartNewConversation,
    handleBackToList
  };
};

export const useChatFilters = (conversations, currentUserId) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Focused');

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const partner = getConversationPartner(conv, currentUserId);
    return partner?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getFilteredConversations = useCallback(() => {
    switch (activeFilter) {
      case 'Focused':
        return filteredConversations.filter(c => c.unreadCount > 0);
      case 'Other':
        return filteredConversations.filter(c => c.unreadCount === 0);
      case 'Unread':
        return filteredConversations.filter(c => c.unreadCount > 0);
      case 'My Connections':
        return filteredConversations;
      default:
        return filteredConversations;
    }
  }, [activeFilter, filteredConversations]);

  const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const filters = [
    { name: 'Focused', count: filteredConversations.filter(c => c.unreadCount > 0).length },
    { name: 'Other', count: filteredConversations.filter(c => c.unreadCount === 0).length },
    { name: 'Unread', count: totalUnreadMessages },
    { name: 'My Connections', count: filteredConversations.length },
    { name: 'InMail', count: 0 },
    { name: 'Starred', count: 0 }
  ];

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredConversations: getFilteredConversations(),
    filters
  };
};
