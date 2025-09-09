export const useChatContextMenuHandlers = ({
  setContextMenu,
  setChatContextMenu,
  setMessageToPinOrChat,
  setPinType,
  setShowPinModal,
  handleReply,
  handleForward
}) => {

  // Handle context menu for messages
  const handleContextMenu = (e, message) => {
    e.preventDefault();

    
    // Calculate position to ensure menu stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 150;
    const menuHeight = 200;
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Adjust position if would go off screen
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    const menuState = {
      show: true,
      x: x,
      y: y,
      message: message
    };
    
    console.log('🔥 Setting context menu state:', menuState);
    setContextMenu(menuState);
  };

  // Handle context menu for chat conversations
  const handleChatContextMenu = (e, conversation) => {
    e.preventDefault();
    
    if (!conversation || !conversation.id) {
      return;
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 150;
    const menuHeight = 80;
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }
    
    setChatContextMenu({
      show: true,
      x: x,
      y: y,
      conversation: conversation
    });
  };

  // Handle context menu reply action
  const handleContextMenuReply = (contextMenu) => {
    if (!contextMenu || !contextMenu.message) return;
    handleReply(contextMenu.message);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  // Handle context menu forward action
  const handleContextMenuForward = (contextMenu) => {
    if (!contextMenu || !contextMenu.message) return;
    handleForward(contextMenu.message);
  };

  // Handle pin message from context menu
  const handlePin = (message) => {
    setMessageToPinOrChat(message);
    setPinType('message');
    setShowPinModal(true);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  };

  // Handle pin chat from context menu
  const handlePinChat = (conversation) => {
    if (!conversation || !conversation.id) {
      return;
    }
    
    // Close context menu first
    setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
    
    // Set the data and show modal
    setMessageToPinOrChat(conversation);
    setPinType('chat');
    
    // Use a small delay to ensure state updates are processed
    setTimeout(() => {
      setShowPinModal(true);
    }, 50);
  };

  return {
    handleContextMenu,
    handleChatContextMenu,
    handleContextMenuReply,
    handleContextMenuForward,
    handlePin,
    handlePinChat
  };
};
