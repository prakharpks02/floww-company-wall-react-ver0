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
  
  console.log('🔍 Parsing reply data:', {
    original: replyToMessageData,
    parsed: result
  });
  
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
      console.log('Cannot send message: empty message or no active conversation');
      return;
    }

    console.log('📤 Attempting to send message...');
    console.log('🏠 Active conversation room_id:', activeConversation.room_id);
    
    // Ensure WebSocket connection exists for the current conversation
    if (!activeConversation.room_id) {
      console.log('⚠️ No room_id found, attempting to establish room connection...');
      console.log('🔍 Active conversation details:', {
        id: activeConversation.id,
        type: activeConversation.type,
        name: activeConversation.name,
        participants: activeConversation.participants,
        room_id: activeConversation.room_id
      });
      console.log('🔍 Current user details:', {
        id: currentUser?.id,
        employeeId: currentUser?.employeeId,
        name: currentUser?.name
      });
      
      // If it's a direct conversation, try to find or create room
      if (activeConversation.type === 'direct') {
        const otherParticipantId = activeConversation.participants.find(id => id !== currentUser?.id);
        console.log('🔍 Other participant ID found:', otherParticipantId);
        console.log('🔍 All participants:', activeConversation.participants);
        console.log('🔍 Current user ID for comparison:', currentUser?.id);
        
        if (otherParticipantId) {
          try {
            console.log('🔍 Finding/creating room for participant:', otherParticipantId);
            
            let roomResponse = await enhancedChatAPI.findRoomWithParticipant(String(otherParticipantId));
            
            if (!roomResponse || !roomResponse.room_id) {
              console.log('🏠 Creating new room...');
              roomResponse = await enhancedChatAPI.createRoomAndConnect(String(otherParticipantId));
            } else {
              console.log('🔗 Connecting to existing room...');
              enhancedChatAPI.connectToRoom(roomResponse.room_id);
            }
            
            if (roomResponse && roomResponse.room_id) {
              activeConversation.room_id = roomResponse.room_id;
              console.log('✅ Room established:', roomResponse.room_id);
              
              // Update conversations with room_id
              setConversations(prev => prev.map(conv => 
                conv.id === activeConversation.id 
                  ? { ...conv, room_id: roomResponse.room_id }
                  : conv
              ));
            } else {
              console.error('❌ Failed to establish room connection');
              return;
            }
          } catch (error) {
            console.error('❌ Error establishing room connection:', error);
            chatToast.connectionError();
            return;
          }
        } else {
          console.error('❌ Could not find other participant');
          chatToast.error('Could not find chat participant');
          return;
        }
      } else {
        console.error('❌ Group conversations not yet supported for auto-connection');
        chatToast.error('Group conversation setup not supported');
        return;
      }
    } else {
      // Ensure WebSocket is connected to the room
      console.log('🔗 Ensuring WebSocket connection to room:', activeConversation.room_id);
      enhancedChatAPI.connectToRoom(activeConversation.room_id);
    }
    
    try {
      // Determine sender_id based on environment and user type
      let senderEmployeeId;
      
      // Check if we're in admin environment - always use admin sender_id
      if (currentUser.isAdmin) {
        senderEmployeeId = 'UAI5Tfzl3k4Y6NIp';
        console.log('📤 Using admin sender_id:', senderEmployeeId);
      } else if (activeConversation.type === 'direct' && activeConversation.participants) {
        // For direct conversations, use the other participant's employee_id as sender_id
        const otherParticipantId = activeConversation.participants.find(id => id !== currentUser?.id);
        senderEmployeeId = otherParticipantId || (currentUser.employeeId || 'emp-' + currentUser.id);
        console.log('📤 Using other participant employee_id as sender:', senderEmployeeId);
      } else {
        // Fallback to current user for group chats or if no other participant found
        senderEmployeeId = currentUser.employeeId || 'emp-' + currentUser.id;
        console.log('📤 Using current user employee_id as sender:', senderEmployeeId);
      }
      
      const replyToMessageId = replyToMessage ? replyToMessage.id : null;
      
      console.log('📤 Sending message via enhanced WebSocket API...');
      const sendResult = await enhancedChatAPI.sendMessage(
        newMessage.trim(),
        senderEmployeeId,
        [],
        replyToMessageId,
        activeConversation.room_id // Pass room ID for verification
      );
      
      console.log('📤 Send result:', sendResult);
      
      if (sendResult && sendResult.success !== false) {
        const messageData = {
          id: sendResult.temporaryMessage?.id || Date.now(),
          senderId: senderEmployeeId,
          sender: {
            employee_id: senderEmployeeId,
            employee_name: currentUser?.name || currentUser?.fullName || 'You',
            profile_picture_link: currentUser?.profile_picture_link || currentUser?.avatar || ''
          }, // 🔑 Add sender object for consistency with received messages
          text: newMessage.trim(),
          timestamp: new Date(),
          read: true,
          status: sendResult.requiresVerification ? 'sending' : 'sent', // Show as 'sending' until verified
          _temporary: sendResult.temporaryMessage?._temporary || false
        };
        
        if (replyToMessage) {
          messageData.replyTo = replyToMessage;
          setReplyToMessage(null);
        }
        
        // Add message to local state immediately
        setMessages(prev => ({
          ...prev,
          [activeConversation.id]: [...(prev[activeConversation.id] || []), messageData]
        }));
        
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation.id 
            ? { ...conv, lastMessage: { text: messageData.text, timestamp: new Date() } }
            : conv
        ));
        
        setNewMessage('');
      } else {
        chatToast.sendMessageFailed();
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
        console.log('📝 Editing message via admin API:', editingMessage.id);
        
        const response = await fetch(`https://dev.gofloww.co/api/wall/chat/admin/messages/${editingMessage.id}/edit`, {
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
        console.log('📝 Admin edit API result:', result);
        
        if (response.ok && result.status === 'success') {
          console.log('✅ Message edited successfully via admin API');
          chatToast.messageEdited();
        } else {
          console.error('❌ Failed to edit message via admin API:', result);
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
      console.error('❌ Error editing message:', error);
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
      console.log('Loading previous messages for room:', roomId);
      
      const existingMessages = messages[conversationId] || [];
      if (existingMessages.length > 0) {
        console.log('Messages already loaded for this conversation, skipping...');
        return;
      }
      
      // Use admin API for message retrieval in admin environment, otherwise use employee API
      const isAdminEnv = isAdminEnvironment();
      console.log('🔍 [LOAD] Using admin API:', isAdminEnv);
      const messagesResponse = isAdminEnv 
        ? await adminChatAPI.getRoomMessages(roomId)
        : await enhancedChatAPI.getRoomMessages(roomId);
      console.log('🔍 [LOAD] Messages API response:', messagesResponse);
      
      // Log raw messages with reply data
      if (messagesResponse.status === 'success' && messagesResponse.data) {
        const messagesWithReplies = messagesResponse.data.filter(msg => msg.reply_to_message);
        console.log('🔍 [LOAD] Raw messages with replies from API:', messagesWithReplies);
      }
      
      if (messagesResponse.status === 'success' && messagesResponse.data) {
        const apiMessages = messagesResponse.data;
        
        const convertedMessages = apiMessages.map(msg => {
          const convertedMsg = {
            id: msg.message_id || msg.id,
            senderId: msg.sender?.employee_id || msg.sender_id,
            sender: msg.sender, // 🔑 Preserve full sender object with profile_picture_link
            senderName: msg.sender?.employee_name || 'Unknown',
            text: msg.content,
            timestamp: new Date(msg.created_at || msg.timestamp),
            read: true,
            status: 'sent',
            fileUrls: msg.file_urls || []
          };

          // Handle reply to message from API
          if (msg.reply_to_message) {
            convertedMsg.replyTo = parseReplyData(msg.reply_to_message);
            console.log('🔍 Message with reply found:', {
              messageId: convertedMsg.id,
              content: convertedMsg.text,
              replyTo: convertedMsg.replyTo
            });
          }

          return convertedMsg;
        });
        
        console.log('🔍 [LOAD] Converted', convertedMessages.length, 'previous messages');
        const messagesWithReplies = convertedMessages.filter(msg => msg.replyTo);
        console.log('🔍 [LOAD] Messages with replies after conversion:', messagesWithReplies.length);
        
        // Show detailed info about converted messages with replies
        messagesWithReplies.forEach(msg => {
          console.log('🔍 [LOAD] Converted message with reply:', {
            id: msg.id,
            text: msg.text,
            replyTo: msg.replyTo
          });
        });
        
        setMessages(prev => {
          const newState = {
            ...prev,
            [conversationId]: convertedMessages
          };
          console.log('🔍 [LOAD] Updated messages state for conversation', conversationId);
          console.log('🔍 [LOAD] Messages with replies in state:', newState[conversationId].filter(msg => msg.replyTo).length);
          return newState;
        });
        
        console.log('Previous messages loaded successfully');
      } else {
        console.log('No previous messages found or API error');
      }
    } catch (error) {
      console.error('Error loading previous messages:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    console.log('Selecting conversation:', conversation);
    
    setActiveConversation(conversation);
    setGlobalActiveConversation(conversation);
    markConversationAsRead(conversation.id);

    // Load messages if they haven't been loaded yet
    if (conversation.room_id) {
      console.log('Conversation has room_id:', conversation.room_id, '- loading messages...');
      await loadPreviousMessages(conversation.room_id, conversation.id);
    }

    if (!conversation.room_id && conversation.type === 'direct') {
      try {
        console.log('Conversation missing room_id, attempting to find/create room...');
        
        const otherParticipantId = conversation.participants.find(id => id !== currentUser?.id);
        
        if (otherParticipantId) {
          console.log('Found other participant ID:', otherParticipantId);
          
          // For room finding, use existing employee API infrastructure (works with WebSocket)
          const roomResponse = await enhancedChatAPI.findRoomWithParticipant(String(otherParticipantId));
          
          if (roomResponse && roomResponse.room_id) {
            console.log('Found existing room:', roomResponse.room_id);
            
            conversation.room_id = roomResponse.room_id;
            
            setConversations(prev => prev.map(conv => 
              conv.id === conversation.id 
                ? { ...conv, room_id: roomResponse.room_id }
                : conv
            ));
            
            console.log('Room ID added to conversation, WebSocket will connect automatically');
            
            await loadPreviousMessages(roomResponse.room_id, conversation.id);
          } else {
            console.log('No existing room found, creating new room...');
            
            // For room creation in direct chats, use existing employee API infrastructure
            const newRoomResponse = await enhancedChatAPI.createRoomAndConnect(String(otherParticipantId));
            
            if (newRoomResponse && newRoomResponse.room_id) {
              console.log('Created new room:', newRoomResponse.room_id);
              
              conversation.room_id = newRoomResponse.room_id;
              
              setConversations(prev => prev.map(conv => 
                conv.id === conversation.id 
                  ? { ...conv, room_id: newRoomResponse.room_id }
                  : conv
              ));
              
              console.log('New room created and WebSocket connected');
              
              await loadPreviousMessages(newRoomResponse.room_id, conversation.id);
            } else {
              console.warn('Failed to create room for conversation');
            }
          }
        } else {
          console.warn('Could not find other participant for direct conversation');
        }
      } catch (error) {
        console.error('Error handling room for conversation:', error);
      }
    } else if (conversation.room_id) {
      console.log('Conversation already has room_id:', conversation.room_id);
      
      await loadPreviousMessages(conversation.room_id, conversation.id);
    } else {
      console.log('Group conversation or no room_id handling needed');
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
    console.log('📤 Setting reply to message:', message);
    setReplyToMessage(message);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handleForward = (message) => {
    console.log('📤 Setting message to forward:', message);
    setMessageToForward(message);
    setShowForwardModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handleForwardMessage = async (conversationIds, forwardMessage) => {
    console.log('📤 Forwarding message to conversations:', conversationIds);
    console.log('📤 Message to forward:', forwardMessage);
    
    if (!forwardMessage || !conversationIds || conversationIds.length === 0) {
      console.error('❌ Invalid forward parameters');
      return;
    }

    try {
      // Get current conversations state
      let currentConversations;
      setConversations(prev => {
        currentConversations = prev;
        return prev;
      });

      // Forward to each selected conversation
      for (const conversationId of conversationIds) {
        const targetConversation = currentConversations.find(conv => conv.id === conversationId);
        console.log('📤 Target conversation found:', targetConversation);
        
        if (targetConversation) {
          // Ensure the conversation has a room_id
          let roomId = targetConversation.room_id;
          
          if (!roomId && targetConversation.type === 'direct') {
            console.log('📤 No room_id, creating room for direct conversation...');
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
            console.log('📤 Forwarding to room:', roomId);
            
            // Use enhanced API to forward the message
            await enhancedChatAPI.sendMessage(
              forwardMessage.text, // Forward original message without prefix
              currentUser.isAdmin ? 'UAI5Tfzl3k4Y6NIp' : (currentUser.employeeId || 'emp-' + currentUser.id),
              forwardMessage.fileUrls || [],
              null,
              roomId
            );
            
            console.log('✅ Message forwarded to conversation:', targetConversation.name);
          } else {
            console.error('❌ Could not establish room_id for conversation:', conversationId);
          }
        } else {
          console.error('❌ Target conversation not found:', conversationId);
        }
      }
      
      // Close the forward modal
      setShowForwardModal(false);
      setMessageToForward(null);
      
      console.log('✅ Message forwarded to', conversationIds.length, 'conversations');
    } catch (error) {
      console.error('❌ Error forwarding message:', error);
    }
  };

  const handlePinMessage = (message) => {
    console.log('📌 Pinning message:', message);
    setMessageToPin(message);
    setShowPinMessageModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  const handlePinMessageWithDuration = async (message, duration) => {
    console.log('📌 Pinning message with duration:', { message, duration });
    
    if (!message) {
      console.error('❌ No message to pin');
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
      
      console.log('✅ Message pinned successfully');
    } catch (error) {
      console.error('❌ Error pinning message:', error);
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
