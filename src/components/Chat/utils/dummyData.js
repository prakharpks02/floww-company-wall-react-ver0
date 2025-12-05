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
    dummyEmployees = [];
    return dummyEmployees;
  }
};

// Empty chat conversations and messages - will be populated from API
export const dummyConversations = [];
export const dummyMessages = {};

// Helper functions
export const getEmployeeById = (id) => {

  
  // Handle both numeric IDs and employee IDs (emp-xxx format)
  if (typeof id === 'number') {
    const result = findEmployeeByIdAPI(id, dummyEmployees);

    return result;
  } else if (typeof id === 'string' && id.startsWith('emp-')) {
    const result = findEmployeeByEmployeeId(id, dummyEmployees);
  
    return result;
  } else if (typeof id === 'string') {
    // Try to find by employeeId first, then by numeric conversion
    const byEmployeeId = findEmployeeByEmployeeId(id, dummyEmployees);
    if (byEmployeeId) {

      return byEmployeeId;
    }
    
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      const result = findEmployeeByIdAPI(numericId, dummyEmployees);
   
      return result;
    }
  }
  
  return null;
};

export const getAllEmployees = () => {
  return dummyEmployees;
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
  
  // 🔥 Priority 1: Check if room_name exists (from API response)
  // room_name can be string or array - handle both cases
  let roomName = null;
  if (conversation.room_name) {
    if (Array.isArray(conversation.room_name) && conversation.room_name.length > 0) {
      roomName = conversation.room_name[0]; // Take first element from array
    } else if (typeof conversation.room_name === 'string') {
      roomName = conversation.room_name;
    }
  }
  
  // If we have a valid room_name, use it
  if (roomName && roomName.trim()) {
    // Don't show "Admin" if current user IS admin - show the other participant instead
    const isCurrentUserAdmin = currentUserId === 'UAI5Tfzl3k4Y6NIp' || currentUserId === 'admin' || currentUserId === 'N/A';
    const isRoomNameAdmin = roomName === 'Admin' || roomName.toLowerCase() === 'admin';
    
    // If current user is admin and room name is "Admin", skip to participant logic below
    if (!isCurrentUserAdmin || !isRoomNameAdmin) {
      return {
        name: roomName,
        avatar: roomName.charAt(0).toUpperCase(),
        status: 'online',
        id: conversation.room_id || conversation.id,
        isAdmin: isRoomNameAdmin
      };
    }
  }
  
  // For group conversations, return group info
  if (conversation.type === 'group') {
    return {
      name: conversation.name || 'Group Chat',
      avatar: conversation.avatar || conversation.icon || '',
      status: 'group',
      id: conversation.id
    };
  }
  
  // Use participantDetails if available (from API with full participant info)
  if (conversation.participantDetails && Array.isArray(conversation.participantDetails)) {
    const currentUserEmpId = currentUserId?.startsWith('emp-') ? currentUserId : `emp-${currentUserId}`;
    
    const partner = conversation.participantDetails.find(p => 
      p.id !== currentUserId && 
      p.id !== currentUserEmpId &&
      (!currentUserId?.startsWith('emp-') ? p.id !== `emp-${currentUserId}` : true)
    );
    
    if (partner) {
      return {
        name: partner.name,
        avatar: partner.avatar || '',
        status: 'online', // Default status
        id: partner.id,
        isAdmin: partner.isAdmin
      };
    }
  }
  
  if (!conversation.participants || !Array.isArray(conversation.participants)) {
    return null;
  }
  
  // Ensure currentUserId is a string and handle both employee ID formats
  if (!currentUserId || typeof currentUserId !== 'string') {
    // If no valid currentUserId, return the first participant as partner
    const firstParticipant = conversation.participants[0];
    
    // Check if this is an Admin user (employee_id === "N/A")
    if (firstParticipant && typeof firstParticipant === 'object') {
      if (firstParticipant.employee_id === 'N/A' && firstParticipant.employee_name === 'Admin') {
        return {
          name: firstParticipant.employee_name,
          avatar: firstParticipant.profile_picture_link || 'A',
          status: 'online',
          id: 'admin',
          isAdmin: true
        };
      }
    }
    
    const partnerId = typeof firstParticipant === 'object' ? firstParticipant.employee_id : firstParticipant;
    const partner = getEmployeeById(partnerId);
    return partner || {
      name: partnerId ? `Employee ${partnerId}` : 'Unknown User',
      avatar: partnerId ? partnerId.charAt(0).toUpperCase() : 'U',
      status: 'offline',
      id: partnerId || 'unknown'
    };
  }
  
  const currentUserEmpId = currentUserId.startsWith('emp-') ? currentUserId : `emp-${currentUserId}`;
  
  // Find the partner (the other participant who is not the current user)
  const partnerParticipant = conversation.participants.find(participant => {
    const participantId = typeof participant === 'object' ? participant.employee_id : participant;
    return participantId !== currentUserId && 
           participantId !== currentUserEmpId &&
           (!currentUserId.startsWith('emp-') ? participantId !== `emp-${currentUserId}` : true);
  });
  
  if (!partnerParticipant) {
    return {
      name: 'Unknown User',
      avatar: '',
      status: 'offline',
      id: 'unknown'
    };
  }
  
  // Handle Admin user with employee_id === "N/A"
  if (typeof partnerParticipant === 'object') {
    if (partnerParticipant.employee_id === 'N/A' && partnerParticipant.employee_name === 'Admin') {
      return {
        name: partnerParticipant.employee_name,
        avatar: partnerParticipant.profile_picture_link || 'A',
        status: 'online',
        id: 'admin',
        isAdmin: true
      };
    }
    
    // Return participant object data if available
    return {
      name: partnerParticipant.employee_name || 'Unknown User',
      avatar: partnerParticipant.profile_picture_link || (partnerParticipant.employee_name ? partnerParticipant.employee_name.charAt(0).toUpperCase() : 'U'),
      status: 'online',
      id: partnerParticipant.employee_id,
      isAdmin: partnerParticipant.is_admin || false
    };
  }
  
  // Legacy: partner is just an ID string
  const partnerId = partnerParticipant;
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
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } else {
    // For previous days, always show time in AM/PM format
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
};

// New function to get date headers
export const getDateHeader = (timestamp) => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const isToday = now.toDateString() === messageDate.toDateString();
  
  if (isToday) {
    return 'Today';
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === messageDate.toDateString();
    
    if (isYesterday) {
      return 'Yesterday';
    } else {
      // Calculate how many days ago the message was sent
      const daysDifference = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
      
      // For messages within the last 5 days (including today and yesterday), show day names only
      if (daysDifference <= 5) {
        return messageDate.toLocaleDateString([], { weekday: 'long' });
      } else {
        // For messages older than 5 days, show date only (no day name)
        return messageDate.toLocaleDateString([], { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    }
  }
};

// Function to group messages by date
export const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentGroup = null;
  
  messages.forEach(message => {
    const dateHeader = getDateHeader(message.timestamp);
    
    if (!currentGroup || currentGroup.date !== dateHeader) {
      currentGroup = {
        date: dateHeader,
        messages: [message]
      };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
    }
  });
  
  return groups;
};
