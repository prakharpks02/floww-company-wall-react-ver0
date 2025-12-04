import { cookieUtils } from '../../utils/cookieUtils';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get authorization headers for employee API
const getEmployeeApiHeaders = () => {
  const { adminToken, employeeToken, employeeId } = cookieUtils.getAuthTokens();
  
  if (isAdminEnvironment()) {
    // Use admin token and ID in admin environment
    return {
      'Content-Type': 'application/json',
      'Authorization': adminToken,
      'floww-admin-token': adminToken,
    };
  }
  
  // Use employee token and ID in employee environment
  return {
    'Content-Type': 'application/json',
    'Authorization': employeeToken,
    'floww-mail-token': employeeToken,
    'employeeId': employeeId,
  };
};

// Helper function to detect admin environment
const isAdminEnvironment = () => {
  return window.location.pathname.includes('/crm');
};

// Helper function to get the proper API base URL
const getChatApiBaseUrl = (endpoint = '') => {
  // For message sending, always use regular chat endpoints even in admin mode
  // Admin endpoints may not support message sending
  if (endpoint.includes('send_message')) {
    return `${BASE_URL}/api/wall/chat`;
  }
  
  if (isAdminEnvironment()) {
    return `${BASE_URL}/api/wall/chat/admin`;
  }
  return `${BASE_URL}/api/wall/chat`;
};

// Helper function to get authorization headers for chat API
const getChatApiHeaders = () => {
  // Get tokens from cookies
  const { adminToken, employeeToken } = cookieUtils.getAuthTokens();
  
  // Use admin token in admin environment, employee token otherwise
  const token = isAdminEnvironment() ? adminToken : employeeToken;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token, // No Bearer prefix, matching existing API pattern
  };
};

// Helper function to handle API responses
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

// Chat API functions
export const chatAPI = {
  // Get all employees
  getAllEmployees: async () => {
    try {
      const headers = getEmployeeApiHeaders();
    
      
      const response = await fetch(`${BASE_URL}/api/employee/get-all-employees/`, {
        method: 'GET',
        headers,
      });
      
      const data = await handleResponse(response);
    
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Create a chat room
  createRoom: async (receiverEmployeeId) => {
    try {
      const headers = getChatApiHeaders();
      const body = {
        receiver_employee_id: String(receiverEmployeeId) // Ensure it's a string
      };
      
      const apiUrl = `${getChatApiBaseUrl()}/rooms/create`;
     
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // List all chat rooms
  listAllRooms: async () => {
    try {
      const headers = getChatApiHeaders();
      const body = {
        last_checked_at: new Date().toISOString()
      };
      
      const apiUrl = `${getChatApiBaseUrl()}/rooms/list_all_rooms`;
  
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // Get chat room details
  getRoomDetails: async (roomId) => {
    try {
      const headers = getChatApiHeaders();
      
      const apiUrl = `${getChatApiBaseUrl()}/rooms/${roomId}/get_details`;

      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });
      
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // Get chat room messages
  getRoomMessages: async (roomId) => {
    try {
      const headers = getChatApiHeaders();
      
      const apiUrl = `${getChatApiBaseUrl()}/rooms/${roomId}/get_messages`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });
      
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  },

  // Send message via HTTP API (for database persistence)
  sendMessageHttp: async (roomId, content, senderId, fileUrls = [], replyToMessageId = null) => {
    try {
      const headers = getChatApiHeaders();
      
      // Use the exact format expected by the API
      const body = {
        content: String(content),
        sender_id: String(senderId),
        file_urls: Array.isArray(fileUrls) ? fileUrls : []
      };
      
      // Only add reply_to_message_id if it exists
      if (replyToMessageId) {
        body.reply_to_message_id = String(replyToMessageId);
      }
      
      const apiUrl = `${getChatApiBaseUrl('send_message')}/rooms/${roomId}/send_message`;
      
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      
      const result = await handleResponse(response);
    
      
      return result;
    } catch (error) {
      // Don't throw the error - this is a fallback mechanism
      return { status: 'error', message: error.message };
    }
  },

  // Forward message to multiple rooms
  forwardMessage: async (messageId, roomIds) => {
    try {
      const headers = getChatApiHeaders();
      
      const body = {
        room_ids: Array.isArray(roomIds) ? roomIds : [roomIds]
      };
      
      const apiUrl = `${getChatApiBaseUrl()}/messages/${messageId}/forward`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
   
      
      const result = await handleResponse(response);
      
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Find the actual employee ID format for a given participant ID
  resolveEmployeeId: async (partialId) => {
    try {
      const roomsResponse = await chatAPI.listAllRooms();
      
      if (roomsResponse.status !== 'success' || !Array.isArray(roomsResponse.data)) {
        return null;
      }
      
      // Search through all participants to find matching employee ID
      for (const room of roomsResponse.data) {
        if (room.participants && Array.isArray(room.participants)) {
          for (const participant of room.participants) {
            if (participant && participant.employee_id) {
              const employeeId = String(participant.employee_id);
              
              // Check if this employee ID contains the partial ID
              if (employeeId.includes(String(partialId))) {
            
                return {
                  fullEmployeeId: employeeId,
                  employeeName: participant.employee_name || 'Unknown',
                  profilePicture: participant.profile_picture_link || null
                };
              }
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },

  // Find existing room with a specific participant
  findRoomWithParticipant: async (participantEmployeeId) => {
    try {
      // First try to resolve the actual employee ID
      const resolvedEmployee = await chatAPI.resolveEmployeeId(participantEmployeeId);
      let searchIds = [String(participantEmployeeId)];
      
      if (resolvedEmployee) {
        searchIds.push(resolvedEmployee.fullEmployeeId);
       
      }

      const participantId = String(participantEmployeeId); // Ensure it's a string

      
      // Generate possible ID formats to match against
      const possibleIds = [
        participantId, // Original ID
        `emp-${participantId}`, // Add emp- prefix
        participantId.replace('emp-', ''), // Remove emp- prefix if exists
      ];
      
      // If participantId is just a number, also try to find employee IDs that contain this number
      const isNumericId = /^\d+$/.test(participantId);

      

      
      const roomsResponse = await chatAPI.listAllRooms();

      
      if (roomsResponse.status === 'success' && Array.isArray(roomsResponse.data)) {
       
        
        // Find room where the participant is involved
        const existingRoom = roomsResponse.data.find(room => {

          
          // Check if any participant in this room matches our search IDs
          if (room.participants && Array.isArray(room.participants)) {
            const participantMatch = room.participants.some(participant => {
              if (participant && typeof participant === 'object' && participant.employee_id) {
                const participantEmployeeId = String(participant.employee_id);
                
                // Check if this participant matches any of our search IDs (including resolved IDs)
                const isMatch = searchIds.some(searchId => participantEmployeeId === searchId);
                
                if (isMatch) {
                 
                  return true;
                }
                
                return false;
              }
              return false;
            });
            
            if (participantMatch) {
              return true;
            }
          }
          
          return false;
        });
        
        if (existingRoom) {
    
          return {
            room_id: existingRoom.room_id,
            ...existingRoom
          };
        } else {
        
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  },

  // Helper function to get actual employeeId for a given employee object
  getEmployeeIdForChat: async (employee) => {
    try {
      // If the employee object already has the correct employeeId format, use it
      if (employee.employeeId && employee.employeeId.startsWith('emp-')) {
      
        return employee.employeeId;
      }
      
      // Otherwise, fetch all employees and find the matching one
     
      const employeesResponse = await chatAPI.getAllEmployees();
      
      if (employeesResponse.status === 'success' && Array.isArray(employeesResponse.response)) {
        // Find employee by name or email match
        const matchedEmployee = employeesResponse.response.find(emp => 
          emp.employeeName === employee.name || 
          emp.companyEmail === employee.email ||
          emp.employeeId === employee.employeeId
        );
        
        if (matchedEmployee) {
         return matchedEmployee.employeeId;
        } else {
          return employee.employeeId || employee.id;
        }
      } else {
        return employee.employeeId || employee.id;
      }
    } catch (error) {
      // Fallback to original ID
      return employee.employeeId || employee.id;
    }
  }
};

// Test function to verify API connectivity
// const testChatAPI = async () => {
 
  
//   try {

//     const roomsResponse = await chatAPI.listAllRooms();
 
    
//     // Test creating a room (if no rooms exist)
//     if (roomsResponse.status === 'success' && roomsResponse.data && roomsResponse.data.length === 0) {
     
//       const createResponse = await chatAPI.createRoom('emp-k15sLcnjub9r');
   
//     }
    
//     return true;
//   } catch (error) {
//     return false;
//   }
// };

// WebSocket Chat Manager Class
export class ChatWebSocketManager {
  constructor() {
    this.ws = null;
    this.roomId = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.messageCallbacks = [];
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
  }

  // Connect to WebSocket for a specific room
  connect(roomId) {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      return;
    }
    
    // If already connected to the same room, don't reconnect
    if (this.ws && this.roomId === roomId) {
      // Check if connection is open or connecting
      if (this.ws.readyState === WebSocket.OPEN) {
        return;
      }
      if (this.ws.readyState === WebSocket.CONNECTING) {
        return;
      }
    }

    // Close existing connection if connecting to a different room
    if (this.ws && this.roomId !== roomId) {
      this.ws.close();
      this.isConnected = false;
    }

    this.roomId = roomId;
    this.isConnecting = true;
    
    try {
      // Determine if this is admin or employee environment
      const isAdmin = isAdminEnvironment();
      const authType = isAdmin ? 'admin' : 'employee';
      
      // Get the appropriate authorization token
      const { adminToken, employeeToken } = cookieUtils.getAuthTokens();
      const authToken = isAdmin ? adminToken : employeeToken;
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }
      
      // WebSocket URL with authorization and auth-type as query parameters
      const wsUrl = `wss://console.gofloww.xyz/ws/chat/${roomId}/?authorization=${authToken}&floww-socket-auth-type=${authType}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = (event) => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionCallbacks(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          this.notifyMessageCallbacks(messageData);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyConnectionCallbacks(false);
        
        // Attempt to reconnect if not a clean close
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(this.roomId);
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        this.isConnecting = false;
        this.notifyErrorCallbacks(error);
      };
      
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.isConnecting = false;
      this.notifyErrorCallbacks(error);
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.roomId = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Send message via WebSocket
  sendMessage(content, senderId, fileUrls = [], replyToMessageId = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send - not connected. ReadyState:', this.ws?.readyState);
      throw new Error('WebSocket not connected');
    }

    const message = {
      content,
      sender_id: senderId,
      file_urls: fileUrls,
      reply_to_message_id: replyToMessageId
    };

    try {
      const messageJson = JSON.stringify(message);
      this.ws.send(messageJson);
      return true; // Return success
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
      return false; // Return failure
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      roomId: this.roomId,
      readyState: this.ws ? this.ws.readyState : null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Subscribe to message events
  onMessage(callback) {
    this.messageCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to connection events
  onConnection(callback) {
    this.connectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to error events
  onError(callback) {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Notify message callbacks
  notifyMessageCallbacks(messageData) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(messageData);
      } catch (error) {
      }
    });
  }

  // Notify connection callbacks
  notifyConnectionCallbacks(isConnected) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
      }
    });
  }

  // Notify error callbacks
  notifyErrorCallbacks(error) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
      }
    });
  }
}

// Create a global WebSocket instance
export const chatWebSocket = new ChatWebSocketManager();

// Enhanced Chat API with WebSocket integration
export const enhancedChatAPI = {
  /**
   * Create room and establish WebSocket connection
   * WARNING: This function connects WebSocket automatically. 
   * If using useChatWebSocket hook, the hook will handle connections.
   * Only call this when not using the hook to avoid duplicate connections.
   */
  createRoomAndConnect: async (receiverEmployeeId) => {
    const participantId = String(receiverEmployeeId); // Ensure it's a string
  
    try {
      const resolvedEmployee = await chatAPI.resolveEmployeeId(participantId);
      
      // Use the resolved employee ID if available, otherwise use the original
      const targetEmployeeId = resolvedEmployee?.fullEmployeeId || participantId;
      
      // First, try to find existing room
      const existingRoom = await chatAPI.findRoomWithParticipant(targetEmployeeId);
      
      let finalRoomResponse;
      
      if (existingRoom && existingRoom.room_id) {
        finalRoomResponse = existingRoom;
      } else {
        const newRoomResponse = await chatAPI.createRoom(targetEmployeeId);
        
        if (newRoomResponse.status === 'success') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit for room to be created
     
          const newRoom = await chatAPI.findRoomWithParticipant(targetEmployeeId);
          
          if (newRoom && newRoom.room_id) {
            finalRoomResponse = newRoom;
          } else {
            throw new Error('Failed to find newly created room');
          }
        } else if (newRoomResponse.status === 'failure' && newRoomResponse.message === 'Chat room already exists.') {
          // If room already exists, try multiple times to find it with delays
          let existingRoom = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            existingRoom = await chatAPI.findRoomWithParticipant(targetEmployeeId);
            
            if (existingRoom && existingRoom.room_id) {
              break;
            }
            
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
          
          if (existingRoom && existingRoom.room_id) {
            finalRoomResponse = existingRoom;
          } else {
            throw new Error(`Room exists but could not be found after 3 attempts. Participant ID: ${targetEmployeeId} (original: ${participantId})`);
          }
        } else {
          throw new Error(`Failed to create room: ${newRoomResponse.message || 'Unknown error'}`);
        }
      }
      
      // Connect WebSocket to the room
      if (finalRoomResponse.room_id) {
        // Verify room exists by getting its details
        try {
          await chatAPI.getRoomDetails(finalRoomResponse.room_id);
        } catch (error) {
          console.error('[API] Failed to get room details:', error);
          // Continue anyway, as room might still be valid
        }
        
        // Wait a bit before connecting to ensure room is fully created
        await new Promise(resolve => setTimeout(resolve, 500));
        
        chatWebSocket.connect(finalRoomResponse.room_id);
        
        // Wait for connection to establish
        for (let i = 0; i < 15; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          const status = chatWebSocket.getConnectionStatus();
          
          if (status.isConnected) {
            return {
              ...finalRoomResponse,
              websocketConnected: true
            };
          }
        }
        
        return {
          ...finalRoomResponse,
          websocketConnected: false
        };
      } else {
        return finalRoomResponse;
      }

    } catch (error) {
      throw error;
    }
  },

  // Send message via WebSocket with retry logic and persistence verification
  sendMessage: async (content, senderId, fileUrls = [], replyToMessageId = null, roomId = null) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connection status
        const status = chatWebSocket.getConnectionStatus();
        
        if (status.isConnected) {
          // Send via WebSocket
          const webSocketResult = await chatWebSocket.sendMessage(content, senderId, fileUrls, replyToMessageId);
         
          // Create message object for immediate local storage and verification
          const messageForStorage = {
            id: `temp_${Date.now()}_${Math.random()}`, // Temporary ID
            message_id: `temp_${Date.now()}_${Math.random()}`,
            content: content,
            sender: {
              employee_id: senderId,
              employee_name: 'You', // Will be updated when verified
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            file_urls: fileUrls,
            reply_to_message: replyToMessageId,
            is_starred: false,
            _temporary: true, // Flag to indicate this is a temporary message
            _sendTimestamp: Date.now()
          };
          
          // If we have roomId, schedule verification after delay
          if (roomId) {
            setTimeout(async () => {
              await enhancedChatAPI.verifyMessagePersistence(roomId, content, senderId, messageForStorage._sendTimestamp);
            }, 3000);
          }
          
          return {
            success: webSocketResult,
            temporaryMessage: messageForStorage,
            requiresVerification: !!roomId
          };
        } else {
          if (attempt < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            // Check connection again after waiting
            const newStatus = chatWebSocket.getConnectionStatus();
            if (newStatus.isConnected) {
              continue;
            }
          }
          
          if (attempt === maxRetries) {
            throw new Error('WebSocket not connected. Please ensure you\'re connected to the chat room.');
          }
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry for other errors too
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  },

  // Verify if message was persisted in database and handle if not
  verifyMessagePersistence: async (roomId, content, senderId, sendTimestamp) => {
    try {
      // Get latest messages from API
      const messagesResponse = await chatAPI.getRoomMessages(roomId);
      
      if (messagesResponse.status === 'success' && Array.isArray(messagesResponse.data)) {
        // Look for the message we sent within the last 10 seconds
        const recentMessages = messagesResponse.data.filter(msg => {
          const msgTime = new Date(msg.created_at).getTime();
          const timeDiff = Math.abs(msgTime - sendTimestamp);
          return timeDiff < 10000; // Within 10 seconds
        });
        
        // Check if our message is among the recent messages
        const foundMessage = recentMessages.find(msg => 
          msg.content === content && 
          msg.sender?.employee_id === senderId
        );
        
        if (foundMessage) {
          return { persisted: true, message: foundMessage };
        } else {
          return { persisted: false, reason: 'Message not found in database after WebSocket send' };
        }
      } else {
        return { persisted: false, reason: 'Could not retrieve messages for verification' };
      }
    } catch (error) {
      return { persisted: false, reason: error.message };
    }
  },

  // Find existing room with participant
  findRoomWithParticipant: async (participantEmployeeId) => {
    return await chatAPI.findRoomWithParticipant(participantEmployeeId);
  },

  // List all rooms
  listAllRooms: async () => {
    return await chatAPI.listAllRooms();
  },

  // Get messages for a room
  getRoomMessages: async (roomId) => {
    return await chatAPI.getRoomMessages(roomId);
  },

  // Send message via HTTP API for database persistence
  sendMessageHttp: async (roomId, content, senderId, fileUrls = [], replyToMessageId = null) => {
    return await chatAPI.sendMessageHttp(roomId, content, senderId, fileUrls, replyToMessageId);
  },

  // Forward message to multiple rooms
  forwardMessage: async (messageId, roomIds) => {
    return await chatAPI.forwardMessage(messageId, roomIds);
  },

  // WebSocket connection management
  connectToRoom: (roomId) => {
    return chatWebSocket.connect(roomId);
  },
  disconnectFromRoom: () => {
    return chatWebSocket.disconnect();
  },
  getConnectionStatus: () => {
    const status = chatWebSocket.getConnectionStatus();
    return status;
  },

  // Event subscriptions
  onMessage: (callback) => chatWebSocket.onMessage(callback),
  onConnection: (callback) => chatWebSocket.onConnection(callback),
  onError: (callback) => chatWebSocket.onError(callback)
};



export default enhancedChatAPI;