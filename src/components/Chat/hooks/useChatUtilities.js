import { getConversationPartner as getPartner, formatMessageTime, getEmployeeByIdFromList, getDateHeader, groupMessagesByDate } from '../utils/dummyData';
import { useChat } from '../../../contexts/ChatContext';
import { cookieUtils } from '../../../utils/cookieUtils';

export const useChatUtilities = () => {
  const { employees } = useChat();
  
  // Detect if we're in admin environment
  const isAdminEnvironment = () => {
    return window.location.pathname.includes('/crm');
  };
  
  // Always provide a current user, even if employees haven't loaded yet
  const currentUser = (() => {
    // Check if we're in admin environment
    if (isAdminEnvironment()) {
      return {
        id: 'N/A', // Match API response for Admin user
        employeeId: 'N/A', // Match API response for Admin user
        name: 'Admin',
        email: 'admin@company.com',
        status: 'online',
        avatar: 'AD',
        role: 'Administrator',
        isAdmin: true
      };
    }
    
    // Get the logged-in user's employee ID from cookies/auth
    const { employeeId: loggedInEmployeeId } = cookieUtils.getAuthTokens();
    // If employees are available, find the logged-in user
    if (employees.length > 0) {
      // Try to find the current logged-in user by their employeeId from cookies
      let emp = employees.find(emp => emp.employeeId === loggedInEmployeeId);
      
      // Fallback: if not found, use first employee with employeeId
      if (!emp) {
        emp = employees.find(emp => emp.employeeId) || employees[0];
      }
      
      const user = {
        ...emp,
        id: emp.employeeId || emp.id || loggedInEmployeeId || 'emp-k15sLcnjub9r',
        employeeId: emp.employeeId || emp.id || loggedInEmployeeId || 'emp-k15sLcnjub9r'
      };
      
      return user;
    }
    
    // Fallback current user when employees haven't loaded - use cookie value
    const fallbackId = loggedInEmployeeId || 'emp-k15sLcnjub9r';
    return {
      id: fallbackId,
      employeeId: fallbackId, 
      name: 'Current User',
      email: 'current@company.com',
      status: 'online'
    };
  })();

  // Create a local getEmployeeById function that uses the current employees list
  const getEmployeeById = (id) => {
    return getEmployeeByIdFromList(id, employees);
  };

  // Filter employees for search
  const getFilteredEmployees = (searchQuery) => {
    if (!employees.length) return [];
    return employees.filter(emp => 
      emp.id !== currentUser?.id && 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Global search: search both conversations and messages
  const getMessageSearchResults = (searchQuery, conversations, messages) => {
    if (!searchQuery.trim() || !employees.length) return [];
    
    const results = [];
    conversations.forEach(conv => {
      const conversationMessages = messages[conv.id] || [];
      conversationMessages.forEach(msg => {
        if ((msg.text || '').toLowerCase().includes(searchQuery.toLowerCase())) {
          const sender = employees.find(emp => emp.id === msg.senderId);
          const partner = conv.type === 'group' ? 
            { name: conv.name, avatar: '👥' } : 
            employees.find(emp => emp.id !== currentUser?.id && conv.participants.includes(emp.id));
          
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
    if (!conversation || !employees.length) {
      return null;
    }
    
    if (conversation.type === 'group') {
      return { name: conversation.name, avatar: '👥', status: 'online' };
    }
    
    const partnerId = conversation.participants.find(id => id !== currentUserId);
    return employees.find(emp => emp.id === partnerId);
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
    if (!message || !currentUser || message.senderId !== currentUser.id) return false;
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
    formatMessageTime,
    getDateHeader,
    groupMessagesByDate
  };
};
