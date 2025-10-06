export const useChatNavigationHandlers = ({
  conversations,
  createConversation,
  setActiveConversation,
  setGlobalActiveConversation,
  markConversationAsRead,
  setShowUserList,
  setSearchQuery,
  setShowChatInfo,
  setShowAttachmentMenu,
  setShowPollModal,
  setMessages,
  setConversations,
  currentUser,
  setIsConnectingToChat,
  setConnectingChatId
}) => {

  // Handle starting a new chat with an employee
  const handleStartNewChat = async (employee) => {
    // Use employeeId for chat system compatibility, fallback to id
    const employeeChatId = employee.employeeId || employee.id;
    const currentUserChatId = currentUser.employeeId || currentUser.id;
    
    // Set loading state
    setIsConnectingToChat(true);
    setConnectingChatId(employeeChatId);
    
    console.log('🔍 Starting new chat with chat IDs:', {
      employee: employeeChatId,
      currentUser: currentUserChatId
    });
    
    // Check if conversation already exists locally
    const existingConv = conversations.find(conv => 
      conv.type === 'direct' && 
      conv.participants.includes(employeeChatId) && 
      conv.participants.includes(currentUserChatId)
    );

    if (existingConv) {
      console.log('✅ Found existing conversation, setting as active:', existingConv.room_id);
      setActiveConversation(existingConv);
      setGlobalActiveConversation(existingConv);
      markConversationAsRead(existingConv.id);
      
      // Connect to WebSocket room and load messages if room_id exists
      if (existingConv.room_id) {
        const { enhancedChatAPI } = await import('../chatapi');
        console.log('🔗 Connecting to existing WebSocket room:', existingConv.room_id);
        enhancedChatAPI.connectToRoom(existingConv.room_id);
        
        // Load messages for existing room
        try {
          console.log('📜 Loading messages for existing room:', existingConv.room_id);
          const messagesResponse = await enhancedChatAPI.getRoomMessages(existingConv.room_id);
          
          if (messagesResponse.status === 'success' && Array.isArray(messagesResponse.data)) {
            console.log(`📜 Loaded ${messagesResponse.data.length} messages for existing conversation`);
            
            const formattedMessages = messagesResponse.data.map(msg => ({
              id: msg.message_id,
              senderId: msg.sender?.employee_id || msg.sender_id,
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

            // Set messages using the setMessages function from the parent context
            if (setMessages) {
              setMessages(prev => ({
                ...prev,
                [existingConv.id]: formattedMessages
              }));
            }
          }
        } catch (error) {
          console.error('❌ Error loading messages for existing room:', error);
        }
      }
      
      // Clear loading state for existing conversation
      setIsConnectingToChat(false);
      setConnectingChatId(null);
    } else {
      console.log('🆕 Creating new conversation and room immediately');
      
      // Create the conversation locally first
      const newConv = createConversation([currentUserChatId, employeeChatId], 'direct');
      
      // Immediately create the room and connect
      try {
        const { enhancedChatAPI } = await import('../chatapi');
        console.log('🏠 Creating room immediately for new conversation with:', employeeChatId);
        
        const roomResponse = await enhancedChatAPI.createRoomAndConnect(String(employeeChatId));
        
        if (roomResponse && roomResponse.room_id) {
          console.log('✅ Room created immediately:', roomResponse.room_id);
          
          // Update the conversation with room_id
          newConv.room_id = roomResponse.room_id;
          
          // Update conversations in the context
          if (setConversations) {
            setConversations(prev => prev.map(conv => 
              conv.id === newConv.id 
                ? { ...conv, room_id: roomResponse.room_id }
                : conv
            ));
          }
          
          // Load messages for the newly created room
          try {
            console.log('📜 Loading messages for newly created room:', roomResponse.room_id);
            const messagesResponse = await enhancedChatAPI.getRoomMessages(roomResponse.room_id);
            
            if (messagesResponse.status === 'success' && Array.isArray(messagesResponse.data)) {
              console.log(`📜 Loaded ${messagesResponse.data.length} messages for new room`);
              
              const formattedMessages = messagesResponse.data.map(msg => ({
                id: msg.message_id,
                senderId: msg.sender?.employee_id || msg.sender_id,
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

              // Set messages for the conversation
              if (setMessages) {
                setMessages(prev => ({
                  ...prev,
                  [newConv.id]: formattedMessages
                }));
              }
            } else {
              // Initialize empty messages array if no messages found
              if (setMessages) {
                setMessages(prev => ({
                  ...prev,
                  [newConv.id]: []
                }));
              }
            }
          } catch (error) {
            console.error('❌ Error loading messages for new room:', error);
            // Initialize empty messages array on error
            if (setMessages) {
              setMessages(prev => ({
                ...prev,
                [newConv.id]: []
              }));
            }
          }
          
          console.log('🔗 WebSocket connected to new room:', roomResponse.room_id);
        } else {
          console.error('❌ Failed to create room immediately');
        }
      } catch (error) {
        console.error('❌ Error creating room immediately:', error);
      }
      
      setActiveConversation(newConv);
      setGlobalActiveConversation(newConv);
    }
    
    setShowUserList(false);
    setSearchQuery('');
    
    // Clear loading state
    setIsConnectingToChat(false);
    setConnectingChatId(null);
  };

  // Handle showing chat info
  const handleShowInfo = () => {
    setShowChatInfo(true);
  };

  // Handle starting chat from user profile
  const handleStartChatFromProfile = (user) => {
    handleStartNewChat(user);
  };

  // Handle selecting an existing conversation from the list
  const handleSelectConversation = async (conversation) => {
    console.log('🔍 Selecting conversation:', conversation.id, 'Room ID:', conversation.room_id);
    
    // Set loading state for existing conversations too
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => p !== (currentUser.employeeId || currentUser.id));
      if (otherParticipant) {
        setIsConnectingToChat(true);
        setConnectingChatId(otherParticipant);
      }
    }
    
    setActiveConversation(conversation);
    setGlobalActiveConversation(conversation);
    markConversationAsRead(conversation.id);
    
    // If conversation has room_id, connect and load messages
    if (conversation.room_id) {
      try {
        const { enhancedChatAPI } = await import('../chatapi');
        console.log('🔗 Connecting to WebSocket room:', conversation.room_id);
        enhancedChatAPI.connectToRoom(conversation.room_id);
        
        // Load messages for the conversation
        console.log('📜 Loading messages for room:', conversation.room_id);
        const messagesResponse = await enhancedChatAPI.getRoomMessages(conversation.room_id);
        
        if (messagesResponse.status === 'success' && Array.isArray(messagesResponse.data)) {
          console.log(`📜 Loaded ${messagesResponse.data.length} messages for conversation`);
          
          const formattedMessages = messagesResponse.data.map(msg => {
            const message = {
              id: msg.message_id,
              senderId: msg.sender?.employee_id || msg.sender_id,
              text: msg.content,
              timestamp: new Date(msg.created_at),
              read: true,
              status: 'delivered',
              type: msg.type || 'text'
            };

            // Parse reply data properly
            if (msg.reply_to_message) {
              message.replyTo = {
                id: msg.reply_to_message.message_id,
                text: msg.reply_to_message.content,
                senderId: msg.reply_to_message.sender?.employee_id,
                senderName: msg.reply_to_message.sender?.employee_name || 'Unknown User',
                timestamp: new Date(msg.reply_to_message.created_at)
              };
              console.log('🔍 [NAV] Parsed reply in NavigationHandlers:', {
                messageId: message.id,
                content: message.text,
                replyTo: message.replyTo
              });
            }

            return message;
          });

          // Set messages for the conversation
          if (setMessages) {
            setMessages(prev => ({
              ...prev,
              [conversation.id]: formattedMessages
            }));
          }
          
          console.log('✅ Messages loaded and WebSocket connected for conversation');
        } else {
          console.log('⚠️ No messages found for conversation');
          // Initialize empty messages array
          if (setMessages) {
            setMessages(prev => ({
              ...prev,
              [conversation.id]: []
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error connecting to conversation room or loading messages:', error);
        // Initialize empty messages array on error
        if (setMessages) {
          setMessages(prev => ({
            ...prev,
            [conversation.id]: []
          }));
        }
        
        // Clear loading state on error
        setIsConnectingToChat(false);
        setConnectingChatId(null);
      }
    } else {
      console.log('⚠️ Conversation has no room_id, initializing empty messages');
      // Initialize empty messages array for conversations without room_id
      if (setMessages) {
        setMessages(prev => ({
          ...prev,
          [conversation.id]: []
        }));
      }
    }
    
    // Clear loading state
    setIsConnectingToChat(false);
    setConnectingChatId(null);
  };

  // Handle attachment selection
  const handleAttachmentSelect = (type) => {
    setShowAttachmentMenu(false);
    
    switch (type) {
      case 'photos-videos':
        // Trigger file input for photos and videos
        const photoInput = document.createElement('input');
        photoInput.type = 'file';
        photoInput.accept = 'image/*,video/*';
        photoInput.multiple = true;
        photoInput.onchange = (e) => {
          const files = Array.from(e.target.files);
   
          // TODO: Handle file upload
        };
        photoInput.click();
        break;
        
      case 'camera':
        // Trigger camera capture
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment';
        cameraInput.onchange = (e) => {
          const files = Array.from(e.target.files);
   
          // TODO: Handle camera capture
        };
        cameraInput.click();
        break;
        
      case 'document':
        // Trigger file input for documents
        const docInput = document.createElement('input');
        docInput.type = 'file';
        docInput.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
        docInput.multiple = true;
        docInput.onchange = (e) => {
          const files = Array.from(e.target.files);
     
          // TODO: Handle document upload
        };
        docInput.click();
        break;
        
      case 'poll':
        // Open poll creation modal
     
        if (setShowPollModal) {
          setShowPollModal(true);
        }
        break;
        
      default:
        console.log('Unknown attachment type:', type);
    }
  };

  return {
    handleStartNewChat,
    handleShowInfo,
    handleStartChatFromProfile,
    handleAttachmentSelect,
    handleSelectConversation
  };
};
