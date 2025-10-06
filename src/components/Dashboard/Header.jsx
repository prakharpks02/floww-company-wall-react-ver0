import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, LogOut, Users, X } from 'lucide-react';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Header = ({ onSearchChange, searchValue }) => {
  const { user, logout } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleMobileSearchToggle = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      // Focus search input after animation
      setTimeout(() => {
        document.getElementById('mobile-search-input')?.focus();
      }, 100);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 safe-area-inset-top">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-shrink-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#9f7aea' }}>
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="block min-w-0">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  Atom Buzz
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
                 Buzz Together. Work Smarter.
                </p>
              </div>
           
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search posts, colleagues, or topics..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Mobile Search Button */}
              <button
                onClick={handleMobileSearchToggle}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors touch-friendly rounded-full hover:bg-gray-100"
                aria-label="Search"
              >
                {showMobileSearch ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              {/* <NotificationDropdown /> */}

              {/* User Profile */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src={user?.profile_picture_link}
                  alt={user?.name}
                  className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full object-cover border-2 border-gray-200 hover:border-purple-300 transition-colors"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-24 lg:max-w-none">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-24 lg:max-w-none">
                    {user?.position}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors touch-friendly rounded-full hover:bg-red-50"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="mobile-search-input"
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search posts, colleagues, or topics..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base"
                  onBlur={() => {
                    // Close search on blur if search is empty
                    if (!searchValue.trim()) {
                      setTimeout(() => setShowMobileSearch(false), 100);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Fixed spacer to account for header */}
      <div className="h-16 sm:h-20" />
    </>
  );
};

export default Header;
