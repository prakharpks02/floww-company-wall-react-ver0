import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeEmployees, getEmployeeById } from '../components/Chat/utils/dummyData';
import { enhancedChatAPI } from '../components/Chat/chatapi';
import adminChatAPI from '../services/adminChatAPI';

// Environment detection
const isAdminEnvironment = () => {
  return window.location.pathname.includes('/crm');
};

// Choose API based on environment
const getChatAPI = () => {
  if (isAdminEnvironment()) {
    return adminChatAPI;
  } else {
    return enhancedChatAPI;
  }
};

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(true); // Start in compact mode
  const [isFullScreenMobile, setIsFullScreenMobile] = useState(false); // Full screen mobile mode
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // Load messages for a specific conversation (environment-aware)
  const loadMessagesForConversation = async (conversationId) => {
    try {
      const currentAPI = getChatAPI();
      const envType = isAdminEnvironment() ? 'ADMIN' : 'EMPLOYEE';
      const messagesResponse = await currentAPI.getRoomMessages(conversationId);
      
      if (messagesResponse.status === 'success' && Array.isArray(messagesResponse.data)) {
        const apiMessages = messagesResponse.data.map(msg => {
          const message = {
            id: msg.message_id,
            senderId: msg.sender?.employee_id || msg.sender_id,
            text: msg.content,
            timestamp: new Date(msg.created_at),
            read: true,
            isStarred: msg.is_starred || false,
            fileUrls: msg.file_urls || [],
            // Store sender information from API
            sender: msg.sender ? {
              id: msg.sender.employee_id,
              name: msg.sender.employee_name,
              avatar: msg.sender.profile_picture_link,
              jobTitle: msg.sender.job_title
            } : null
          };

          // Parse reply data properly
          if (msg.reply_to_message) {
            message.replyTo = {
              id: msg.reply_to_message.message_id,
              text: msg.reply_to_message.content,
              senderId: msg.reply_to_message.sender?.employee_id,
              senderName: msg.reply_to_message.sender?.employee_name || 'Unknown User',
              senderAvatar: msg.reply_to_message.sender?.profile_picture_link,
              timestamp: new Date(msg.reply_to_message.created_at)
            };
            
          }

          return message;
        });
        // Update messages state
        setMessages(prev => ({
          ...prev,
          [conversationId]: apiMessages
        }));
        
        return apiMessages;
      } else {
        setMessages(prev => ({
          ...prev,
          [conversationId]: []
        }));
        return [];
      }
    } catch (error) {
      setMessages(prev => ({
        ...prev,
        [conversationId]: []
      }));
      return [];
    }
  };

  // Load conversations from API (environment-aware)
  const loadConversations = async () => {
    try {
      const currentAPI = getChatAPI();
      const envType = isAdminEnvironment() ? 'ADMIN' : 'EMPLOYEE';
      setConversationsLoading(true);
      
      const roomsResponse = await currentAPI.listAllRooms();
      
      if (roomsResponse.status === 'success' && Array.isArray(roomsResponse.data)) {
        const apiConversations = roomsResponse.data.map(room => {
          
          
          // Extract participants with their full details
          const participantDetails = room.participants ? room.participants
            .filter(p => p && p.employee_id) // ⚠️ Allow N/A for Admin users
            .map(p => {
              // 🔥 Special handling for Admin users
              const isAdmin = p.employee_id === 'N/A' && p.employee_name === 'Admin';
              
              return {
                id: isAdmin ? 'admin' : p.employee_id,
                name: p.employee_name || `Employee ${p.employee_id}`,
                avatar: p.profile_picture_link || '',
                isAdmin: p.is_admin === true || isAdmin
              };
            }) : [];
          
          // Extract just the IDs for backwards compatibility
          const participants = participantDetails.map(p => p.id);

          // Extract admin IDs from participants with is_admin: true
          const adminIds = participantDetails
            .filter(p => p.isAdmin)
            .map(p => p.id);
          
          
          const isGroup = room.is_group || participants.length > 2;
          
          // Handle both possible timestamp formats
          const parseDate = (dateStr) => {
            if (!dateStr) return new Date();
            const parsed = new Date(dateStr);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          };
          
          // Simply use room_name directly from API - handle both string and array formats
          let conversationName;
          if (Array.isArray(room.room_name)) {
            // If API returns array, take first element
            conversationName = room.room_name[0] || 'Unnamed Chat';
          } else if (typeof room.room_name === 'string') {
            // If API returns string, use directly
            conversationName = room.room_name;
          } else {
            // Fallback for invalid room_name
            conversationName = isGroup ? 'Group Chat' : 'Direct Chat';
          }
          

          // Handle room_icon - can be string or array
          let iconUrl = null;
          
          
          if (room.room_icon) {
            if (Array.isArray(room.room_icon)) {
              // For direct chats, room_icon is an array - take first element
              const iconValue = room.room_icon[0];
              // Only use if it's a valid URL (not abbreviations)
              if (iconValue && iconValue.startsWith('http')) {
                iconUrl = iconValue;
              } else {
              }
            } else if (typeof room.room_icon === 'string') {
              // For groups, room_icon is a string
              // Only use it if it's a valid URL (starts with http)
              if (room.room_icon.startsWith('http')) {
                iconUrl = room.room_icon;
              } else {
              }
              // Ignore abbreviations like "TE", "A", etc. - they should show as initials instead
            }
          }
          return {
            id: room.room_id || room.id,
            room_id: room.room_id || room.id,
            participants: participants,
            participantDetails: participantDetails, // Store full participant details
            type: isGroup ? 'group' : 'direct',
            name: conversationName, // ⚠️ This should be "Prakhar Singh" from room_name
            room_name: room.room_name, // 🔑 Preserve original room_name for reference
            description: room.room_desc || room.description || '', // Map room_desc to description
            icon: iconUrl, // Map icon field (handles both string and array)
            admins: adminIds, // Extract from participants with is_admin: true
            createdBy: room.created_by || room.creator_id || null, // Map creator ID
            lastMessage: room.last_message && room.last_message !== 'N/A' ? (
              typeof room.last_message === 'string' ? {
                // If last_message is just a string
                id: 'last_msg_' + room.room_id,
                senderId: 'unknown',
                text: room.last_message,
                timestamp: parseDate(room.updated_at || room.created_at),
                read: true
              } : {
                // If last_message is an object
                id: room.last_message.message_id || room.last_message.id,
                senderId: room.last_message.sender?.employee_id || room.last_message.sender_id,
                text: room.last_message.content || room.last_message.text || room.last_message,
                timestamp: parseDate(room.last_message.created_at || room.last_message.timestamp),
                read: true
              }
            ) : null,
            unreadCount: room.unread_count || room.unreadCount || 0,
            createdAt: parseDate(room.created_at),
            updatedAt: parseDate(room.updated_at || room.created_at)
          };
        });
        
        setConversations(apiConversations);
        
      } else {
        setConversations([]);
      }
    } catch (error) {
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  // Initialize employees and conversations from API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setEmployeesLoading(true);
        const loadedEmployees = await initializeEmployees();
        
        setEmployees(loadedEmployees);
        
        // Load conversations after employees are loaded
        await loadConversations();
      } catch (error) {
        setEmployees([]);
        setConversations([]);
      } finally {
        setEmployeesLoading(false);
      }
    };

    loadData();
  }, []);

  // Periodic sync to catch messages that may have been persisted after WebSocket send
  useEffect(() => {
    if (conversations.length === 0) return;

    const syncInterval = setInterval(async () => {
      // Sync messages for conversations that have room_id
      for (const conversation of conversations.slice(0, 3)) { // Limit to first 3 to avoid too many API calls
        if (conversation.room_id) {
          try {
            await loadMessagesForConversation(conversation.id);
          } catch (error) {
          }
        }
      }
    }, 60000); // Sync every 60 seconds

    return () => clearInterval(syncInterval);
  }, [conversations]);

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
  const sendMessage = (conversationId, senderId, text) => {
    const newMessage = {
      id: Date.now(),
      senderId,
      text: text.trim(),
      timestamp: new Date(),
      read: true
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

  // Create new group using admin API
  const createGroup = async (name, description, participants, createdBy) => {
    
    
    try {
      // Prepare participants for admin API (need employee IDs)
      const participantIds = [];
      
      // Convert participants to employee IDs if needed
      for (const participant of participants) {
        if (typeof participant === 'string') {
          // If it's already an employee ID string
          participantIds.push(participant);
        } else if (participant.employeeId) {
          // If it's an employee object with employeeId
          participantIds.push(participant.employeeId);
        } else if (participant.id) {
          // If it's an employee object with id, try to find the employeeId
          const employee = employees.find(emp => emp.id === participant.id);
          if (employee && employee.employeeId) {
            participantIds.push(employee.employeeId);
          }
        }
      }
      // Call admin API to create group
      const groupData = {
        group_name: name,
        group_description: description,
        group_icon: name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2),
        participants_ids: participantIds
      };
      const response = await adminChatAPI.createGroup(groupData);
      
      if (response && response.status === 'success') {
        // Reload conversations to include the new group
        await loadConversations();
        
        // Find the newly created group in the conversations
        const newGroup = conversations.find(conv => 
          conv.name === name && conv.type === 'group'
        );
        
        if (newGroup) {
          return newGroup;
        } else {
          // Create a temporary local group object for immediate UI update
          const tempGroup = createConversation(
            participants,
            'group',
            { 
              name, 
              description, 
              avatar: groupData.group_icon, 
              createdBy,
              _adminCreated: true // Flag to indicate it was created via admin API
            }
          );
          return tempGroup;
        }
      } else {
        throw new Error(response?.message || 'Failed to create group');
      }
      
    } catch (error) {
      // Fallback: create local group if API fails (for development)
      const avatar = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
      const fallbackGroup = createConversation(
        participants,
        'group',
        { name, description, avatar, createdBy, _fallback: true }
      );
      
      // Show error to user (you might want to add error state to context)
      return fallbackGroup;
    }
  };

  // Update existing conversation
  const updateConversation = (conversationId, updates) => {
    
    
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, ...updates };
        }
        return conv;
      });
      return updated;
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
    employees,
    employeesLoading,
    conversationsLoading,

    // Actions
    setConversations,
    setMessages,
    setActiveConversation,
    markConversationAsRead,
    sendMessage,
    createConversation,
    createGroup,
    updateConversation,
    loadConversations,
    loadMessagesForConversation,

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
