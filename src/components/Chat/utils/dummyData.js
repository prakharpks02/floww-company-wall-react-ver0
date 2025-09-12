// Import real employee API
import { fetchAllEmployees, findEmployeeById as findEmployeeByIdAPI } from '../../../services/employeeAPI.js';

// Employee data - will be populated from API
export let dummyEmployees = [];

// Initialize employees from API
export const initializeEmployees = async () => {
  try {
    dummyEmployees = await fetchAllEmployees();
    return dummyEmployees;
  } catch (error) {
    console.error('Failed to load employees:', error);
    // Fallback to empty array if API fails
    dummyEmployees = [];
    return dummyEmployees;
  }
};

// Dummy chat conversations
export const dummyConversations = [
  {
    id: 1,
    participants: [1, 2], // Shreyansh and Sakshi
    type: 'direct', // direct or group
    lastMessage: {
      id: 1,
      senderId: 2,
      text: "Hey Shreyansh! Can you help me test the new feature?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    },
    unreadCount: 1
  },
  {
    id: 2,
    participants: [1, 3], // Shreyansh and Aman
    type: 'direct',
    lastMessage: {
      id: 2,
      senderId: 3,
      text: "The API integration is complete. Ready for testing!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    },
    unreadCount: 0
  },
  {
    id: 3,
    participants: [1, 5], // Shreyansh and Samrat
    type: 'direct',
    lastMessage: {
      id: 3,
      senderId: 5,
      text: "I've updated the UI designs. Please check when you get a chance.",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true
    },
    unreadCount: 0
  },
  {
    id: 4,
    participants: [1, 2, 3, 5], // Engineering Team Group
    type: 'group',
    name: 'Engineering Team',
    description: 'Main engineering discussion group',
    avatar: 'ET',
    createdBy: 1,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    lastMessage: {
      id: 4,
      senderId: 3,
      text: "Great work everyone on the new release! 🎉",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: true
    },
    unreadCount: 2
  },
  {
    id: 5,
    participants: [1, 4, 5, 8], // Project Alpha Group
    type: 'group',
    name: 'Project Alpha',
    description: 'Discussion for Project Alpha development',
    avatar: 'PA',
    createdBy: 4,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    lastMessage: {
      id: 5,
      senderId: 8,
      text: "The deadline has been moved to next week",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false
    },
    unreadCount: 1
  }
];

// Dummy messages for conversations
export const dummyMessages = {
  1: [ // Conversation between Shreyansh and Sakshi
    {
      id: 1,
      senderId: 2,
      text: "Hey Shreyansh! Can you help me test the new feature?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    },
    {
      id: 2,
      senderId: 1,
      text: "Sure! What feature are we testing?",
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      read: true
    },
    {
      id: 3,
      senderId: 2,
      text: "The new chat functionality in the company wall app",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      read: false
    }
  ],
  2: [ // Conversation between Shreyansh and Aman
    {
      id: 4,
      senderId: 3,
      text: "The API integration is complete. Ready for testing!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 5,
      senderId: 1,
      text: "Great work! I'll start testing it now.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      read: true
    }
  ],
  3: [ // Conversation between Shreyansh and Samrat
    {
      id: 6,
      senderId: 5,
      text: "I've updated the UI designs. Please check when you get a chance.",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 7,
      senderId: 1,
      text: "Thanks Samrat! The designs look great.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: true
    }
  ],
  4: [ // Engineering Team Group
    {
      id: 8,
      senderId: 1,
      text: "Hey team! How's everyone doing with the new features?",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 9,
      senderId: 2,
      text: "Going well! The testing is almost complete.",
      timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 10,
      senderId: 3,
      text: "Great work everyone on the new release! 🎉",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 11,
      senderId: 5,
      text: "The UI updates are ready for review!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    }
  ],
  5: [ // Project Alpha Group
    {
      id: 12,
      senderId: 4,
      text: "Welcome to Project Alpha team!",
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 13,
      senderId: 1,
      text: "Thanks! Excited to work on this project.",
      timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 14,
      senderId: 8,
      text: "The deadline has been moved to next week",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false
    },
    {
      id: 16,
      senderId: 1,
      text: "I think UI improvements will have the most impact for our next sprint.",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      read: false
    }
  ]
};

export const getEmployeeById = (id) => {
  return findEmployeeByIdAPI(id, dummyEmployees);
};

// Updated function that works with the context
export const getEmployeeByIdFromList = (id, employeesList) => {
  return findEmployeeByIdAPI(id, employeesList);
};

export const getConversationPartner = (conversation, currentUserId) => {
  // Add comprehensive null and undefined checks
  if (!conversation || typeof conversation !== 'object') {
    return null;
  }
  
  // Check if conversation has the required properties
  if (conversation.type === undefined) {
    return null;
  }
  
  if (conversation.type === 'group') {
    return {
      name: conversation.name || 'Group Chat',
      avatar: conversation.avatar || '👥',
      status: 'group',
      id: conversation.id
    };
  }
  
  // Check if participants array exists
  if (!conversation.participants || !Array.isArray(conversation.participants)) {
    return null;
  }
  
  const partnerId = conversation.participants.find(id => id !== currentUserId);
  return getEmployeeById(partnerId);
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
