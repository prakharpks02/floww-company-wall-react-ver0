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
  currentUser
}) => {

  // Handle starting a new chat with an employee
  const handleStartNewChat = (employee) => {
    // Use employeeId for chat system compatibility, fallback to id
    const employeeChatId = employee.employeeId || employee.id;
    const currentUserChatId = currentUser.employeeId || currentUser.id;
    
    console.log('🔍 Starting new chat with chat IDs:', {
      employee: employeeChatId,
      currentUser: currentUserChatId
    });
    
    const existingConv = conversations.find(conv => 
      conv.type === 'direct' && 
      conv.participants.includes(employeeChatId) && 
      conv.participants.includes(currentUserChatId)
    );

    if (existingConv) {
      setActiveConversation(existingConv);
      setGlobalActiveConversation(existingConv);
      markConversationAsRead(existingConv.id);
    } else {
      const newConv = createConversation([currentUserChatId, employeeChatId], 'direct');
      setActiveConversation(newConv);
      setGlobalActiveConversation(newConv);
    }
    
    setShowUserList(false);
    setSearchQuery('');
  };

  // Handle showing chat info
  const handleShowInfo = () => {
    setShowChatInfo(true);
  };

  // Handle starting chat from user profile
  const handleStartChatFromProfile = (user) => {
    handleStartNewChat(user);
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
    handleAttachmentSelect
  };
};
