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
  setConnectingChatId,
  mediaHandlers, // New parameter for media upload handlers
}) => {
  // Handle starting a new chat with an employee
  const handleStartNewChat = async (employee) => {
    // Use employeeId for chat system compatibility, fallback to id
    const employeeChatId =
      employee.employeeId || employee.id || employee.employee_id;
    const currentUserChatId = currentUser.employeeId || currentUser.id;

    if (!employeeChatId) {
      console.error(
        "[NavigationHandler] No employee ID found in employee object:",
        employee
      );
      return;
    }

    // Set loading state
    setIsConnectingToChat(true);
    setConnectingChatId(employeeChatId);

    // Check if conversation already exists locally
    const existingConv = conversations.find(
      (conv) =>
        conv.type === "direct" &&
        conv.participants.includes(employeeChatId) &&
        conv.participants.includes(currentUserChatId)
    );

    if (existingConv) {
      setActiveConversation(existingConv);
      setGlobalActiveConversation(existingConv);
      markConversationAsRead(existingConv.id);

      // WebSocket connect karna hai
      if (existingConv.room_id) {
        const { enhancedChatAPI } = await import("../chatapi");

        // Pehle purana disconnect karo
        enhancedChatAPI.disconnectFromRoom();

        // Naya connect karo
        await enhancedChatAPI.connectToRoom(existingConv.room_id);

        // Load messages for existing room
        try {
          const messagesResponse = await enhancedChatAPI.getRoomMessages(
            existingConv.room_id
          );

          if (
            messagesResponse.status === "success" &&
            Array.isArray(messagesResponse.data)
          ) {
            const formattedMessages = messagesResponse.data.map((msg) => {
              // 🔥 Fix: Override server's wrong admin sender_id
              let senderId = msg.sender?.employee_id || msg.sender_id;
              if (
                senderId === "2Zt363ClFSPBz1NW" &&
                msg.sender?.employee_name === "Admin"
              ) {
                senderId = "N/A"; // Use correct admin ID
              }

              return {
                id: msg.message_id,
                senderId: senderId,
                sender: msg.sender, // 🔑 Preserve full sender object with profile_picture_link
                text: msg.content,
                timestamp: new Date(msg.created_at),
                read: true,
                status: "delivered",
                type: msg.type || "text",
                file_urls: msg.file_urls || [], // 🔥 CRITICAL: Include file_urls!
                isForwarded: msg.is_forwarded || false, // 🔁 Include forwarded flag
                ...(msg.reply_to_message_id && {
                  replyTo: {
                    id: msg.reply_to_message_id,
                    text: msg.reply_content || "Original message",
                    senderName: msg.reply_sender_name || "Unknown",
                  },
                }),
              };
            });

            // Set messages using the setMessages function from the parent context
            if (setMessages) {
              setMessages((prev) => ({
                ...prev,
                [existingConv.id]: formattedMessages,
              }));
            }
          }
        } catch (error) {}
      }

      // Clear loading state for existing conversation
      setIsConnectingToChat(false);
      setConnectingChatId(null);
    } else {
      // Don't create local conversation yet - check server first
      try {
        const { enhancedChatAPI } = await import("../chatapi");

        // First, query server rooms to see if a room already exists for these participants
        try {
          const roomsResp = await enhancedChatAPI.listAllRooms();
          if (
            roomsResp &&
            roomsResp.status === "success" &&
            Array.isArray(roomsResp.data)
          ) {
            const serverExisting = roomsResp.data.find((r) => {
              const ids = (r.participants || []).map(
                (p) => p.employee_id || p.employeeId || p.id
              );
              return (
                ids.includes(String(employeeChatId)) &&
                ids.includes(String(currentUserChatId)) &&
                !r.is_group
              );
            });

            if (serverExisting && serverExisting.room_id) {
              // If conversation exists on server but not locally, create or reuse local conv
              const existingConv = conversations.find(
                (conv) => conv.room_id === serverExisting.room_id
              );
              if (existingConv) {
                setActiveConversation(existingConv);
                setGlobalActiveConversation(existingConv);
                markConversationAsRead(existingConv.id);
              } else {
                // Create a local conversation entry and then load messages
                const newConv = createConversation(
                  [currentUserChatId, employeeChatId],
                  "direct",
                  null,
                  employee
                );
                const updatedConv = {
                  ...newConv,
                  room_id: serverExisting.room_id,
                  name: Array.isArray(serverExisting.room_name)
                    ? serverExisting.room_name[0]
                    : serverExisting.room_name ||
                      employee.name ||
                      employee.employee_name,
                  avatar:
                    (Array.isArray(serverExisting.room_icon)
                      ? serverExisting.room_icon[0]
                      : serverExisting.room_icon) ||
                    employee.profile_picture_link ||
                    newConv.avatar,
                };
                if (setConversations) {
                  setConversations((prev) =>
                    prev.map((conv) =>
                      conv.id === newConv.id ? updatedConv : conv
                    )
                  );
                }
                setActiveConversation(updatedConv);
                setGlobalActiveConversation(updatedConv);
                markConversationAsRead(updatedConv.id);

                // Load messages from serverExisting.room_id
                try {
                  await enhancedChatAPI.connectToRoom(serverExisting.room_id);
                  const messagesResponse =
                    await enhancedChatAPI.getRoomMessages(
                      serverExisting.room_id
                    );
                  if (
                    messagesResponse &&
                    messagesResponse.status === "success" &&
                    Array.isArray(messagesResponse.data)
                  ) {
                    const formatted = messagesResponse.data.map((msg) => ({
                      id: msg.message_id,
                      senderId: msg.sender?.employee_id || msg.sender_id,
                      sender: msg.sender,
                      text: msg.content,
                      timestamp: new Date(msg.created_at),
                      read: true,
                      status: "delivered",
                      type: msg.type || "text",
                      file_urls: msg.file_urls || [],
                    }));
                    if (setMessages)
                      setMessages((prev) => ({
                        ...prev,
                        [updatedConv.id]: formatted,
                      }));
                  }
                } catch (e) {}
              }

              // clear loader and return early
              setIsConnectingToChat(false);
              setConnectingChatId(null);
              setShowUserList(false);
              setSearchQuery("");
              return;
            }
          }
        } catch (e) {
          // ignore listAllRooms errors and continue to create
        }

        const roomResponse = await enhancedChatAPI.createRoomAndConnect(
          String(employeeChatId)
        );

        if (roomResponse && roomResponse.room_id) {
          // Check again if conversation was created by another process
          const existingConvAfterCreate = conversations.find(
            (conv) => conv.room_id === roomResponse.room_id
          );

          if (existingConvAfterCreate) {
            // Use existing conversation
            setActiveConversation(existingConvAfterCreate);
            setGlobalActiveConversation(existingConvAfterCreate);
            markConversationAsRead(existingConvAfterCreate.id);
            setIsConnectingToChat(false);
            setConnectingChatId(null);
            return;
          }

          // Now create the conversation locally with proper avatar handling
          const newConv = createConversation(
            [currentUserChatId, employeeChatId],
            "direct",
            null,
            employee // Pass employee data as 4th parameter
          );

          // Extract room_name and room_icon from API response (they're arrays)
          const roomName = Array.isArray(roomResponse.room_name)
            ? roomResponse.room_name[0]
            : roomResponse.room_name || employee.name || employee.employee_name;

          const roomIconUrl = Array.isArray(roomResponse.room_icon)
            ? roomResponse.room_icon[0]
            : roomResponse.room_icon;

          // Get profile picture URL - prioritize from API response, fallback to employee data
          const profilePicUrl =
            roomIconUrl ||
            employee.profile_picture_link ||
            employee.profilePictureLink;

          // Create the updated conversation object with all data
          const updatedConv = {
            ...newConv,
            room_id: roomResponse.room_id,
            name: roomName,
            // Use initials for avatar text
            avatar: roomName.substring(0, 2).toUpperCase(),
            // Store the actual profile picture URL
            profilePictureLink: profilePicUrl,
            // Also store in icon field for compatibility
            icon: profilePicUrl,
            employeeData: employee,
          };

          // Update conversations in the context with room_id and employee data
          if (setConversations) {
            setConversations((prev) => {
              const updated = prev.map((conv) =>
                conv.id === newConv.id ? updatedConv : conv
              );

              // Double-check no URLs in names
              const cleaned = updated.map((conv) => {
                if (
                  conv.name &&
                  (conv.name.startsWith("http://") ||
                    conv.name.startsWith("https://"))
                ) {
                  return { ...conv, name: "Chat" };
                }
                return conv;
              });

              return cleaned;
            });
          }

          // Load messages for the newly created room
          try {
            const messagesResponse = await enhancedChatAPI.getRoomMessages(
              roomResponse.room_id
            );

            if (
              messagesResponse.status === "success" &&
              Array.isArray(messagesResponse.data)
            ) {
              const formattedMessages = messagesResponse.data.map((msg) => ({
                id: msg.message_id,
                senderId: msg.sender?.employee_id || msg.sender_id,
                sender: msg.sender, // 🔑 Preserve full sender object with profile_picture_link
                text: msg.content,
                timestamp: new Date(msg.created_at),
                read: true,
                status: "delivered",
                type: msg.type || "text",
                file_urls: msg.file_urls || [], // 🔥 CRITICAL: Include file_urls!
                isForwarded: msg.is_forwarded || false, // 🔁 Include forwarded flag
                ...(msg.reply_to_message_id && {
                  replyTo: {
                    id: msg.reply_to_message_id,
                    text: msg.reply_content || "Original message",
                    senderName: msg.reply_sender_name || "Unknown",
                  },
                }),
              }));

              // Set messages for the conversation
              if (setMessages) {
                setMessages((prev) => ({
                  ...prev,
                  [newConv.id]: formattedMessages,
                }));
              }
            } else {
              // Initialize empty messages array if no messages found
              if (setMessages) {
                setMessages((prev) => ({
                  ...prev,
                  [newConv.id]: [],
                }));
              }
            }
          } catch (error) {
            // Initialize empty messages array on error
            if (setMessages) {
              setMessages((prev) => ({
                ...prev,
                [newConv.id]: [],
              }));
            }
          }

          // Set the updated conversation as active
          setActiveConversation(updatedConv);
          setGlobalActiveConversation(updatedConv);
        } else {
        }
      } catch (error) {}
    }

    setShowUserList(false);
    setSearchQuery("");

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
    // Set loading state for existing conversations too
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(
        (p) => p !== (currentUser.employeeId || currentUser.id)
      );
      if (otherParticipant) {
        setIsConnectingToChat(true);
        setConnectingChatId(otherParticipant);
      }
    }

    setActiveConversation(conversation);
    setGlobalActiveConversation(conversation);
    markConversationAsRead(conversation.id);

    // WebSocket connect karne ka logic
    if (conversation.room_id) {
      try {
        const { enhancedChatAPI } = await import("../chatapi");

        // Pehle purana disconnect karo
        enhancedChatAPI.disconnectFromRoom();

        // Naya connect karo
        await enhancedChatAPI.connectToRoom(conversation.room_id);

        // Load messages for the conversation
        const messagesResponse = await enhancedChatAPI.getRoomMessages(
          conversation.room_id
        );

        if (
          messagesResponse.status === "success" &&
          Array.isArray(messagesResponse.data)
        ) {
          const formattedMessages = messagesResponse.data.map((msg) => {
            // 🔥 Fix: Override server's wrong admin sender_id
            let senderId = msg.sender?.employee_id || msg.sender_id;
            if (
              senderId === "2Zt363ClFSPBz1NW" &&
              msg.sender?.employee_name === "Admin"
            ) {
              senderId = "N/A"; // Use correct admin ID
            }

            const message = {
              id: msg.message_id,
              senderId: senderId,
              sender: msg.sender, // 🔑 Preserve full sender object with profile_picture_link
              text: msg.content,
              timestamp: new Date(msg.created_at),
              read: true,
              status: "delivered",
              type: msg.type || "text",
              file_urls: msg.file_urls || [], // 🔥 CRITICAL: Include file_urls!
              isForwarded: msg.is_forwarded || false, // 🔁 Include forwarded flag
            };

            // Parse reply data properly
            if (msg.reply_to_message) {
              message.replyTo = {
                id: msg.reply_to_message.message_id,
                text: msg.reply_to_message.content,
                senderId: msg.reply_to_message.sender?.employee_id,
                senderName:
                  msg.reply_to_message.sender?.employee_name || "Unknown User",
                timestamp: new Date(msg.reply_to_message.created_at),
              };
            }

            return message;
          });

          // Set messages for the conversation
          if (setMessages) {
            setMessages((prev) => ({
              ...prev,
              [conversation.id]: formattedMessages,
            }));
          }
        } else {
          // Initialize empty messages array
          if (setMessages) {
            setMessages((prev) => ({
              ...prev,
              [conversation.id]: [],
            }));
          }
        }
      } catch (error) {
        // Initialize empty messages array on error
        if (setMessages) {
          setMessages((prev) => ({
            ...prev,
            [conversation.id]: [],
          }));
        }

        // Clear loading state on error
        setIsConnectingToChat(false);
        setConnectingChatId(null);
      }
    } else {
      // Initialize empty messages array for conversations without room_id
      if (setMessages) {
        setMessages((prev) => ({
          ...prev,
          [conversation.id]: [],
        }));
      }
    }

    // Clear loading state
    setIsConnectingToChat(false);
    setConnectingChatId(null);
  };

  // Handle attachment selection
  const handleAttachmentSelect = async (type) => {
    setShowAttachmentMenu(false);

    if (!mediaHandlers) {
      console.warn("Media handlers not provided to navigation handlers");
      return;
    }

    switch (type) {
      case "photos-videos":
        // Trigger file input for photos and videos (multiple selection enabled)
        const photoInput = document.createElement("input");
        photoInput.type = "file";
        photoInput.accept = "image/*,video/*";
        photoInput.multiple = true; // Enable multiple file selection
        photoInput.onchange = async (e) => {
          const files = Array.from(e.target.files);
          if (files.length === 0) return;

          // Separate images and videos
          const imageFiles = files.filter((f) => f.type.startsWith("image/"));
          const videoFiles = files.filter((f) => f.type.startsWith("video/"));

          // Handle images (multiple at once)
          if (imageFiles.length > 0 && mediaHandlers.handleImageUpload) {
            await mediaHandlers.handleImageUpload(imageFiles);
          }

          // Handle videos (with compression support)
          if (videoFiles.length > 0 && mediaHandlers.handleVideoUpload) {
            await mediaHandlers.handleVideoUpload(
              videoFiles,
              mediaHandlers.onVideosReady
            );
          }
        };
        photoInput.click();
        break;

      /*case 'camera':
        // Trigger camera capture
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment';
        cameraInput.onchange = async (e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0 && mediaHandlers.handleImageUpload) {
            await mediaHandlers.handleImageUpload(files);
          }
        };
        cameraInput.click();
        break;*/

      case "document":
        // Trigger file input for documents (multiple selection enabled)
        const docInput = document.createElement("input");
        docInput.type = "file";
        docInput.accept = ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx";
        docInput.multiple = true; // Enable multiple file selection
        docInput.onchange = async (e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0 && mediaHandlers.handleDocumentUpload) {
            await mediaHandlers.handleDocumentUpload(files);
          }
        };
        docInput.click();
        break;

      case "poll":
        // Open poll creation modal
        if (setShowPollModal) {
          setShowPollModal(true);
        }
        break;

      default:
    }
  };

  return {
    handleStartNewChat,
    handleShowInfo,
    handleStartChatFromProfile,
    handleAttachmentSelect,
    handleSelectConversation,
  };
};
