import React from 'react';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Users, 
  Star, 
  Pin, 
  Phone, 
  Video, 
  Info, 
  Minimize2, 
  Maximize2,
  X, 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Check, 
  Edit2, 
  Reply, 
  Forward,
  MoreVertical
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useChat } from '../../contexts/ChatContext';
import ChatSidebar from './ChatSidebar';
import ChatInfo from './ChatInfo';
import AttachmentMenu from './AttachmentMenu';
import PollMessage from './PollMessage';

// Import refactored components
import {
  // Mobile components
  MobileChatHeader,
  MobileSearchFilters,
  MobileConversationList,
  MobileContextMenu,
  MobileSearchResults,
  // Desktop components
  DesktopSidebar,
  DesktopChatHeader,
  DesktopContextMenu,
  DesktopAppSidebar,
  // Compact components
  CompactHeader,
  // Shared components
  PinnedMessageDisplay,
  ReplyIndicator,
  MessageInput,
  EmptyStateDisplay,
  ChatModals
} from './components';

// Import custom hooks
import {
  useChatState,
  useChatEffects,
  useChatUtilities,
  useChatMessageHandlers,
  useChatContextMenuHandlers,
  useChatPinAndFavoriteHandlers,
  useChatPollAndGroupHandlers,
  useChatNavigationHandlers,
  useChatWebSocketMessages
} from './hooks';

const ChatApp = ({ isMinimized, onToggleMinimize, onClose, isIntegratedMode = false }) => {
  // Use custom hooks for state management
  const chatState = useChatState();
  
  const {
    conversations,
    messages,
    isCompactMode,
    isFullScreenMobile,
    setActiveConversation: setGlobalActiveConversation,
    sendMessage,
    createConversation,
    createGroup,
    markConversationAsRead,
    toggleCompactMode,
    toggleFullScreenMobile,
    closeChat,
    setConversations,
    setMessages,
    updateConversation,
    loadConversations,
    conversationsLoading
  } = useChat();
  
  // Use utilities hook
  const {
    currentUser,
    getFilteredEmployees,
    getMessageSearchResults,
    getFilteredConversations,
    getConversationPartner,
    getStatusColor,
    canEditMessage,
    getEmployeeById,
    formatMessageTime,
    getDateHeader,
    groupMessagesByDate
  } = useChatUtilities();

  // Use effects hook
  useChatEffects({
    chatContextMenu: chatState.chatContextMenu,
    showMobilePlusMenu: chatState.showMobilePlusMenu,
    showCompactPlusMenu: chatState.showCompactPlusMenu,
    showCompactKebabMenu: chatState.showCompactKebabMenu,
    contextMenu: chatState.contextMenu,
    mobilePlusMenuRef: chatState.mobilePlusMenuRef,
    compactPlusMenuRef: chatState.compactPlusMenuRef,
    compactKebabMenuRef: chatState.compactKebabMenuRef,
    contextMenuRef: chatState.contextMenuRef,
    setShowMobilePlusMenu: chatState.setShowMobilePlusMenu,
    setShowCompactPlusMenu: chatState.setShowCompactPlusMenu,
    setShowCompactKebabMenu: chatState.setShowCompactKebabMenu,
    setContextMenu: chatState.setContextMenu,
    setChatContextMenu: chatState.setChatContextMenu,
    activeConversation: chatState.activeConversation,
    messages,
    messagesEndRef: chatState.messagesEndRef,
    setPinnedMessages: chatState.setPinnedMessages,
    setPinnedChats: chatState.setPinnedChats
  });

  // Use message handlers hook
  const messageHandlers = useChatMessageHandlers({
    activeConversation: chatState.activeConversation,
    setActiveConversation: chatState.setActiveConversation,
    setGlobalActiveConversation,
    markConversationAsRead,
    setMessages,
    setConversations,
    newMessage: chatState.newMessage,
    setNewMessage: chatState.setNewMessage,
    replyToMessage: chatState.replyToMessage,
    setReplyToMessage: chatState.setReplyToMessage,
    editingMessage: chatState.editingMessage,
    setEditingMessage: chatState.setEditingMessage,
    editMessageText: chatState.editMessageText,
    setEditMessageText: chatState.setEditMessageText,
    setMessageToForward: chatState.setMessageToForward,
    setShowForwardModal: chatState.setShowForwardModal,
    setContextMenu: chatState.setContextMenu,
    setPinnedMessages: chatState.setPinnedMessages,
    setMessageToPin: chatState.setMessageToPin,
    setShowPinMessageModal: chatState.setShowPinMessageModal,
    currentUser,
    messages
  });

  // Use context menu handlers hook
  const contextMenuHandlers = useChatContextMenuHandlers({
    setContextMenu: chatState.setContextMenu,
    setChatContextMenu: chatState.setChatContextMenu,
    setMessageToPinOrChat: chatState.setMessageToPinOrChat,
    setPinType: chatState.setPinType,
    setShowPinModal: chatState.setShowPinModal,
    handleReply: messageHandlers.handleReply,
    handleForward: messageHandlers.handleForward
  });

  // Use pin and favorite handlers hook
  const pinAndFavoriteHandlers = useChatPinAndFavoriteHandlers({
    setPinnedMessages: chatState.setPinnedMessages,
    setPinnedChats: chatState.setPinnedChats,
    setFavouriteChats: chatState.setFavouriteChats,
    favouriteChats: chatState.favouriteChats,
    setShowPinModal: chatState.setShowPinModal,
    setMessageToPinOrChat: chatState.setMessageToPinOrChat,
    setPinType: chatState.setPinType,
    setChatContextMenu: chatState.setChatContextMenu,
    activeConversation: chatState.activeConversation
  });

  // Use poll and group handlers hook
  const pollAndGroupHandlers = useChatPollAndGroupHandlers({
    createGroup,
    updateConversation,
    setActiveConversation: chatState.setActiveConversation,
    setGlobalActiveConversation,
    setShowCreateGroup: chatState.setShowCreateGroup,
    setShowPollModal: chatState.setShowPollModal,
    setMessages,
    setConversations,
    activeConversation: chatState.activeConversation,
    currentUser
  });

  // Use navigation handlers hook
  const navigationHandlers = useChatNavigationHandlers({
    conversations,
    createConversation,
    setActiveConversation: chatState.setActiveConversation,
    setGlobalActiveConversation,
    markConversationAsRead,
    setShowUserList: chatState.setShowUserList,
    setSearchQuery: chatState.setSearchQuery,
    setShowChatInfo: chatState.setShowChatInfo,
    setShowAttachmentMenu: chatState.setShowAttachmentMenu,
    setShowPollModal: chatState.setShowPollModal,
    setMessages,
    setConversations,
    currentUser,
    setIsConnectingToChat: chatState.setIsConnectingToChat,
    setConnectingChatId: chatState.setConnectingChatId
  });

  // Use WebSocket messages hook for real-time messaging
  const { isConnected, loadingInitialMessages } = useChatWebSocketMessages({
    activeConversation: chatState.activeConversation,
    setMessages,
    currentUser,
    getEmployeeById,
    messages
  });

  // Destructure state variables for easier access in JSX
  const {
    activeConversation,
    searchQuery,
    showUserList,
    showCreateGroup,
    showChatInfo,
    showAttachmentMenu,
    showPollModal,
    showForwardModal,
    messageToForward,
    contextMenu,
    chatContextMenu,
    showPinModal,
    messageToPinOrChat,
    pinType,
    showPinMessageModal,
    messageToPin,
    pinnedMessages,
    pinnedChats,
    favouriteChats,
    showGroupFilter,
    showFavouritesFilter,
    showMobilePlusMenu,
    showCompactPlusMenu,
    showCompactKebabMenu,
    chatFilter,
    newMessage,
    editingMessage,
    editMessageText,
    replyToMessage,
    compactPlusMenuRef,
    mobilePlusMenuRef,
    compactKebabMenuRef,
    messagesEndRef,
    contextMenuRef,
    setSearchQuery,
    setShowUserList,
    setShowCreateGroup,
    setShowChatInfo,
    setShowAttachmentMenu,
    setShowPollModal,
    setShowForwardModal,
    setShowPinModal,
    setShowPinMessageModal,
    setShowGroupFilter,
    setShowFavouritesFilter,
    setShowCompactPlusMenu,
    setShowMobilePlusMenu,
    setShowCompactKebabMenu,
    setContextMenu,
    setChatContextMenu,
    setActiveConversation,
    setNewMessage,
    setReplyToMessage,
    setEditingMessage,
    setEditMessageText,
    setMessageToForward,
    setMessageToPinOrChat,
    setPinType,
    setPinnedMessages,
    setPinnedChats,
    setFavouriteChats
  } = chatState;

  // Filter employees for search
  const filteredEmployees = getFilteredEmployees(searchQuery);

  // Global search: search both conversations and messages
  const messageSearchResults = getMessageSearchResults(searchQuery, conversations, messages);

  const filteredConversations = getFilteredConversations(
    conversations,
    messages,
    searchQuery,
    showFavouritesFilter,
    showGroupFilter,
    chatFilter,
    favouriteChats,
    pinnedChats
  );

  // Wrapper functions to handle pin confirmations
  const handlePinConfirm = (duration) => {
    pinAndFavoriteHandlers.handlePinConfirm(duration, messageToPinOrChat, pinType);
  };

  // Handler to start chat with a group member
  const handleStartChatWithMember = (member) => {
    console.log('💬 Starting chat with member:', member);
    
    // Close the chat info modal
    setShowChatInfo(false);
    
    // Check if a direct conversation already exists with this member
    const currentUserChatId = currentUser.employeeId || currentUser.id;
    const memberChatId = member.employeeId || member.id;
    
    const existingConv = conversations.find(conv => 
      conv.type === 'direct' && 
      conv.participants.includes(memberChatId) && 
      conv.participants.includes(currentUserChatId)
    );
    
    if (existingConv) {
      console.log('✅ Found existing conversation:', existingConv);
      navigationHandlers.handleSelectConversation(existingConv);
    } else {
      console.log('🆕 Creating new conversation with member');
      navigationHandlers.handleStartNewChat(member);
    }
  };

  // Check if we're on mobile/small screen with proper state management
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Minimized state - hide on mobile entirely, show floating button only on desktop
  if (isMinimized) {
    // On mobile, don't show any floating button (chat is in navigation)
    if (isMobile) {
      return null;
    }
    
    // On desktop, show floating button
    return (
      <div className="fixed bottom-24 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="relative p-4 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#8b5cf6] text-white rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.4)] hover:shadow-[0_20px_80px_rgba(109,40,217,0.5)] transition-all duration-300 hover:scale-110 backdrop-blur-xl"
        >
          <MessageCircle className="h-6 w-6" />
          {conversations.reduce((total, conv) => total + conv.unreadCount, 0) > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#86efac] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-[0_8px_32px_rgba(134,239,172,0.4)] animate-pulse">
              {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Full-screen mobile view
  if (isFullScreenMobile && isMobile) {
    return (
      <>
        {/* Toast Notifications */}
        <Toaster />
        
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Mobile Chat Header */}
          <MobileChatHeader
            activeConversation={activeConversation}
            currentUser={currentUser}
            onClose={onClose}
            onBack={() => chatState.setActiveConversation(null)}
            getConversationPartner={getConversationPartner}
            getStatusColor={getStatusColor}
            pinAndFavoriteHandlers={pinAndFavoriteHandlers}
            setShowChatInfo={setShowChatInfo}
            showMobilePlusMenu={chatState.showMobilePlusMenu}
            setShowMobilePlusMenu={chatState.setShowMobilePlusMenu}
            mobilePlusMenuRef={chatState.mobilePlusMenuRef}
            setSearchQuery={setSearchQuery}
            setShowCreateGroup={setShowCreateGroup}
          />

          {/* Mobile Chat Content */}
          {!activeConversation ? (
            <div className="flex-1 flex flex-col bg-gray-50">
              {/* Search and Filters */}
              <MobileSearchFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showGroupFilter={showGroupFilter}
                setShowGroupFilter={setShowGroupFilter}
                showFavouritesFilter={showFavouritesFilter}
                setShowFavouritesFilter={setShowFavouritesFilter}
              />

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {searchQuery === 'contacts' ? (
                  <MobileSearchResults
                    searchQuery={searchQuery}
                    filteredEmployees={filteredEmployees}
                    messageSearchResults={messageSearchResults}
                    navigationHandlers={navigationHandlers}
                    messageHandlers={messageHandlers}
                    getStatusColor={getStatusColor}
                    formatMessageTime={formatMessageTime}
                    currentUser={currentUser}
                    conversations={conversations}
                    isConnectingToChat={chatState.isConnectingToChat}
                    connectingChatId={chatState.connectingChatId}
                    setSearchQuery={setSearchQuery}
                  />
                ) : (
                  <MobileConversationList
                    filteredConversations={filteredConversations}
                    pinnedChats={pinnedChats}
                    favouriteChats={favouriteChats}
                    currentUser={currentUser}
                    getConversationPartner={getConversationPartner}
                    formatMessageTime={formatMessageTime}
                    getStatusColor={getStatusColor}
                    messageHandlers={messageHandlers}
                    navigationHandlers={navigationHandlers}
                    contextMenuHandlers={contextMenuHandlers}
                    setSearchQuery={setSearchQuery}
                    conversationsLoading={conversationsLoading}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Check if showing chat info */}
              {!showChatInfo ? (
                <>
                  {/* Pinned Message */}
                  <PinnedMessageDisplay
                    pinnedMessage={activeConversation && pinnedMessages[activeConversation.id]}
                    onUnpin={() => pinAndFavoriteHandlers.handleUnpin('message', activeConversation.id)}
                    isDesktop={false}
                  />

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {chatState.isConnectingToChat ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Connecting to chat...</p>
                        </div>
                      </div>
                    ) : (
                      groupMessagesByDate(messages[activeConversation.id] || []).map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-4">
                          {/* Date Header */}
                          <div className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {group.date}
                            </div>
                          </div>
                          
                          {/* Messages for this date */}
                          {group.messages.map(message => {
                            const currentUserEmployeeId = currentUser?.employeeId || `emp-${currentUser?.id}`;
                            // More comprehensive sender ID comparison
                            const isOwnMessage = 
                              message.senderId === currentUser.id || 
                              message.senderId === currentUserEmployeeId ||
                              message.senderId === currentUser?.employeeId ||
                              String(message.senderId) === String(currentUser.id) ||
                              String(message.senderId) === String(currentUserEmployeeId);
                            
                            // Debug logging
                            console.log('🔍 [MOBILE] Message alignment check:', {
                              messageId: message.id,
                              messageSenderId: message.senderId,
                              currentUserId: currentUser.id,
                              currentUserEmployeeId: currentUserEmployeeId,
                              isOwnMessage: isOwnMessage
                            });
                            
                            // Debug logging for reply messages
                            if (message.replyTo) {
                              console.log('🎯 [MOBILE] Rendering message with reply:', {
                                messageId: message.id,
                                content: message.text,
                                replyTo: message.replyTo
                              });
                            }
                            
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                {/* Profile picture for group chats (left side for others' messages) */}
                                {!isOwnMessage && activeConversation.type === 'group' && (
                                  <div 
                                    className="flex-shrink-0 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      const senderEmployee = getEmployeeById(message.senderId);
                                      if (senderEmployee) {
                                        handleStartChatWithMember(senderEmployee);
                                      }
                                    }}
                                    title="Click to start chat"
                                  >
                                    {(() => {
                                      const senderEmployee = getEmployeeById(message.senderId);
                                      const profilePic = message.sender?.profile_picture_link || 
                                                       message.sender?.avatar || 
                                                       senderEmployee?.profile_picture_link ||
                                                       senderEmployee?.avatar;
                                      
                                     
                                      
                                      return profilePic && profilePic.startsWith('http') ? (
                                        <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden">
                                          <img 
                                            src={profilePic} 
                                            alt={message.sender?.name || senderEmployee?.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                          {(message.sender?.name || senderEmployee?.name || 'U').charAt(0)}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                                
                                <div className={`max-w-[280px] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                  {!isOwnMessage && activeConversation.type === 'group' && (
                                    <div 
                                      className="text-xs text-purple-600 mb-1 ml-3 font-medium cursor-pointer hover:underline"
                                      onClick={() => {
                                        const senderEmployee = getEmployeeById(message.senderId);
                                        if (senderEmployee) {
                                          handleStartChatWithMember(senderEmployee);
                                        }
                                      }}
                                      title="Click to start chat"
                                    >
                                      {message.sender?.name || getEmployeeById(message.senderId)?.name || 'Unknown User'}
                                    </div>
                                  )}
                                  <div
                              className={`px-4 py-3 rounded-2xl transition-all duration-200 ${
                                isOwnMessage
                                  ? `bg-gradient-to-br from-purple-500 to-purple-600 text-white ${isOwnMessage ? 'rounded-br-lg' : ''}`
                                  : `bg-gray-100 text-gray-900 border border-gray-200 ${!isOwnMessage ? 'rounded-bl-lg' : ''}`
                              }`}
                              onContextMenu={(e) => contextMenuHandlers.handleContextMenu(e, message)}
                            >
                              {/* Reply indicator */}
                              {message.replyTo && (
                                <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                                  isOwnMessage 
                                    ? 'bg-white/20 border-white/40' 
                                    : 'bg-purple-50 border-purple-300'
                                }`}>
                                  <div className={`text-xs mb-1 ${
                                    isOwnMessage ? 'text-white/90' : 'text-purple-700'
                                  }`}>
                                    {message.replyTo.senderName}
                                  </div>
                                  <div className={`text-sm ${
                                    isOwnMessage ? 'text-white/80' : 'text-gray-600'
                                  }`}>
                                    {message.replyTo.text}
                                  </div>
                                </div>
                              )}
                              
                              {message.type === 'poll' ? (
                                <PollMessage
                                  poll={message.poll}
                                  currentUserId={currentUser.id}
                                  onVote={(optionIndexes) => pollAndGroupHandlers.handlePollVote(message.id, optionIndexes)}
                                  isOwnMessage={isOwnMessage}
                                  isCompact={false}
                                />
                              ) : (
                                <p className="leading-relaxed">{message.text}</p>
                              )}
                              
                              <div className={`text-xs mt-2 ${isOwnMessage ? 'text-purple-100' : 'text-gray-500'}`}>
                                {formatMessageTime(message.timestamp)}
                                {message.edited && (
                                  <span className="ml-1 italic opacity-75">edited</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white relative">
                    {/* Reply Indicator */}
                    <ReplyIndicator
                      replyToMessage={replyToMessage}
                      getEmployeeById={getEmployeeById}
                      onCancel={messageHandlers.handleCancelReply}
                      isDesktop={false}
                    />
                    
                    {/* Message Input */}
                    <MessageInput
                      newMessage={newMessage}
                      setNewMessage={chatState.setNewMessage}
                      editingMessage={editingMessage}
                      editMessageText={editMessageText}
                      setEditMessageText={chatState.setEditMessageText}
                      onSendMessage={messageHandlers.handleSendMessage}
                      onSaveEdit={messageHandlers.handleSaveEdit}
                      onCancelEdit={messageHandlers.handleCancelEdit}
                      onKeyPress={messageHandlers.handleKeyPress}
                      onShowAttachment={() => setShowAttachmentMenu(true)}
                      isDesktop={false}
                    />
                    
                    <AttachmentMenu
                      isOpen={showAttachmentMenu}
                      onClose={() => setShowAttachmentMenu(false)}
                      onSelect={navigationHandlers.handleAttachmentSelect}
                      isGroup={activeConversation?.type === 'group'}
                      isCompact={false}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto bg-gray-50">
                  <ChatInfo
                    isOpen={true}
                    onClose={() => setShowChatInfo(false)}
                    conversation={activeConversation}
                    currentUserId={currentUser.id}
                    onUpdateGroup={pollAndGroupHandlers.handleUpdateGroup}
                    onLeaveGroup={pollAndGroupHandlers.handleLeaveGroup}
                    onRemoveMember={pollAndGroupHandlers.handleRemoveMember}
                    onReloadConversations={loadConversations}
                    onStartChatWithMember={handleStartChatWithMember}
                    isCompact={false}
                    isInline={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Modals */}
        <ChatModals
          showCreateGroup={showCreateGroup}
          setShowCreateGroup={setShowCreateGroup}
          onCreateGroup={pollAndGroupHandlers.handleCreateGroup}
          currentUserId={currentUser.id}
          showPollModal={showPollModal}
          setShowPollModal={setShowPollModal}
          onCreatePoll={pollAndGroupHandlers.handleCreatePoll}
          isCompactMode={true}
          showForwardModal={showForwardModal}
          setShowForwardModal={setShowForwardModal}
          onForwardMessage={messageHandlers.handleForwardMessage}
          conversations={conversations}
          activeConversation={activeConversation}
          messageToForward={messageToForward}
          showPinModal={showPinModal}
          setShowPinModal={setShowPinModal}
          onPinConfirm={handlePinConfirm}
          pinType={pinType}
          messageToPinOrChat={messageToPinOrChat}
          showPinMessageModal={showPinMessageModal}
          setShowPinMessageModal={setShowPinMessageModal}
          onPinMessageWithDuration={messageHandlers.handlePinMessageWithDuration}
          messageToPin={messageToPin}
        />

        {/* Mobile Modals and Context Menus */}
        <MobileContextMenu
          contextMenu={contextMenu}
          chatContextMenu={chatContextMenu}
          setContextMenu={setContextMenu}
          setChatContextMenu={setChatContextMenu}
          pinnedChats={pinnedChats}
          favouriteChats={favouriteChats}
          canEditMessage={canEditMessage}
          messageHandlers={messageHandlers}
          contextMenuHandlers={contextMenuHandlers}
          pinAndFavoriteHandlers={pinAndFavoriteHandlers}
        />
      </>
    );
  }

  // Compact mode - small popup chat
  if ((isCompactMode || (isMobile && !isFullScreenMobile)) && !isIntegratedMode) {
    return (
      <>
        {/* Toast Notifications */}
        <Toaster />
        
        <div 
          className="fixed bottom-4 right-4 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col transform transition-all duration-500 ease-out animate-slideUp chat-window-glass overflow-hidden"
          style={{
            height: 'min(500px, calc(100vh - 32px))',
            maxWidth: 'calc(100vw - 32px)'
          }}
        >
          
          {/* Compact Header */}
          <CompactHeader
            activeConversation={activeConversation}
            currentUser={currentUser}
            isMinimized={false}
            onToggleMinimize={toggleCompactMode}
            onClose={onClose}
            onBack={() => chatState.setActiveConversation(null)}
            getConversationPartner={getConversationPartner}
            getStatusColor={getStatusColor}
            onShowInfo={navigationHandlers.handleShowInfo}
            showCompactPlusMenu={chatState.showCompactPlusMenu}
            setShowCompactPlusMenu={setShowCompactPlusMenu}
            compactPlusMenuRef={compactPlusMenuRef}
            onNewChat={() => {
              setSearchQuery('contacts');
              setShowCompactPlusMenu(false);
            }}
            onCreateGroup={() => {
              setShowCreateGroup(true);
              setShowCompactPlusMenu(false);
            }}
            showCompactKebabMenu={showCompactKebabMenu}
            setShowCompactKebabMenu={setShowCompactKebabMenu}
            compactKebabMenuRef={compactKebabMenuRef}
            pinnedChats={pinnedChats}
            favouriteChats={favouriteChats}
            pinAndFavoriteHandlers={pinAndFavoriteHandlers}
            contextMenuHandlers={contextMenuHandlers}
          />

          {/* Compact Chat Content */}
          {showChatInfo ? (
            // Show Group Info inline
            <ChatInfo
              isOpen={true}
              onClose={() => setShowChatInfo(false)}
              conversation={activeConversation}
              currentUserId={currentUser.id}
              onUpdateGroup={pollAndGroupHandlers.handleUpdateGroup}
              onLeaveGroup={pollAndGroupHandlers.handleLeaveGroup}
              onRemoveMember={pollAndGroupHandlers.handleRemoveMember}
              onReloadConversations={loadConversations}
              onStartChatWithMember={handleStartChatWithMember}
              isCompact={true}
              isInline={false}
            />
          ) : !activeConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Search and Filters */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200"
                  />
                </div>
                
                {/* Filter buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowGroupFilter(!showGroupFilter)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      showGroupFilter 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Groups
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowFavouritesFilter(!showFavouritesFilter)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      showFavouritesFilter 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Favorites
                    </div>
                  </button>
                </div>
              </div>

              {/* Conversations List or Search Results */}
              <div 
                className="flex-1 overflow-y-auto" 
                style={{ 
                  height: 'calc(100% - 80px)',
                  minHeight: '200px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                {searchQuery ? (
                  <div className="p-2 space-y-1">
                    {/* Contacts Section */}
                    {filteredEmployees.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Contacts ({filteredEmployees.length})
                        </h4>
                        <div className="space-y-1">
                          {filteredEmployees.map(employee => {
                            const employeeChatId = employee.employeeId || employee.id;
                            const isConnecting = chatState.isConnectingToChat && chatState.connectingChatId === employeeChatId;
                            
                            return (
                              <button
                                key={employee.id}
                                onClick={() => {
                                  // Create or find conversation, then select it like clicking on conversation list
                                  const currentUserChatId = currentUser.employeeId || currentUser.id;
                                  
                                  // Check if conversation already exists
                                  const existingConv = conversations.find(conv => 
                                    conv.type === 'direct' && 
                                    conv.participants.includes(employeeChatId) && 
                                    conv.participants.includes(currentUserChatId)
                                  );
                                  
                                  if (existingConv) {
                                    // Use same logic as clicking on conversation list
                                    navigationHandlers.handleSelectConversation(existingConv);
                                  } else {
                                    // Create new conversation and select it
                                    navigationHandlers.handleStartNewChat(employee);
                                  }
                                  setSearchQuery(''); // Clear search after selection
                                }}
                                disabled={isConnecting}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                                  isConnecting 
                                    ? 'bg-purple-50 cursor-not-allowed' 
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                              <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                                  {employee.avatar}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(employee.status)} transition-all duration-200`}></div>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-sm truncate">{employee.name}</div>
                                <div className="text-xs text-gray-500 truncate">{employee.role}</div>
                              </div>
                              {isConnecting && (
                                <div className="w-4 h-4">
                                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                        </div>
                      </div>
                    )}

                    {/* Messages Section */}
                    {messageSearchResults.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                          <MessageCircle className="h-3 w-3" />
                          Messages ({messageSearchResults.length})
                        </h4>
                        <div className="space-y-1">
                          {messageSearchResults.map(result => (
                            <button
                              key={result.id}
                              onClick={() => {
                                navigationHandlers.handleSelectConversation(result.conversation);
                                setSearchQuery('');
                              }}
                              className="w-full p-2 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative flex-shrink-0">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                                    {result.partner?.avatar}
                                  </div>
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(result.partner?.status)} transition-all duration-200`}></div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm truncate">{result.partner?.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatMessageTime(result.timestamp)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-purple-600">
                                      {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 line-clamp-2">
                                    {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                                      part.toLowerCase() === searchQuery.toLowerCase() ? 
                                        <span key={index} className="bg-yellow-200 font-medium rounded px-1">{part}</span> : 
                                        part
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {filteredEmployees.length === 0 && messageSearchResults.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-sm text-gray-500 mb-1">No results found</h3>
                        <p className="text-xs text-gray-400">Try searching with different keywords</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2">
                    {/* Pinned Chats Section */}
                    {pinnedChats.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Pin className="h-3 w-3 text-purple-600" />
                          <h4 className="text-xs text-gray-500 uppercase tracking-wide">Pinned Chats</h4>
                        </div>
                        <div className="space-y-1">
                          {pinnedChats.map(pinnedChat => {
                            // Find the actual conversation object from the conversations array
                            const conversation = conversations.find(conv => conv.id === pinnedChat.id);
                            if (!conversation) return null; // Skip if conversation not found
                            
                            const partner = getConversationPartner(conversation, currentUser.id);
                            const isActive = activeConversation?.id === conversation.id;
                            
                            return (
                              <button
                                key={`pinned-${conversation.id}`}
                                onClick={() => navigationHandlers.handleSelectConversation(conversation)}
                                onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 bg-purple-50 border-l-2 border-purple-600 ${
                                  isActive 
                                    ? 'bg-purple-100 hover:bg-purple-200' 
                                    : 'hover:bg-purple-100'
                                }`}
                              >
                                <div className="relative">
                                  {conversation.icon ? (
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                                      <img 
                                        src={conversation.icon} 
                                        alt={conversation.name || partner?.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                                      {partner?.avatar}
                                    </div>
                                  )}
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(partner?.status)} transition-all duration-200`}></div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm font-normal flex items-center gap-1">
                                      <Pin className="h-3 w-3 text-purple-600" />
                                      {partner?.name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {conversation.lastMessage && (
                                        <div className="text-xs text-gray-500">
                                          {formatMessageTime(conversation.lastMessage.timestamp)}
                                        </div>
                                      )}
                                      {conversation.unreadCount > 0 && (
                                        <span className="bg-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                          {conversation.unreadCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {conversation.lastMessage?.text || 'No messages yet'}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Recent Chats</h4>
                    <div className="space-y-1">
                      {filteredConversations
                        .filter(conv => !pinnedChats.find(p => p.id === conv.id)) // Exclude pinned chats from regular list
                        .slice(0, 8).map(conversation => {
                        const partner = getConversationPartner(conversation, currentUser.id);
                        const isActive = activeConversation?.id === conversation.id;
                        const isFavorite = favouriteChats.find(f => f.id === conversation.id);
                        
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => navigationHandlers.handleSelectConversation(conversation)}
                            onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                              isActive 
                                ? 'bg-purple-100' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="relative">
                              {conversation.icon ? (
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                                  <img 
                                    src={conversation.icon} 
                                    alt={conversation.name || partner?.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                                  {partner?.avatar}
                                </div>
                              )}
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(partner?.status)} transition-all duration-200`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-normal truncate flex items-center gap-1 max-w-[140px]">
                                  {partner?.name}
                                  {isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                                </div>
                                {conversation.lastMessage && (
                                  <div className="text-xs text-gray-500">
                                    {formatMessageTime(conversation.lastMessage.timestamp)}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-600 truncate max-w-[200px]">
                                  {conversation.lastMessage?.text || 'No messages yet'}
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <div className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                    {conversation.unreadCount}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Pinned Message Display */}
              <PinnedMessageDisplay
                pinnedMessage={activeConversation && pinnedMessages[activeConversation.id]}
                onUnpin={() => pinAndFavoriteHandlers.handleUnpin('message', activeConversation.id)}
                isCompact={true}
              />
              
              {/* Messages Area */}
              <div 
                className="flex-1 overflow-y-auto p-2 space-y-2" 
                style={{ 
                  height: activeConversation && pinnedMessages[activeConversation.id] 
                    ? 'calc(100% - 140px)' // Account for header + pinned message + input area
                    : 'calc(100% - 100px)', // Account for header + input area
                  minHeight: '200px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                {groupMessagesByDate(messages[activeConversation.id] || []).map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    {/* Date Header */}
                    <div className="flex justify-center">
                      <div className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {group.date}
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    {group.messages.map(message => {
                      const currentUserEmployeeId = currentUser?.employeeId || `emp-${currentUser?.id}`;
                      // More comprehensive sender ID comparison
                      const isOwnMessage = 
                        message.senderId === currentUser.id || 
                        message.senderId === currentUserEmployeeId ||
                        message.senderId === currentUser?.employeeId ||
                        String(message.senderId) === String(currentUser.id) ||
                        String(message.senderId) === String(currentUserEmployeeId);
                  
                      
                   
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* Profile picture for group chats (left side for others' messages) */}
                          {!isOwnMessage && activeConversation.type === 'group' && (
                            <div 
                              className="flex-shrink-0 self-end mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                const senderEmployee = getEmployeeById(message.senderId);
                                if (senderEmployee) {
                                  handleStartChatWithMember(senderEmployee);
                                }
                              }}
                              title="Click to start chat"
                            >
                              {(() => {
                                const senderEmployee = getEmployeeById(message.senderId);
                                const profilePic = message.sender?.profile_picture_link || 
                                                 message.sender?.avatar || 
                                                 senderEmployee?.profile_picture_link ||
                                                 senderEmployee?.avatar;
                                
                               
                                return profilePic && profilePic.startsWith('http') ? (
                                  <div className="w-6 h-6 bg-gray-100 rounded-full overflow-hidden">
                                    <img 
                                      src={profilePic} 
                                      alt={message.sender?.name || senderEmployee?.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {(message.sender?.name || senderEmployee?.name || 'U').charAt(0)}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          
                          <div className={`flex flex-col max-w-[280px]`}>
                            {!isOwnMessage && activeConversation.type === 'group' && (
                              <div 
                                className="text-xs text-purple-600 mb-0.5 font-medium cursor-pointer hover:underline"
                                onClick={() => {
                                  const senderEmployee = getEmployeeById(message.senderId);
                                  if (senderEmployee) {
                                    handleStartChatWithMember(senderEmployee);
                                  }
                                }}
                                title="Click to start chat"
                              >
                                {message.sender?.name || getEmployeeById(message.senderId)?.name || 'Unknown User'}
                              </div>
                            )}
                            <div
                              className={`px-2 py-1.5 rounded-lg text-xs transition-all duration-200 hover:shadow-md ${
                                isOwnMessage
                                  ? `bg-gradient-to-br from-purple-500 to-purple-600 text-white ${isOwnMessage ? 'rounded-br-md' : ''}`
                                  : `bg-gray-100 text-gray-900 border border-gray-200 ${!isOwnMessage ? 'rounded-bl-md' : ''}`
                              }`}
                              onContextMenu={(e) => contextMenuHandlers.handleContextMenu(e, message)}
                            >
                              {/* Reply indicator */}
                              {message.replyTo && (
                                <div className={`mb-1 p-1 rounded border-l-2 ${
                                  isOwnMessage 
                                    ? 'bg-white/20 border-white/40' 
                                    : 'bg-purple-50 border-purple-300'
                                }`}>
                                  <div className={`text-xs mb-0.5 ${
                                    isOwnMessage ? 'text-white/90' : 'text-purple-700'
                                  }`}>
                                    {message.replyTo.senderName}
                                  </div>
                                  <div className={`text-xs ${
                                    isOwnMessage ? 'text-white/80' : 'text-gray-600'
                                  }`}>
                                    {message.replyTo.text}
                                  </div>
                                </div>
                              )}
                              
                              {message.type === 'poll' ? (
                                <PollMessage
                                  poll={message.poll}
                                  currentUserId={currentUser.id}
                                  onVote={(optionIndexes) => pollAndGroupHandlers.handlePollVote(message.id, optionIndexes)}
                                  isOwnMessage={isOwnMessage}
                                  isCompact={true}
                                />
                              ) : (
                                <p className="leading-relaxed">{message.text}</p>
                              )}
                              <div className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-100' : 'text-gray-500'}`}>
                                {formatMessageTime(message.timestamp)}
                                {message.edited && (
                                  <span className="ml-1 italic opacity-75">edited</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-3 border-t border-gray-200 bg-gray-50 relative" style={{ minHeight: '80px' }}>
                {/* Reply UI */}
                {replyToMessage && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-blue-700 mb-1">
                          Replying to {getEmployeeById(replyToMessage.senderId)?.name}
                        </div>
                        <div className="text-xs text-blue-600 truncate">
                          {replyToMessage.text}
                        </div>
                      </div>
                      <button
                        onClick={messageHandlers.handleCancelReply}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                      >
                        <X className="h-3 w-3 text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAttachmentMenu(true)}
                    className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                      value={editingMessage ? editMessageText : newMessage}
                      onChange={(e) => editingMessage ? chatState.setEditMessageText(e.target.value) : chatState.setNewMessage(e.target.value)}
                      onKeyPress={messageHandlers.handleKeyPress}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200"
                    />
                  </div>
                  
                  {editingMessage ? (
                    <div className="flex gap-1">
                      <button
                        onClick={messageHandlers.handleCancelEdit}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={messageHandlers.handleSaveEdit}
                        disabled={!editMessageText.trim()}
                        className="p-2 bg-green-500 text-white hover:bg-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={messageHandlers.handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <AttachmentMenu
                  isOpen={showAttachmentMenu}
                  onClose={() => setShowAttachmentMenu(false)}
                  onSelect={navigationHandlers.handleAttachmentSelect}
                  isGroup={activeConversation?.type === 'group'}
                  isCompact={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Compact Mode Modals */}
        <ChatModals
          showCreateGroup={showCreateGroup}
          setShowCreateGroup={setShowCreateGroup}
          onCreateGroup={pollAndGroupHandlers.handleCreateGroup}
          currentUserId={currentUser.id}
          showPollModal={showPollModal}
          setShowPollModal={setShowPollModal}
          onCreatePoll={pollAndGroupHandlers.handleCreatePoll}
          isCompactMode={true}
          showForwardModal={showForwardModal}
          setShowForwardModal={setShowForwardModal}
          onForwardMessage={messageHandlers.handleForwardMessage}
          conversations={conversations}
          activeConversation={activeConversation}
          messageToForward={messageToForward}
          showPinModal={showPinModal}
          setShowPinModal={setShowPinModal}
          onPinConfirm={handlePinConfirm}
          pinType={pinType}
          messageToPinOrChat={messageToPinOrChat}
          showPinMessageModal={showPinMessageModal}
          setShowPinMessageModal={setShowPinMessageModal}
          onPinMessageWithDuration={messageHandlers.handlePinMessageWithDuration}
          messageToPin={messageToPin}
        />

        {/* Compact Mode Context Menus */}
        <DesktopContextMenu
          contextMenu={contextMenu}
          chatContextMenu={chatContextMenu}
          pinnedChats={pinnedChats}
          favouriteChats={favouriteChats}
          canEditMessage={canEditMessage}
          messageHandlers={messageHandlers}
          contextMenuHandlers={contextMenuHandlers}
          pinAndFavoriteHandlers={pinAndFavoriteHandlers}
          contextMenuRef={contextMenuRef}
        />
      </>
    );
  }

  // Desktop expanded layout (popup or integrated)
  return (
    <>
      {/* Toast Notifications */}
      <Toaster />
      
      <div className={`bg-gradient-to-br from-[#f7f4ff] to-[#ede7f6] flex font-['Inter',sans-serif] overflow-hidden neo-glassmorphism ${
        isIntegratedMode ? 'h-full' : 'fixed bottom-4 right-4 w-[790px] h-[790px] max-w-[85vw] max-h-[85vh] z-40 rounded-3xl shadow-[0_25px_80px_rgba(109,40,217,0.25)] border border-white/40 backdrop-blur-xl animate-in zoom-in-95 duration-300'
      }`}>
        {/* Left App Sidebar */}
        <DesktopAppSidebar
          showGroupFilter={showGroupFilter}
          setShowGroupFilter={setShowGroupFilter}
          showFavouritesFilter={showFavouritesFilter}
          setShowFavouritesFilter={setShowFavouritesFilter}
        />
        
        {/* Main Chat Area */}
        <div className={`flex-1 flex h-full overflow-hidden ${isIntegratedMode ? '' : 'rounded-r-3xl'}`}>
          {/* Chat List Sidebar */}
          <div className="w-64 bg-white/50 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]">
            {/* Chat Header */}
            <div className="p-3 border-b border-white/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base text-[#1f2937]">Atom Link</h2>
                  <p className="text-xs text-[#6b7280]">Stay connected with your team</p>
                </div>
                <div className="relative" ref={compactPlusMenuRef}>
                  <button 
                    onClick={() => setShowCompactPlusMenu(!chatState.showCompactPlusMenu)}
                    className="p-2 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl shadow-[0_8px_32px_rgba(192,132,252,0.3)] hover:shadow-[0_12px_40px_rgba(192,132,252,0.4)] transition-all duration-300 hover:scale-105"
                    title="New chat options"
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                  
                  {chatState.showCompactPlusMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.2)] z-50 overflow-hidden">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSearchQuery('contacts');
                            setShowCompactPlusMenu(false);
                          }}
                          className="w-full text-left px-3 py-3 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center">
                            <Plus className="h-3 w-3 text-white" />
                          </div>
                          <span>New Chat</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateGroup(true);
                            setShowCompactPlusMenu(false);
                          }}
                          className="w-full text-left px-3 py-3 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-xl flex items-center justify-center">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                          <span>Create Group</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-[#6b7280]" />
                </div>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-sm text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300"
                />
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {/* Pinned Chats */}
              {pinnedChats.length > 0 && !searchQuery && (
                <div className="p-2 border-b border-white/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Pin className="h-3 w-3 text-[#86efac]" />
                    <h3 className="text-xs text-[#6b7280] uppercase tracking-wider">Pinned Chats</h3>
                  </div>
                  <div className="space-y-0.5">
                    {pinnedChats.map(pinnedChat => {
                      // Find the actual conversation object from the conversations array
                      const conversation = conversations.find(conv => conv.id === pinnedChat.id);
                      if (!conversation) return null; // Skip if conversation not found
                      
                      const partner = getConversationPartner(conversation, currentUser.id);
                      const isActive = activeConversation?.id === conversation.id;
                      
                      return (
                        <button
                          key={`pinned-${conversation.id}`}
                          onClick={() => navigationHandlers.handleSelectConversation(conversation)}
                          onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                          className={`w-full p-1.5 rounded-lg transition-all duration-200 ${
                            isActive 
                              ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white' 
                              : 'bg-white/70 backdrop-blur-sm border-l-4 border-[#86efac]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="relative">
                              {conversation.icon ? (
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={conversation.icon} 
                                    alt={conversation.name || partner?.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                  {partner?.avatar}
                                </div>
                              )}
                              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#86efac] rounded-full flex items-center justify-center">
                                <Pin className="h-1.5 w-1.5 text-white" />
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className={`text-xs font-normal ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                                  {partner?.name}
                                </p>
                                {conversation.lastMessage && (
                                  <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                    {formatMessageTime(conversation.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className={`text-[10px] truncate max-w-[80px] ${isActive ? 'text-white/90' : 'text-[#6b7280]'}`}>
                                  {conversation.lastMessage?.text || 'No messages yet'}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="ml-1 bg-[#86efac] text-white text-[10px] px-1 py-0.5 rounded-full font-medium">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* All Chats */}
              <div className="p-3">
                <h3 className="text-xs text-[#6b7280] uppercase tracking-wider mb-2">All Chats</h3>
                <div className="space-y-1">
                  {searchQuery ? (
                    <div className="space-y-4">
                      {/* Contacts Section */}
                      {filteredEmployees.length > 0 && (
                        <div>
                          <h4 className="text-xs text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Contacts ({filteredEmployees.length})
                          </h4>
                          <div className="space-y-1">
                            {filteredEmployees.map(employee => (
                              <button
                                key={employee.id}
                                onClick={() => {
                                  // Create or find conversation, then select it like clicking on conversation list
                                  const employeeChatId = employee.employeeId || employee.id;
                                  const currentUserChatId = currentUser.employeeId || currentUser.id;
                                  
                                  // Check if conversation already exists
                                  const existingConv = conversations.find(conv => 
                                    conv.type === 'direct' && 
                                    conv.participants.includes(employeeChatId) && 
                                    conv.participants.includes(currentUserChatId)
                                  );
                                  
                                  if (existingConv) {
                                    // Use same logic as clicking on conversation list
                                    navigationHandlers.handleSelectConversation(existingConv);
                                  } else {
                                    // Create new conversation and select it
                                    navigationHandlers.handleStartNewChat(employee);
                                  }
                                  setSearchQuery(''); // Clear search after selection
                                }}
                                className="w-full p-2 bg-white/70 backdrop-blur-sm rounded-lg hover:bg-white/80 hover:scale-[1.02] shadow-[inset_0_0_10px_rgba(255,255,255,0.8),0_4px_16px_rgba(109,40,217,0.1)] transition-all duration-300"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-[0_2px_8px_rgba(192,132,252,0.3)]">
                                      {employee.avatar}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${getStatusColor(employee.status)}`}></div>
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <p className="font-normal text-xs text-[#1f2937] truncate max-w-[100px]">{employee.name}</p>
                                    <p className="text-[10px] text-[#6b7280] truncate max-w-[100px]">{employee.role}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Messages Section */}
                      {messageSearchResults.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MessageCircle className="h-3 w-3" />
                            Messages ({messageSearchResults.length})
                          </h4>
                          <div className="space-y-1">
                            {messageSearchResults.map(result => (
                              <button
                                key={result.id}
                                onClick={() => {
                                  navigationHandlers.handleSelectConversation(result.conversation);
                                  setSearchQuery('');
                                }}
                                className="w-full p-2 bg-white/70 backdrop-blur-sm rounded-lg hover:bg-white/80 transition-all duration-200"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="relative flex-shrink-0">
                                    <div className="w-7 h-7 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                      {result.partner?.avatar}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white shadow-sm ${getStatusColor(result.partner?.status)}`}></div>
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <p className="font-normal text-xs text-[#1f2937] truncate max-w-[70px]">
                                        {result.partner?.name}
                                      </p>
                                      <span className="text-[10px] text-[#6b7280]">
                                        {formatMessageTime(result.timestamp)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-[10px] font-medium text-[#6d28d9]">
                                        {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-[#6b7280] line-clamp-2 max-w-[120px]">
                                      {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                                        part.toLowerCase() === searchQuery.toLowerCase() ? 
                                          <span key={index} className="bg-yellow-200 font-medium rounded px-0.5">{part}</span> : 
                                          part
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conversations Section */}
                      {filteredConversations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MessageCircle className="h-3 w-3" />
                            Conversations ({filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).length})
                          </h4>
                          <div className="space-y-1">
                            {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                              const partner = getConversationPartner(conversation, currentUser.id);
                              const isActive = activeConversation?.id === conversation.id;
                              
                              return (
                                <button
                                  key={conversation.id}
                                  onClick={() => navigationHandlers.handleSelectConversation(conversation)}
                                  onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                                  className={`w-full p-1.5 rounded-lg transition-all duration-200 ${
                                    isActive 
                                      ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white' 
                                      : 'bg-white/70 backdrop-blur-sm'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className="relative">
                                      {conversation.icon ? (
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                          <img 
                                            src={conversation.icon} 
                                            alt={conversation.name || partner?.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                          {partner?.avatar}
                                        </div>
                                      )}
                                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <p className={`font-normal text-xs ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                                          {partner?.name}
                                        </p>
                                        {conversation.lastMessage && (
                                          <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                            {formatMessageTime(conversation.lastMessage.timestamp)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <p className={`text-[10px] ${isActive ? 'text-white/90' : 'text-[#6b7280]'}`}>
                                          {conversation.lastMessage?.text || 'No messages yet'}
                                        </p>
                                        {conversation.unreadCount > 0 && (
                                          <span className="ml-1 bg-[#86efac] text-white text-[10px] px-1 py-0.5 rounded-full font-medium">
                                            {conversation.unreadCount}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* No Results */}
                      {filteredEmployees.length === 0 && messageSearchResults.length === 0 && filteredConversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Search className="h-12 w-12 text-[#6b7280]/30 mb-3" />
                          <h3 className="text-sm font-medium text-[#6b7280] mb-1">No results found</h3>
                          <p className="text-xs text-[#6b7280]/70">Try searching with different keywords</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                      const partner = getConversationPartner(conversation, currentUser.id);
                      const isActive = activeConversation?.id === conversation.id;
                      
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => navigationHandlers.handleSelectConversation(conversation)}
                          onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                          className={`w-full p-2 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white' 
                              : 'bg-white/70 backdrop-blur-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              {conversation.icon ? (
                                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={conversation.icon} 
                                    alt={conversation.name || partner?.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-9 h-9 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                  {partner?.avatar}
                                </div>
                              )}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className={`font-normal text-sm truncate ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                                  {partner?.name}
                                </p>
                                {conversation.lastMessage && (
                                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                    {formatMessageTime(conversation.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className={`text-xs truncate ${isActive ? 'text-white/90' : 'text-[#6b7280]'}`}>
                                  {conversation.lastMessage?.text || 'No messages yet'}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="ml-1 bg-[#86efac] text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Content */}
          {activeConversation ? (
            <div className={`flex-1 flex flex-col bg-white/30 backdrop-blur-xl overflow-hidden ${isIntegratedMode ? '' : 'rounded-r-3xl'}`}>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/30 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {activeConversation.icon ? (
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                          <img 
                            src={activeConversation.icon} 
                            alt={activeConversation.name || getConversationPartner(activeConversation, currentUser.id)?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                          {getConversationPartner(activeConversation, currentUser.id)?.avatar}
                        </div>
                      )}
                      {/* <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)}`}></div> */}
                    </div>
                    <div>
                      <h2 className="text-sm font-normal text-[#1f2937]">
                        {activeConversation.name || getConversationPartner(activeConversation, currentUser.id)?.name}
                      </h2>
                      <p className="text-sm text-[#6b7280] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(getConversationPartner(activeConversation, currentUser.id)?.status)}`}></span>
                        {getConversationPartner(activeConversation, currentUser.id)?.status === 'online' ? 'Active now' : 
                         getConversationPartner(activeConversation, currentUser.id)?.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105">
                      <Phone className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <button className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105">
                      <Video className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <button 
                      onClick={navigationHandlers.handleShowInfo}
                      className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
                    >
                      <Info className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <div className="w-px h-6 bg-white/30 mx-2"></div>
                    <button
                      onClick={toggleCompactMode}
                      className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
                      title="Switch to compact view"
                    >
                      <Minimize2 className="h-4 w-4 text-[#6d28d9]" />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 bg-red-100/80 backdrop-blur-sm hover:bg-red-200/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-105"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              {!showChatInfo ? (
                <>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ 
                    maxHeight: 'calc(100% - 140px)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}>
                    {/* Pinned Message */}
                    {activeConversation && pinnedMessages[activeConversation.id] && (
                      <div className="bg-gradient-to-r from-[#86efac]/20 to-[#4ade80]/20 backdrop-blur-sm border border-[#86efac]/30 p-4 rounded-2xl shadow-[inset_0_0_20px_rgba(134,239,172,0.2)]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Pin className="h-4 w-4 text-[#86efac]" />
                              <span className="text-sm font-semibold text-[#86efac]">Pinned Message</span>
                            </div>
                            <p className="text-[#1f2937]">
                              {pinnedMessages[activeConversation.id].message.text}
                            </p>
                          </div>
                          <button
                            onClick={() => pinAndFavoriteHandlers.handleUnpin('message', activeConversation.id)}
                            className="p-2 hover:bg-white/30 rounded-xl transition-colors"
                          >
                            <X className="h-4 w-4 text-[#6b7280]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {groupMessagesByDate(messages[activeConversation.id] || []).map((group, groupIndex) => (
                      <div key={groupIndex} className="space-y-2">
                        {/* Date Header */}
                        <div className="flex justify-center">
                          <div className="bg-white/60 backdrop-blur-sm text-[#6b7280] text-xs px-3 py-1 rounded-full border border-white/40">
                            {group.date}
                          </div>
                        </div>
                        
                        {/* Messages for this date */}
                        {group.messages.map(message => {
                          const currentUserEmployeeId = currentUser?.employeeId || `emp-${currentUser?.id}`;
                          // More comprehensive sender ID comparison
                          const isOwnMessage = 
                            message.senderId === currentUser.id || 
                            message.senderId === currentUserEmployeeId ||
                            message.senderId === currentUser?.employeeId ||
                            String(message.senderId) === String(currentUser.id) ||
                            String(message.senderId) === String(currentUserEmployeeId);
                          
                          // Debug logging
                          console.log('🔍 [DESKTOP] Message alignment check:', {
                            messageId: message.id,
                            messageSenderId: message.senderId,
                            currentUserId: currentUser.id,
                            currentUserEmployeeId: currentUserEmployeeId,
                            isOwnMessage: isOwnMessage
                          });
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              {/* Profile picture for group chats (left side for others' messages) */}
                              {!isOwnMessage && activeConversation.type === 'group' && (
                                <div 
                                  className="flex-shrink-0 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => {
                                    const senderEmployee = getEmployeeById(message.senderId);
                                    if (senderEmployee) {
                                      handleStartChatWithMember(senderEmployee);
                                    }
                                  }}
                                  title="Click to start chat"
                                >
                                  {(() => {
                                    const senderEmployee = getEmployeeById(message.senderId);
                                    const profilePic = message.sender?.profile_picture_link || 
                                                     message.sender?.avatar || 
                                                     senderEmployee?.profile_picture_link ||
                                                     senderEmployee?.avatar;
                                    
                                 
                                    
                                    return profilePic && profilePic.startsWith('http') ? (
                                      <div className="w-6 h-6 bg-gray-100 rounded-full overflow-hidden">
                                        <img 
                                          src={profilePic} 
                                          alt={message.sender?.name || senderEmployee?.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {(message.sender?.name || senderEmployee?.name || 'U').charAt(0)}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                              
                              <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                {!isOwnMessage && activeConversation.type === 'group' && (
                                  <div 
                                    className="text-xs text-[#6d28d9] mb-1 ml-2 font-medium cursor-pointer hover:underline"
                                    onClick={() => {
                                      const senderEmployee = getEmployeeById(message.senderId);
                                      if (senderEmployee) {
                                        handleStartChatWithMember(senderEmployee);
                                      }
                                    }}
                                    title="Click to start chat"
                                  >
                                    {message.sender?.name || getEmployeeById(message.senderId)?.name || 'Unknown User'}
                                  </div>
                                )}
                                <div
                              className={`relative group ${message.type === 'poll' ? 'p-2' : 'px-3 py-2'} rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                                isOwnMessage
                                  ? `bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] text-white shadow-[0_4px_16px_rgba(109,40,217,0.3)] ${isOwnMessage ? 'rounded-br-md' : ''}`
                                  : `bg-white/80 backdrop-blur-sm text-[#1f2937] border border-white/30 shadow-[inset_0_0_10px_rgba(255,255,255,0.8),0_4px_16px_rgba(109,40,217,0.1)] ${!isOwnMessage ? 'rounded-bl-md' : ''}`
                              }`}
                              onContextMenu={(e) => contextMenuHandlers.handleContextMenu(e, message)}
                            >
                              {/* Reply indicator */}
                              {message.replyTo && (
                                <div className={`mb-2 p-2 rounded-lg border-l-2 ${
                                  isOwnMessage 
                                    ? 'bg-white/20 border-white/40 backdrop-blur-sm' 
                                    : 'bg-[#6d28d9]/10 border-[#6d28d9]/30'
                                }`}>
                                  <div className={`text-[10px] font-medium mb-1 ${
                                    isOwnMessage ? 'text-white/90' : 'text-[#6d28d9]'
                                  }`}>
                                    {message.replyTo.senderName}
                                  </div>
                                  <div className={`text-xs ${
                                    isOwnMessage ? 'text-white/80' : 'text-[#6b7280]'
                                  }`}>
                                    {message.replyTo.text}
                                  </div>
                                </div>
                              )}
                              
                              {message.type === 'poll' ? (
                                <PollMessage
                                  poll={message.poll}
                                  currentUserId={currentUser.id}
                                  onVote={(optionIndexes) => pollAndGroupHandlers.handlePollVote(message.id, optionIndexes)}
                                  isOwnMessage={isOwnMessage}
                                  isCompact={false}
                                />
                              ) : (
                                <p className="text-sm leading-snug">{message.text}</p>
                              )}
                            </div>
                            <div className={`text-[10px] text-[#6b7280] mt-1 ${isOwnMessage ? 'text-right mr-2' : 'text-left ml-2'}`}>
                              {formatMessageTime(message.timestamp)}
                              {message.edited && (
                                <span className="ml-1 italic opacity-75">edited</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-2 border-t border-white/30 bg-white/50 backdrop-blur-sm">
                    {/* Reply UI */}
                    {replyToMessage && (
                      <div className="mb-2 bg-gradient-to-r from-[#c084fc]/20 to-[#d8b4fe]/20 backdrop-blur-sm border border-[#c084fc]/30 p-2 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-xs font-medium text-[#6d28d9] mb-1">
                              Replying to {getEmployeeById(replyToMessage.senderId)?.name}
                            </div>
                            <div className="text-xs text-[#6b7280] truncate">
                              {replyToMessage.text}
                            </div>
                          </div>
                          <button
                            onClick={messageHandlers.handleCancelReply}
                            className="p-2 hover:bg-white/30 rounded-xl transition-colors"
                          >
                            <X className="h-4 w-4 text-[#6b7280]" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAttachmentMenu(true)}
                        className="p-1.5 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-lg shadow-[inset_0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_2px_8px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-[#6d28d9]" />
                      </button>
                      
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                          value={editingMessage ? editMessageText : newMessage}
                          onChange={(e) => editingMessage ? chatState.setEditMessageText(e.target.value) : chatState.setNewMessage(e.target.value)}
                          onKeyPress={messageHandlers.handleKeyPress}
                          className="w-full px-2 py-1.5 bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-sm text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_10px_rgba(255,255,255,0.8)] focus:shadow-[inset_0_0_10px_rgba(255,255,255,0.9),0_2px_8px_rgba(109,40,217,0.2)] transition-all duration-300"
                        />
                      </div>
                      
                      {editingMessage ? (
                        <div className="flex gap-1">
                          <button
                            onClick={messageHandlers.handleCancelEdit}
                            className="p-2 bg-red-50/70 backdrop-blur-sm hover:bg-red-100/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                          <button
                            onClick={messageHandlers.handleSaveEdit}
                            disabled={!editMessageText.trim()}
                            className="p-2 bg-gradient-to-br from-[#86efac] to-[#4ade80] text-white rounded-xl shadow-[0_4px_16px_rgba(134,239,172,0.3)] hover:shadow-[0_6px_20px_rgba(134,239,172,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={messageHandlers.handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="p-2 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] text-white rounded-xl shadow-[0_4px_16px_rgba(109,40,217,0.3)] hover:shadow-[0_6px_20px_rgba(109,40,217,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <AttachmentMenu
                      isOpen={showAttachmentMenu}
                      onClose={() => setShowAttachmentMenu(false)}
                      onSelect={navigationHandlers.handleAttachmentSelect}
                      isGroup={activeConversation?.type === 'group'}
                      isCompact={false}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto bg-white/30">
                  <ChatInfo
                    isOpen={true}
                    onClose={() => setShowChatInfo(false)}
                    conversation={activeConversation}
                    currentUserId={currentUser.id}
                    onUpdateGroup={pollAndGroupHandlers.handleUpdateGroup}
                    onLeaveGroup={pollAndGroupHandlers.handleLeaveGroup}
                    onRemoveMember={pollAndGroupHandlers.handleRemoveMember}
                    onReloadConversations={loadConversations}
                    onStartChatWithMember={handleStartChatWithMember}
                    isCompact={false}
                    isInline={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-center bg-white/30 backdrop-blur-xl ${isIntegratedMode ? '' : 'rounded-r-3xl'}`}>
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_16px_64px_rgba(192,132,252,0.3)]">
                  <MessageCircle className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1f2937] mb-3">Select a conversation</h3>
                <p className="text-[#6b7280] max-w-md mx-auto">
                  Choose from your existing conversations or start a new one to begin chatting with your team
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop Modals */}
      <ChatModals
        showCreateGroup={showCreateGroup}
        setShowCreateGroup={setShowCreateGroup}
        onCreateGroup={pollAndGroupHandlers.handleCreateGroup}
        currentUserId={currentUser.id}
        showPollModal={showPollModal}
        setShowPollModal={setShowPollModal}
        onCreatePoll={pollAndGroupHandlers.handleCreatePoll}
        showForwardModal={showForwardModal}
        setShowForwardModal={setShowForwardModal}
        onForwardMessage={messageHandlers.handleForwardMessage}
        conversations={conversations}
        activeConversation={activeConversation}
        messageToForward={messageToForward}
        showPinModal={showPinModal}
        setShowPinModal={setShowPinModal}
        onPinConfirm={handlePinConfirm}
        pinType={pinType}
        messageToPinOrChat={messageToPinOrChat}
        showPinMessageModal={showPinMessageModal}
        setShowPinMessageModal={setShowPinMessageModal}
        onPinMessageWithDuration={messageHandlers.handlePinMessageWithDuration}
        messageToPin={messageToPin}
      />

      {/* Desktop Context Menus */}
      <DesktopContextMenu
        contextMenu={contextMenu}
        chatContextMenu={chatContextMenu}
        pinnedChats={pinnedChats}
        favouriteChats={favouriteChats}
        canEditMessage={canEditMessage}
        messageHandlers={messageHandlers}
        contextMenuHandlers={contextMenuHandlers}
        pinAndFavoriteHandlers={pinAndFavoriteHandlers}
        contextMenuRef={contextMenuRef}
      />
    </>
  );
};

export default ChatApp;
