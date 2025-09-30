import React from 'react';

/**
 * Admin Layout Component - CRM Dashboard Layout
 * This layout is specifically for the CRM admin dashboard and does NOT
 * include any employee chat context or components that might trigger
 * employee API calls.
 */
const AdminLayout = ({ children }) => {
  console.log('🔧 AdminLayout: Rendering admin-only layout');
  
  return (
    <div className="admin-layout min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                CRM Admin Dashboard
              </h1>
              <div className="ml-4 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Admin API Only
              </div>
            </div>
            <div className="text-sm text-gray-500">
              localhost:8000/crm
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 text-center text-sm text-gray-500">
            Admin Dashboard - Using Admin APIs Only • No Employee Chat Context
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;