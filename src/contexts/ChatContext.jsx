import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeEmployees, getEmployeeById } from '../components/Chat/utils/dummyData';
import { enhancedChatAPI } from '../components/Chat/chatapi';

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

  // Load messages for a specific conversation
  const loadMessagesForConversation = async (conversationId) => {
    try {
      console.log(`Loading messages for conversation ${conversationId}...`);
      const messagesResponse = await enhancedChatAPI.getRoomMessages(conversationId);
      
      if (messagesResponse.status === 'success' && Array.isArray(messagesResponse.data)) {
        const apiMessages = messagesResponse.data.map(msg => ({
          id: msg.message_id,
          senderId: msg.sender?.employee_id || msg.sender_id,
          text: msg.content,
          timestamp: new Date(msg.created_at),
          read: true,
          isStarred: msg.is_starred || false,
          replyToMessage: msg.reply_to_message,
          fileUrls: msg.file_urls || []
        }));
        
        console.log(`Loaded ${apiMessages.length} messages for conversation ${conversationId}`);
        
        // Update messages state
        setMessages(prev => ({
          ...prev,
          [conversationId]: apiMessages
        }));
        
        return apiMessages;
      } else {
        console.log(`No messages found for conversation ${conversationId}`);
        setMessages(prev => ({
          ...prev,
          [conversationId]: []
        }));
        return [];
      }
    } catch (error) {
      console.error(`Failed to load messages for conversation ${conversationId}:`, error);
      setMessages(prev => ({
        ...prev,
        [conversationId]: []
      }));
      return [];
    }
  };

  // Load conversations from API
  const loadConversations = async () => {
    try {
      console.log('Loading conversations from API...');
      setConversationsLoading(true);
      
      const roomsResponse = await enhancedChatAPI.listAllRooms();
      console.log('Rooms API response:', roomsResponse);
      console.log('Response status:', roomsResponse?.status);
      console.log('Response data:', roomsResponse?.data);
      console.log('Is data array?', Array.isArray(roomsResponse?.data));
      
      if (roomsResponse.status === 'success' && Array.isArray(roomsResponse.data)) {
        const apiConversations = roomsResponse.data.map(room => {
          console.log('Processing room:', room);
          console.log('Last message type:', typeof room.last_message);
          console.log('Last message value:', room.last_message);
          
          // Determine conversation type and participants - handle both possible structures
          const participants = room.participants ? room.participants.map(p => p.employee_id || p.id) : 
                              (room.receiver_employee_id && room.sender_employee_id ? 
                               [room.receiver_employee_id, room.sender_employee_id] : []);
          const isGroup = participants.length > 2;
          
          // Handle both possible timestamp formats
          const parseDate = (dateStr) => {
            if (!dateStr) return new Date();
            const parsed = new Date(dateStr);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          };
          
          return {
            id: room.room_id || room.id,
            room_id: room.room_id || room.id,
            participants: participants,
            type: isGroup ? 'group' : 'direct',
            name: room.room_name || room.name || (isGroup ? 'Group Chat' : null),
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
        
        console.log('Converted conversations:', apiConversations);
        console.log('Total conversations loaded:', apiConversations.length);
        setConversations(apiConversations);
        
      } else {
        console.log('No conversations found or invalid response');
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
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
        console.log('🔧 Employees loaded:', loadedEmployees?.length || 0, 'employees');
        console.log('🔧 Sample employee IDs:', loadedEmployees?.slice(0, 3)?.map(emp => ({
          id: emp.id,
          employeeId: emp.employeeId,
          name: emp.name
        })));
        setEmployees(loadedEmployees);
        
        // Load conversations after employees are loaded
        await loadConversations();
      } catch (error) {
        console.error('Failed to load chat data:', error);
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
      console.log('🔄 Performing periodic message sync for all conversations...');
      
      // Sync messages for conversations that have room_id
      for (const conversation of conversations.slice(0, 3)) { // Limit to first 3 to avoid too many API calls
        if (conversation.room_id) {
          try {
            await loadMessagesForConversation(conversation.id);
          } catch (error) {
            console.warn('Periodic sync failed for conversation:', conversation.id, error);
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

  // Create new group
  const createGroup = (name, description, participants, createdBy) => {
    const avatar = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    return createConversation(
      participants,
      'group',
      { name, description, avatar, createdBy }
    );
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
