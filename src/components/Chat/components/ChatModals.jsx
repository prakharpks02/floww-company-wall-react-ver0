import React from 'react';
import CreateGroupModal from '../CreateGroupModal';
import PollCreationModal from '../PollCreationModal';
import ForwardModal from '../ForwardModal';
import PinModal from '../PinModal';

const ChatModals = ({
  // Create Group Modal
  showCreateGroup,
  setShowCreateGroup,
  onCreateGroup,
  currentUserId,
  
  // Poll Creation Modal
  showPollModal,
  setShowPollModal,
  onCreatePoll,
  isCompactMode = false,
  
  // Forward Modal
  showForwardModal,
  setShowForwardModal,
  onForwardMessage,
  conversations,
  activeConversation,
  messageToForward,
  
  // Pin Modal (for chats)
  showPinModal,
  setShowPinModal,
  onPinConfirm,
  pinType,
  messageToPinOrChat,
  
  // Pin Message Modal
  showPinMessageModal,
  setShowPinMessageModal,
  onPinMessageWithDuration,
  messageToPin
}) => {
  return (
    <>
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={onCreateGroup}
        currentUserId={currentUserId}
      />

      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreatePoll={onCreatePoll}
        isCompactMode={isCompactMode}
      />

      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={onForwardMessage}
        conversations={conversations.filter(conv => conv.id !== activeConversation?.id)}
        currentUserId={currentUserId}
        message={messageToForward}
      />

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onPin={onPinConfirm}
        type={pinType}
        item={messageToPinOrChat}
      />

      <PinModal
        isOpen={showPinMessageModal}
        onClose={() => setShowPinMessageModal(false)}
        onPin={onPinMessageWithDuration}
        type="message"
        item={messageToPin}
      />
    </>
  );
};

export default ChatModals;
