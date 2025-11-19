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
    if (!activeConversation) {
      return;
    }

    

    // Extract message details
    const senderEmployeeId = messageData.sender?.employee_id || messageData.sender_id;
    const currentUserEmployeeId = currentUser?.employeeId || `emp-${currentUser?.id}`;
    const messageContent = messageData.content || messageData.message;
    const messageId = messageData.message_id;
    
    
    
    // Check if message already exists to prevent duplicates (optimistic UI)
    const existingMessages = messages[activeConversation.id] || [];
    
    
    
    // Check for duplicate by message_id
    const messageExists = existingMessages.some(msg => msg.id === messageData.message_id);
    
    if (messageExists) {
      return;
    }
    
    // Check for optimistic message that matches this WebSocket message
    const messageTime = new Date(messageData.timestamp || messageData.created_at || Date.now());
    
    
    
    // Find optimistic message that matches
    const optimisticMessage = existingMessages.find(msg => {
      const isOptimistic = msg._optimistic === true;
      const senderMatches = msg._optimisticSender === senderEmployeeId;
      const textMatches = msg._optimisticText === messageContent;
      const timeDiff = Math.abs(messageTime - msg.timestamp);
      const timeWithinWindow = timeDiff < 10000;
      
      
      
      return isOptimistic && senderMatches && textMatches && timeWithinWindow;
    });
    
    if (optimisticMessage) {
      
      
      // Replace optimistic message with real message
      setMessages(prev => {
        const updated = prev[activeConversation.id].map(msg => {
          if (msg.id === optimisticMessage.id) {
            return {
              ...msg,
              id: messageData.message_id,
              message_id: messageData.message_id,
              sender: messageData.sender, // Update with real sender data
              status: 'delivered',
              _optimistic: false, // No longer optimistic
              timestamp: new Date(messageData.created_at || messageData.timestamp || Date.now())
            };
          }
          return msg;
        });
        return {
          ...prev,
          [activeConversation.id]: updated
        };
      });
      return; // CRITICAL: Stop here, don't add the message again
    }
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
      fileUrls: messageData.file_urls || [], // Include file URLs from WebSocket
      isForwarded: messageData.is_forwarded || false // 🔁 Include forwarded flag
    };
    
    // Verify sender data is preserved
    

    // Add reply information if present
    if (messageData.reply_to_message_id || messageData.reply_to) {
      const replyData = messageData.reply_to || messageData;
      incomingMessage.replyTo = {
        id: messageData.reply_to_message_id || replyData.reply_to_message_id,
        text: replyData.reply_content || 'Original message',
        senderName: replyData.reply_sender_name || 'Unknown'
      };
    }
    
    
    // Add message to the active conversation
    setMessages(prev => {
      const previousMessages = prev[activeConversation.id] || [];
      const updatedMessages = {
        ...prev,
        [activeConversation.id]: [...previousMessages, incomingMessage]
      };
      const newMessages = updatedMessages[activeConversation.id];
      
      
      
      return updatedMessages;
    });
  };

  // WebSocket connection handler
  const handleWebSocketConnection = (connected) => {
    setIsConnected(connected);
  };

  // Load initial messages only when absolutely necessary (e.g., when switching to a conversation)
  const loadInitialMessages = async (roomId) => {
    if (!roomId || loadingInitialMessages) return;
    setLoadingInitialMessages(true);
    
    try {
      const response = await enhancedChatAPI.getRoomMessages(roomId);
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        const formattedMessages = response.data.map(msg => ({
          id: msg.message_id,
          senderId: msg.sender?.employee_id || msg.sender_id,
          sender: msg.sender, // 🔑 Preserve full sender object with profile_picture_link
          text: msg.content,
          timestamp: new Date(msg.created_at),
          read: true,
          status: 'delivered',
          type: msg.type || 'text',
          isForwarded: msg.is_forwarded || false, // 🔁 Include forwarded flag
          ...(msg.reply_to_message_id && {
            replyTo: {
              id: msg.reply_to_message_id,
              text: msg.reply_content || 'Original message',
              senderName: msg.reply_sender_name || 'Unknown'
            }
          })
        }));
        
        // Verify sender data is preserved
        

        // Set initial messages for the conversation
        setMessages(prev => ({
          ...prev,
          [activeConversation.id]: formattedMessages
        }));
      } else {
        // Set empty array to indicate messages were loaded (prevents re-loading)
        setMessages(prev => ({
          ...prev,
          [activeConversation.id]: []
        }));
      }
    } catch (error) {
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
      enhancedChatAPI.disconnectFromRoom();
      setIsConnected(false);
      return;
    }

    

    // The navigation handlers now handle WebSocket connection and message loading
    // This hook now only handles incoming real-time messages
    // Cleanup function
    return () => {
    };
  }, [activeConversation?.id, activeConversation?.room_id]);

  // Effect to subscribe to WebSocket events - ONLY ONCE
  useEffect(() => {
    const unsubscribeMessage = enhancedChatAPI.onMessage(handleWebSocketMessage);
    const unsubscribeConnection = enhancedChatAPI.onConnection(handleWebSocketConnection);
    
    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, []); // Empty dependency array - subscribe only once!

  return {
    isConnected,
    loadingInitialMessages,
    loadInitialMessages
  };
};

export default useChatWebSocketMessages;