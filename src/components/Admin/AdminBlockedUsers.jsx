import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/adminAPI';
import { userAPI } from '../../services/api';
import { Ban, Check, User, Mail, Calendar, AlertTriangle } from 'lucide-react';

const AdminBlockedUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingUser, setProcessingUser] = useState(null);

  useEffect(() => {
    if (user?.is_admin) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Since there's no direct API for getting all users, we'll need to get this from local storage
      // or implement a way to track users. For now, let's use a mock approach
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      // Filter to show only blocked users
      const blockedUsers = registeredUsers.filter(u => u.is_blocked);
      setUsers(blockedUsers);
      
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId) => {
    if (!window.confirm('Are you sure you want to change this user\'s block status?')) {
      return;
    }

    try {
      setProcessingUser(userId);
      const response = await adminAPI.toggleBlockUser(userId);
      
      if (response.status === 'success') {
        // Update local storage
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const updatedUsers = registeredUsers.map(u => {
          if (u.user_id === userId || u.id === userId) {
            return { ...u, is_blocked: !u.is_blocked };
          }
          return u;
        });
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
        
        // Reload users to update the display
        await loadUsers();
      } else {
        alert(response.message || 'Failed to update user status');
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setProcessingUser(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user?.is_admin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg font-semibold">Access Denied</div>
        <div className="text-gray-600 mt-2">You don't have permission to access this page.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg font-semibold">Error</div>
        <div className="text-gray-600 mt-2">{error}</div>
        <button
          onClick={loadUsers}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blocked Users Management</h1>
        <div className="text-sm text-gray-600">
          Total Blocked Users: {users.length}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No blocked users found</div>
          <div className="text-gray-400 mt-2">All users are currently active</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((blockedUser) => (
            <div key={blockedUser.user_id || blockedUser.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              {/* User Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {blockedUser.username || blockedUser.name}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {blockedUser.email}
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>ID: {blockedUser.user_id || blockedUser.id}</span>
                </div>
                
                {blockedUser.position && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">💼</span>
                    <span>{blockedUser.position}</span>
                  </div>
                )}
                
                {blockedUser.department && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🏢</span>
                    <span>{blockedUser.department}</span>
                  </div>
                )}
                
                {blockedUser.created_at && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Joined: {formatDate(blockedUser.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Block Status */}
              <div className="mb-4">
                <div className="flex items-center justify-center space-x-2 py-2 px-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    User is Blocked
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => handleToggleBlock(blockedUser.user_id || blockedUser.id)}
                  disabled={processingUser === (blockedUser.user_id || blockedUser.id)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingUser === (blockedUser.user_id || blockedUser.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Unblock User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Management Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">User Management Information</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Blocked users can only view and share posts but cannot create new posts or add comments</p>
          <p>• Use the "Unblock User" button to restore full access to a user account</p>
          <p>• Changes take effect immediately across the platform</p>
        </div>
      </div>
    </div>
  );
};

export default AdminBlockedUsers;
