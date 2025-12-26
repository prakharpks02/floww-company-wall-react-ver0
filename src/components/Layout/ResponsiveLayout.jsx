import React, { useState, useEffect } from 'react';
import { Home, Plus, FileText, Megaphone, MessageCircle, Menu, X } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const MobileBottomNav = ({ activeView, onViewChange, onCreatePost, user, isScrolledDown, onToggleSidebar }) => {
  const isAdmin = user?.is_admin;
  const { isChatOpen, isChatMinimized, toggleChat, conversations } = useChat();
  
  // Calculate total unread messages
  const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Handle home button click - scroll to top if already on home, otherwise navigate to home
  const handleHomeClick = () => {
    if (activeView === 'home') {
      scrollToTop();
    } else {
      onViewChange('home');
    }
  };
  
  // For non-admin users, create a layout with Create Post in the center
  if (!isAdmin) {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-gray-50/80 border-t border-gray-200 safe-area-inset-bottom z-40 shadow-lg backdrop-blur-sm">
        <div className="flex items-center py-3 px-1">
          {/* Home Feed */}
          <button
            onClick={handleHomeClick}
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

          {/* Chat */}
          <button
            onClick={toggleChat}
            className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-friendly flex-1 mx-1 ${
              isChatOpen && !isChatMinimized
                ? 'text-purple-600 bg-purple-50 scale-105'
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Chat</span>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // For admin users, include menu and chat
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-gray-50/80 border-t border-gray-200 safe-area-inset-bottom z-40 shadow-lg backdrop-blur-sm">
      <div className="flex items-center py-3 px-1">
        {/* Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-friendly flex-1 mx-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
        >
          <Menu className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Menu</span>
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

        {/* Chat */}
        <button
          onClick={toggleChat}
          className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-friendly flex-1 mx-1 ${
            isChatOpen && !isChatMinimized
              ? 'text-purple-600 bg-purple-50 scale-105'
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
          }`}
        >
          <MessageCircle className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Chat</span>
          {totalUnreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

const ResponsiveLayout = ({ header, sidebar, children, activeView, onViewChange, onCreatePost, user, chatContent }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeView]);

  // Don't render layout components when in full-screen mobile chat mode
  if (isFullScreenMobile && isMobile) {
    return null;
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {header}
      </div>
      
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:pt-16">
          <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
            {sidebar}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && isMobile && (
          <>
            {/* Backdrop */}
            <div 
              className="lg:hidden fixed inset-0 backdrop-blur-md z-40 transition-opacity"
              onClick={toggleMobileSidebar}
            />
            
            {/* Sidebar */}
            <div className="lg:hidden fixed top-6 bottom-30 left-0 w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out shadow-lg rounded-r-lg">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={toggleMobileSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>
              <div className="pb-4">
                {sidebar}
              </div>
            </div>
          </>
        )}
        
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
        onToggleSidebar={toggleMobileSidebar}
      />
    </div>
  );
};

export default ResponsiveLayout;
