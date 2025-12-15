import React from 'react';
import { ArrowLeft, Phone, Video, Info, Star, Plus, Users } from 'lucide-react';

const MobileChatHeader = ({
  activeConversation,
  currentUser,
  isAdmin,
  onClose,
  onBack,
  getConversationPartner,
  getStatusColor,
  pinAndFavoriteHandlers,
  setShowChatInfo,
  showMobilePlusMenu,
  setShowMobilePlusMenu,
  mobilePlusMenuRef,
  setSearchQuery,
  setShowCreateGroup
}) => {
  if (!activeConversation) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white safe-area-inset-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-white text-lg">Messages</h3>
        </div>
        
        {isAdmin && (
          <div className="relative" ref={mobilePlusMenuRef}>
            <button
              onClick={() => setShowMobilePlusMenu(!showMobilePlusMenu)}
              className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
            </button>
          
            {/* Mobile Plus Menu */}
            {showMobilePlusMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowCreateGroup(true);
                    setShowMobilePlusMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                >
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span>Create Group</span>
                </button>
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Only get partner if activeConversation exists
  const partner = activeConversation ? getConversationPartner(activeConversation, currentUser.id) : null;
  
  // Check if partner avatar is a URL
  const isPartnerAvatarUrl = partner?.avatar && typeof partner.avatar === 'string' && 
                             (partner.avatar.startsWith('http://') || partner.avatar.startsWith('https://'));

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white safe-area-inset-top">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative">
          {(activeConversation.icon || isPartnerAvatarUrl) ? (
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={activeConversation.icon || partner.avatar} 
                alt={activeConversation.type === 'group' ? 'Group Icon' : 'Profile Picture'} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white overflow-hidden">
              {activeConversation.type === 'group' ? (
                <span className="text-white">{activeConversation.name?.substring(0, 2).toUpperCase() || 'GR'}</span>
              ) : (
                <span className="text-white text-sm font-semibold">
                  {partner?.name?.substring(0, 2).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          )}
          {/* <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(partner?.status)}`}></div> */}
        </div>
        <div>
          <h3 className="text-white font-normal">
            {activeConversation.type === 'group' ? activeConversation.name : partner?.name}
          </h3>
          {/* <p className="text-sm text-purple-200">
            {activeConversation.type === 'group' 
              ? `${activeConversation.participants?.length || 0} members`
              : (partner?.status === 'online' ? 'Active now' : partner?.status)
            }
          </p> */}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => pinAndFavoriteHandlers.handleToggleFavorite(activeConversation.id)}
          className={`p-2 rounded-full transition-all duration-200 ${
            activeConversation.isFavorite 
              ? 'bg-yellow-500 text-white' 
              : 'hover:bg-purple-700 text-white'
          }`}
        >
          <Star className="h-5 w-5" />
        </button>
        {/* <button className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200">
          <Phone className="h-5 w-5" />
        </button>
        <button className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200">
          <Video className="h-5 w-5" />
        </button> */}
        <button 
          onClick={() => setShowChatInfo(true)}
          className="p-2 hover:bg-purple-700 rounded-full transition-all duration-200"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MobileChatHeader;
