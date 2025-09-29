// Import real employee API
import { fetchAllEmployees, findEmployeeById as findEmployeeByIdAPI, findEmployeeByEmployeeId } from '../../../services/employeeAPI.js';

// Employee data - will be populated from API
export let dummyEmployees = [];

// Initialize employees from API
export const initializeEmployees = async () => {
  try {
    dummyEmployees = await fetchAllEmployees();
    return dummyEmployees;
  } catch (error) {
    console.error('Failed to load employees:', error);
    dummyEmployees = [];
    return dummyEmployees;
  }
};

// Empty chat conversations and messages - will be populated from API
export const dummyConversations = [];
export const dummyMessages = {};

// Helper functions
export const getEmployeeById = (id) => {
  console.log(`🔍 Looking up employee by ID: "${id}" (type: ${typeof id})`);
  
  // Handle both numeric IDs and employee IDs (emp-xxx format)
  if (typeof id === 'number') {
    const result = findEmployeeByIdAPI(id, dummyEmployees);
    console.log(`📊 Numeric ID lookup result:`, result?.name || 'Not found');
    return result;
  } else if (typeof id === 'string' && id.startsWith('emp-')) {
    const result = findEmployeeByEmployeeId(id, dummyEmployees);
    console.log(`📊 Employee ID lookup result:`, result?.name || 'Not found');
    return result;
  } else if (typeof id === 'string') {
    // Try to find by employeeId first, then by numeric conversion
    const byEmployeeId = findEmployeeByEmployeeId(id, dummyEmployees);
    if (byEmployeeId) {
      console.log(`📊 String employeeId lookup result:`, byEmployeeId.name);
      return byEmployeeId;
    }
    
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      const result = findEmployeeByIdAPI(numericId, dummyEmployees);
      console.log(`📊 Converted numeric lookup result:`, result?.name || 'Not found');
      return result;
    }
  }
  
  console.log(`❌ No employee found for ID: "${id}"`);
  return null;
};

export const getEmployeeByIdFromList = (id, employeesList) => {
  // Handle both numeric IDs and employee IDs (emp-xxx format)
  if (typeof id === 'number') {
    return findEmployeeByIdAPI(id, employeesList);
  } else if (typeof id === 'string' && id.startsWith('emp-')) {
    return findEmployeeByEmployeeId(id, employeesList);
  } else if (typeof id === 'string') {
    // Try to find by employeeId first, then by numeric conversion
    const byEmployeeId = findEmployeeByEmployeeId(id, employeesList);
    if (byEmployeeId) return byEmployeeId;
    
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      return findEmployeeByIdAPI(numericId, employeesList);
    }
  }
  return null;
};

export const getConversationPartner = (conversation, currentUserId) => {
  if (!conversation || typeof conversation !== 'object') {
    return null;
  }
  
  if (conversation.type === undefined) {
    return null;
  }
  

  
  if (conversation.type === 'group') {
    return {
      name: conversation.name || 'Group Chat',
      avatar: conversation.avatar || '',
      status: 'group',
      id: conversation.id
    };
  }
  
  if (!conversation.participants || !Array.isArray(conversation.participants)) {
    return null;
  }
  
  // Ensure currentUserId is a string and handle both employee ID formats
  if (!currentUserId || typeof currentUserId !== 'string') {
    // If no valid currentUserId, return the first participant as partner
    const partnerId = conversation.participants[0];
    const partner = getEmployeeById(partnerId);
    return partner || {
      name: partnerId ? `Employee ${partnerId}` : 'Unknown User',
      avatar: partnerId ? partnerId.charAt(0).toUpperCase() : 'U',
      status: 'offline',
      id: partnerId || 'unknown'
    };
  }
  
  const currentUserEmpId = currentUserId.startsWith('emp-') ? currentUserId : `emp-${currentUserId}`;
  const partnerId = conversation.participants.find(id => 
    id !== currentUserId && 
    id !== currentUserEmpId &&
    (!currentUserId.startsWith('emp-') ? id !== `emp-${currentUserId}` : true)
  );
  
  if (!partnerId) {
    return {
      name: 'Unknown User',
      avatar: '',
      status: 'offline',
      id: 'unknown'
    };
  }
  
  const partner = getEmployeeById(partnerId);
  return partner || {
    name: `Employee ${partnerId}`,
    avatar: partnerId ? partnerId.charAt(0).toUpperCase() : 'U',
    status: 'offline', 
    id: partnerId
  };
};

export const getConversationTitle = (conversation, currentUserId) => {
  if (conversation.type === 'group') {
    return conversation.name;
  }
  
  const partner = getConversationPartner(conversation, currentUserId);
  return partner?.name || 'Unknown';
};

export const formatLastSeen = (lastSeen) => {
  const now = new Date();
  const diff = now - lastSeen;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const formatMessageTime = (timestamp) => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const isToday = now.toDateString() === messageDate.toDateString();
  
  if (isToday) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === messageDate.toDateString();
    
    if (isYesterday) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
};
