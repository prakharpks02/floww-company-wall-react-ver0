import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, Video, Mail, MapPin, Calendar, Building, User, MessageCircle, Users, Settings, Image, FileText, Link, Clock, Crown, Shield, UserPlus, UserMinus, Edit2, VolumeX, Search, Camera } from 'lucide-react';
import { getEmployeeById, getAllEmployees } from './utils/dummyData';
import chatToast from './utils/toastUtils';

const ChatInfo = ({ isOpen, onClose, conversation, currentUserId, onUpdateGroup, onLeaveGroup, onRemoveMember, onStartCall, onStartVideoCall, onReloadConversations, onStartChatWithMember, isCompact = false, isInline = false }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || '');
  const [groupDescription, setGroupDescription] = useState(conversation?.description || conversation?.room_desc || '');
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [groupIcon, setGroupIcon] = useState(conversation?.icon || null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const fileInputRef = useRef(null);

  // Load available employees for participant selection
  useEffect(() => {
    const loadEmployees = () => {
      const employees = getAllEmployees();
      // Filter out current participants
      const currentParticipantIds = conversation?.participants || [];
      const available = employees.filter(emp => 
        !currentParticipantIds.includes(emp.employeeId) && 
        !currentParticipantIds.includes(emp.id.toString())
      );
      setAvailableEmployees(available);
    };

    if (showAddParticipants && conversation) {
      loadEmployees();
    }
  }, [showAddParticipants, conversation?.participants]);

  // Early return after all hooks are called
  if (!isOpen || !conversation) return null;

  // Debug conversation object
  console.log('🔍 ChatInfo conversation object:', conversation);
  console.log('🔍 Description field:', conversation.description);
  console.log('🔍 Room_desc field:', conversation.room_desc);

  const isGroup = conversation.type === 'group';
  const currentUser = getEmployeeById(currentUserId);
  
  // For groups - check if user is admin or in admin environment (CRM)
  const isAdminEnvironment = window.location.pathname.includes('/crm');
  const isAdmin = isGroup ? (conversation.admins?.includes(currentUserId) || isAdminEnvironment) : false;
  const isCreator = isGroup ? conversation.createdBy === currentUserId : false;
  
  // For direct chats
  const otherUser = !isGroup ? getEmployeeById(conversation.participants.find(id => id !== currentUserId)) : null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Active now';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      default: return 'Offline';
    }
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

  const handleAddParticipants = async () => {
    if (selectedParticipants.length === 0) return;

    try {
      // Import admin API for participant management
      const { adminChatAPI } = await import('../../services/adminChatAPI');
      
      // Use room_id if available, otherwise fallback to conversation id
      const roomId = conversation.room_id || conversation.id;
      
      console.log('🔧 ChatInfo: Adding participants via admin API:', {
        roomId,
        participantIds: selectedParticipants
      });

      const response = await adminChatAPI.addParticipants(roomId, selectedParticipants);
      
      if (response && response.status === 'success') {
        console.log('✅ Participants added successfully via admin API');
        
        // Update local conversation data
        if (onUpdateGroup) {
          const updatedParticipants = [...(conversation.participants || []), ...selectedParticipants];
          onUpdateGroup(conversation.id, {
            participants: updatedParticipants
          });
        }
        
        setShowAddParticipants(false);
        setSelectedParticipants([]);
        
        // Show success message
        chatToast.success('Participants added successfully!');
      } else {
        console.error('❌ Failed to add participants:', response);
        chatToast.error('Failed to add participants. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error adding participants:', error);
      chatToast.error('Error adding participants: ' + error.message);
    }
  };

  const handleRemoveParticipant = (participantId) => {
    // Show confirmation modal
    setMemberToRemove(participantId);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveParticipant = async () => {
    if (!memberToRemove) return;

    try {
      // Import admin API for participant management
      const { adminChatAPI } = await import('../../services/adminChatAPI');
      
      // Use room_id if available, otherwise fallback to conversation id
      const roomId = conversation.room_id || conversation.id;
      
      console.log('🔧 ChatInfo: Removing participant via admin API:', {
        roomId,
        participantId: memberToRemove
      });

      const response = await adminChatAPI.removeParticipant(roomId, memberToRemove);
      
      if (response && response.status === 'success') {
        console.log('✅ Participant removed successfully via admin API');
        
        // Update local conversation data
        if (onUpdateGroup) {
          const updatedParticipants = (conversation.participants || []).filter(id => id !== memberToRemove);
          onUpdateGroup(conversation.id, {
            participants: updatedParticipants
          });
        }
        
        // Show success message in red
        const memberName = getEmployeeById(memberToRemove)?.name || 'Participant';
        chatToast.custom(`${memberName} removed from group`, {
          duration: 3000,
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          },
          icon: '👋'
        });
      } else {
        console.error('❌ Failed to remove participant:', response);
        chatToast.error('Failed to remove participant. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      chatToast.error('Error removing participant: ' + error.message);
    } finally {
      // Close modal and reset state
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
    }
  };

  const handleAssignAdminRights = async (participantId) => {
    const member = getEmployeeById(participantId);
    const memberName = member ? member.name : 'this participant';

    try {
      // Import admin API for rights management
      const { adminChatAPI } = await import('../../services/adminChatAPI');
      
      // Use room_id if available, otherwise fallback to conversation id
      const roomId = conversation.room_id || conversation.id;
      
      console.log('🔧 ChatInfo: Assigning admin rights via admin API:', {
        roomId,
        participantId
      });

      const response = await adminChatAPI.assignAdminRights(roomId, participantId);
      
      if (response && response.status === 'success') {
        console.log('✅ Admin rights assigned successfully via admin API');
        
        // Update local conversation data
        if (onUpdateGroup) {
          const updatedAdmins = [...(conversation.admins || []), participantId];
          onUpdateGroup(conversation.id, {
            admins: updatedAdmins
          });
        }
        
        // Show success message
        chatToast.success(`Admin rights assigned to ${memberName} successfully!`);
      } else {
        console.error('❌ Failed to assign admin rights:', response);
        chatToast.error('Failed to assign admin rights. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error assigning admin rights:', error);
      chatToast.error('Error assigning admin rights: ' + error.message);
    }
  };

  const handleRemoveAdminRights = async (participantId) => {
    const member = getEmployeeById(participantId);
    const memberName = member ? member.name : 'this participant';

    try {
      // Import admin API for rights management
      const { adminChatAPI } = await import('../../services/adminChatAPI');
      
      // Use room_id if available, otherwise fallback to conversation id
      const roomId = conversation.room_id || conversation.id;
      
      console.log('🔧 ChatInfo: Removing admin rights via admin API:', {
        roomId,
        participantId
      });

      const response = await adminChatAPI.removeAdminRights(roomId, participantId);
      
      if (response && response.status === 'success') {
        console.log('✅ Admin rights removed successfully via admin API');
        
        // Update local conversation data
        if (onUpdateGroup) {
          const updatedAdmins = (conversation.admins || []).filter(id => id !== participantId);
          onUpdateGroup(conversation.id, {
            admins: updatedAdmins
          });
        }
        
        // Show success message
        chatToast.success(`Admin rights removed from ${memberName} successfully!`);
      } else {
        console.error('❌ Failed to remove admin rights:', response);
        chatToast.error('Failed to remove admin rights. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error removing admin rights:', error);
      chatToast.error('Error removing admin rights: ' + error.message);
    }
  };

  const handleSaveChanges = async () => {
    if (!groupName.trim()) return;
    
    try {
      // Import admin API for room editing
      const { adminChatAPI } = await import('../../services/adminChatAPI');
      
      // Use room_id if available, otherwise fallback to conversation id
      const roomId = conversation.room_id || conversation.id;
      
      console.log('🔧 ChatInfo: Editing group details via admin API:', {
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
        
        // Show success message
        chatToast.success('Group details updated successfully!');
      } else {
        throw new Error(response?.message || 'Failed to update group details');
      }
    } catch (error) {
      console.error('❌ Error updating group details:', error);
      chatToast.error('Failed to update group details. Please try again.');
    }
  };

  const handleIconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      chatToast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      chatToast.error('File size must be less than 5MB');
      return;
    }

    setUploadingIcon(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use correct admin API base URL
      const baseURL = 'https://dev.gofloww.co';
      
      const response = await fetch(`${baseURL}/api/wall/admin/upload_file`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': '7a3239c81974cdd6140c3162468500ba95d7d5823ea69658658c2986216b273e'
        }
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.data?.file_url) {
        setGroupIcon(result.data.file_url);
        
        // Update the group icon in the backend
        try {
          const { adminChatAPI } = await import('../../services/adminChatAPI');
          const roomId = conversation.room_id || conversation.id;
          
          const updateResponse = await adminChatAPI.editRoomDetails(roomId, {
            room_icon: result.data.file_url
          });
          
          if (updateResponse && updateResponse.status === 'success') {
            console.log('✅ Group icon updated successfully in backend');
            console.log('📤 Calling onUpdateGroup with:', {
              conversationId: conversation.id,
              room_id: conversation.room_id,
              icon: result.data.file_url
            });
            
            // Update local conversation state to reflect in sidebar
            if (onUpdateGroup) {
              onUpdateGroup(conversation.id, {
                icon: result.data.file_url
              });
              console.log('✅ onUpdateGroup called successfully');
            } else {
              console.warn('⚠️ onUpdateGroup is not defined');
            }
            
            // Reload conversations from backend to refresh sidebar
            if (onReloadConversations) {
              console.log('🔄 Reloading conversations from backend...');
              await onReloadConversations();
              console.log('✅ Conversations reloaded successfully');
            } else {
              console.warn('⚠️ onReloadConversations is not defined');
            }
          } else {
            console.error('❌ Error updating group icon in backend:', updateResponse);
          }
        } catch (updateError) {
          console.error('❌ Error updating group icon:', updateError);
        }
        
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Error uploading group icon:', error);
      chatToast.error('Failed to upload group icon. Please try again.');
    } finally {
      setUploadingIcon(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderOverview = () => {
    if (isGroup) {
      return (
        <div className={`space-y-${isCompact ? '4' : '6'}`}>
          {/* Group Header */}
          <div className="text-center">
            <div className="relative inline-block mx-auto mb-4">
              <div className={`${isCompact ? 'w-20 h-20 text-2xl' : 'w-32 h-32 text-4xl'} ${groupIcon || conversation.icon ? 'bg-gray-100' : 'bg-gradient-to-br from-purple-500 to-purple-700'} rounded-full flex items-center justify-center text-white font-bold shadow-lg overflow-hidden`}>
                {groupIcon || conversation.icon ? (
                  <img 
                    src={groupIcon || conversation.icon} 
                    alt="Group Icon" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  conversation.name?.charAt(0) || 'G'
                )}
              </div>
              {/* Camera button for uploading group icon */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingIcon}
                className="absolute -bottom-1 -right-1 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all duration-200 shadow-2xl border-3 border-white z-10"
                title="Change group icon"
              >
                {uploadingIcon ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
            </div>
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="text-2xl font-bold text-center bg-transparent border-b-2 border-gray-300 focus:border-[#FFAD46] outline-none w-full"
                    placeholder="Group name"
                  />
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="text-sm text-gray-600 text-center bg-transparent border-b-2 border-gray-300 focus:border-[#FFAD46] outline-none w-full resize-none"
                    placeholder="Group description"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleSaveChanges}
                      className="px-4 py-2 bg-[#FFAD46] text-white rounded-lg text-sm hover:bg-[#FF9A1A] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">{conversation.name}</h2>
                    {(isAdmin || isCreator) && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-gray-400 hover:text-[#FFAD46] transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {conversation.description || conversation.room_desc || 'No description available'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {conversation.participants?.length || 0} members
                  </p>
                  {conversation.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Created {formatDate(conversation.createdAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-${isCompact ? '2' : '4'} justify-center`}>
            <button
              onClick={() => onStartCall && onStartCall(conversation)}
              className={`flex flex-col items-center gap-${isCompact ? '1' : '2'} ${isCompact ? 'p-2' : 'p-4'} bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors`}
            >
              <Phone className={`${isCompact ? 'h-4 w-4' : 'h-6 w-6'} text-green-600`} />
              <span className="text-xs text-gray-600">Audio</span>
            </button>
            <button
              onClick={() => onStartVideoCall && onStartVideoCall(conversation)}
              className={`flex flex-col items-center gap-${isCompact ? '1' : '2'} ${isCompact ? 'p-2' : 'p-4'} bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors`}
            >
              <Video className={`${isCompact ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600`} />
              <span className="text-xs text-gray-600">Video</span>
            </button>
            <button className={`flex flex-col items-center gap-${isCompact ? '1' : '2'} ${isCompact ? 'p-2' : 'p-4'} bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors`}>
              <Search className={`${isCompact ? 'h-4 w-4' : 'h-6 w-6'} text-gray-600`} />
              <span className="text-xs text-gray-600">Search</span>
            </button>
          </div>
        </div>
      );
    } else {
      // Direct chat profile
      if (!otherUser) return null;
      
      return (
        <div className="space-y-6">
          {/* User Header */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {otherUser.avatar}
              </div>
              <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white ${getStatusColor(otherUser.status)}`}></div>
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">{otherUser.name}</h2>
              <p className="text-sm text-gray-600">{otherUser.position}</p>
              <p className="text-sm text-[#FFAD46]">{getStatusText(otherUser.status)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onStartCall && onStartCall(otherUser)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Phone className="h-6 w-6 text-green-600" />
              <span className="text-xs text-gray-600">Audio</span>
            </button>
            <button
              onClick={() => onStartVideoCall && onStartVideoCall(otherUser)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Video className="h-6 w-6 text-blue-600" />
              <span className="text-xs text-gray-600">Video</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <Search className="h-6 w-6 text-gray-600" />
              <span className="text-xs text-gray-600">Search</span>
            </button>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{otherUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{otherUser.department}</p>
              </div>
            </div>
            {otherUser.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{otherUser.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const renderMembers = () => {
    if (!isGroup) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {conversation.participants?.length || 0} Members
          </h3>
          {(isAdmin || isCreator) && (
            <button 
              onClick={() => setShowAddParticipants(true)}
              className="flex items-center gap-2 px-3 py-1 text-[#FFAD46] hover:bg-orange-50 rounded-lg transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-sm">Add</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {conversation.participants?.map((memberId) => {
            const member = getEmployeeById(memberId);
            if (!member) return null;

            return (
              <div key={memberId} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                {/* Clickable member info section */}
                <div 
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (memberId !== currentUserId && onStartChatWithMember) {
                      console.log('🎯 Starting chat with member:', { memberId, member });
                      onStartChatWithMember(member);
                    }
                  }}
                  title={memberId !== currentUserId ? "Click to start chat" : undefined}
                >
                  <div className="relative">
                    {member.profile_picture_link ? (
                      <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                        <img 
                          src={member.profile_picture_link} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                        {member.avatar}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{member.name}</p>
                      {getRoleIcon(memberId)}
                      {memberId !== currentUserId && (
                        <MessageCircle className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{member.position}</p>
                    <p className="text-xs text-gray-400">{getRoleText(memberId)}</p>
                  </div>
                </div>
                
                {(isAdmin || isCreator) && memberId !== currentUserId && (
                  <div className="flex items-center gap-1">
                    {/* Admin Rights Management */}
                    {conversation.admins?.includes(memberId) ? (
                      // Remove admin rights button (only show if current user is creator or super admin)
                      (isCreator || isAdminEnvironment) && (
                        <button
                          onClick={() => handleRemoveAdminRights(memberId)}
                          className="p-2 text-yellow-500 hover:text-yellow-600 transition-colors"
                          title="Remove admin rights"
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                      )
                    ) : (
                      // Assign admin rights button
                      <button
                        onClick={() => handleAssignAdminRights(memberId)}
                        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                        title="Assign admin rights"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Remove participant button */}
                    <button 
                      onClick={() => handleRemoveParticipant(memberId)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from group"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMedia = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Media, Links and Docs</h3>
        
        <div className="space-y-3">
          <button className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">Media</span>
            </div>
            <span className="text-sm text-gray-500">12</span>
          </button>
          
          <button className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Documents</span>
            </div>
            <span className="text-sm text-gray-500">5</span>
          </button>
          
          <button className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Link className="h-5 w-5 text-purple-600" />
              <span className="text-gray-700">Links</span>
            </div>
            <span className="text-sm text-gray-500">3</span>
          </button>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
        
        <div className="space-y-3">
          <button className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <VolumeX className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">Mute notifications</span>
            </div>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative transition-colors">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
            </div>
          </button>
          
          <button className="flex items-center gap-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            {isGroup ? (
              <>
                <Users className="h-5 w-5" />
                <span>Leave Group</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                <span>Block Contact</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {isCompact && !isInline ? (
        // Compact mode - inline view (no modal overlay)
        <div className="h-full bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 p-3 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
            <h1 className="text-base font-semibold text-gray-900">
              {isGroup ? 'Group Info' : 'Contact Info'}
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
                activeSection === 'overview'
                  ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            {isGroup && (
              <button
                onClick={() => setActiveSection('members')}
                className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
                  activeSection === 'members'
                    ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Members
              </button>
            )}
            <button
              onClick={() => setActiveSection('media')}
              className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
                activeSection === 'media'
                  ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
                activeSection === 'settings'
                  ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'members' && renderMembers()}
            {activeSection === 'media' && renderMedia()}
            {activeSection === 'settings' && renderSettings()}
          </div>
        </div>
      ) : (
        // Regular mode - sidebar
        <div className={`${
          isInline 
            ? 'w-full h-full bg-white'
            : 'fixed top-0 right-0 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out w-96 h-full md:w-96 sm:w-full'
        }`}>
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-200">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isGroup ? 'Group Info' : 'Contact Info'}
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeSection === 'overview'
                  ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            {isGroup && (
              <button
                onClick={() => setActiveSection('members')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeSection === 'members'
                    ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Members
              </button>
            )}
            <button
              onClick={() => setActiveSection('media')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeSection === 'media'
                  ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeSection === 'settings'
                  ? 'text-[#FFAD46] border-b-2 border-[#FFAD46]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'members' && renderMembers()}
            {activeSection === 'media' && renderMedia()}
            {activeSection === 'settings' && renderSettings()}
          </div>
        </div>
      )}

      {/* Add Participants Modal */}
      {showAddParticipants && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Participants</h3>
              <button
                onClick={() => {
                  setShowAddParticipants(false);
                  setSelectedParticipants([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {availableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`employee-${employee.id}`}
                      checked={selectedParticipants.includes(employee.employeeId || employee.id.toString())}
                      onChange={(e) => {
                        const participantId = employee.employeeId || employee.id.toString();
                        if (e.target.checked) {
                          setSelectedParticipants(prev => [...prev, participantId]);
                        } else {
                          setSelectedParticipants(prev => prev.filter(id => id !== participantId));
                        }
                      }}
                      className="rounded border-gray-300 text-[#FFAD46] focus:ring-[#FFAD46]"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {employee.avatar || employee.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="font-medium text-gray-900 cursor-pointer block truncate"
                      >
                        {employee.name}
                      </label>
                      <p className="text-sm text-gray-500 truncate">{employee.position}</p>
                    </div>
                  </div>
                ))}
                
                {availableEmployees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No employees available to add</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddParticipants(false);
                  setSelectedParticipants([]);
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipants}
                disabled={selectedParticipants.length === 0}
                className="flex-1 px-4 py-2 bg-[#FFAD46] text-white rounded-lg hover:bg-[#E6941A] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add ({selectedParticipants.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveConfirm && memberToRemove && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Remove Member</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Are you sure you want to remove <span className="font-semibold text-gray-900">{getEmployeeById(memberToRemove)?.name || 'this participant'}</span> from the group?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setMemberToRemove(null);
                }}
                className="flex-1 px-5 py-2.5 text-gray-700 font-medium bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveParticipant}
                className="flex-1 px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-lg shadow-red-500/30"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInfo;
