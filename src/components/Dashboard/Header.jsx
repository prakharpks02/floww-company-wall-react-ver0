import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, LogOut, Users } from 'lucide-react';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Header = ({ onSearchChange, searchValue }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4 min-w-0">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#9f7aea' }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
                Atom HR Community
              </h1>
              <p className="text-xs lg:text-sm text-gray-500 truncate">Human Resources Department</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold text-gray-900">Atom HR</h1>
            </div>
          </div>

          {/* Search Bar - Hidden on small screens */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search posts, colleagues, or topics..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2 text-sm"
                style={{ 
                  '--tw-ring-color': '#9f7aea',
                  'borderColor': 'var(--focus-border, #d1d5db)'
                }}
                onFocus={(e) => e.target.style.setProperty('--focus-border', '#9f7aea')}
                onBlur={(e) => e.target.style.setProperty('--focus-border', '#d1d5db')}
              />
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden flex-1 mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2 text-sm"
                style={{ 
                  '--tw-ring-color': '#9f7aea',
                  'borderColor': 'var(--focus-border, #d1d5db)'
                }}
                onFocus={(e) => e.target.style.setProperty('--focus-border', '#9f7aea')}
                onBlur={(e) => e.target.style.setProperty('--focus-border', '#d1d5db')}
              />
            </div>
          </div>

          {/* User Profile and Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User Profile */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="h-7 w-7 lg:h-8 lg:w-8 rounded-full object-cover"
              />
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.position}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
