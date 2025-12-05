import React from 'react';
import { AdminChatProvider } from '../../contexts/AdminChatContext';
import AdminLayout from '../Layout/AdminLayout';
import AdminChatDashboard from './AdminChatDashboard';

/**
 * CRM Admin App - Complete admin application wrapper
 * This component is specifically designed for localhost:8000/crm/dashboard
 * and only uses admin API endpoints.
 */
const CRMAdminApp = () => {
  return (
    <AdminChatProvider>
      <AdminLayout>
        <div className="crm-admin-app">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">Admin Chat Management</h2>
            <p className="text-sm text-gray-600">
              Manage chat rooms, participants, and messages using admin-only API endpoints.
            </p>
          </div>
          <AdminChatDashboard />

          {/* Environment Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Environment Information</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• <strong>Environment:</strong> CRM Admin Dashboard (localhost:8000/crm)</div>
              <div>• <strong>API Base:</strong> https://console.gofloww.xyz/api/wall/chat/admin</div>
              <div>• <strong>Context:</strong> AdminChatContext (No employee chat APIs)</div>
              <div>• <strong>Layout:</strong> AdminLayout (No employee chat components)</div>
              <div>• <strong>Purpose:</strong> Admin-only chat management with proper API isolation</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminChatProvider>
  );
};

export default CRMAdminApp;