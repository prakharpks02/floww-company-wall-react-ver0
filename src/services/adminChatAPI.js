// Admin Chat API Service - Specifically for CRM Dashboard
// This service ONLY uses admin endpoints and is designed for localhost:8000/crm/dashboard

import { cookieUtils } from '../utils/cookieUtils';

const ADMIN_API_BASE_URL = import.meta.env.VITE_CHAT_API_BASE + '/admin' || 'https://console.gofloww.xyz/api/wall/chat/admin';

const getAdminHeaders = () => {
  const { adminToken } = cookieUtils.getAuthTokens();
  return {
    'Authorization': adminToken || '',
    'Content-Type': 'application/json'
  };
};

/**
 * Handle API responses consistently for admin operations
 */
const handleAdminResponse = async (response) => {
  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (e) {
      error = { message: `HTTP error! status: ${response.status}` };
    }
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

/**
 * Admin Chat API - Only admin endpoints, designed for CRM dashboard
 */
export const adminChatAPI = {
  
  // =============================================================================
  // ROOM MANAGEMENT (Admin Only)
  // =============================================================================
  
  /**
   * List all chat rooms (Admin endpoint)
   */
  listAllRooms: async (lastCheckedAt = null) => {
    try {
      const body = lastCheckedAt ? { last_checked_at: lastCheckedAt } : {};
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/list_all_rooms`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(body)
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get room details (Admin endpoint)
   */
  getRoomDetails: async (roomId) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/get_details`, {
        method: 'GET',
        headers: {
          ...getAdminHeaders()
        }
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get room messages (Admin endpoint)
   */
  getRoomMessages: async (roomId) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/get_messages`, {
        method: 'GET',
        headers: {
          ...getAdminHeaders()
        }
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new room (Admin endpoint)
   */
  createRoom: async (receiverEmployeeId) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/create`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          receiver_employee_id: receiverEmployeeId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Edit room details (Admin endpoint)
   */
  editRoomDetails: async (roomId, roomDetails) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/edit_details`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          room_name: roomDetails.room_name,
          room_icon: roomDetails.room_icon,
          room_desc: roomDetails.room_desc
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new group (Admin endpoint)
   */
  createGroup: async (groupData) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/create_group`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          group_name: groupData.group_name,
          group_description: groupData.group_description,
          group_icon: groupData.group_icon,
          participants_ids: groupData.participants_ids
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Edit room details (Admin endpoint)
   */
  editRoomDetails: async (roomId, roomData) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/edit_details`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(roomData)
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // =============================================================================
  // PARTICIPANT MANAGEMENT (Admin Only)
  // =============================================================================

  /**
   * Add participants to room (Admin endpoint)
   */
  addParticipants: async (roomId, participantIds) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/add_participants`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          participant_ids: participantIds
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove participant from room (Admin endpoint)
   */
  removeParticipant: async (roomId, participantId) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/remove_participant`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          participant_id: participantId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // =============================================================================
  // ADMIN RIGHTS MANAGEMENT (Admin Only)
  // =============================================================================

  /**
   * Assign admin rights (Admin endpoint)
   */
  assignAdminRights: async (roomId, employeeId) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/assign_admin_rights`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          employee_id: employeeId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove admin rights (Admin endpoint)
   */
  removeAdminRights: async (roomId, employeeId) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/remove_admin_rights`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          employee_id: employeeId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // =============================================================================
  // MESSAGE MANAGEMENT (Admin Only)
  // =============================================================================

  /**
   * Edit a message (Admin endpoint)
   */
  editMessage: async (messageId, content) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/messages/${messageId}/edit`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          content: content
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // =============================================================================
  // UTILITY FUNCTIONS (Using Admin Endpoints Only)
  // =============================================================================

  /**
   * Get comprehensive room statistics using admin endpoints
   */
  getRoomStats: async (roomId) => {
    try {
      const [roomDetails, messages] = await Promise.all([
        adminChatAPI.getRoomDetails(roomId),
        adminChatAPI.getRoomMessages(roomId)
      ]);

      if (roomDetails.status === 'success' && messages.status === 'success') {
        const participants = roomDetails.data.participants || [];
        const messageList = Array.isArray(messages.data) ? messages.data : Object.values(messages.data || {});
        
        return {
          participantCount: participants.length,
          messageCount: messageList.length,
          adminCount: participants.filter(p => p.is_admin).length,
          isGroup: roomDetails.data.is_group || false,
          createdAt: roomDetails.data.created_at,
          lastMessage: roomDetails.data.last_message,
          roomName: roomDetails.data.room_name,
          roomIcon: roomDetails.data.room_icon,
          description: roomDetails.data.description
        };
      }
      
      throw new Error('Failed to get room statistics');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user has admin rights in a room
   */
  checkAdminRights: async (roomId, employeeId) => {
    try {
      const roomDetails = await adminChatAPI.getRoomDetails(roomId);
      if (roomDetails.status === 'success' && roomDetails.data) {
        const participants = roomDetails.data.participants || [];
        const participant = participants.find(p => p.employee_id === employeeId);
        return participant ? participant.is_admin : false;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get detailed participant list for a room
   */
  getParticipantDetails: async (roomId) => {
    try {
      const roomDetails = await adminChatAPI.getRoomDetails(roomId);
      if (roomDetails.status === 'success' && roomDetails.data) {
        return roomDetails.data.participants || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }
};

// Test function for admin API in CRM environment
export const testAdminChatAPI = async () => {
  try {
    // Test listing rooms
    const roomsResponse = await adminChatAPI.listAllRooms();
    
    
    if (roomsResponse.data && roomsResponse.data.length > 0) {
      const testRoom = roomsResponse.data[0];
      // Test getting room details
      const detailsResponse = await adminChatAPI.getRoomDetails(testRoom.room_id);
      // Test editing room details (optional - only if you want to test)
      // const editResponse = await adminChatAPI.editRoomDetails(testRoom.room_id, {
      //   room_name: testRoom.room_name + ' (Edited)',
      //   room_icon: 'Updated_Icon',
      //   room_desc: 'Updated description via API test'
      // });
      // 
      
      // Test getting messages
      const messagesResponse = await adminChatAPI.getRoomMessages(testRoom.room_id);
      // Test getting room stats
      const stats = await adminChatAPI.getRoomStats(testRoom.room_id);
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Make test function available globally for debugging in CRM
if (typeof window !== 'undefined') {
  window.testAdminChatAPI = testAdminChatAPI;
}

export default adminChatAPI;
