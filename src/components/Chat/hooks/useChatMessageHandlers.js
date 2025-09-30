import { enhancedChatAPI } from '../chatapi';
import adminChatAPI from '../../../services/adminChatAPI';

// For admin environment, we only use admin APIs for group creation
// All other chat operations (messaging, room connections) use existing WebSocket infrastructure
const isAdminEnvironment = () => window.location.pathname.includes('/crm');

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
            return;
          }
        } else {
          console.error('❌ Could not find other participant');
          return;
        }
      } else {
        console.error('❌ Group conversations not yet supported for auto-connection');
        return;
      }
    } else {
      // Ensure WebSocket is connected to the room
      console.log('🔗 Ensuring WebSocket connection to room:', activeConversation.room_id);
      enhancedChatAPI.connectToRoom(activeConversation.room_id);
    }
    
    try {
      const senderEmployeeId = currentUser.employeeId || 'emp-' + currentUser.id;
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
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
    
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: (prev[activeConversation.id] || []).map(msg => 
        msg.id === editingMessage.id 
          ? { ...msg, text: editMessageText.trim(), edited: true }
          : msg
      )
    }));
    
    setEditingMessage(null);
    setEditMessageText('');
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
      const messagesResponse = isAdminEnvironment() 
        ? await adminChatAPI.getRoomMessages(roomId)
        : await enhancedChatAPI.getRoomMessages(roomId);
      console.log('Messages API response:', messagesResponse);
      
      if (messagesResponse.status === 'success' && messagesResponse.data) {
        const apiMessages = messagesResponse.data;
        
        const convertedMessages = apiMessages.map(msg => ({
          id: msg.message_id || msg.id,
          senderId: msg.sender?.employee_id || msg.sender_id,
          senderName: msg.sender?.employee_name || 'Unknown',
          text: msg.content,
          timestamp: new Date(msg.created_at || msg.timestamp),
          read: true,
          status: 'sent',
          fileUrls: msg.file_urls || [],
          replyTo: msg.reply_to_message_id ? { id: msg.reply_to_message_id } : null
        }));
        
        console.log('Converted', convertedMessages.length, 'previous messages');
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: convertedMessages
        }));
        
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
    handleCancelReply
  };
};
