import React from 'react';
import { 
  Phone, 
  Video, 
  Info, 
  Maximize2, 
  X 
} from 'lucide-react';

const DesktopChatHeader = ({
  activeConversation,
  currentUser,
  getConversationPartner,
  getStatusColor,
  onShowInfo,
  onToggleCompact,
  onClose
}) => {
  // Only get partner if activeConversation exists
  const partner = activeConversation ? getConversationPartner(activeConversation, currentUser.id) : null;

  return (
    <div className="p-4 border-b border-white/30 bg-white/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {activeConversation.icon ? (
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(192,132,252,0.3)] overflow-hidden">
                <img 
                  src={activeConversation.icon} 
                  alt={activeConversation.type === 'group' ? 'Group Icon' : 'Profile Picture'} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white text-base shadow-[0_8px_32px_rgba(192,132,252,0.3)] overflow-hidden">
                {activeConversation.type === 'group' ? (
                  <span className="text-white">{activeConversation.name?.substring(0, 2).toUpperCase() || 'GR'}</span>
                ) : (
                  partner?.avatar
                )}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
          </div>
          <div>
            <h2 className="text-lg font-normal text-[#1f2937]">
              {activeConversation.type === 'group' ? activeConversation.name : partner?.name}
            </h2>
            {/* <p className="text-sm text-[#6b7280] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(partner?.status)}`}></span>
              {activeConversation.type === 'group' 
                ? `${activeConversation.participants?.length || 0} members`
                : (partner?.status === 'online' ? 'Active now' : partner?.status)
              }
            </p> */}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105">
            <Phone className="h-4 w-4 text-[#6d28d9]" />
          </button>
          <button className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105">
            <Video className="h-4 w-4 text-[#6d28d9]" />
          </button>
          <button 
            onClick={onShowInfo}
            className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
          >
            <Info className="h-4 w-4 text-[#6d28d9]" />
          </button>
          <div className="w-px h-6 bg-white/30 mx-2"></div>
          <button
            onClick={onToggleCompact}
            className="p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
            title="Switch to compact view"
          >
            <Maximize2 className="h-4 w-4 text-[#6d28d9]" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-red-100/80 backdrop-blur-sm hover:bg-red-200/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-105"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopChatHeader;
