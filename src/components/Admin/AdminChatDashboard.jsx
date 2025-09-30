import React, { useState, useEffect } from 'react';
import { useAdminChat } from '../../contexts/AdminChatContext';

const AdminChatDashboard = () => {
  const {
    rooms,
    messages,
    activeRoom,
    loading,
    error,
    setActiveRoom,
    setError,
    loadRooms,
    loadMessagesForRoom,
    getRoomStats,
    createGroup,
    editMessage,
    assignAdminRights
  } = useAdminChat();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomStats, setRoomStats] = useState(null);

  // Load all rooms on component mount
  useEffect(() => {
    console.log('🔧 CRM Dashboard: Component mounted, rooms will be loaded by AdminChatContext');
  }, []);

  const loadRoomDetails = async (roomId) => {
    try {
      console.log('🔧 CRM: Loading room details for:', roomId);
      
      // Use context methods instead of direct API calls
      const [roomMessages, stats] = await Promise.all([
        loadMessagesForRoom(roomId),
        getRoomStats(roomId)
      ]);

      console.log('🔧 CRM: Room details loaded via context');
      setRoomStats(stats);
      setSelectedRoom(rooms.find(room => room.room_id === roomId));
      setActiveRoom(roomId);
    } catch (error) {
      console.error('🔧 CRM: Error loading room details:', error);
      setError(error.message);
    }
  };

  const handleCreateGroup = async () => {
    try {
      console.log('🔧 CRM: Creating new admin group...');
      const groupData = {
        group_name: 'CRM Admin Group',
        group_description: 'Created from CRM dashboard',
        group_icon: 'admin-group',
        participants_ids: ['emp-K6m82p2AJ6bd', 'emp-Hfpxcxh1L612']
      };

      const response = await createGroup(groupData);
      
      if (response && response.status === 'success') {
        console.log('🔧 CRM: Group created successfully via context');
      } else {
        setError('Failed to create group');
      }
    } catch (error) {
      console.error('🔧 CRM: Error creating group:', error);
      setError(error.message);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      console.log('🔧 CRM: Editing message:', messageId);
      const response = await editMessage(messageId, newContent);
      
      if (response && response.status === 'success') {
        console.log('🔧 CRM: Message edited successfully via context');
        // Reload messages to show the updated content
        if (selectedRoom) {
          loadRoomDetails(selectedRoom.room_id);
        }
      } else {
        setError('Failed to edit message');
      }
    } catch (error) {
      console.error('🔧 CRM: Error editing message:', error);
      setError(error.message);
    }
  };

  const handleEditRoomDetails = async (roomId, roomDetails) => {
    try {
      console.log('🔧 CRM: Editing room details for:', roomId, roomDetails);
      
      // Import adminChatAPI directly for this operation
      const { adminChatAPI } = await import('../../services/adminChatAPI');
      const response = await adminChatAPI.editRoomDetails(roomId, roomDetails);
      
      if (response && response.status === 'success') {
        console.log('🔧 CRM: Room details edited successfully');
        // Reload rooms to show updated details
        await loadRooms();
        // Reload room details if this room is currently selected
        if (selectedRoom && selectedRoom.room_id === roomId) {
          loadRoomDetails(roomId);
        }
      } else {
        setError('Failed to edit room details');
      }
    } catch (error) {
      console.error('🔧 CRM: Error editing room details:', error);
      setError(error.message);
    }
  };

  const handleAssignAdmin = async (roomId, employeeId) => {
    try {
      console.log('🔧 CRM: Assigning admin rights to:', employeeId);
      const response = await assignAdminRights(roomId, employeeId);
      
      if (response && response.status === 'success') {
        console.log('🔧 CRM: Admin rights assigned successfully via context');
        // Reload room details to show updated admin status
        loadRoomDetails(roomId);
      } else {
        setError('Failed to assign admin rights');
      }
    } catch (error) {
      console.error('🔧 CRM: Error assigning admin rights:', error);
      setError(error.message);
    }
  };

  if (loading && !selectedRoom) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading chat rooms...</div>
      </div>
    );
  }

  return (
    <div className="admin-chat-dashboard p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Chat Dashboard</h1>
          <div className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
            CRM Admin API • localhost:8000
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError(null)}
              className="float-right ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => loadRooms()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Rooms
          </button>
          <button
            onClick={handleCreateGroup}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Test Group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Chat Rooms ({rooms.length})</h2>
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.room_id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?.room_id === room.room_id
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => loadRoomDetails(room.room_id)}
              >
                <div className="font-medium">{room.room_name}</div>
                <div className="text-sm text-gray-600">
                  {room.is_group ? 'Group Chat' : 'Direct Message'}
                </div>
                <div className="text-sm text-gray-500">
                  Participants: {room.participants?.length || 0}
                </div>
                {room.last_message && room.last_message !== 'N/A' && (
                  <div className="text-sm text-gray-600 mt-1">
                    Last: {room.last_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Room Details */}
        <div className="lg:col-span-2">
          {selectedRoom ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">{selectedRoom.room_name}</h2>
                  <button
                    onClick={() => {
                      // Simple demo: Edit room name with prompt
                      const newName = prompt('Enter new room name:', selectedRoom.room_name);
                      const newDesc = prompt('Enter new room description:', selectedRoom.description || '');
                      if (newName && newName !== selectedRoom.room_name) {
                        handleEditRoomDetails(selectedRoom.room_id, {
                          room_name: newName,
                          room_icon: selectedRoom.room_icon || 'Updated_Icon',
                          room_desc: newDesc || 'Updated via admin dashboard'
                        });
                      }
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Edit Room
                  </button>
                </div>
                {roomStats && (
                  <div className="text-sm text-gray-600">
                    {roomStats.messageCount} messages • {roomStats.participantCount} participants
                  </div>
                )}
              </div>

              {/* Room Stats */}
              {roomStats && (
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-2">Room Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Messages: {roomStats.messageCount}</div>
                    <div>Participants: {roomStats.participantCount}</div>
                    <div>Admins: {roomStats.adminCount}</div>
                    <div>Type: {roomStats.isGroup ? 'Group' : 'Direct'}</div>
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedRoom.participants && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Participants</h3>
                  <div className="space-y-2">
                    {selectedRoom.participants.map((participant, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{participant.employee_name}</div>
                          <div className="text-sm text-gray-600">
                            {participant.job_title} • {participant.employee_id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.is_admin && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Admin
                            </span>
                          )}
                          {!participant.is_admin && participant.employee_id !== 'N/A' && (
                            <button
                              onClick={() => handleAssignAdmin(selectedRoom.room_id, participant.employee_id)}
                              className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
                            >
                              Make Admin
                            </button>
                          )}
                          {participant.is_blocked && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                              Blocked
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div>
                {(() => {
                  const roomMessages = activeRoom ? messages[activeRoom] || [] : [];
                  return (
                    <div>
                      <h3 className="font-medium mb-2">Messages ({roomMessages.length})</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {roomMessages.length > 0 ? (
                          roomMessages.map((message, index) => (
                      <div key={index} className="p-3 bg-white border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{message.sender_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(message.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-gray-700 mb-2">{message.content}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newContent = prompt('Edit message:', message.content);
                              if (newContent && newContent !== message.content) {
                                handleEditMessage(message.message_id, newContent);
                              }
                            }}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-center py-8">
                            No messages in this room
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a room to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatDashboard;