export const useChatPinAndFavoriteHandlers = ({
  setPinnedMessages,
  setPinnedChats,
  setFavouriteChats,
  favouriteChats,
  setShowPinModal,
  setMessageToPinOrChat,
  setPinType,
  setChatContextMenu,
  activeConversation
}) => {

  // Handle pin confirmation with duration
  const handlePinConfirm = (duration, messageToPinOrChat, pinType) => {
    if (!messageToPinOrChat || !messageToPinOrChat.id) {
      return;
    }
    
    // Force the type to be 'chat' if we're pinning a conversation object
    const actualPinType = messageToPinOrChat?.participants || messageToPinOrChat?.type ? 'chat' : pinType;
    
    const pinExpiry = new Date();
    switch (duration) {
      case '1hour':
        pinExpiry.setHours(pinExpiry.getHours() + 1);
        break;
      case '24hours':
        pinExpiry.setHours(pinExpiry.getHours() + 24);
        break;
      case '7days':
        pinExpiry.setDate(pinExpiry.getDate() + 7);
        break;
      case 'forever':
        pinExpiry = null;
        break;
      default:
        pinExpiry.setHours(pinExpiry.getHours() + 1);
    }

    if (actualPinType === 'message' && messageToPinOrChat && activeConversation) {
      setPinnedMessages(prev => ({
        ...prev,
        [activeConversation.id]: {
          message: messageToPinOrChat,
          expiry: pinExpiry
        }
      }));
    } else if (actualPinType === 'chat') {
      setPinnedChats(prev => {
        const chatToPin = {
          ...messageToPinOrChat,
          expiry: pinExpiry
        };
        
        // Check if already pinned
        const existingIndex = prev.findIndex(chat => chat.id === messageToPinOrChat.id);
        if (existingIndex !== -1) {
          // Update existing pin
          const updated = [...prev];
          updated[existingIndex] = chatToPin;
          return updated;
        } else {
          // Add new pin
          return [...prev, chatToPin];
        }
      });
    }

    // Clean up state
    setShowPinModal(false);
    setMessageToPinOrChat(null);
    setPinType('message');
  };

  // Handle unpinning items
  const handleUnpin = (type, id) => {
    if (type === 'message') {
      setPinnedMessages(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } else if (type === 'chat') {
      setPinnedChats(prev => prev.filter(chat => chat.id !== id));
    }
  };

  // Handle unpin message shortcut
  const handleUnpinMessage = (conversationId) => {
    handleUnpin('message', conversationId);
  };

  // Handle unpin chat shortcut
  const handleUnpinChat = (conversationId) => {
    handleUnpin('chat', conversationId);
  };

  // Handle adding to favorites
  const handleAddToFavourites = (conversation) => {
    if (!conversation || !conversation.id) {
      return;
    }

    // Check if already in favourites
    const isAlreadyFavourite = favouriteChats.find(fav => fav.id === conversation.id);
    if (isAlreadyFavourite) {
      return;
    }

    setFavouriteChats(prev => [...prev, conversation]);
    setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
  };

  // Handle removing from favorites
  const handleRemoveFromFavourites = (conversationId) => {
    setFavouriteChats(prev => prev.filter(chat => chat.id !== conversationId));
    setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
  };

  // Handle toggle favorite (for header button)
  const handleToggleFavorite = (conversationId) => {
    const isCurrentlyFavorite = favouriteChats.find(fav => fav.id === conversationId);
    
    if (isCurrentlyFavorite) {
      handleRemoveFromFavourites(conversationId);
    } else {
      // Find the conversation to add to favorites
      if (activeConversation && activeConversation.id === conversationId) {
        handleAddToFavourites(activeConversation);
      }
    }
  };

  return {
    handlePinConfirm,
    handleUnpin,
    handleUnpinMessage,
    handleUnpinChat,
    handleAddToFavourites,
    handleRemoveFromFavourites,
    handleToggleFavorite
  };
};
