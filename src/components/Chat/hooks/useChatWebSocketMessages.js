import { useEffect, useState } from 'react';
import { enhancedChatAPI } from '../chatapi';

/**
 * Custom hook for managing WebSocket-only real-time messaging
 * This hook replaces the traditional API-based message fetching with WebSocket-only approach
 * Messages are loaded only when needed and are primarily delivered via WebSocket
 */
export const useChatWebSocketMessages = ({
  activeConversation,
  setMessages,
  currentUser,
  getEmployeeById,
  messages
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loadingInitialMessages, setLoadingInitialMessages] = useState(false);
  const [loadedRooms, setLoadedRooms] = useState(new Set());

  // WebSocket message handler
  const handleWebSocketMessage = (messageData) => {
    console.log('📨 Received WebSocket message:', messageData);
    
    if (!activeConversation) {
      console.log('⚠️ No active conversation, ignoring message');
      return;
    }

    console.log('📨 Active conversation:', {
      id: activeConversation.id,
      type: activeConversation.type,
      room_id: activeConversation.room_id
    });

    // Extract message details
    const senderEmployeeId = messageData.sender?.employee_id || messageData.sender_id;
    const currentUserEmployeeId = currentUser?.employeeId || `emp-${currentUser?.id}`;
    
    console.log('📨 Sender check:', {
      senderEmployeeId,
      currentUserEmployeeId,
      currentUserId: currentUser?.id,
      isOwnMessage: senderEmployeeId === currentUserEmployeeId || senderEmployeeId === currentUser?.id
    });
    
    // Check if message already exists to prevent duplicates (optimistic UI)
    const existingMessages = messages[activeConversation.id] || [];
    const messageExists = existingMessages.some(msg => msg.id === messageData.message_id);
    
    if (messageExists) {
      console.log('🚫 Message already exists in UI, skipping:', messageData.message_id);
      return;
    }
    
    console.log('✅ Message is new, adding to UI');
    
    // REMOVED: Don't filter by sender - show all messages from WebSocket
    // This allows real-time updates even for own messages sent from other clients

    // Create message object - PRESERVE SENDER DATA for profile pictures
    const incomingMessage = {
      id: messageData.message_id || `ws-${Date.now()}`,
      senderId: senderEmployeeId,
      sender: messageData.sender, // 🔑 Preserve full sender object with profile_picture_link
      text: messageData.content || messageData.message,
      timestamp: new Date(messageData.timestamp || messageData.created_at || Date.now()),
      read: false,
      status: 'received',
      type: messageData.type || 'text',
      fileUrls: messageData.file_urls || [] // Include file URLs from WebSocket
    };
    
    // Verify sender data is preserved
    console.log('✅ [WS] Message sender data:', {
      hasSender: !!incomingMessage.sender,
      profilePic: incomingMessage.sender?.profile_picture_link,
      name: incomingMessage.sender?.employee_name
    });

    // Add reply information if present
    if (messageData.reply_to_message_id || messageData.reply_to) {
      const replyData = messageData.reply_to || messageData;
      incomingMessage.replyTo = {
        id: messageData.reply_to_message_id || replyData.reply_to_message_id,
        text: replyData.reply_content || 'Original message',
        senderName: replyData.reply_sender_name || 'Unknown'
      };
    }

    console.log('✅ Adding incoming message to conversation:', activeConversation.id);
    console.log('✅ Message object to add:', incomingMessage);
    
    // Add message to the active conversation
    setMessages(prev => {
      const previousMessages = prev[activeConversation.id] || [];
      const updatedMessages = {
        ...prev,
        [activeConversation.id]: [...previousMessages, incomingMessage]
      };
      const newMessages = updatedMessages[activeConversation.id];
      
      console.log('✅ Updated messages state:', {
        conversationId: activeConversation.id,
        previousCount: previousMessages.length,
        newCount: newMessages.length,
        lastMessage: newMessages[newMessages.length - 1],
        allMessageIds: newMessages.map(m => m.id),
        newMessageAdded: newMessages[newMessages.length - 1]?.id === incomingMessage.id
      });
      
      return updatedMessages;
    });
  };

  // WebSocket connection handler
  const handleWebSocketConnection = (connected) => {
    console.log('🔗 WebSocket connection status changed:', connected);
    setIsConnected(connected);
  };

  // Load initial messages only when absolutely necessary (e.g., when switching to a conversation)
  const loadInitialMessages = async (roomId) => {
    if (!roomId || loadingInitialMessages) return;
    
    console.log('📜 Loading initial messages for room:', roomId);
    setLoadingInitialMessages(true);
    
    try {
      const response = await enhancedChatAPI.getRoomMessages(roomId);
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        console.log(`📜 Loaded ${response.data.length} initial messages`);
        
        const formattedMessages = response.data.map(msg => ({
          id: msg.message_id,
          senderId: msg.sender?.employee_id || msg.sender_id,
          sender: msg.sender, // 🔑 Preserve full sender object with profile_picture_link
          text: msg.content,
          timestamp: new Date(msg.created_at),
          read: true,
          status: 'delivered',
          type: msg.type || 'text',
          ...(msg.reply_to_message_id && {
            replyTo: {
              id: msg.reply_to_message_id,
              text: msg.reply_content || 'Original message',
              senderName: msg.reply_sender_name || 'Unknown'
            }
          })
        }));
        
        // Verify sender data is preserved
        console.log('✅ [API] First message sender data:', {
          hasSender: !!formattedMessages[0]?.sender,
          profilePic: formattedMessages[0]?.sender?.profile_picture_link,
          name: formattedMessages[0]?.sender?.employee_name
        });

        // Set initial messages for the conversation
        setMessages(prev => ({
          ...prev,
          [activeConversation.id]: formattedMessages
        }));
        
        console.log('✅ Initial messages loaded and set');
      } else {
        console.log('⚠️ No messages found or invalid response');
        // Set empty array to indicate messages were loaded (prevents re-loading)
        setMessages(prev => ({
          ...prev,
          [activeConversation.id]: []
        }));
      }
    } catch (error) {
      console.error('❌ Error loading initial messages:', error);
      // Set empty array on error to prevent retry loops
      setMessages(prev => ({
        ...prev,
        [activeConversation.id]: []
      }));
    } finally {
      setLoadingInitialMessages(false);
    }
  };

  // Effect to handle active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      console.log('🔌 No active conversation, disconnecting WebSocket');
      enhancedChatAPI.disconnectFromRoom();
      setIsConnected(false);
      return;
    }

    console.log('🔄 Active conversation changed:', {
      id: activeConversation.id,
      type: activeConversation.type,
      room_id: activeConversation.room_id
    });

    // The navigation handlers now handle WebSocket connection and message loading
    // This hook now only handles incoming real-time messages
    console.log('📡 WebSocket messages hook is now monitoring for real-time messages only');

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up conversation WebSocket message monitoring');
    };
  }, [activeConversation?.id, activeConversation?.room_id]);

  // Effect to subscribe to WebSocket events
  useEffect(() => {
    console.log('👂 Setting up WebSocket event listeners');
    
    const unsubscribeMessage = enhancedChatAPI.onMessage(handleWebSocketMessage);
    const unsubscribeConnection = enhancedChatAPI.onConnection(handleWebSocketConnection);
    
    return () => {
      console.log('👂❌ Cleaning up WebSocket event listeners');
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [activeConversation?.id, currentUser?.id]);

  return {
    isConnected,
    loadingInitialMessages,
    loadInitialMessages
  };
};

export default useChatWebSocketMessages;