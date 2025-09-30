// Admin API service for chat administration functionality
// This service is designed to work specifically with the CRM admin panel at localhost:8000/crm

// Detect if we're running in the CRM admin environment
const getCurrentUserType = () => {
  const currentPath = window.location.pathname;
  return currentPath.includes('/crm') ? 'admin' : 'employee';
};

// Different base URLs for different environments
const getApiBaseUrl = () => {
  const userType = getCurrentUserType();
  if (userType === 'admin') {
    // Admin endpoints - these are the only ones that work in CRM dashboard
    return 'https://dev.gofloww.co/api/wall/chat/admin';
  } else {
    // Employee endpoints (fallback, but shouldn't be used in admin context)
    return 'https://dev.gofloww.co/api/wall/chat';
  }
};

const API_BASE_URL = getApiBaseUrl();
const ADMIN_AUTH_TOKEN = '7a3239c81974cdd6140c3162468500ba95d7d5823ea69658658c2986216b273e';

const API_HEADERS = {
  'Authorization': ADMIN_AUTH_TOKEN,
  'Content-Type': 'application/json'
};

// Log the current configuration
console.log('🔧 Admin API Configuration:', {
  userType: getCurrentUserType(),
  baseUrl: API_BASE_URL,
  path: window.location.pathname
});

/**
 * Handle API responses and errors consistently
 * @param {Response} response - Fetch API response object
 * @returns {Promise<Object>} Parsed response data
 */
const handleResponse = async (response) => {
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

// =============================================================================
// ROOM MANAGEMENT APIs
// =============================================================================

/**
 * Create a new chat room between admin and an employee
 * @param {string} receiverEmployeeId - Employee ID to create room with
 * @returns {Promise<Object>} API response
 */
export const createRoom = async (receiverEmployeeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/create`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        receiver_employee_id: receiverEmployeeId
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

/**
 * Create a new group chat room
 * @param {Object} groupData - Group creation data
 * @param {string} groupData.group_name - Name of the group
 * @param {string} groupData.group_description - Description of the group
 * @param {string} groupData.group_icon - Icon for the group
 * @param {Array<string>} groupData.participants_ids - Array of employee IDs
 * @returns {Promise<Object>} API response
 */
export const createGroup = async (groupData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/create_group`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        group_name: groupData.group_name,
        group_description: groupData.group_description,
        group_icon: groupData.group_icon,
        participants_ids: groupData.participants_ids
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

/**
 * List all chat rooms
 * @param {string} [lastCheckedAt] - Optional timestamp for filtering
 * @returns {Promise<Object>} API response with rooms data
 */
export const listAllRooms = async (lastCheckedAt = null) => {
  try {
    const body = lastCheckedAt ? { last_checked_at: lastCheckedAt } : {};
    
    const response = await fetch(`${API_BASE_URL}/rooms/list_all_rooms`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(body)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error listing rooms:', error);
    throw error;
  }
};

/**
 * Get details of a specific room
 * @param {string} roomId - Room ID to get details for
 * @returns {Promise<Object>} API response with room details
 */
export const getRoomDetails = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/get_details`, {
      method: 'GET',
      headers: {
        'Authorization': ADMIN_AUTH_TOKEN
      }
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error getting room details:', error);
    throw error;
  }
};

/**
 * Edit room details (name, icon, description)
 * @param {string} roomId - Room ID to edit
 * @param {Object} roomData - Room update data
 * @param {string} [roomData.room_name] - New room name
 * @param {string} [roomData.room_icon] - New room icon
 * @param {string} [roomData.room_desc] - New room description
 * @returns {Promise<Object>} API response
 */
export const editRoomDetails = async (roomId, roomData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/edit_details`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(roomData)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error editing room details:', error);
    throw error;
  }
};

// =============================================================================
// PARTICIPANT MANAGEMENT APIs
// =============================================================================

/**
 * Add participants to a room
 * @param {string} roomId - Room ID to add participants to
 * @param {Array<string>} participantIds - Array of employee IDs to add
 * @returns {Promise<Object>} API response
 */
export const addParticipants = async (roomId, participantIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/add_participants`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        participant_ids: participantIds
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error adding participants:', error);
    throw error;
  }
};

/**
 * Remove a participant from a room
 * @param {string} roomId - Room ID to remove participant from
 * @param {string} participantId - Employee ID to remove
 * @returns {Promise<Object>} API response
 */
export const removeParticipant = async (roomId, participantId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/remove_participant`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        participant_id: participantId
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
};

// =============================================================================
// ADMIN RIGHTS MANAGEMENT APIs
// =============================================================================

/**
 * Assign admin rights to an employee in a room
 * @param {string} roomId - Room ID
 * @param {string} employeeId - Employee ID to assign admin rights to
 * @returns {Promise<Object>} API response
 */
export const assignAdminRights = async (roomId, employeeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/assign_admin_rights`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        employee_id: employeeId
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error assigning admin rights:', error);
    throw error;
  }
};

/**
 * Remove admin rights from an employee in a room
 * @param {string} roomId - Room ID
 * @param {string} employeeId - Employee ID to remove admin rights from
 * @returns {Promise<Object>} API response
 */
export const removeAdminRights = async (roomId, employeeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/remove_admin_rights`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        employee_id: employeeId
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error removing admin rights:', error);
    throw error;
  }
};

// =============================================================================
// MESSAGE MANAGEMENT APIs
// =============================================================================

/**
 * Get all messages from a room
 * @param {string} roomId - Room ID to get messages from
 * @returns {Promise<Object>} API response with messages data
 */
export const getRoomMessages = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/get_messages`, {
      method: 'GET',
      headers: {
        'Authorization': ADMIN_AUTH_TOKEN
      }
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error getting room messages:', error);
    throw error;
  }
};

/**
 * Edit a specific message
 * @param {string} messageId - Message ID to edit
 * @param {string} content - New content for the message
 * @returns {Promise<Object>} API response
 */
export const editMessage = async (messageId, content) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/edit`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        content: content
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a user has admin privileges
 * @param {string} roomId - Room ID to check
 * @param {string} employeeId - Employee ID to check
 * @returns {Promise<boolean>} True if user has admin rights
 */
export const checkAdminRights = async (roomId, employeeId) => {
  try {
    const roomDetails = await getRoomDetails(roomId);
    if (roomDetails.status === 'success' && roomDetails.data) {
      const participants = roomDetails.data.participants || [];
      const participant = participants.find(p => p.employee_id === employeeId);
      return participant ? participant.is_admin : false;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin rights:', error);
    return false;
  }
};

/**
 * Get room statistics
 * @param {string} roomId - Room ID to get statistics for
 * @returns {Promise<Object>} Room statistics
 */
export const getRoomStats = async (roomId) => {
  try {
    const [roomDetails, messages] = await Promise.all([
      getRoomDetails(roomId),
      getRoomMessages(roomId)
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
        lastMessage: roomDetails.data.last_message
      };
    }
    
    throw new Error('Failed to get room statistics');
  } catch (error) {
    console.error('Error getting room stats:', error);
    throw error;
  }
};

// Export all functions as a default object for easier importing
export default {
  // Room Management
  createRoom,
  createGroup,
  listAllRooms,
  getRoomDetails,
  editRoomDetails,
  
  // Participant Management
  addParticipants,
  removeParticipant,
  
  // Admin Rights Management
  assignAdminRights,
  removeAdminRights,
  
  // Message Management
  getRoomMessages,
  editMessage,
  
  // Utility Functions
  checkAdminRights,
  getRoomStats
};