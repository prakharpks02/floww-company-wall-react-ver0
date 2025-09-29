import { useState, useRef } from 'react';

export const useChatState = () => {
  // Conversation and UI state
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Menu states
  const [showMobilePlusMenu, setShowMobilePlusMenu] = useState(false);
  const [showCompactPlusMenu, setShowCompactPlusMenu] = useState(false);
  const [showCompactKebabMenu, setShowCompactKebabMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  
  // Message interaction states
  const [newMessage, setNewMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, message: null });
  const [chatContextMenu, setChatContextMenu] = useState({ show: false, x: 0, y: 0, conversation: null });
  
  // Pin and favorite states
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinMessageModal, setShowPinMessageModal] = useState(false);
  const [messageToPinOrChat, setMessageToPinOrChat] = useState(null);
  const [messageToPin, setMessageToPin] = useState(null);
  const [pinType, setPinType] = useState('message'); // 'message' or 'chat'
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [pinnedChats, setPinnedChats] = useState([]);
  const [favouriteChats, setFavouriteChats] = useState([]);
  
  // Filter states
  const [chatFilter, setChatFilter] = useState('all'); // 'all', 'direct', 'groups'
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [showFavouritesFilter, setShowFavouritesFilter] = useState(false);
  
  // Refs
  const mobilePlusMenuRef = useRef(null);
  const compactPlusMenuRef = useRef(null);
  const compactKebabMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const contextMenuRef = useRef(null);

  return {
    // Conversation and UI state
    activeConversation,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    showUserList,
    setShowUserList,
    showCreateGroup,
    setShowCreateGroup,
    showChatInfo,
    setShowChatInfo,
    selectedUserId,
    setSelectedUserId,
    
    // Menu states
    showMobilePlusMenu,
    setShowMobilePlusMenu,
    showCompactPlusMenu,
    setShowCompactPlusMenu,
    showCompactKebabMenu,
    setShowCompactKebabMenu,
    showAttachmentMenu,
    setShowAttachmentMenu,
    showPollModal,
    setShowPollModal,
    
    // Message interaction states
    newMessage,
    setNewMessage,
    replyToMessage,
    setReplyToMessage,
    showForwardModal,
    setShowForwardModal,
    messageToForward,
    setMessageToForward,
    editingMessage,
    setEditingMessage,
    editMessageText,
    setEditMessageText,
    
    // Context menu states
    contextMenu,
    setContextMenu,
    chatContextMenu,
    setChatContextMenu,
    
    // Pin and favorite states
    showPinModal,
    setShowPinModal,
    showPinMessageModal,
    setShowPinMessageModal,
    messageToPinOrChat,
    setMessageToPinOrChat,
    messageToPin,
    setMessageToPin,
    pinType,
    setPinType,
    pinnedMessages,
    setPinnedMessages,
    pinnedChats,
    setPinnedChats,
    favouriteChats,
    setFavouriteChats,
    
    // Filter states
    chatFilter,
    setChatFilter,
    showGroupFilter,
    setShowGroupFilter,
    showFavouritesFilter,
    setShowFavouritesFilter,
    
    // Refs
    mobilePlusMenuRef,
    compactPlusMenuRef,
    compactKebabMenuRef,
    messagesEndRef,
    contextMenuRef
  };
};
