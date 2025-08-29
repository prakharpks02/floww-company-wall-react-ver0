// Dummy employee data for chat functionality
export const dummyEmployees = [
  {
    id: 1,
    name: "Shreyansh Shandilya",
    email: "shreyansh@gofloww.co",
    phone: "+91 98765 43210",
    role: "Tester",
    department: "Quality Assurance",
    location: "Mumbai, India",
    employeeId: "EMP001",
    joinDate: "Jan 15, 2023",
    bio: "Passionate QA engineer with 3+ years of experience in manual and automated testing. Love ensuring software quality and user satisfaction.",
    avatar: "SS",
    status: "online",
    lastSeen: new Date()
  },
  {
    id: 2,
    name: "Sakshi Jadhav",
    email: "sakshi@gofloww.co",
    phone: "+91 98765 43211",
    role: "Developer",
    department: "Engineering",
    location: "Pune, India",
    employeeId: "EMP002",
    joinDate: "Feb 20, 2023",
    bio: "Full-stack developer specializing in React and Node.js. Always excited to learn new technologies and solve complex problems.",
    avatar: "SJ",
    status: "online",
    lastSeen: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  },
  {
    id: 3,
    name: "Aman Yadav",
    email: "aman@gofloww.co",
    phone: "+91 98765 43212",
    role: "Developer",
    department: "Engineering",
    location: "Delhi, India",
    employeeId: "EMP003",
    joinDate: "Mar 10, 2023",
    bio: "Backend developer with expertise in microservices and cloud architecture. Enjoys building scalable and efficient systems.",
    avatar: "AY",
    status: "away",
    lastSeen: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
  },
  {
    id: 4,
    name: "John Smith",
    email: "john.smith@gofloww.co",
    phone: "+91 98765 43213",
    role: "Product Manager",
    department: "Product",
    location: "Bangalore, India",
    employeeId: "EMP004",
    joinDate: "Jan 5, 2023",
    bio: "Product manager with 5+ years of experience in SaaS products. Passionate about user experience and data-driven decisions.",
    avatar: "JS",
    status: "offline",
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 5,
    name: "Samrat Singh",
    email: "samrat.singh@gofloww.co",
    phone: "+91 98765 43214",
    role: "Designer",
    department: "Design",
    location: "Mumbai, India",
    employeeId: "EMP005",
    joinDate: "Apr 12, 2023",
    bio: "UI/UX designer focused on creating beautiful and intuitive user interfaces. Love working on mobile and web experiences.",
    avatar: "SS",
    status: "online",
    lastSeen: new Date()
  },
  {
    id: 6,
    name: "Mike Wilson",
    email: "mike.wilson@gofloww.co",
    role: "DevOps Engineer",
    department: "Engineering",
    avatar: "MW",
    status: "busy",
    lastSeen: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    id: 7,
    name: "Lisa Chen",
    email: "lisa.chen@gofloww.co",
    role: "HR Manager",
    department: "Human Resources",
    avatar: "LC",
    status: "online",
    lastSeen: new Date()
  },
  {
    id: 8,
    name: "David Brown",
    email: "david.brown@gofloww.co",
    role: "Sales Manager",
    department: "Sales",
    avatar: "DB",
    status: "offline",
    lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    id: 9,
    name: "Emily Davis",
    email: "emily.davis@gofloww.co",
    role: "Marketing Specialist",
    department: "Marketing",
    avatar: "ED",
    status: "away",
    lastSeen: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
  },
  {
    id: 10,
    name: "Alex Rodriguez",
    email: "alex.rodriguez@gofloww.co",
    role: "Senior Developer",
    department: "Engineering",
    avatar: "AR",
    status: "online",
    lastSeen: new Date()
  }
];

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
    },
    // Poll removed as requested
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
    },
    // Poll removed as requested
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
    // Poll removed as requested
    {
      id: 16,
      senderId: 1,
      text: "Great poll! I think UI improvements will have the most impact.",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      read: false
    }
  ]
};

export const getEmployeeById = (id) => {
  return dummyEmployees.find(emp => emp.id === id);
};

export const getConversationPartner = (conversation, currentUserId) => {
  if (conversation.type === 'group') {
    return {
      name: conversation.name,
      avatar: conversation.avatar,
      status: 'group',
      id: conversation.id
    };
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

export const getStatusColor = (status) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'busy': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};
