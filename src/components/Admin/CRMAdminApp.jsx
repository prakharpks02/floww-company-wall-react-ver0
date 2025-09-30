import React from 'react';
import { AdminChatProvider } from '../../contexts/AdminChatContext';
import AdminLayout from '../Layout/AdminLayout';
import AdminChatDashboard from './AdminChatDashboard';
import AdminAPITester from './AdminAPITester';

/**
 * CRM Admin App - Complete admin application wrapper
 * This component is specifically designed for localhost:8000/crm/dashboard
 * and only uses admin API endpoints.
 */
const CRMAdminApp = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  console.log('🔧 CRMAdminApp: Rendering admin app with active tab:', activeTab);

  return (
    <AdminChatProvider>
      <AdminLayout>
        <div className="crm-admin-app">
          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chat Dashboard
              </button>
              <button
                onClick={() => setActiveTab('tester')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tester'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                API Tester
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'dashboard' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Admin Chat Management</h2>
                  <p className="text-sm text-gray-600">
                    Manage chat rooms, participants, and messages using admin-only API endpoints.
                  </p>
                </div>
                <AdminChatDashboard />
              </div>
            )}

            {activeTab === 'tester' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Admin API Testing</h2>
                  <p className="text-sm text-gray-600">
                    Test all admin API endpoints to ensure they work correctly in the CRM environment.
                  </p>
                </div>
                <AdminAPITester />
              </div>
            )}
          </div>

          {/* Environment Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Environment Information</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• <strong>Environment:</strong> CRM Admin Dashboard (localhost:8000/crm)</div>
              <div>• <strong>API Base:</strong> https://dev.gofloww.co/api/wall/chat/admin</div>
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