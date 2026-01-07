import React, { createContext, useContext, useState, useEffect } from "react";
import adminChatAPI from "../services/adminChatAPI";

const AdminChatContext = createContext();

export const useAdminChat = () => {
  const context = useContext(AdminChatContext);
  if (!context) {
    throw new Error("useAdminChat must be used within an AdminChatProvider");
  }
  return context;
};

export const AdminChatProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [error, setError] = useState(null);

  // Load all rooms using admin API
  // suppressLoading: when true, do not toggle the `loading` UI flag (used for background polling)
  const loadRooms = async (suppressLoading = false) => {
    try {
      if (!suppressLoading) setLoading(true);
      const response = await adminChatAPI.listAllRooms();

      if (response.status === "success") {
        setRooms(response.data || []);
      } else {
        setError("Failed to load rooms");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      if (!suppressLoading) setLoading(false);
    }
  };

  // Load messages for a specific room
  const loadMessagesForRoom = async (roomId) => {
    try {
      const response = await adminChatAPI.getRoomMessages(roomId);

      if (response.status === "success") {
        const messageData = response.data;
        const rawList = Array.isArray(messageData)
          ? messageData
          : Object.values(messageData || {});

        // Normalize messages to ensure UI has consistent fields
        const messageList = rawList.map((msg) => ({
          message_id: msg.message_id,
          room_id: msg.room_id,
          content: msg.content,
          file_urls: msg.file_urls || [],
          is_starred: msg.is_starred || false,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
          // Sender normalized fields
          sender: msg.sender || null,
          sender_name:
            msg.sender?.employee_name ||
            msg.sender_name ||
            msg.sender?.employee_username ||
            "Unknown",
          sender_username:
            msg.sender?.employee_username || msg.sender_username || null,
        }));

        setMessages((prev) => ({
          ...prev,
          [roomId]: messageList,
        }));

        return messageList;
      }
    } catch (error) {
      setError(error.message);
    }
    return [];
  };

  // Get room details
  const getRoomDetails = async (roomId) => {
    try {
      const response = await adminChatAPI.getRoomDetails(roomId);

      if (response.status === "success") {
        return response.data;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Get room statistics
  const getRoomStats = async (roomId) => {
    try {
      const stats = await adminChatAPI.getRoomStats(roomId);
      return stats;
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Create new room
  const createRoom = async (receiverEmployeeId) => {
    try {
      // If a direct room already exists locally, switch to it
      const existing = rooms.find(
        (r) =>
          !r.is_group &&
          Array.isArray(r.participants) &&
          r.participants.includes(receiverEmployeeId)
      );
      if (existing) {
        setActiveRoom(existing.room_id || existing.id || null);
        return { status: "success", message: "Already exists", data: existing };
      }

      setCreatingRoom(true);
      const response = await adminChatAPI.createRoom(receiverEmployeeId);

      if (response && response.status === "success") {
        // Reload rooms to include the new one
        await loadRooms();
        return response;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setCreatingRoom(false);
    }
    return null;
  };

  // Create new group
  const createGroup = async (groupData) => {
    try {
      const response = await adminChatAPI.createGroup(groupData);

      if (response.status === "success") {
        // Reload rooms to include the new group
        await loadRooms();
        return response;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Edit message
  const editMessage = async (messageId, content) => {
    try {
      const response = await adminChatAPI.editMessage(messageId, content);

      if (response.status === "success") {
        return response;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Add participants to room
  const addParticipants = async (roomId, participantIds) => {
    try {
      const response = await adminChatAPI.addParticipants(
        roomId,
        participantIds
      );

      if (response.status === "success") {
        return response;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Remove participant from room
  const removeParticipant = async (roomId, participantId) => {
    try {
      const response = await adminChatAPI.removeParticipant(
        roomId,
        participantId
      );

      if (response.status === "success") {
        return response;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Get mention users for adding to groups
  const getMentionUsers = async (search = "") => {
    try {
      const response = await adminChatAPI.getMentionUsers(search);

      if (response.status === "success") {
        return response;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Assign admin rights
  const assignAdminRights = async (roomId, employeeId) => {
    try {
      const response = await adminChatAPI.assignAdminRights(roomId, employeeId);

      if (response.status === "success") {
        return response;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Remove admin rights
  const removeAdminRights = async (roomId, employeeId) => {
    try {
      const response = await adminChatAPI.removeAdminRights(roomId, employeeId);

      if (response.status === "success") {
        return response;
      }
    } catch (error) {
      setError(error.message);
    }
    return null;
  };

  // Load rooms on mount
  useEffect(() => {
    loadRooms();

    // Poll rooms every 5 seconds to keep list fresh (suppress loading spinner)
    const intervalId = setInterval(() => {
      loadRooms(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const value = {
    // State
    rooms,
    messages,
    activeRoom,
    loading,
    creatingRoom,
    error,

    // Actions
    setActiveRoom,
    setError,
    loadRooms,
    loadMessagesForRoom,
    getRoomDetails,
    getRoomStats,
    createRoom,
    createGroup,
    editMessage,
    addParticipants,
    removeParticipant,
    assignAdminRights,
    removeAdminRights,
    getMentionUsers,
  };

  return (
    <AdminChatContext.Provider value={value}>
      {children}
    </AdminChatContext.Provider>
  );
};

export default AdminChatContext;
