import { enhancedChatAPI } from '../chatapi';
import adminChatAPI from '../../../services/adminChatAPI';
import chatToast from '../utils/toastUtils';
import { cookieUtils } from '../../../utils/cookieUtils';

// For admin environment, we only use admin APIs for group creation
// All other chat operations (messaging, room connections) use existing WebSocket infrastructure
const isAdminEnvironment = () => window.location.pathname.includes('/crm');

// Utility function to parse reply data from API response
const parseReplyData = (replyToMessageData) => {
  if (!replyToMessageData) return null;
  
  const result = {
    id: replyToMessageData.message_id,
    text: replyToMessageData.content,
    senderId: replyToMessageData.sender?.employee_id,
    senderName: replyToMessageData.sender?.employee_name || 'Unknown User',
    timestamp: new Date(replyToMessageData.created_at)
  };
  
  
  
  return result;
};

export const useChatMessageHandlers = ({
  activeConversation,
  setActiveConversation,
  setGlobalActiveConversation,
  markConversationAsRead,
  setMessages,
  setConversations,
  newMessage,
  setNewMessage,
  replyToMessage,
  setReplyToMessage,
  editingMessage,
  setEditingMessage,
  editMessageText,
  setEditMessageText,
  setMessageToForward,
  setShowForwardModal,
  setContextMenu,
  setPinnedMessages,
  setMessageToPin,
  setShowPinMessageModal,
  currentUser,
  messages,
  pendingFileUrls,
  setPendingFileUrls
}) => {
  
  const handleSendMessage = async () => {
    if (editingMessage) {
      await handleSaveEdit();
      return;
    }
    
    // Allow sending if there's text OR file URLs
    const hasContent = newMessage.trim() || (pendingFileUrls && pendingFileUrls.length > 0);
    if (!hasContent || !activeConversation) {
      return;
    }
    
    
    // Ensure WebSocket connection exists for the current conversation
    if (!activeConversation.room_id) {
      
      
      
      // If it's a direct conversation, try to find or create room
      if (activeConversation.type === 'direct') {
        const otherParticipantId = activeConversation.participants.find(id => id !== currentUser?.id);
        
        if (otherParticipantId) {
          try {
            let roomResponse = await enhancedChatAPI.findRoomWithParticipant(String(otherParticipantId));
            
            if (!roomResponse || !roomResponse.room_id) {
              roomResponse = await enhancedChatAPI.createRoomAndConnect(String(otherParticipantId));
            } else {
              enhancedChatAPI.connectToRoom(roomResponse.room_id);
            }
            
            if (roomResponse && roomResponse.room_id) {
              activeConversation.room_id = roomResponse.room_id;
              // Update conversations with room_id
              setConversations(prev => prev.map(conv => 
                conv.id === activeConversation.id 
                  ? { ...conv, room_id: roomResponse.room_id }
                  : conv
              ));
            } else {
              return;
            }
          } catch (error) {
            chatToast.connectionError();
            return;
          }
        } else {
          chatToast.error('Could not find chat participant');
          return;
        }
      } else if (activeConversation.type === 'group') {
        // For group conversations, connect to existing room
        // Group should already have room_id from creation, but if not, show error
        chatToast.error('Group room ID missing. Please recreate the group.');
        return;
      } else {
        chatToast.error('Invalid conversation type');
        return;
      }
    }
    
    // Ensure WebSocket is connected for the room
    const connectionStatus = enhancedChatAPI.getConnectionStatus();
    
    if (!connectionStatus.isConnected || connectionStatus.roomId !== activeConversation.room_id) {
      enhancedChatAPI.connectToRoom(activeConversation.room_id);
      
      // Wait for connection with multiple checks
      let connected = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Check every 200ms
        const status = enhancedChatAPI.getConnectionStatus();
        
        if (status.isConnected && status.roomId === activeConversation.room_id) {
          connected = true;
          break;
        }
      }
      
      if (!connected) {
        console.error('[Message] Failed to establish WebSocket connection after waiting');
        chatToast.error('Could not connect to chat. Please refresh and try again.');
        return;
      }
    }
    
    try {
      // Determine sender_id based on current user's actual employee ID
      let senderEmployeeId;
      
      // Try to get employee ID from multiple sources
      if (currentUser.employeeId && currentUser.employeeId !== 'N/A') {
        senderEmployeeId = currentUser.employeeId; // Should be like "emp-26WoIrooxdVU"
      } else if (currentUser.id && currentUser.id !== 'N/A' && currentUser.id.startsWith('emp-')) {
        senderEmployeeId = currentUser.id; // Already in correct format
      } else if (currentUser.id && currentUser.id !== 'N/A') {
        senderEmployeeId = `emp-${currentUser.id}`; // Add emp- prefix
      } else {
        // Last resort: try to get from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            senderEmployeeId = parsedUser.employeeId || parsedUser.employee_id || parsedUser.id || 'emp-unknown';
          } catch (e) {
            senderEmployeeId = 'emp-unknown';
          }
        } else {
          senderEmployeeId = 'emp-unknown';
        }
      }
      
      const replyToMessageId = replyToMessage ? replyToMessage.id : null;
      const sendResult = await enhancedChatAPI.sendMessage(
        newMessage.trim() || '', // Send empty string if no text, only files
        senderEmployeeId,
        pendingFileUrls || [],
        replyToMessageId,
        activeConversation.room_id // Pass room ID for verification
      );
      if (sendResult && sendResult.success !== false) {
        // Create optimistic message with unique temporary ID
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageText = newMessage.trim() || ''; // Can be empty if only files
        const messageData = {
          id: tempId,
          message_id: tempId,
          senderId: senderEmployeeId,
          sender: {
            employee_id: senderEmployeeId,
            employee_name: currentUser?.name || currentUser?.fullName || 'You',
            profile_picture_link: currentUser?.profile_picture_link || currentUser?.avatar || ''
          },
          text: messageText,
          file_urls: pendingFileUrls || [], // Include file URLs in optimistic message
          timestamp: new Date(),
          read: true,
          status: 'sending',
          _optimistic: true, // Mark as optimistic
          _optimisticText: messageText, // Store original text for matching
          _optimisticSender: senderEmployeeId // Store sender for matching
        };
        
        if (replyToMessage) {
          messageData.replyTo = replyToMessage;
          setReplyToMessage(null);
        }
        
        // Use room_id if available, otherwise fall back to id
        const conversationKey = activeConversation.room_id || activeConversation.id;
        
        // Add message to local state immediately (optimistic UI)
        setMessages(prev => ({
          ...prev,
          [conversationKey]: [...(prev[conversationKey] || []), messageData]
        }));
        
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation.id 
            ? { ...conv, lastMessage: { text: messageText, timestamp: new Date() } }
            : conv
        ));
        
        setNewMessage('');
        setPendingFileUrls([]);
        

      } else {
        console.error('[Message] Send result indicates failure:', sendResult);
        chatToast.sendMessageFailed();
      }
    } catch (error) {
      console.error('[Message] Error sending message:', error);
      chatToast.error(error.message || 'Failed to send message');
      setNewMessage('');
    }
  };

  const handleIncomingMessage = (messageData) => {
    if (!activeConversation) return;
    
    const senderEmployeeId = messageData.sender?.employee_id || messageData.sender_id;
    const currentUserEmployeeId = currentUser?.employeeId || 'emp-' + currentUser?.id;
    
    if (senderEmployeeId === currentUserEmployeeId) {
      return;
    }
    
    const incomingMessage = {
      id: messageData.message_id || Date.now(),
      senderId: senderEmployeeId,
      text: messageData.content,
      timestamp: new Date(messageData.timestamp || messageData.created_at || Date.now()),
      read: false,
      status: 'received'
    };

    // Handle reply to message from API
    if (messageData.reply_to_message) {
      incomingMessage.replyTo = parseReplyData(messageData.reply_to_message);
    }
    
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), incomingMessage]
    }));
    
    // Update conversation list with new last message and increment unread count
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { 
            ...conv, 
            lastMessage: { 
              text: incomingMessage.text, 
              timestamp: incomingMessage.timestamp,
              senderId: incomingMessage.senderId
            },
            unreadCount: (conv.unreadCount || 0) + 1
          }
        : conv
    ));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveEdit = async () => {
    if (!editMessageText.trim() || !editingMessage) return;
    
    try {
      // Call the edit message API
      const result = await enhancedChatAPI.editMessage(editingMessage.id, editMessageText.trim());
      
      if (result.status === 'success') {
        chatToast.messageEdited();
        
        // Update local state
        const editedText = editMessageText.trim();
        setMessages(prev => ({
          ...prev,
          [activeConversation.id]: (prev[activeConversation.id] || []).map(msg => 
            msg.id === editingMessage.id 
              ? { ...msg, text: editedText, edited: true }
              : msg
          )
        }));

        // Update conversation list if this was the last message
        const currentMessages = messages[activeConversation.id] || [];
        const isLastMessage = currentMessages.length > 0 && 
          currentMessages[currentMessages.length - 1].id === editingMessage.id;
        
        if (isLastMessage) {
          setConversations(prev => prev.map(conv => 
            conv.id === activeConversation.id 
              ? { 
                  ...conv, 
                  lastMessage: { 
                    text: editedText, 
                    timestamp: new Date(),
                    senderId: editingMessage.senderId,
                    edited: true
                  }
                }
              : conv
          ));
        }
      } else {
        chatToast.error('Failed to save edit');
      }
      
    } catch (error) {
      chatToast.error('Failed to edit message');
    }
    
    // Clear editing state
    setEditingMessage(null);
    setEditMessageText('');
  };

  const loadPreviousMessages = async (roomId, conversationId) => {
    try {
      const existingMessages = messages[conversationId] || [];
      if (existingMessages.length > 0) {
        return;
      }
      
      // Use admin API for message retrieval in admin environment, otherwise use employee API
      const isAdminEnv = isAdminEnvironment();
      const messagesResponse = isAdminEnv 
        ? await adminChatAPI.getRoomMessages(roomId)
        : await enhancedChatAPI.getRoomMessages(roomId);
      // Log raw messages with reply data
      if (messagesResponse.status === 'success' && messagesResponse.data) {
        const messagesWithReplies = messagesResponse.data.filter(msg => msg.reply_to_message);
      }
      
      if (messagesResponse.status === 'success' && messagesResponse.data) {
        const apiMessages = messagesResponse.data;
        
        const convertedMessages = apiMessages.map(msg => {
          const convertedMsg = {
            id: msg.message_id || msg.id,
            senderId: msg.sender?.employee_id || msg.sender_id,
            sender: msg.sender, // ?? Preserve full sender object with profile_picture_link
            senderName: msg.sender?.employee_name || 'Unknown',
            text: msg.content,
            timestamp: new Date(msg.created_at || msg.timestamp),
            read: true,
            status: 'sent',
            fileUrls: msg.file_urls || [],
            isForwarded: msg.is_forwarded || false // ?? Include forwarded flag
          };

          // Handle reply to message from API
          if (msg.reply_to_message) {
            convertedMsg.replyTo = parseReplyData(msg.reply_to_message);
            
          }

          return convertedMsg;
        });
        const messagesWithReplies = convertedMessages.filter(msg => msg.replyTo);
        // Show detailed info about converted messages with replies
        messagesWithReplies.forEach(msg => {
          
        });
        
        setMessages(prev => {
          const newState = {
            ...prev,
            [conversationId]: convertedMessages
          };
          return newState;
        });
      } else {
      }
    } catch (error) {
    }
  };

  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setGlobalActiveConversation(conversation);
    markConversationAsRead(conversation.id);

    // Load messages if they haven't been loaded yet
    if (conversation.room_id) {
      await loadPreviousMessages(conversation.room_id, conversation.id);
    }

    if (!conversation.room_id && conversation.type === 'direct') {
      try {
        const otherParticipantId = conversation.participants.find(id => id !== currentUser?.id);
        
        if (otherParticipantId) {
          // For room finding, use existing employee API infrastructure (works with WebSocket)
          const roomResponse = await enhancedChatAPI.findRoomWithParticipant(String(otherParticipantId));
          
          if (roomResponse && roomResponse.room_id) {
            conversation.room_id = roomResponse.room_id;
            
            setConversations(prev => prev.map(conv => 
              conv.id === conversation.id 
                ? { ...conv, room_id: roomResponse.room_id }
                : conv
            ));
            await loadPreviousMessages(roomResponse.room_id, conversation.id);
          } else {
            // For room creation in direct chats, use existing employee API infrastructure
            const newRoomResponse = await enhancedChatAPI.createRoomAndConnect(String(otherParticipantId));
            
            if (newRoomResponse && newRoomResponse.room_id) {
              conversation.room_id = newRoomResponse.room_id;
              
              setConversations(prev => prev.map(conv => 
                conv.id === conversation.id 
                  ? { ...conv, room_id: newRoomResponse.room_id }
                  : conv
              ));
              await loadPreviousMessages(newRoomResponse.room_id, conversation.id);
            } else {
            }
          }
        } else {
        }
      } catch (error) {
      }
    } else if (conversation.room_id) {
      await loadPreviousMessages(conversation.room_id, conversation.id);
    } else {
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditMessageText('');
  };

  const handleStartEdit = (message) => {
    if (message.senderId !== currentUser?.employeeId && message.senderId !== 'emp-' + currentUser?.id) {
      return;
    }
    
    setEditingMessage(message);
    setEditMessageText(message.text);
  };

  const handleReplyToMessage = (message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleReply = (message) => {
    setReplyToMessage(message);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handleForward = (message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handleForwardMessage = async (conversationIds, forwardMessage) => {
    
    
    if (!forwardMessage || !conversationIds || conversationIds.length === 0) {
      chatToast.error('Please select at least one conversation to forward to');
      return;
    }

    // Check if message has a message_id
    if (!forwardMessage.message_id && !forwardMessage.id) {
      chatToast.error('Cannot forward this message');
      return;
    }

    try {
      // Get current conversations state
      let currentConversations;
      setConversations(prev => {
        currentConversations = prev;
        return prev;
      });

      // Collect room_ids from the selected conversations
      const roomIds = [];
      
      for (const conversationId of conversationIds) {
        const targetConversation = currentConversations.find(conv => conv.id === conversationId);
        if (targetConversation) {
          // Ensure the conversation has a room_id
          let roomId = targetConversation.room_id;
          
          if (!roomId && targetConversation.type === 'direct') {
            const otherParticipantId = targetConversation.participants.find(id => id !== currentUser?.id);
            
            if (otherParticipantId) {
              const roomResponse = await enhancedChatAPI.createRoomAndConnect(String(otherParticipantId));
              if (roomResponse && roomResponse.room_id) {
                roomId = roomResponse.room_id;
                
                // Update conversation with room_id
                setConversations(prev => prev.map(conv => 
                  conv.id === conversationId 
                    ? { ...conv, room_id: roomId }
                    : conv
                ));
              }
            }
          }
          
          if (roomId) {
            roomIds.push(roomId);
          } else {
          }
        } else {
        }
      }
      
      if (roomIds.length === 0) {
        chatToast.error('Failed to forward message - no valid conversations');
        return;
      }
      
      // Use the new forward API endpoint
      const messageId = forwardMessage.message_id || forwardMessage.id;
      const result = await enhancedChatAPI.forwardMessage(messageId, roomIds);
      
      if (result && result.status === 'success') {
        chatToast.success(`Message forwarded to ${roomIds.length} conversation${roomIds.length > 1 ? 's' : ''}`);
        
        // Update conversations to reflect the forwarded message as the last message
        const forwardedText = `?? Forwarded: ${forwardMessage.text}`;
        const currentTime = new Date();
        
        setConversations(prev => prev.map(conv => {
          if (roomIds.includes(conv.room_id)) {
            return {
              ...conv,
              lastMessage: {
                text: forwardedText,
                timestamp: currentTime
              },
              timestamp: currentTime,
              unreadCount: conv.id === activeConversation?.id ? 0 : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        }));
        
        // If the user is viewing one of the target conversations, reload its messages
        if (activeConversation && roomIds.includes(activeConversation.room_id)) {
          try {
            const messagesResponse = await enhancedChatAPI.getRoomMessages(activeConversation.room_id);
            if (messagesResponse.status === 'success' && Array.isArray(messagesResponse.data)) {
              const formattedMessages = messagesResponse.data.map(msg => ({
                id: msg.message_id,
                message_id: msg.message_id,
                senderId: msg.sender?.employee_id || msg.sender_id,
                sender: msg.sender,
                text: msg.content,
                timestamp: new Date(msg.created_at),
                read: true,
                status: 'delivered',
                type: msg.type || 'text',
                fileUrls: msg.file_urls || [],
                isForwarded: msg.is_forwarded || false,
                ...(msg.reply_to_message_id && {
                  replyTo: {
                    id: msg.reply_to_message_id,
                    text: msg.reply_content || 'Original message',
                    senderName: msg.reply_sender_name || 'Unknown'
                  }
                })
              }));
              
              setMessages(prev => ({
                ...prev,
                [activeConversation.id]: formattedMessages
              }));
            }
          } catch (error) {
          }
        }
      } else {
        chatToast.error('Failed to forward message');
      }
      
      // Close the forward modal
      setShowForwardModal(false);
      setMessageToForward(null);
      
    } catch (error) {
      chatToast.error('Failed to forward message');
    }
  };

  const handlePinMessage = (message) => {
    setMessageToPin(message);
    setShowPinMessageModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handlePinMessageWithDuration = async (message, duration) => {
    if (!message) {
      return;
    }

    try {
      // Add message to pinned messages
      const pinnedMessage = {
        ...message,
        pinnedAt: new Date(),
        pinnedBy: currentUser.id || currentUser.employeeId || 'N/A',
        duration: duration
      };

      setPinnedMessages(prev => [...prev, pinnedMessage]);
      
      // Close the pin modal
      setShowPinMessageModal(false);
      setMessageToPin(null);
    } catch (error) {
    }
  };

  return {
    handleSendMessage,
    handleIncomingMessage,
    handleKeyPress,
    handleSaveEdit,
    handleCancelEdit,
    handleStartEdit,
    handleSelectConversation,
    loadPreviousMessages,
    handleReplyToMessage,
    handleCancelReply,
    handleReply,
    handleForward,
    handleForwardMessage,
    handlePinMessage,
    handlePinMessageWithDuration
  };
};
