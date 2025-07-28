import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const MobileMenu = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

const ResponsiveLayout = ({ header, sidebar, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with mobile menu button */}
      <div className="relative">
        {header}
        
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-6 left-4 z-30 p-2 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          {sidebar}
        </div>
        
        {/* Mobile Sidebar */}
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {sidebar}
        </MobileMenu>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
