import { getEmployeeById } from '../utils/dummyData';

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
  
  // Handle sending a new message
  const handleSendMessage = () => {
    // If editing a message, save the edit instead
    if (editingMessage) {
      handleSaveEdit();
      return;
    }
    
    if (!newMessage.trim() || !activeConversation) return;
    
    let messageData = {
      id: Date.now(),
      senderId: currentUser.id,
      text: newMessage.trim(),
      timestamp: new Date(),
      read: true
    };
    
    if (replyToMessage) {
      messageData.replyTo = replyToMessage;
      setReplyToMessage(null);
    }
    
    // Add message directly to state
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), messageData]
    }));

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { ...conv, lastMessage: { text: messageData.text, timestamp: new Date() } }
        : conv
    ));
    
    setNewMessage('');
  };

  // Handle key press in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    setGlobalActiveConversation(conversation);
    markConversationAsRead(conversation.id);
  };

  // Handle starting message edit
  const handleStartEdit = (message) => {
    setEditingMessage(message);
    setEditMessageText(message.text || '');
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  // Handle saving edited message
  const handleSaveEdit = () => {
    if (!editingMessage || !editMessageText.trim()) return;

    const updatedMessages = { ...messages };
    const conversationMessages = updatedMessages[activeConversation.id] || [];
    
    const messageIndex = conversationMessages.findIndex(msg => msg.id === editingMessage.id);
   
    if (messageIndex !== -1) {
      conversationMessages[messageIndex] = {
        ...conversationMessages[messageIndex],
        text: editMessageText.trim(),
        edited: true,
        editedAt: new Date()
      };
      
      setMessages(updatedMessages);
    }

    // Clear editing state
    setEditingMessage(null);
    setEditMessageText('');
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditMessageText('');
    setNewMessage('');
  };

  // Handle reply to message
  const handleReply = (message) => {
    if (!message) return;
    setReplyToMessage(message);
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // Handle forward message
  const handleForward = (message) => {
    if (!message) return;
    setMessageToForward(message);
    setShowForwardModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  // Handle pin message
  const handlePinMessage = (message) => {
    if (!message || !activeConversation) return;
    
    // Store the message to pin and show the pin duration modal
    setMessageToPin(message);
    setShowPinMessageModal(true);
    
    // Close context menu
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  // Handle pin message with duration (called from PinModal)
  const handlePinMessageWithDuration = (duration) => {
    if (!messageToPin || !activeConversation) return;
    
    // Calculate expiry based on duration
    let expiry = null;
    const now = Date.now();
    
    switch (duration) {
      case '24hours':
        expiry = now + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
        break;
      case '7days':
        expiry = now + (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
        break;
      case '30days':
        expiry = now + (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
        break;
      case 'forever':
      default:
        expiry = null; // Pin forever
        break;
    }
    
    // Create pinned message object
    const pinnedMessage = {
      id: `pinned-${messageToPin.id}-${Date.now()}`,
      message: messageToPin,
      pinnedBy: currentUser.id,
      pinnedAt: now,
      expiry: expiry
    };

    // Add to pinned messages for this conversation
    setPinnedMessages(prev => ({
      ...prev,
      [activeConversation.id]: pinnedMessage
    }));

    // Clear the message to pin
    setMessageToPin(null);
    setShowPinMessageModal(false);
  };

  // Handle forwarding message to selected conversations
  const handleForwardMessage = (selectedConversations) => {
    if (!messageToForward || !selectedConversations.length) return;

    selectedConversations.forEach(convId => {
      const forwardedMessage = {
        id: Date.now() + Math.random(),
        senderId: currentUser.id,
        text: messageToForward.text,
        timestamp: new Date(),
        read: true,
        forwarded: true,
        originalSender: getEmployeeById(messageToForward.senderId)?.name
      };

      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), forwardedMessage]
      }));

      setConversations(prev => prev.map(conv => 
        conv.id === convId 
          ? { ...conv, lastMessage: { text: 'Forwarded message', timestamp: new Date() } }
          : conv
      ));
    });

    setShowForwardModal(false);
    setMessageToForward(null);
  };

  return {
    handleSendMessage,
    handleKeyPress,
    handleSelectConversation,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleReply,
    handleCancelReply,
    handleForward,
    handleForwardMessage,
    handlePinMessage,
    handlePinMessageWithDuration,
    // Add the setter functions for direct access
    setReplyToMessage,
    setMessageToForward,
    setShowForwardModal,
    setEditingMessage,
    setNewMessage
  };
};
