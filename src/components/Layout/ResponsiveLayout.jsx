import React, { useState, useEffect } from 'react';
import { Home, Plus, FileText, Megaphone } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const MobileBottomNav = ({ activeView, onViewChange, onCreatePost, user, isScrolledDown }) => {
  const isAdmin = user?.is_admin;
  
  // For non-admin users, create a layout with Create Post in the center
  if (!isAdmin) {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-gray-50/80 border-t border-gray-200 safe-area-inset-bottom z-40 shadow-lg backdrop-blur-sm">
        <div className={`flex items-center transition-all duration-300 py-3 ${
          isScrolledDown ? 'px-2 pr-16' : 'px-1'
        }`}>
          {/* Home Feed */}
          <button
            onClick={() => onViewChange('home')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-friendly flex-1 mx-1 ${
              activeView === 'home'
                ? 'text-purple-600 bg-purple-50 scale-105'
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Community Broadcast */}
          <button
            onClick={() => onViewChange('broadcast')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-friendly flex-1 mx-1 ${
              activeView === 'broadcast'
                ? 'text-purple-600 bg-purple-50 scale-105'
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            <Megaphone className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Broadcast</span>
          </button>

          {/* Create Post (Prominent) */}
          <button
            onClick={onCreatePost}
            className="flex flex-col items-center justify-center p-3 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 touch-friendly flex-1 mx-1"
          >
            <Plus className="h-6 w-6 mb-1" />
            <span className="text-xs font-semibold">Create</span>
          </button>

          {/* My Posts */}
          <button
            onClick={() => onViewChange('myposts')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-friendly flex-1 mx-1 ${
              activeView === 'myposts'
                ? 'text-purple-600 bg-purple-50 scale-105'
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">My Posts</span>
          </button>
        </div>
      </div>
    );
  }

  // For admin users, simpler layout with just broadcast
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-gray-50/80 border-t border-gray-200 safe-area-inset-bottom z-40 shadow-lg backdrop-blur-sm">
      <div className={`flex items-center justify-center transition-all duration-300 py-3 ${
        isScrolledDown ? 'px-2 pr-16' : 'px-4'
      }`}>
        <button
          onClick={() => onViewChange('broadcast')}
          className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 touch-friendly w-full max-w-xs ${
            activeView === 'broadcast'
              ? 'text-purple-600 bg-purple-50 scale-105'
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
          }`}
        >
          <Megaphone className="h-6 w-6 mb-1" />
          <span className="text-sm font-medium">Community Broadcast</span>
        </button>
      </div>
    </div>
  );
};

const ResponsiveLayout = ({ header, sidebar, children, activeView, onViewChange, onCreatePost, user, chatContent }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const { isChatOpen, isChatMinimized, isCompactMode, isFullScreenMobile } = useChat();

  // Chat is visible when it's open AND not minimized AND not in compact mode (for layout purposes)
  const isChatTakingSpace = isChatOpen && !isChatMinimized && !isCompactMode;
  
  // Chat is in compact mode (small floating popup, needs some space)
  const isChatCompact = isChatOpen && !isChatMinimized && isCompactMode;

  // Handle responsive behavior
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Handle scroll detection for bottom navigation adjustment
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset > 300;
      setIsScrolledDown(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Don't render layout components when in full-screen mobile chat mode
  if (isFullScreenMobile && isMobile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {header}
      </div>
      
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:pt-16">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {sidebar}
          </div>
        </div>
        
        {/* Main Content */}
        <main className={`flex-1 lg:ml-64 min-h-screen transition-all duration-300 ${
          isChatTakingSpace && !isMobile ? 'lg:mr-[750px]' : 
          isChatCompact && !isMobile ? 'lg:mr-[350px]' : ''
        }`}>
          <div className="p-3 sm:p-4 lg:p-8 pt-16 pb-24 lg:pb-8">
            <div className={`mx-auto w-full ${
              isChatTakingSpace && !isMobile ? 'max-w-4xl mr-auto ml-0' : 
              isChatCompact && !isMobile ? 'max-w-3xl' : 'max-w-4xl'
            }`}>
              {children}
            </div>
          </div>
        </main>

        {/* Chat Area - Fixed on Desktop when open and in full mode only */}
        {isChatTakingSpace && !isMobile && (
          <div className="hidden lg:block lg:fixed lg:top-18 lg:bottom-0 lg:right-4 lg:w-[730px] lg:bg-white lg:border lg:border-gray-200 lg:shadow-lg lg:rounded-xl">
            <div className="h-full pt-6">
              {chatContent}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeView={activeView}
        onViewChange={onViewChange}
        onCreatePost={onCreatePost}
        user={user}
        isScrolledDown={isScrolledDown}
      />
    </div>
  );
};

export default ResponsiveLayout;
