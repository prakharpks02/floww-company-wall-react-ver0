export const useChatPollAndGroupHandlers = ({
  createGroup,
  setActiveConversation,
  setGlobalActiveConversation,
  setShowCreateGroup,
  setShowPollModal,
  setMessages,
  setConversations,
  activeConversation,
  currentUser
}) => {

  // Handle creating a group
  const handleCreateGroup = (name, description, participants, createdBy) => {
    const newGroup = createGroup(name, description, participants, createdBy);
    setActiveConversation(newGroup);
    setGlobalActiveConversation(newGroup);
    setShowCreateGroup(false);
  };

  // Handle creating a poll
  const handleCreatePoll = (pollData) => {
    if (!activeConversation) return;
    
    const pollMessage = {
      id: Date.now(),
      type: 'poll',
      senderId: currentUser.id,
      timestamp: new Date(),
      read: true,
      poll: {
        ...pollData,
        id: `poll_${Date.now()}`,
        createdAt: new Date(),
        votes: pollData.options.reduce((acc, _, index) => {
          acc[index] = [];
          return acc;
        }, {})
      }
    };

    // Add message directly to state instead of using sendMessage
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), pollMessage]
    }));

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { ...conv, lastMessage: { text: 'Poll created', timestamp: new Date() } }
        : conv
    ));
    
    setShowPollModal(false);
  };

  // Handle poll voting
  const handlePollVote = (messageId, optionIndexes) => {
    if (!activeConversation || !messageId) return;
    
    setMessages(prevMessages => ({
      ...prevMessages,
      [activeConversation.id]: prevMessages[activeConversation.id].map(message => {
        if (message.id === messageId && message.type === 'poll') {
          const updatedVotes = { ...message.poll.votes };
          
          // Remove user's previous votes
          Object.keys(updatedVotes).forEach(optionIndex => {
            updatedVotes[optionIndex] = updatedVotes[optionIndex].filter(
              userId => userId !== currentUser.id
            );
          });
          
          // Add new votes
          optionIndexes.forEach(optionIndex => {
            if (!updatedVotes[optionIndex]) {
              updatedVotes[optionIndex] = [];
            }
            updatedVotes[optionIndex].push(currentUser.id);
          });
          
          return {
            ...message,
            poll: {
              ...message.poll,
              votes: updatedVotes
            }
          };
        }
        return message;
      })
    }));
  };

  // Handle updating group information
  const handleUpdateGroup = (groupId, updates) => {
    // Group update logic would go here
    console.log('Update group:', groupId, updates);
  };

  // Handle leaving a group
  const handleLeaveGroup = (groupId) => {
    // Leave group logic would go here
    console.log('Leave group:', groupId);
    setActiveConversation(null);
  };

  // Handle removing a member from group
  const handleRemoveMember = (groupId, memberId) => {
    // Remove member logic would go here
    console.log('Remove member:', groupId, memberId);
  };

  return {
    handleCreateGroup,
    handleCreatePoll,
    handlePollVote,
    handleUpdateGroup,
    handleLeaveGroup,
    handleRemoveMember
  };
};
