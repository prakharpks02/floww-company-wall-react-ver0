import { useEffect } from 'react';

export const useChatEffects = ({
  chatContextMenu,
  showMobilePlusMenu,
  showCompactPlusMenu,
  showCompactKebabMenu,
  contextMenu,
  mobilePlusMenuRef,
  compactPlusMenuRef,
  compactKebabMenuRef,
  contextMenuRef,
  setShowMobilePlusMenu,
  setShowCompactPlusMenu,
  setShowCompactKebabMenu,
  setContextMenu,
  setChatContextMenu,
  activeConversation,
  messages,
  messagesEndRef,
  setPinnedMessages,
  setPinnedChats
}) => {
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Skip if the target is within the pin chat button (including text/icons)
      const pinChatButton = event.target.closest('[data-pin-chat="true"]');
      if (pinChatButton) {
        return;
      }
      
      if (mobilePlusMenuRef.current && !mobilePlusMenuRef.current.contains(event.target)) {
        setShowMobilePlusMenu(false);
      }
      if (compactPlusMenuRef.current && !compactPlusMenuRef.current.contains(event.target)) {
        setShowCompactPlusMenu(false);
      }
      if (compactKebabMenuRef.current && !compactKebabMenuRef.current.contains(event.target)) {
        setShowCompactKebabMenu(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ show: false, x: 0, y: 0, message: null });
      }
      
      // Close chat context menu when clicking outside
      const chatContextMenuElement = event.target.closest('.chat-context-menu');
      if (!chatContextMenuElement) {
        setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
      }
    };

    // Custom event listener for closing context menu
    const handleCloseContextMenu = () => {
      setContextMenu({ show: false, x: 0, y: 0, message: null });
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('closeContextMenu', handleCloseContextMenu);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('closeContextMenu', handleCloseContextMenu);
    };
  }, [
    chatContextMenu.show,
    showMobilePlusMenu,
    showCompactPlusMenu,
    showCompactKebabMenu,
    contextMenu.show,
    mobilePlusMenuRef,
    compactPlusMenuRef,
    compactKebabMenuRef,
    contextMenuRef,
    setShowMobilePlusMenu,
    setShowCompactPlusMenu,
    setShowCompactKebabMenu,
    setContextMenu,
    setChatContextMenu
  ]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    if (activeConversation && messages[activeConversation.id]) {
      scrollToBottom();
    }
  }, [messages, activeConversation, messagesEndRef]);

  // Clean up expired pinned items
  useEffect(() => {
    const cleanupExpiredPins = () => {
      const now = new Date();
      
      // Clean up expired pinned messages
      setPinnedMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(conversationId => {
          if (updated[conversationId]?.expiry && new Date(updated[conversationId].expiry) <= now) {
            delete updated[conversationId];
          }
        });
        return updated;
      });
      
      // Clean up expired pinned chats
      setPinnedChats(prev => 
        prev.filter(chat => !chat.expiry || new Date(chat.expiry) > now)
      );
    };
    
    // Run cleanup every minute
    const interval = setInterval(cleanupExpiredPins, 60000);
    
    // Run cleanup on mount
    cleanupExpiredPins();
    
    return () => clearInterval(interval);
  }, [setPinnedMessages, setPinnedChats]);
};
