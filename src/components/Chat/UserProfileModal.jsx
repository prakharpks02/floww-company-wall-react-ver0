import React, { useState, useRef } from 'react';
import { X, Phone, Video, Mail, MapPin, Calendar, Building, User, MessageCircle, Camera } from 'lucide-react';
import { getEmployeeById } from './utils/dummyData';

const UserProfileModal = ({ isOpen, onClose, userId, onStartChat, currentUserId }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !userId) return null;

  const user = getEmployeeById(userId);
  if (!user) return null;

  // Check if this is the current user's own profile
  const isOwnProfile = userId === currentUserId;

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

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
        setProfilePicture(result.data.file_url);
        
        // Here you could update the user's profile picture in the backend
        // You might need to call a user update API endpoint
        console.log('✅ Profile picture updated successfully:', result.data.file_url);
        
        // You could also update the local user data if needed
        // This would depend on your user management system
        
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-32"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              {profilePicture || employee?.photo_url ? (
                <img
                  src={profilePicture || employee?.photo_url}
                  alt={`${user.name}'s profile`}
                  className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
                  {user.avatar}
                </div>
              )}
              
              {/* Camera overlay for own profile */}
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
                >
                  {uploadingPicture ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
              )}
              
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${getStatusColor(user.status)}`}></div>
            </div>
            
            {/* Hidden file input */}
            {isOwnProfile && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-6 px-6">
          {/* Basic Info */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
            <p className="text-purple-600 font-medium mb-2">{user.role}</p>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`}></div>
              <span className="text-gray-600">{getStatusText(user.status)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                onStartChat(user);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Phone className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Video className="h-4 w-4" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{user.location}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Work Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="text-gray-900">{user.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="text-gray-900">{user.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="text-gray-900">{user.joinDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {user.bio && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
