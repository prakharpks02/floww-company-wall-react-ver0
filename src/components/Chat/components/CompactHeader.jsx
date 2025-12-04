import React from 'react';
import { 
  ArrowLeft, 
  Minimize2, 
  Maximize2, 
  Phone, 
  Video, 
  Info, 
  Plus,
  X,
  MoreVertical,
  Pin,
  Star
} from 'lucide-react';

const CompactHeader = ({
  activeConversation,
  currentUser,
  isMinimized,
  onToggleMinimize,
  onClose,
  onBack,
  getConversationPartner,
  getStatusColor,
  onShowInfo,
  showCompactPlusMenu,
  setShowCompactPlusMenu,
  compactPlusMenuRef,
  onNewChat,
  onCreateGroup,
  showCompactKebabMenu,
  setShowCompactKebabMenu,
  compactKebabMenuRef,
  pinnedChats,
  favouriteChats,
  pinAndFavoriteHandlers,
  contextMenuHandlers
}) => {
  // Only get partner if activeConversation exists and is valid
  const partner = (activeConversation && activeConversation.type !== undefined) 
    ? getConversationPartner(activeConversation, currentUser.id) 
    : null;

  return (
    <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-between text-white rounded-t-xl" style={{ minHeight: '60px' }}>
      <div className="flex items-center gap-3">
        {activeConversation ? (
          <>
            <button 
              onClick={onBack}
              className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              {activeConversation.icon ? (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  <img 
                    src={activeConversation.icon} 
                    alt={activeConversation.type === 'group' ? 'Group Icon' : 'Profile Picture'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white font-normal text-sm shadow-lg overflow-hidden">
                  {activeConversation.type === 'group' ? (
                    <span className="text-white text-xs">{activeConversation.name?.substring(0, 2).toUpperCase() || 'GR'}</span>
                  ) : partner?.avatar && partner.avatar.startsWith('http') ? (
                    <img 
                      src={partner.avatar} 
                      alt={partner.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold">{partner?.name?.substring(0, 2).toUpperCase() || 'U'}</span>
                  )}
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
            </div>
            <div>
              <h3 className="font-normal text-sm">
                {activeConversation.type === 'group' ? activeConversation.name : partner?.name}
              </h3>
              <p className="text-xs text-purple-200">
                {activeConversation.type === 'group' 
                  ? `${activeConversation.participants?.length || 0} members`
                  : (partner?.status === 'online' ? 'Active now' : partner?.status)
                }
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold">AL</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Atom Link</h3>
              <p className="text-xs text-purple-200">Team Chat</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {activeConversation ? (
          <>
            <button className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110">
              <Phone className="h-4 w-4" />
            </button>
            <button className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110">
              <Video className="h-4 w-4" />
            </button>
            <button 
              onClick={onShowInfo}
              className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
            >
              <Info className="h-4 w-4" />
            </button>
            
            {/* Kebab Menu for conversation actions */}
            <div className="relative" ref={compactKebabMenuRef}>
              <button
                onClick={() => setShowCompactKebabMenu(!showCompactKebabMenu)}
                className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200"
                title="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {/* Compact Kebab Menu */}
              {showCompactKebabMenu && activeConversation && (
                <div 
                  className="absolute top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] overflow-hidden max-h-80"
                  style={{
                    right: '0px',
                    left: 'auto'
                  }}
                >
                  <div className="py-1 overflow-y-auto">
                    {(() => {
                      const isPinned = pinnedChats?.find(p => p.id === activeConversation.id);
                      const isFavourite = favouriteChats?.find(f => f.id === activeConversation.id);
                      return (
                        <>
                          <button
                            onClick={() => {
                              setShowCompactKebabMenu(false);
                              if (isPinned) {
                                pinAndFavoriteHandlers?.handleUnpinChat(activeConversation.id);
                              } else {
                                pinAndFavoriteHandlers?.handlePinConfirm('forever', activeConversation, 'chat');
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Pin className="h-4 w-4" />
                            {isPinned ? 'Unpin Chat' : 'Pin Chat'}
                          </button>
                          <button
                            onClick={() => {
                              setShowCompactKebabMenu(false);
                              if (isFavourite) {
                                pinAndFavoriteHandlers?.handleRemoveFromFavourites(activeConversation.id);
                              } else {
                                pinAndFavoriteHandlers?.handleAddToFavourites(activeConversation);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Star className="h-4 w-4" />
                            {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative" ref={compactPlusMenuRef}>
            <button
              onClick={() => setShowCompactPlusMenu(!showCompactPlusMenu)}
              className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200"
              title="New chat options"
            >
              <Plus className="h-4 w-4" />
            </button>
            
            {/* Compact Plus Menu */}
            {showCompactPlusMenu && (
              <div 
                className="absolute top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] overflow-hidden max-h-80"
                style={{
                  right: '0px',
                  left: 'auto'
                }}
              >
                <div className="py-1 overflow-y-auto">
                  <button
                    onClick={onNewChat}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                    <span>New Chat</span>
                  </button>
                  <button
                    onClick={onCreateGroup}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"
                  >
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                    <span>Create Group</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="w-px h-4 bg-purple-400 mx-1"></div>
        
        <button
          onClick={onToggleMinimize}
          className="p-1.5 hover:bg-purple-700 rounded-full transition-all duration-200 transform hover:scale-110"
          title={isMinimized ? "Expand" : "Maximize"}
        >
          {isMinimized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-red-600 rounded-full transition-all duration-200 transform hover:scale-110"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CompactHeader;
