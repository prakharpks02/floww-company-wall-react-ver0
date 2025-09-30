import React, { useState } from 'react';
import { X, Users, UserPlus, UserMinus, Edit2, Crown, Shield, User } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { getEmployeeByIdFromList } from './utils/dummyData';

const GroupDetailsModal = ({ isOpen, onClose, conversation, currentUserId, onUpdateGroup, onLeaveGroup, onRemoveMember }) => {
  const { employees } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || '');
  const [groupDescription, setGroupDescription] = useState(conversation?.description || '');
  const [showAddMember, setShowAddMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !conversation || !employees.length) return null;

  const currentUser = getEmployeeByIdFromList(currentUserId, employees);
  
  // Check if user is admin - either in conversation.admins or in admin environment (CRM)
  const isAdminEnvironment = window.location.pathname.includes('/crm');
  const isAdmin = conversation.admins?.includes(currentUserId) || isAdminEnvironment;
  const isCreator = conversation.createdBy === currentUserId;
  
  console.log('🔧 GroupDetailsModal: Admin check:', {
    currentUserId,
    conversationAdmins: conversation.admins,
    isAdminEnvironment,
    isAdmin,
    isCreator,
    pathname: window.location.pathname
  });

  // Get available employees to add (not already in group)
  const availableEmployees = employees.filter(emp => 
    !conversation.participants.includes(emp.id) && emp.id !== currentUserId
  );

  const handleSaveChanges = async () => {
    if (!groupName.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      // Import admin API for room editing
      const { adminChatAPI } = await import('../../services/adminChatAPI');
      
      // Use room_id if available, otherwise fallback to conversation id
      const roomId = conversation.room_id || conversation.id;
      
      console.log('🔧 GroupDetailsModal: Editing group details via admin API:', {
        roomId,
        room_name: groupName.trim(),
        room_desc: groupDescription.trim()
      });
      
      const response = await adminChatAPI.editRoomDetails(roomId, {
        room_name: groupName.trim(),
        room_icon: conversation.name ? conversation.name.substring(0, 2).toUpperCase() : 'GR',
        room_desc: groupDescription.trim()
      });
      
      if (response && response.status === 'success') {
        console.log('✅ Group details updated successfully via admin API');
        
        // Update local conversation data if onUpdateGroup callback is available
        if (onUpdateGroup) {
          onUpdateGroup(conversation.id, {
            name: groupName.trim(),
            description: groupDescription.trim()
          });
        }
        
        setIsEditing(false);
        
        // Show success message (you could add a toast notification here)
        alert('Group details updated successfully!');
      } else {
        throw new Error(response?.message || 'Failed to update group details');
      }
    } catch (error) {
      console.error('❌ Error updating group details:', error);
      alert('Failed to update group details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = (employeeId) => {
    onUpdateGroup(conversation.id, {
      participants: [...conversation.participants, employeeId]
    });
    setShowAddMember(false);
  };

  const getRoleIcon = (userId) => {
    if (conversation.createdBy === userId) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (conversation.admins?.includes(userId)) return <Shield className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4 text-gray-400" />;
  };

  const getRoleText = (userId) => {
    if (conversation.createdBy === userId) return 'Creator';
    if (conversation.admins?.includes(userId)) return 'Admin';
    return 'Member';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Group Info</h2>
              <p className="text-sm text-purple-200">{conversation.participants.length} members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Group Details */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Group Details</h3>
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  title="Edit group details"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Enter group description"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving || !groupName.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setGroupName(conversation.name);
                      setGroupDescription(conversation.description || '');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{conversation.name}</h4>
                {conversation.description && (
                  <p className="text-gray-600 text-sm">{conversation.description}</p>
                )}
                <div className="mt-3 text-xs text-gray-500">
                  Created by {getEmployeeByIdFromList(conversation.createdBy, employees)?.name} • {new Date(conversation.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Members ({conversation.participants.length})</h3>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  title="Add member"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Add Member Section */}
            {showAddMember && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add Members</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableEmployees.map(employee => (
                    <div key={employee.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {employee.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.role}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(employee.id)}
                        className="px-3 py-1 text-xs bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {availableEmployees.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No more members to add</p>
                  )}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              {conversation.participants.map(participantId => {
                const member = getEmployeeByIdFromList(participantId, employees);
                if (!member) return null;

                return (
                  <div key={participantId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                          {member.avatar}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          member.status === 'online' ? 'bg-green-500' : 
                          member.status === 'away' ? 'bg-yellow-500' : 
                          member.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{member.name}</span>
                          {getRoleIcon(participantId)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{member.role}</span>
                          <span className="text-xs text-purple-600">{getRoleText(participantId)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Remove member button (only for admins, can't remove creator or self) */}
                    {isAdmin && participantId !== conversation.createdBy && participantId !== currentUserId && (
                      <button
                        onClick={() => onRemoveMember(conversation.id, participantId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="space-y-2">
              {!isCreator && (
                <button
                  onClick={() => onLeaveGroup(conversation.id)}
                  className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Leave Group
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;
