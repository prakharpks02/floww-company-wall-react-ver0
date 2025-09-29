import { cookieUtils } from '../../utils/cookieUtils';

const BASE_URL = 'https://dev.gofloww.co';

// Helper function to get authorization headers for employee API
const getEmployeeApiHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'token-68VCKDcyqrds',
    'floww-mail-token': 'token-68VCKDcyqrds',
    'employeeId': 'emp-k15sLcnjub9r',
  };
};

// Helper function to get authorization headers for chat API
const getChatApiHeaders = () => {
  // Use the working token from API testing
  const token = '88e68a3c158170f5144582c7fd759e99c64aa53406d6a6ae32e697bb50a6f374';
  console.log('Using token for authorization:', token ? `${token.substring(0, 10)}...` : 'No token found');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token, // No Bearer prefix, matching existing API pattern
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log('API Response status:', response.status);
  console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    let error;
    try {
      error = await response.json();
      console.log('API Error response body:', error);
    } catch (e) {
      error = { message: `HTTP error! status: ${response.status}` };
      console.log('Failed to parse error response, using fallback message');
    }
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('API Success response:', data);
  return data;
};

// Chat API functions
export const chatAPI = {
  // Get all employees
  getAllEmployees: async () => {
    try {
      const headers = getEmployeeApiHeaders();
      
      console.log('Getting all employees with:');
      console.log('URL:', `${BASE_URL}/api/employee/get-all-employees/`);
      console.log('Headers:', headers);
      
      const response = await fetch(`${BASE_URL}/api/employee/get-all-employees/`, {
        method: 'GET',
        headers,
      });
      
      const data = await handleResponse(response);
      console.log('Employees response:', data);
      return data;
    } catch (error) {
      console.error('Error getting employees:', error);
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
      
      console.log('Creating chat room with:');
      console.log('URL:', `${BASE_URL}/api/wall/chat/rooms/create`);
      console.log('Headers:', headers);
      console.log('Body:', body);
      
      const response = await fetch(`${BASE_URL}/api/wall/chat/rooms/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating chat room:', error);
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
      
      console.log('Getting all chat rooms with:');
      console.log('URL:', `${BASE_URL}/api/wall/chat/rooms/list_all_rooms`);
      console.log('Headers:', headers);
      console.log('Body:', body);
      
      const response = await fetch(`${BASE_URL}/api/wall/chat/rooms/list_all_rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error getting all rooms:', error);
      throw error;
    }
  },

  // Get chat room details
  getRoomDetails: async (roomId) => {
    try {
      const headers = getChatApiHeaders();
      
      console.log('Getting room details with:');
      console.log('URL:', `${BASE_URL}/api/wall/chat/rooms/${roomId}/get_details`);
      console.log('Headers:', headers);
      
      const response = await fetch(`${BASE_URL}/api/wall/chat/rooms/${roomId}/get_details`, {
        method: 'GET',
        headers,
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error getting room details:', error);
      throw error;
    }
  },

  // Get chat room messages
  getRoomMessages: async (roomId) => {
    try {
      const headers = getChatApiHeaders();
      
      console.log('Getting room messages with:');
      console.log('URL:', `${BASE_URL}/api/wall/chat/rooms/${roomId}/get_messages`);
      console.log('Headers:', headers);
      
      const response = await fetch(`${BASE_URL}/api/wall/chat/rooms/${roomId}/get_messages`, {
        method: 'GET',
        headers,
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error getting room messages:', error);
      throw error;
    }
  },

  // Send message via HTTP API (for database persistence)
  sendMessageHttp: async (roomId, content, senderId, fileUrls = [], replyToMessageId = null) => {
    try {
      const headers = getChatApiHeaders();
      const body = {
        room_id: String(roomId),
        content: String(content),
        sender_id: String(senderId),
        file_urls: Array.isArray(fileUrls) ? fileUrls : [],
        reply_to_message_id: replyToMessageId ? String(replyToMessageId) : null
      };
      
      console.log('Sending message via HTTP API:');
      console.log('URL:', `${BASE_URL}/api/wall/chat/rooms/${roomId}/send_message`);
      console.log('Headers:', headers);
      console.log('Body:', body);
      
      const response = await fetch(`${BASE_URL}/api/wall/chat/rooms/${roomId}/send_message`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error sending message via HTTP:', error);
      // Don't throw the error - this is a fallback mechanism
      return { status: 'error', message: error.message };
    }
  },

  // Find the actual employee ID format for a given participant ID
  resolveEmployeeId: async (partialId) => {
    try {
      const roomsResponse = await chatAPI.listAllRooms();
      
      if (roomsResponse.status !== 'success' || !Array.isArray(roomsResponse.data)) {
        console.log('No rooms found for employee ID resolution');
        return null;
      }

      console.log(`🔍 Resolving employee ID for: ${partialId}`);
      
      // Search through all participants to find matching employee ID
      for (const room of roomsResponse.data) {
        if (room.participants && Array.isArray(room.participants)) {
          for (const participant of room.participants) {
            if (participant && participant.employee_id) {
              const employeeId = String(participant.employee_id);
              
              // Check if this employee ID contains the partial ID
              if (employeeId.includes(String(partialId))) {
                console.log(`✅ Resolved employee ID: ${partialId} → ${employeeId}`);
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
      
      console.log(`❌ Could not resolve employee ID for: ${partialId}`);
      return null;
    } catch (error) {
      console.error('Error resolving employee ID:', error);
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
        console.log(`✅ Using resolved employee ID: ${resolvedEmployee.fullEmployeeId} for participant ${participantEmployeeId}`);
      }

      const participantId = String(participantEmployeeId); // Ensure it's a string
      console.log('🔍 Finding existing room with participant:', participantId, 'Search IDs:', searchIds);
      
      // Generate possible ID formats to match against
      const possibleIds = [
        participantId, // Original ID
        `emp-${participantId}`, // Add emp- prefix
        participantId.replace('emp-', ''), // Remove emp- prefix if exists
      ];
      
      // If participantId is just a number, also try to find employee IDs that contain this number
      const isNumericId = /^\d+$/.test(participantId);
      console.log('🔢 Is numeric ID:', isNumericId, 'Value:', participantId);
      
      console.log('🎯 Possible ID formats to match:', possibleIds);
      
      const roomsResponse = await chatAPI.listAllRooms();
      console.log('📋 All rooms response:', roomsResponse);
      
      if (roomsResponse.status === 'success' && Array.isArray(roomsResponse.data)) {
        console.log('🔍 Searching through', roomsResponse.data.length, 'rooms...');
        
        // Find room where the participant is involved
        const existingRoom = roomsResponse.data.find(room => {
          console.log('🔍 Checking room:', {
            room_id: room.room_id,
            room_name: room.room_name,
            participants: room.participants,
            receiver_id: room.receiver_id,
            sender_id: room.sender_id,
            receiver_employee_id: room.receiver_employee_id,
            sender_employee_id: room.sender_employee_id
          });
          console.log('🎯 Looking for participant:', participantId);
          
          // Check if any participant in this room matches our search IDs
          if (room.participants && Array.isArray(room.participants)) {
            const participantMatch = room.participants.some(participant => {
              if (participant && typeof participant === 'object' && participant.employee_id) {
                const participantEmployeeId = String(participant.employee_id);
                
                // Check if this participant matches any of our search IDs (including resolved IDs)
                const isMatch = searchIds.some(searchId => participantEmployeeId === searchId);
                
                if (isMatch) {
                  console.log(`✅ Found participant match: ${participantEmployeeId} matches search criteria`);
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
          console.log('✅ Found existing room with participant:', existingRoom);
          return {
            room_id: existingRoom.room_id,
            ...existingRoom
          };
        } else {
          console.log('ℹ️ No existing room found with participant:', participantId);
          return null;
        }
      } else {
        console.warn('⚠️ Invalid response format from listAllRooms:', roomsResponse);
        return null;
      }
    } catch (error) {
      console.error('❌ Error finding room with participant:', error);
      throw error;
    }
  },

  // Helper function to get actual employeeId for a given employee object
  getEmployeeIdForChat: async (employee) => {
    try {
      // If the employee object already has the correct employeeId format, use it
      if (employee.employeeId && employee.employeeId.startsWith('emp-')) {
        console.log('Using existing employeeId:', employee.employeeId);
        return employee.employeeId;
      }
      
      // Otherwise, fetch all employees and find the matching one
      console.log('Fetching all employees to find correct employeeId for:', employee);
      const employeesResponse = await chatAPI.getAllEmployees();
      
      if (employeesResponse.status === 'success' && Array.isArray(employeesResponse.response)) {
        // Find employee by name or email match
        const matchedEmployee = employeesResponse.response.find(emp => 
          emp.employeeName === employee.name || 
          emp.companyEmail === employee.email ||
          emp.employeeId === employee.employeeId
        );
        
        if (matchedEmployee) {
          console.log('Found matching employee:', matchedEmployee);
          return matchedEmployee.employeeId;
        } else {
          console.warn('No matching employee found in API response');
          return employee.employeeId || employee.id;
        }
      } else {
        console.warn('Invalid employees API response');
        return employee.employeeId || employee.id;
      }
    } catch (error) {
      console.error('Error getting employee ID for chat:', error);
      // Fallback to original ID
      return employee.employeeId || employee.id;
    }
  }
};

// Test function to verify API connectivity
const testChatAPI = async () => {
  console.log('🧪 Testing Chat API connectivity...');
  
  try {
    // Test listing rooms
    console.log('Testing room listing...');
    const roomsResponse = await chatAPI.listAllRooms();
    console.log('✅ Room listing successful:', roomsResponse);
    
    // Test creating a room (if no rooms exist)
    if (roomsResponse.status === 'success' && roomsResponse.data && roomsResponse.data.length === 0) {
      console.log('No rooms found, testing room creation...');
      const createResponse = await chatAPI.createRoom('emp-k15sLcnjub9r');
      console.log('✅ Room creation successful:', createResponse);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Chat API test failed:', error);
    return false;
  }
};

// Export test function for debugging
if (typeof window !== 'undefined') {
  window.testChatAPI = testChatAPI;
}

// WebSocket Chat Manager Class
export class ChatWebSocketManager {
  constructor() {
    this.ws = null;
    this.roomId = null;
    this.isConnected = false;
    this.messageCallbacks = [];
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
  }

  // Connect to WebSocket for a specific room
  connect(roomId) {
    console.log('🔗 WebSocket connect requested for room:', roomId);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomId === roomId) {
      console.log('✅ Already connected to room:', roomId);
      return;
    }

    // Close existing connection if any
    if (this.ws) {
      console.log('🔌 Closing existing WebSocket connection');
      this.ws.close();
    }

    this.roomId = roomId;
    
    try {
      const wsUrl = `wss://dev.gofloww.co/ws/chat/${roomId}/`;
      console.log('🔗 Connecting to WebSocket URL:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = (event) => {
        console.log('✅ WebSocket connected successfully');
        console.log('🔍 Connection event:', event);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionCallbacks(true);
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('📨 WebSocket MESSAGE RECEIVED:');
          console.log('🔍 Raw message data:', event.data);
          
          const messageData = JSON.parse(event.data);
          console.log('✅ Parsed message data:', messageData);
          console.log('👤 Sender ID:', messageData.sender?.employee_id || messageData.sender_id);
          
          this.notifyMessageCallbacks(messageData);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          console.error('🔍 Raw message data:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed');
        console.log('🔍 Close event:', event);
        this.isConnected = false;
        this.notifyConnectionCallbacks(false);
        
        // Attempt to reconnect if not a clean close
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(this.roomId);
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.notifyErrorCallbacks(error);
      };
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.notifyErrorCallbacks(error);
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    console.log('🔌 WebSocket disconnect requested');
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.roomId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  // Send message via WebSocket
  sendMessage(content, senderId, fileUrls = [], replyToMessageId = null) {
    console.log('📤 WebSocket sendMessage called');
    console.log('🔍 Connection status:', {
      isConnected: this.isConnected,
      wsExists: !!this.ws,
      readyState: this.ws ? this.ws.readyState : 'No WebSocket',
      roomId: this.roomId
    });

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('❌ Cannot send message: WebSocket not connected');
      console.log('🔍 Debug info:', {
        isConnected: this.isConnected,
        wsExists: !!this.ws,
        roomId: this.roomId
      });
      throw new Error('WebSocket not connected');
    }

    const message = {
      content,
      sender_id: senderId,
      file_urls: fileUrls,
      reply_to_message_id: replyToMessageId
    };

    console.log('📤 SENDING WebSocket message:');
    console.log('💬 Content:', content);
    console.log('👤 Sender ID:', senderId);
    console.log('📎 File URLs:', fileUrls);
    console.log('↩️ Reply to message ID:', replyToMessageId);
    console.log('📦 Complete message object:', message);
    console.log('🌐 Room ID:', this.roomId);
    console.log('⏰ Send timestamp:', new Date().toISOString());

    try {
      const messageJson = JSON.stringify(message);
      console.log('📄 JSON message being sent:', messageJson);
      this.ws.send(messageJson);
      console.log('✅ Message sent successfully via WebSocket');
      return true; // Return success
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        messageData: message
      });
      return false; // Return failure
    }
  }

  // Get connection status
  getConnectionStatus() {
    const status = {
      isConnected: this.isConnected,
      roomId: this.roomId,
      readyState: this.ws ? this.ws.readyState : null,
      reconnectAttempts: this.reconnectAttempts
    };
    
    console.log('📊 WebSocket connection status:', status);
    return status;
  }

  // Subscribe to message events
  onMessage(callback) {
    console.log('👂 Subscribing to WebSocket messages');
    this.messageCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      console.log('👂❌ Unsubscribing from WebSocket messages');
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to connection events
  onConnection(callback) {
    console.log('👂 Subscribing to WebSocket connection events');
    this.connectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      console.log('👂❌ Unsubscribing from WebSocket connection events');
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to error events
  onError(callback) {
    console.log('👂 Subscribing to WebSocket error events');
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      console.log('👂❌ Unsubscribing from WebSocket error events');
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Notify message callbacks
  notifyMessageCallbacks(messageData) {
    console.log('📢 Notifying', this.messageCallbacks.length, 'message callbacks');
    this.messageCallbacks.forEach(callback => {
      try {
        callback(messageData);
      } catch (error) {
        console.error('❌ Error in message callback:', error);
      }
    });
  }

  // Notify connection callbacks
  notifyConnectionCallbacks(isConnected) {
    console.log('📢 Notifying', this.connectionCallbacks.length, 'connection callbacks:', isConnected);
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('❌ Error in connection callback:', error);
      }
    });
  }

  // Notify error callbacks
  notifyErrorCallbacks(error) {
    console.log('📢 Notifying', this.errorCallbacks.length, 'error callbacks');
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('❌ Error in error callback:', error);
      }
    });
  }
}

// Create a global WebSocket instance
export const chatWebSocket = new ChatWebSocketManager();

// Enhanced Chat API with WebSocket integration
export const enhancedChatAPI = {
  // Create room and establish WebSocket connection
  createRoomAndConnect: async (receiverEmployeeId) => {
    console.log('🏠 Enhanced API createRoomAndConnect called');
    const participantId = String(receiverEmployeeId); // Ensure it's a string
    console.log('🔍 Receiver employee ID (original):', receiverEmployeeId);
    console.log('🔍 Receiver employee ID (as string):', participantId);
    console.log('🔍 Type of receiverEmployeeId:', typeof receiverEmployeeId);
    
    try {
      // First, try to resolve the proper employee ID format
      console.log('🔍 Resolving employee ID format...');
      const resolvedEmployee = await chatAPI.resolveEmployeeId(participantId);
      console.log('🔍 Resolved employee data:', resolvedEmployee);
      
      // Use the resolved employee ID if available, otherwise use the original
      const targetEmployeeId = resolvedEmployee?.fullEmployeeId || participantId;
      console.log('🎯 Target employee ID for room operations:', targetEmployeeId);
      
      // First, try to find existing room
      console.log('🔍 Checking for existing room...');
      const existingRoom = await chatAPI.findRoomWithParticipant(targetEmployeeId);
      
      let finalRoomResponse;
      
      if (existingRoom && existingRoom.room_id) {
        console.log('✅ Found existing room:', existingRoom.room_id);
        finalRoomResponse = existingRoom;
      } else {
        console.log('🏠 No existing room found, creating new room...');
        const newRoomResponse = await chatAPI.createRoom(targetEmployeeId);
        
        if (newRoomResponse.status === 'success') {
          console.log('✅ Room created successfully, now finding the new room...');
          console.log('🔍 Room creation response:', newRoomResponse);
          
          // After creating room, we need to get the room details
          // The API doesn't return room_id in create response, so we find it
          console.log('⏳ Waiting 1 second for room to be created...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit for room to be created
          console.log('🔍 Now searching for newly created room with participant ID:', targetEmployeeId);
          const newRoom = await chatAPI.findRoomWithParticipant(targetEmployeeId);
          console.log('🔍 Find room result:', newRoom);
          
          if (newRoom && newRoom.room_id) {
            finalRoomResponse = newRoom;
          } else {
            throw new Error('Failed to find newly created room');
          }
        } else if (newRoomResponse.status === 'failure' && newRoomResponse.message === 'Chat room already exists.') {
          console.log('ℹ️ Room already exists, finding existing room...');
          
          // If room already exists, try multiple times to find it with delays
          let existingRoom = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`🔍 Attempt ${attempt}/3 to find existing room...`);
            
            existingRoom = await chatAPI.findRoomWithParticipant(targetEmployeeId);
            
            if (existingRoom && existingRoom.room_id) {
              console.log('✅ Found existing room:', existingRoom.room_id);
              break;
            }
            
            if (attempt < 3) {
              console.log(`⏳ Room not found, waiting ${attempt * 1000}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
          
          if (existingRoom && existingRoom.room_id) {
            finalRoomResponse = existingRoom;
          } else {
            console.error('❌ Could not find room after multiple attempts');
            console.log('🔍 Listing all rooms to debug...');
            
            // Debug: List all rooms to see what's available
            try {
              const allRoomsResponse = await chatAPI.listAllRooms();
              console.log('📋 All available rooms:', allRoomsResponse);
            } catch (debugError) {
              console.error('❌ Error listing rooms for debug:', debugError);
            }
            
            throw new Error(`Room exists but could not be found after 3 attempts. Participant ID: ${targetEmployeeId} (original: ${participantId})`);
          }
        } else {
          console.log('❌ Room creation failed:', newRoomResponse);
          throw new Error(`Failed to create room: ${newRoomResponse.message || 'Unknown error'}`);
        }
      }
      
      // Connect WebSocket to the room
      if (finalRoomResponse.room_id) {
        console.log('🔗 Connecting WebSocket to room:', finalRoomResponse.room_id);
        chatWebSocket.connect(finalRoomResponse.room_id);
        
        console.log('✅ Room creation and WebSocket connection process completed');
        return {
          ...finalRoomResponse,
          websocketConnected: true
        };
      } else {
        console.warn('⚠️ No room_id found in final response:', finalRoomResponse);
        return finalRoomResponse;
      }

    } catch (error) {
      console.error('❌ Error creating room and connecting:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        receiverEmployeeId: receiverEmployeeId
      });
      throw error;
    }
  },

  // Send message via WebSocket with retry logic and persistence verification
  sendMessage: async (content, senderId, fileUrls = [], replyToMessageId = null, roomId = null) => {
    console.log('📤 Enhanced API sendMessage called');
    console.log('🔍 Parameters:', { content, senderId, fileUrls, replyToMessageId, roomId });
    
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${maxRetries} to send message`);
        
        // Check connection status
        const status = chatWebSocket.getConnectionStatus();
        console.log('🔍 Connection status:', status);
        
        if (status.isConnected) {
          // Send via WebSocket
          const webSocketResult = await chatWebSocket.sendMessage(content, senderId, fileUrls, replyToMessageId);
          console.log('🔍 WebSocket send result:', webSocketResult);
          
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
          
          console.log('💾 Created temporary message for local storage:', messageForStorage);
          
          // If we have roomId, schedule verification after delay
          if (roomId) {
            console.log('⏱️ Scheduling message persistence verification in 3 seconds...');
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
          console.log(`⚠️ Attempt ${attempt}: WebSocket not connected, waiting...`);
          
          if (attempt < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            // Check connection again after waiting
            const newStatus = chatWebSocket.getConnectionStatus();
            if (newStatus.isConnected) {
              console.log('✅ WebSocket connected after waiting, retrying...');
              continue;
            }
          }
          
          if (attempt === maxRetries) {
            console.log('❌ Max retries reached, WebSocket still not connected');
            throw new Error('WebSocket connection failed after retries');
          }
        }
      } catch (error) {
        console.log(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          console.log('❌ All retry attempts failed');
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
      console.log('🔍 Verifying message persistence for room:', roomId);
      console.log('🔍 Looking for message with content:', content);
      console.log('🔍 Sent by:', senderId);
      console.log('🔍 Send timestamp:', sendTimestamp);
      
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
          console.log('✅ Message successfully persisted in database:', foundMessage.message_id);
          return { persisted: true, message: foundMessage };
        } else {
          console.log('❌ Message NOT found in database - WebSocket backend may not be persisting messages');
          console.log('📋 Recent messages found:', recentMessages.length);
          console.log('📋 Expected content:', content);
          console.log('📋 Expected sender:', senderId);
          
          // Log for debugging
          recentMessages.forEach((msg, index) => {
            console.log(`📋 Recent message ${index + 1}:`, {
              content: msg.content,
              sender: msg.sender?.employee_id,
              created_at: msg.created_at
            });
          });
          
          return { persisted: false, reason: 'Message not found in database after WebSocket send' };
        }
      } else {
        console.log('⚠️ Could not retrieve messages for verification');
        return { persisted: false, reason: 'Could not retrieve messages for verification' };
      }
    } catch (error) {
      console.error('❌ Error verifying message persistence:', error);
      return { persisted: false, reason: error.message };
    }
  },

  // Find existing room with participant
  findRoomWithParticipant: async (participantEmployeeId) => {
    console.log('🔍 Enhanced API findRoomWithParticipant called with:', participantEmployeeId);
    return await chatAPI.findRoomWithParticipant(participantEmployeeId);
  },

  // List all rooms
  listAllRooms: async () => {
    console.log('📋 Enhanced API listAllRooms called');
    return await chatAPI.listAllRooms();
  },

  // Get messages for a room
  getRoomMessages: async (roomId) => {
    console.log('📜 Enhanced API getRoomMessages called with room ID:', roomId);
    return await chatAPI.getRoomMessages(roomId);
  },

  // WebSocket connection management
  connectToRoom: (roomId) => {
    console.log('🔗 Enhanced API connectToRoom called with room ID:', roomId);
    return chatWebSocket.connect(roomId);
  },
  disconnectFromRoom: () => {
    console.log('🔌 Enhanced API disconnectFromRoom called');
    return chatWebSocket.disconnect();
  },
  getConnectionStatus: () => {
    const status = chatWebSocket.getConnectionStatus();
    console.log('📊 Enhanced API getConnectionStatus:', status);
    return status;
  },

  // Event subscriptions
  onMessage: (callback) => chatWebSocket.onMessage(callback),
  onConnection: (callback) => chatWebSocket.onConnection(callback),
  onError: (callback) => chatWebSocket.onError(callback)
};

export default enhancedChatAPI;