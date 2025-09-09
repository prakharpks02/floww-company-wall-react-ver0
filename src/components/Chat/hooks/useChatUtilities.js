import { dummyEmployees, getConversationPartner as getPartner, formatMessageTime, getEmployeeById } from '../utils/dummyData';

export const useChatUtilities = () => {
  const currentUser = dummyEmployees[0]; // Shreyansh Shandilya

  // Filter employees for search
  const getFilteredEmployees = (searchQuery) => {
    return dummyEmployees.filter(emp => 
      emp.id !== currentUser.id && 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Global search: search both conversations and messages
  const getMessageSearchResults = (searchQuery, conversations, messages) => {
    if (!searchQuery.trim()) return [];
    
    const results = [];
    conversations.forEach(conv => {
      const conversationMessages = messages[conv.id] || [];
      conversationMessages.forEach(msg => {
        if ((msg.text || '').toLowerCase().includes(searchQuery.toLowerCase())) {
          const sender = dummyEmployees.find(emp => emp.id === msg.senderId);
          const partner = conv.type === 'group' ? 
            { name: conv.name, avatar: '👥' } : 
            dummyEmployees.find(emp => emp.id !== currentUser.id && conv.participants.includes(emp.id));
          
          results.push({
            id: `${conv.id}-${msg.id}`,
            conversation: conv,
            message: msg,
            sender,
            partner,
            timestamp: msg.timestamp
          });
        }
      });
    });
    
    // Sort by timestamp (newest first)
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Filter conversations based on various criteria
  const getFilteredConversations = (
    conversations,
    messages,
    searchQuery,
    showFavouritesFilter,
    showGroupFilter,
    chatFilter,
    favouriteChats,
    pinnedChats
  ) => {
    const filtered = conversations.filter(conv => {
      const partner = getPartner(conv, currentUser.id);
      
      // If no search query, show all conversations
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const nameMatch = partner?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const messageMatch = (messages[conv.id] || []).some(msg =>
          (msg.text || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        matchesSearch = nameMatch || messageMatch;
      }
      
      // Apply favourites filter if active
      if (showFavouritesFilter) {
        matchesSearch = matchesSearch && favouriteChats.find(fav => fav.id === conv.id);
      }
      
      // Apply group filter if active
      if (showGroupFilter) {
        matchesSearch = matchesSearch && conv.type === 'group';
      }
      
      // Apply chat filter
      if (chatFilter === 'direct') {
        matchesSearch = matchesSearch && conv.type === 'direct';
      } else if (chatFilter === 'groups') {
        matchesSearch = matchesSearch && conv.type === 'group';
      }
      
      return matchesSearch;
    });

    // Separate pinned and regular chats
    const pinnedConversations = filtered.filter(conv => 
      pinnedChats.find(p => p.id === conv.id)
    );
    const regularConversations = filtered.filter(conv => 
      !pinnedChats.find(p => p.id === conv.id)
    );

    // Return pinned chats first, then regular chats
    return [...pinnedConversations, ...regularConversations];
  };

  // Get conversation partner helper
  const getConversationPartner = (conversation, currentUserId) => {
    // Add null check to prevent errors
    if (!conversation) {
      return null;
    }
    
    if (conversation.type === 'group') {
      return { name: conversation.name, avatar: '👥', status: 'online' };
    }
    
    const partnerId = conversation.participants.find(id => id !== currentUserId);
    return dummyEmployees.find(emp => emp.id === partnerId);
  };

  // Get status color utility
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-400';
      case 'away':
        return 'bg-yellow-400';
      case 'busy':
        return 'bg-red-400';
      case 'offline':
      default:
        return 'bg-gray-400';
    }
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

  return {
    currentUser,
    getFilteredEmployees,
    getMessageSearchResults,
    getFilteredConversations,
    getConversationPartner: getPartner,
    getStatusColor,
    canEditMessage,
    getEmployeeById,
    formatMessageTime
  };
};
