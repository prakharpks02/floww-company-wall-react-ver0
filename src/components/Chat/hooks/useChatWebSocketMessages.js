import { useEffect, useState, useCallback } from 'react';
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
  const handleWebSocketMessage = useCallback((messageData) => {
    if (!activeConversation) {
      return;
    }

    // Use room_id if available, otherwise fall back to id
    const conversationKey = activeConversation.room_id || activeConversation.id;

    // Extract message details
    let senderEmployeeId = messageData.sender?.employee_id || messageData.sender_id;
    const currentUserEmployeeId = currentUser?.employeeId || `emp-${currentUser?.id}`;
    const messageContent = messageData.content || messageData.message;
    const messageId = messageData.message_id;
    
    // Fix: If server returns wrong sender_id for admin, use correct one
    const isLikelyOwnMessage = 
      senderEmployeeId === '2Zt363ClFSPBz1NW' && 
      currentUser?.isAdmin && 
      currentUser?.employeeId === 'N/A';
    
    if (isLikelyOwnMessage) {
      senderEmployeeId = currentUser.employeeId;
    }
    
    // Check if message already exists to prevent duplicates (optimistic UI)
    const existingMessages = messages[conversationKey] || [];
    
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
      
      // For media messages, also check file URLs
      const hasFileUrls = (messageData.file_urls && messageData.file_urls.length > 0) || (msg.file_urls && msg.file_urls.length > 0);
      let fileUrlsMatch = true;
      
      if (hasFileUrls) {
        const incomingUrls = messageData.file_urls || [];
        const optimisticUrls = msg.file_urls || [];
        
        // Check if file URLs match (for media-only messages)
        if (incomingUrls.length > 0 && optimisticUrls.length > 0) {
          fileUrlsMatch = incomingUrls.some(url => 
            optimisticUrls.some(optUrl => 
              url === optUrl || url.includes(optUrl.split('/').pop()) || optUrl.includes(url.split('/').pop())
            )
          );
        }
      }
      
      const timeDiff = Math.abs(messageTime - msg.timestamp);
      const timeWithinWindow = timeDiff < 10000;
      
      // Match by text OR by file URLs (for media-only messages)
      const contentMatches = textMatches || (hasFileUrls && fileUrlsMatch);
      
      return isOptimistic && senderMatches && contentMatches && timeWithinWindow;
    });
    
    if (optimisticMessage) {
      // Replace optimistic message with real message
      setMessages(prev => {
        const updated = prev[conversationKey].map(msg => {
          if (msg.id === optimisticMessage.id) {
            return {
              ...msg,
              id: messageData.message_id,
              message_id: messageData.message_id,
              sender: messageData.sender, // Update with real sender data
              status: 'delivered',
              _optimistic: false, // No longer optimistic
              timestamp: new Date(messageData.created_at || messageData.timestamp || Date.now()),
              file_urls: messageData.file_urls || msg.file_urls || [] // 🔥 PRESERVE file_urls!
            };
          }
          return msg;
        });
        return {
          ...prev,
          [conversationKey]: updated
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
      file_urls: messageData.file_urls || [], // Include file URLs from WebSocket
      isForwarded: messageData.is_forwarded || false // 🔁 Include forwarded flag
    };
    
    // Add reply information if present (comprehensive handling)
    if (messageData.reply_to_message_id || messageData.reply_to_message) {
      
      const replyData = messageData.reply_to_message || messageData;
      incomingMessage.replyTo = {
        id: messageData.reply_to_message_id || replyData.message_id,
        text: replyData.content || replyData.reply_content || 'Original message',
        senderId: replyData.sender?.employee_id || replyData.reply_sender_id,
        senderName: replyData.sender?.employee_name || replyData.reply_sender_name || 'Unknown',
        timestamp: replyData.created_at ? new Date(replyData.created_at) : null
      };
    }
    
    // Add message to the active conversation
    setMessages(prev => {
      const previousMessages = prev[conversationKey] || [];
      return {
        ...prev,
        [conversationKey]: [...previousMessages, incomingMessage]
      };
    });
  }, [activeConversation, messages, setMessages, currentUser]); // Add all dependencies

  // WebSocket connection handler
  const handleWebSocketConnection = useCallback((connected) => {
    setIsConnected(connected);
  }, []);

  // Load initial messages only when absolutely necessary (e.g., when switching to a conversation)
  const loadInitialMessages = async (roomId) => {
    if (!roomId || loadingInitialMessages) return;
    setLoadingInitialMessages(true);
    
    try {
      const response = await enhancedChatAPI.getRoomMessages(roomId);
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        const formattedMessages = response.data.map(msg => {
          return {
            id: msg.message_id,
            senderId: msg.sender?.employee_id || msg.sender_id,
            sender: msg.sender, // 🔑 Preserve full sender object with profile_picture_link
            text: msg.content,
            timestamp: new Date(msg.created_at),
            read: true,
            status: 'delivered',
            type: msg.type || 'text',
            file_urls: msg.file_urls || [], // Include file URLs from API
            isForwarded: msg.is_forwarded || false, // 🔁 Include forwarded flag
            ...(msg.reply_to_message_id && {
              replyTo: {
                id: msg.reply_to_message_id,
                text: msg.reply_content || 'Original message',
                senderName: msg.reply_sender_name || 'Unknown'
              }
            })
          };
        });

        // Set initial messages for the conversation
        setMessages(prev => ({
          ...prev,
          [activeConversation.room_id || activeConversation.id]: formattedMessages
        }));
      } else {
        // Set empty array to indicate messages were loaded (prevents re-loading)
        setMessages(prev => ({
          ...prev,
          [activeConversation.room_id || activeConversation.id]: []
        }));
      }
    } catch (error) {
      // Set empty array on error to prevent retry loops
      setMessages(prev => ({
        ...prev,
        [activeConversation.room_id || activeConversation.id]: []
      }));
    } finally {
      setLoadingInitialMessages(false);
    }
  };

  // Effect to handle active conversation changes - disconnect when no active conversation
  useEffect(() => {
    if (!activeConversation) {
      enhancedChatAPI.disconnectFromRoom();
      setIsConnected(false);
    }
  }, [activeConversation?.id, activeConversation?.room_id]);

  // Effect to subscribe to WebSocket events
  useEffect(() => {
    const unsubscribeMessage = enhancedChatAPI.onMessage(handleWebSocketMessage);
    const unsubscribeConnection = enhancedChatAPI.onConnection(handleWebSocketConnection);
    
    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [handleWebSocketMessage, handleWebSocketConnection]); // Add dependencies so it updates with fresh closures

  return {
    isConnected,
    loadingInitialMessages,
    loadInitialMessages
  };
};

export default useChatWebSocketMessages;