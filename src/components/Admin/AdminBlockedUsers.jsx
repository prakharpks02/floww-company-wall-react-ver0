import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext_token';
import { adminAPI } from '../../services/adminAPI';
import { adminAPI as regularAdminAPI } from '../../services/api';
import { Ban, Check, User, Mail, Calendar, AlertTriangle, UserCheck } from 'lucide-react';
import Alert, { useAlert } from '../UI/Alert';

const AdminBlockedUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingUser, setProcessingUser] = useState(null);
  const { showSuccess, showError, showWarning, AlertContainer } = useAlert();

  useEffect(() => {
    if (user?.is_admin) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Use the new admin API to get blocked users from backend
      const response = await regularAdminAPI.getBlockedUsers();
      
      if (response.status === 'success' && response.data) {
        setUsers(response.data);
      } else {
        throw new Error(response.message || 'Failed to load blocked users');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId) => {
    try {
      setProcessingUser(userId);
      const response = await adminAPI.toggleBlockUser(userId);
      
      if (response.status === 'success') {
        // Reload users to update the display after successful unblock
        await loadUsers();
        showSuccess('User Unblocked', 'User has been successfully unblocked and can now fully access the platform.');
      } else {
        showError('Unblock Failed', response.message || 'Failed to unblock user. Please try again.');
      }
    } catch (err) {
      showError('Unblock Error', err.message || 'An error occurred while trying to unblock the user.');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert
          type="error"
          title="Access Denied"
          message="You don't have permission to access this page."
          className="max-w-md"
        />
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert
            type="error"
            title="Error Loading Users"
            message={error}
          />
          <div className="flex justify-center">
            <button
              onClick={loadUsers}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-18 bg-gradient-to-br from-white via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-l-4 border-blue-400 pl-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow">
              <Ban className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-blue-900">Blocked Users Management</h1>
          </div>
          <div className="text-sm font-semibold text-blue-700">
            Total Blocked Users: {users.length}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-2xl font-semibold text-blue-900 mb-2">No blocked users found</div>
            <div className="text-blue-500">All users are currently active</div>
          </div>
        ) : (
          <div className="divide-y divide-blue-100">
            {users.map((blockedUser) => (
              <div key={blockedUser.user_id || blockedUser.id} className="flex items-center py-4 px-2 border-l-4 border-blue-400 bg-white hover:bg-blue-50 transition-all">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-900 text-base">
                      {blockedUser.username || blockedUser.name}
                    </div>
                    <div className="text-xs text-blue-700 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {blockedUser.email}
                    </div>
                    <div className="flex items-center text-xs text-blue-800 mt-1">
                      <User className="h-3 w-3 mr-1" />
                      <span>ID: {blockedUser.user_id || blockedUser.id}</span>
                      {blockedUser.position && <span className="ml-2">💼 {blockedUser.position}</span>}
                      {blockedUser.department && <span className="ml-2">🏢 {blockedUser.department}</span>}
                      {blockedUser.created_at && <span className="ml-2"><Calendar className="h-3 w-3 inline mr-1" />Joined: {formatDate(blockedUser.created_at)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs font-bold text-red-800">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span>Blocked</span>
                  </div>
                  <button
                    onClick={() => handleToggleBlock(blockedUser.user_id || blockedUser.id)}
                    disabled={processingUser === (blockedUser.user_id || blockedUser.id)}
                    className="ml-4 flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    title="Unblock this user"
                    aria-label={`Unblock user ${blockedUser.name}`}
                  >
                    {processingUser === (blockedUser.user_id || blockedUser.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Unblocking...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3" />
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
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="font-bold text-blue-900 text-lg mb-3">User Management Information</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Blocked users can only view and share posts but cannot create new posts or add comments</p>
            <p>• Use the <span className="font-semibold text-green-700">Unblock User</span> button to restore full access to a user account</p>
            <p>• Changes take effect immediately across the platform</p>
          </div>
        </div>
      </div>
      
      {/* Alert Container for Notifications */}
      <AlertContainer />
    </div>
  );
};

export default AdminBlockedUsers;
