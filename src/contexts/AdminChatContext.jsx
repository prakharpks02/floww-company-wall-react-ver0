import React, { createContext, useContext, useState, useEffect } from 'react';
import adminChatAPI from '../services/adminChatAPI';

const AdminChatContext = createContext();

export const useAdminChat = () => {
  const context = useContext(AdminChatContext);
  if (!context) {
    throw new Error('useAdminChat must be used within an AdminChatProvider');
  }
  return context;
};

export const AdminChatProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all rooms using admin API
  const loadRooms = async () => {
    try {
      console.log('🔧 AdminChatContext: Loading rooms using admin API...');
      setLoading(true);
      const response = await adminChatAPI.listAllRooms();
      
      if (response.status === 'success') {
        console.log('🔧 AdminChatContext: Loaded', response.data?.length || 0, 'rooms');
        setRooms(response.data || []);
      } else {
        setError('Failed to load rooms');
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error loading rooms:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a specific room
  const loadMessagesForRoom = async (roomId) => {
    try {
      console.log('🔧 AdminChatContext: Loading messages for room:', roomId);
      const response = await adminChatAPI.getRoomMessages(roomId);
      
      if (response.status === 'success') {
        const messageData = response.data;
        const messageList = Array.isArray(messageData) 
          ? messageData 
          : Object.values(messageData || {});
        
        console.log('🔧 AdminChatContext: Loaded', messageList.length, 'messages for room:', roomId);
        
        setMessages(prev => ({
          ...prev,
          [roomId]: messageList
        }));
        
        return messageList;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error loading messages:', error);
      setError(error.message);
    }
    return [];
  };

  // Get room details
  const getRoomDetails = async (roomId) => {
    try {
      console.log('🔧 AdminChatContext: Getting room details for:', roomId);
      const response = await adminChatAPI.getRoomDetails(roomId);
      
      if (response.status === 'success') {
        return response.data;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error getting room details:', error);
      setError(error.message);
    }
    return null;
  };

  // Get room statistics
  const getRoomStats = async (roomId) => {
    try {
      console.log('🔧 AdminChatContext: Getting room stats for:', roomId);
      const stats = await adminChatAPI.getRoomStats(roomId);
      return stats;
    } catch (error) {
      console.error('🔧 AdminChatContext: Error getting room stats:', error);
      setError(error.message);
    }
    return null;
  };

  // Create new room
  const createRoom = async (receiverEmployeeId) => {
    try {
      console.log('🔧 AdminChatContext: Creating room with employee:', receiverEmployeeId);
      const response = await adminChatAPI.createRoom(receiverEmployeeId);
      
      if (response.status === 'success') {
        // Reload rooms to include the new one
        await loadRooms();
        return response;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error creating room:', error);
      setError(error.message);
    }
    return null;
  };

  // Create new group
  const createGroup = async (groupData) => {
    try {
      console.log('🔧 AdminChatContext: Creating group:', groupData.group_name);
      const response = await adminChatAPI.createGroup(groupData);
      
      if (response.status === 'success') {
        // Reload rooms to include the new group
        await loadRooms();
        return response;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error creating group:', error);
      setError(error.message);
    }
    return null;
  };

  // Edit message
  const editMessage = async (messageId, content) => {
    try {
      console.log('🔧 AdminChatContext: Editing message:', messageId);
      const response = await adminChatAPI.editMessage(messageId, content);
      
      if (response.status === 'success') {
        return response;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error editing message:', error);
      setError(error.message);
    }
    return null;
  };

  // Add participants to room
  const addParticipants = async (roomId, participantIds) => {
    try {
      console.log('🔧 AdminChatContext: Adding participants to room:', roomId);
      const response = await adminChatAPI.addParticipants(roomId, participantIds);
      
      if (response.status === 'success') {
        return response;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error adding participants:', error);
      setError(error.message);
    }
    return null;
  };

  // Remove participant from room
  const removeParticipant = async (roomId, participantId) => {
    try {
      console.log('🔧 AdminChatContext: Removing participant from room:', roomId);
      const response = await adminChatAPI.removeParticipant(roomId, participantId);
      
      if (response.status === 'success') {
        return response;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error removing participant:', error);
      setError(error.message);
    }
    return null;
  };

  // Assign admin rights
  const assignAdminRights = async (roomId, employeeId) => {
    try {
      console.log('🔧 AdminChatContext: Assigning admin rights in room:', roomId);
      const response = await adminChatAPI.assignAdminRights(roomId, employeeId);
      
      if (response.status === 'success') {
        return response;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error assigning admin rights:', error);
      setError(error.message);
    }
    return null;
  };

  // Remove admin rights
  const removeAdminRights = async (roomId, employeeId) => {
    try {
      console.log('🔧 AdminChatContext: Removing admin rights in room:', roomId);
      const response = await adminChatAPI.removeAdminRights(roomId, employeeId);
      
      if (response.status === 'success') {
        return response;
      }
    } catch (error) {
      console.error('🔧 AdminChatContext: Error removing admin rights:', error);
      setError(error.message);
    }
    return null;
  };

  // Load rooms on mount
  useEffect(() => {
    console.log('🔧 AdminChatContext: Provider mounted, loading rooms...');
    loadRooms();
  }, []);

  const value = {
    // State
    rooms,
    messages,
    activeRoom,
    loading,
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
    removeAdminRights
  };

  return (
    <AdminChatContext.Provider value={value}>
      {children}
    </AdminChatContext.Provider>
  );
};

export default AdminChatContext;