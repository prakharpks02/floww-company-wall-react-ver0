import React, { useState } from 'react';
import { X, Phone, Video, Mail, MapPin, Calendar, Building, User, MessageCircle, Users, Settings, Image, FileText, Link, Clock, Crown, Shield, UserPlus, UserMinus, Edit2, VolumeX, Search } from 'lucide-react';
import { getEmployeeById } from './utils/dummyData';

const ChatInfo = ({ isOpen, onClose, conversation, currentUserId, onUpdateGroup, onLeaveGroup, onRemoveMember, onStartCall, onStartVideoCall, isCompact = false, isInline = false }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || '');
  const [groupDescription, setGroupDescription] = useState(conversation?.description || '');

  if (!isOpen || !conversation) return null;

  const isGroup = conversation.type === 'group';
  const currentUser = getEmployeeById(currentUserId);
  
  // For groups
  const isAdmin = isGroup ? conversation.admins?.includes(currentUserId) : false;
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

  const handleSaveChanges = () => {
    if (groupName.trim()) {
      onUpdateGroup(conversation.id, {
        name: groupName.trim(),
        description: groupDescription.trim()
      });
      setIsEditing(false);
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
        <div className="space-y-6">
          {/* Group Header */}
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
              {conversation.name?.charAt(0) || 'G'}
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
                  {conversation.description && (
                    <p className="text-sm text-gray-600">{conversation.description}</p>
                  )}
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
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onStartCall && onStartCall(conversation)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Phone className="h-6 w-6 text-green-600" />
              <span className="text-xs text-gray-600">Audio</span>
            </button>
            <button
              onClick={() => onStartVideoCall && onStartVideoCall(conversation)}
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
            <button className="flex items-center gap-2 px-3 py-1 text-[#FFAD46] hover:bg-orange-50 rounded-lg transition-colors">
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
              <div key={memberId} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                    {member.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{member.name}</p>
                    {getRoleIcon(memberId)}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.position}</p>
                  <p className="text-xs text-gray-400">{getRoleText(memberId)}</p>
                </div>
                {(isAdmin || isCreator) && memberId !== currentUserId && (
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <UserMinus className="h-4 w-4" />
                  </button>
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
      {/* Sidebar */}
      <div className={`${
        isInline 
          ? 'w-full h-full bg-white'
          : `fixed top-0 right-0 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
              isCompact ? 'w-80 h-[400px]' : 'w-96 h-full md:w-96 sm:w-full'
            }`
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
    </>
  );
};

export default ChatInfo;
