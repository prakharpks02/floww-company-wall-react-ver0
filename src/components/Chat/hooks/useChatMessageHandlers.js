import { enhancedChatAPI } from '../chatapi';
import adminChatAPI from '../../../services/adminChatAPI';
import chatToast from '../utils/toastUtils';

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
  messages
}) => {
  
  const handleSendMessage = async () => {
    if (editingMessage) {
      await handleSaveEdit();
      return;
    }
    
    if (!newMessage.trim() || !activeConversation) {
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
      } else {
        chatToast.error('Group conversation setup not supported');
        return;
      }
    } else {
      // Ensure WebSocket is connected to the room
      enhancedChatAPI.connectToRoom(activeConversation.room_id);
    }
    
    try {
      // Determine sender_id based on environment and user type
      let senderEmployeeId;
      
      // Check if we're in admin environment - always use admin sender_id
      if (currentUser.isAdmin) {
        senderEmployeeId = 'UAI5Tfzl3k4Y6NIp';
      } else {
        // Always use current user's employee ID as sender (you are sending the message!)
        senderEmployeeId = currentUser.employeeId || 'emp-' + currentUser.id;
      }
      
      const replyToMessageId = replyToMessage ? replyToMessage.id : null;
      const sendResult = await enhancedChatAPI.sendMessage(
        newMessage.trim(),
        senderEmployeeId,
        [],
        replyToMessageId,
        activeConversation.room_id // Pass room ID for verification
      );
      if (sendResult && sendResult.success !== false) {
        // Create optimistic message with unique temporary ID
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageText = newMessage.trim();
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
        // Add message to local state immediately (optimistic UI)
        setMessages(prev => ({
          ...prev,
          [activeConversation.id]: [...(prev[activeConversation.id] || []), messageData]
        }));
        
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation.id 
            ? { ...conv, lastMessage: { text: messageText, timestamp: new Date() } }
            : conv
        ));
        
        setNewMessage('');
      } else {
        chatToast.sendMessageFailed();
      }
    } catch (error) {
      chatToast.sendMessageFailed();
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
    if (!editMessageText.trim()) return;
    
    try {
      // Call admin API to edit the message
      if (currentUser.isAdmin && editingMessage.id) {
        const response = await fetch(`https://console.gofloww.xyz/api/wall/chat/admin/messages/${editingMessage.id}/edit`, {
          method: 'POST',
          headers: {
            'Authorization': '7a3239c81974cdd6140c3162468500ba95d7d5823ea69658658c2986216b273e',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: editMessageText.trim()
          })
        });
        
        const result = await response.json();
        if (response.ok && result.status === 'success') {
          chatToast.messageEdited();
        } else {
          chatToast.error('Failed to save edit');
        }
      }
      
      // Update local state regardless of API call result
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
      
    } catch (error) {
      chatToast.error('Failed to edit message');
      
      // Still update local state even if API fails
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
    } finally {
      setEditingMessage(null);
      setEditMessageText('');
    }
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
        pinnedBy: currentUser.isAdmin ? 'UAI5Tfzl3k4Y6NIp' : (currentUser.employeeId || 'emp-' + currentUser.id),
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
