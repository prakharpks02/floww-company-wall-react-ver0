import React from 'react';
import { getConversationPartner as getPartner, formatMessageTime, getEmployeeByIdFromList, getDateHeader, groupMessagesByDate } from '../utils/dummyData';
import { useChat } from '../../../contexts/ChatContext';
import { useAuth } from '../../../contexts/AuthContext';
import { cookieUtils } from '../../../utils/cookieUtils';
import { userAPI } from '../../../services/api.jsx';
import adminChatAPI from '../../../services/adminChatAPI.js';

export const useChatUtilities = () => {
  const { employees } = useChat();
  const { user: authUser } = useAuth();
  
  // Cache for API results to avoid repeated calls
  const [searchCache, setSearchCache] = React.useState(new Map());
  const [lastSearchTime, setLastSearchTime] = React.useState(new Map());
  
  // Detect if we're in admin environment
  const isAdminEnvironment = () => {
    return window.location.pathname.includes('/crm');
  };
  
  // Always provide a current user, even if employees haven't loaded yet
  const currentUser = (() => {
    // PRIORITY 1: Use user from AuthContext if available (has employee_id from API)
    if (authUser && authUser.employeeId && authUser.employeeId !== 'N/A') {
      return {
        id: authUser.employeeId,
        employeeId: authUser.employeeId,
        employee_id: authUser.employee_id,
        name: authUser.name || 'User',
        email: authUser.email || authUser.company_email,
        status: 'online',
        avatar: authUser.profile_picture_link,
        role: authUser.position || 'User',
        isAdmin: authUser.is_admin || false
      };
    }
    
    // PRIORITY 2: Get the logged-in user's employee ID from cookies/auth
    const { employeeId: loggedInEmployeeId } = cookieUtils.getAuthTokens();
    
    // Check if we're in admin environment
    if (isAdminEnvironment()) {
      // Even in admin environment, use the actual employee ID from cookies if available
      if (loggedInEmployeeId && loggedInEmployeeId !== 'N/A') {
        // Find the employee in the list to get full details
        if (employees.length > 0) {
          const emp = employees.find(emp => emp.employeeId === loggedInEmployeeId);
          if (emp) {
            return {
              ...emp,
              id: emp.employeeId || emp.id || loggedInEmployeeId,
              employeeId: emp.employeeId || emp.id || loggedInEmployeeId,
              isAdmin: true
            };
          }
        }
        
        // If not found in employees list, create user object with cookie ID
        return {
          id: loggedInEmployeeId,
          employeeId: loggedInEmployeeId,
          name: 'Admin',
          email: 'admin@company.com',
          status: 'online',
          avatar: 'AD',
          role: 'Administrator',
          isAdmin: true
        };
      }
      
      // Only use N/A as last resort in admin environment
      return {
        id: 'N/A',
        employeeId: 'N/A',
        name: 'Admin',
        email: 'admin@company.com',
        status: 'online',
        avatar: 'AD',
        role: 'Administrator',
        isAdmin: true
      };
    }
    
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

  // Filter employees for search - includes both local employees and API search results
  const getFilteredEmployees = async (searchQuery) => {
    if (!searchQuery.trim()) return [];
    
    const trimmedQuery = searchQuery.trim().toLowerCase();
    
    // Get local employees first
    const localResults = employees.filter(emp => 
      emp.id !== currentUser?.id && 
      emp.name.toLowerCase().includes(trimmedQuery)
    );
    
    // If search query is less than 2 characters, only return local results
    if (trimmedQuery.length < 2) {
      return localResults;
    }
    
    // Check cache first (cache for 30 seconds)
    const now = Date.now();
    const cacheKey = trimmedQuery;
    const cachedResult = searchCache.get(cacheKey);
    const lastSearch = lastSearchTime.get(cacheKey);
    
    if (cachedResult && lastSearch && (now - lastSearch < 30000)) {
      // Combine cached API results with fresh local results
      const combinedResults = [...localResults];
      cachedResult.forEach(apiUser => {
        const exists = combinedResults.find(local => 
          local.id === apiUser.id || local.employeeId === apiUser.employeeId
        );
        if (!exists) {
          combinedResults.push(apiUser);
        }
      });
      return combinedResults;
    }
    
    // Rate limiting: don't make API calls more than once every 500ms per query
    if (lastSearch && (now - lastSearch < 500)) {
      return localResults;
    }
    
    try {
      // Update last search time before making the call
      setLastSearchTime(prev => new Map(prev.set(cacheKey, now)));
      
      // Choose appropriate API based on environment
      const isAdmin = isAdminEnvironment();
      const apiResponse = isAdmin 
        ? await adminChatAPI.getUsersForMentions(trimmedQuery, 10)
        : await userAPI.getUsersForMentions(trimmedQuery, 10);
      
      if (apiResponse.status === 'success' && apiResponse.data) {
        // Transform API results to match employee structure
        const apiResults = apiResponse.data
          .filter(user => {
            // Filter out current user and users already in local employees
            return user.employee_id !== currentUser?.id && 
                   !employees.find(emp => emp.employeeId === user.employee_id || emp.id === user.employee_id);
          })
          .map(user => {
            // Clean up employee name - remove any URLs that might be concatenated
            let cleanName = user.employee_name || 'User';
            
            // If name contains a URL, extract just the name part (before the URL)
            const urlMatch = cleanName.match(/(.*?)(https?:\/\/|www\.)/);
            if (urlMatch) {
              cleanName = urlMatch[1].trim().replace(/,\s*$/, ''); // Remove trailing comma and spaces
            }
            
            return {
              id: user.employee_id,
              employeeId: user.employee_id,
              name: cleanName,
              employee_name: cleanName, // Also set employee_name
              email: user.company_email || user.personal_email,
              avatar: user.profile_picture_link || cleanName.substring(0, 2).toUpperCase(),
              profile_picture_link: user.profile_picture_link, // Preserve original field
              status: 'offline', // New contacts default to offline
              role: user.job_title || 'Employee',
              isNewContact: true // Flag to indicate this is a new contact
            };
          });
        
        // Cache the API results
        setSearchCache(prev => new Map(prev.set(cacheKey, apiResults)));
        
        // Combine local and API results, removing duplicates
        const combinedResults = [...localResults];
        apiResults.forEach(apiUser => {
          const exists = combinedResults.find(local => 
            local.id === apiUser.id || local.employeeId === apiUser.employeeId
          );
          if (!exists) {
            combinedResults.push(apiUser);
          }
        });
        
        return combinedResults;
      }
    } catch (error) {
      console.error('Error fetching users from API:', error);
      // Return local results on API failure
    }
    
    return localResults;
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
