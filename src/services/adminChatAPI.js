// Admin Chat API Service - Specifically for CRM Dashboard
// This service ONLY uses admin endpoints and is designed for localhost:8000/crm/dashboard

const ADMIN_API_BASE_URL = 'https://dev.gofloww.co/api/wall/chat/admin';
const ADMIN_AUTH_TOKEN = '7a3239c81974cdd6140c3162468500ba95d7d5823ea69658658c2986216b273e';

const ADMIN_HEADERS = {
  'Authorization': ADMIN_AUTH_TOKEN,
  'Content-Type': 'application/json'
};

/**
 * Handle API responses consistently for admin operations
 */
const handleAdminResponse = async (response) => {
  console.log('🔧 Admin API Response status:', response.status);
  
  if (!response.ok) {
    let error;
    try {
      error = await response.json();
      console.error('🔧 Admin API Error response:', error);
    } catch (e) {
      error = { message: `HTTP error! status: ${response.status}` };
    }
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('🔧 Admin API Success response:', data);
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
      console.log('🔧 Admin: Listing all rooms');
      
      const body = lastCheckedAt ? { last_checked_at: lastCheckedAt } : {};
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/list_all_rooms`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify(body)
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error listing rooms:', error);
      throw error;
    }
  },

  /**
   * Get room details (Admin endpoint)
   */
  getRoomDetails: async (roomId) => {
    try {
      console.log('🔧 Admin: Getting room details for:', roomId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/get_details`, {
        method: 'GET',
        headers: {
          'Authorization': ADMIN_AUTH_TOKEN
        }
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error getting room details:', error);
      throw error;
    }
  },

  /**
   * Get room messages (Admin endpoint)
   */
  getRoomMessages: async (roomId) => {
    try {
      console.log('🔧 Admin: Getting messages for room:', roomId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/get_messages`, {
        method: 'GET',
        headers: {
          'Authorization': ADMIN_AUTH_TOKEN
        }
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error getting room messages:', error);
      throw error;
    }
  },

  /**
   * Create a new room (Admin endpoint)
   */
  createRoom: async (receiverEmployeeId) => {
    try {
      console.log('🔧 Admin: Creating room with employee:', receiverEmployeeId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/create`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          receiver_employee_id: receiverEmployeeId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error creating room:', error);
      throw error;
    }
  },

  /**
   * Edit room details (Admin endpoint)
   */
  editRoomDetails: async (roomId, roomDetails) => {
    try {
      console.log('🔧 Admin: Editing room details for:', roomId, roomDetails);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/edit_details`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          room_name: roomDetails.room_name,
          room_icon: roomDetails.room_icon,
          room_desc: roomDetails.room_desc
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error editing room details:', error);
      throw error;
    }
  },

  /**
   * Create a new group (Admin endpoint)
   */
  createGroup: async (groupData) => {
    try {
      console.log('🔧 Admin: Creating group:', groupData.group_name);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/create_group`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          group_name: groupData.group_name,
          group_description: groupData.group_description,
          group_icon: groupData.group_icon,
          participants_ids: groupData.participants_ids
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error creating group:', error);
      throw error;
    }
  },

  /**
   * Edit room details (Admin endpoint)
   */
  editRoomDetails: async (roomId, roomData) => {
    try {
      console.log('🔧 Admin: Editing room details for:', roomId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/edit_details`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify(roomData)
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error editing room details:', error);
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
      console.log('🔧 Admin: Adding participants to room:', roomId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/add_participants`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          participant_ids: participantIds
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error adding participants:', error);
      throw error;
    }
  },

  /**
   * Remove participant from room (Admin endpoint)
   */
  removeParticipant: async (roomId, participantId) => {
    try {
      console.log('🔧 Admin: Removing participant from room:', roomId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/remove_participant`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          participant_id: participantId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error removing participant:', error);
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
      console.log('🔧 Admin: Assigning admin rights in room:', roomId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/assign_admin_rights`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          employee_id: employeeId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error assigning admin rights:', error);
      throw error;
    }
  },

  /**
   * Remove admin rights (Admin endpoint)
   */
  removeAdminRights: async (roomId, employeeId) => {
    try {
      console.log('🔧 Admin: Removing admin rights in room:', roomId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/rooms/${roomId}/remove_admin_rights`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          employee_id: employeeId
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error removing admin rights:', error);
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
      console.log('🔧 Admin: Editing message:', messageId);
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/messages/${messageId}/edit`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          content: content
        })
      });

      return await handleAdminResponse(response);
    } catch (error) {
      console.error('🔧 Admin: Error editing message:', error);
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
      console.log('🔧 Admin: Getting room statistics for:', roomId);
      
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
      console.error('🔧 Admin: Error getting room stats:', error);
      throw error;
    }
  },

  /**
   * Check if user has admin rights in a room
   */
  checkAdminRights: async (roomId, employeeId) => {
    try {
      console.log('🔧 Admin: Checking admin rights for employee:', employeeId, 'in room:', roomId);
      
      const roomDetails = await adminChatAPI.getRoomDetails(roomId);
      if (roomDetails.status === 'success' && roomDetails.data) {
        const participants = roomDetails.data.participants || [];
        const participant = participants.find(p => p.employee_id === employeeId);
        return participant ? participant.is_admin : false;
      }
      return false;
    } catch (error) {
      console.error('🔧 Admin: Error checking admin rights:', error);
      return false;
    }
  },

  /**
   * Get detailed participant list for a room
   */
  getParticipantDetails: async (roomId) => {
    try {
      console.log('🔧 Admin: Getting participant details for room:', roomId);
      
      const roomDetails = await adminChatAPI.getRoomDetails(roomId);
      if (roomDetails.status === 'success' && roomDetails.data) {
        return roomDetails.data.participants || [];
      }
      return [];
    } catch (error) {
      console.error('🔧 Admin: Error getting participant details:', error);
      return [];
    }
  }
};

// Test function for admin API in CRM environment
export const testAdminChatAPI = async () => {
  console.log('🧪 Testing Admin Chat API in CRM environment...');
  
  try {
    // Test listing rooms
    const roomsResponse = await adminChatAPI.listAllRooms();
    console.log('✅ Admin room listing successful:', roomsResponse.status);
    console.log('📊 Rooms found:', roomsResponse.data?.length || 0);
    
    if (roomsResponse.data && roomsResponse.data.length > 0) {
      const testRoom = roomsResponse.data[0];
      console.log('🏠 Testing with room:', testRoom.room_name, '(' + testRoom.room_id + ')');
      
      // Test getting room details
      const detailsResponse = await adminChatAPI.getRoomDetails(testRoom.room_id);
      console.log('✅ Room details successful:', detailsResponse.status);
      
      // Test editing room details (optional - only if you want to test)
      // const editResponse = await adminChatAPI.editRoomDetails(testRoom.room_id, {
      //   room_name: testRoom.room_name + ' (Edited)',
      //   room_icon: 'Updated_Icon',
      //   room_desc: 'Updated description via API test'
      // });
      // console.log('✅ Room edit successful:', editResponse.status);
      
      // Test getting messages
      const messagesResponse = await adminChatAPI.getRoomMessages(testRoom.room_id);
      console.log('✅ Messages retrieval successful:', messagesResponse.status);
      
      // Test getting room stats
      const stats = await adminChatAPI.getRoomStats(testRoom.room_id);
      console.log('✅ Room stats successful:', stats);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Admin Chat API test failed:', error);
    return false;
  }
};

// Make test function available globally for debugging in CRM
if (typeof window !== 'undefined') {
  window.testAdminChatAPI = testAdminChatAPI;
  console.log('🔧 Admin Chat API loaded for CRM dashboard');
  console.log('🧪 Run window.testAdminChatAPI() to test the API');
}

export default adminChatAPI;