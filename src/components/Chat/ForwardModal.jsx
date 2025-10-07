 import React, { useState } from 'react';
import { X, Check, Send, Search } from 'lucide-react';
import { getConversationPartner } from './utils/dummyData';

const ForwardModal = ({ isOpen, onClose, onForward, conversations, currentUserId, message, isCompactMode = true }) => {
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleToggleConversation = (convId) => {
    setSelectedConversations(prev => 
      prev.includes(convId) 
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    );
  };

  const handleClose = () => {
    setSelectedConversations([]);
    setSearchQuery('');
    onClose();
  };

  const handleForward = () => {
    onForward(selectedConversations);
    setSelectedConversations([]);
    setSearchQuery('');
    onClose();
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const partner = getConversationPartner(conversation, currentUserId);
    const searchLower = searchQuery.toLowerCase();
    
    // Search by partner name or conversation type
    return (
      partner?.name?.toLowerCase().includes(searchLower) ||
      conversation.type?.toLowerCase().includes(searchLower) ||
      (conversation.type === 'group' && 'group'.includes(searchLower)) ||
      (conversation.type === 'direct' && 'direct'.includes(searchLower))
    );
  });

  // Use compact mode with neumorphic styling - size based on mode and screen size
  const containerClasses = isCompactMode 
    ? "fixed bottom-4 right-4 w-64 h-[320px] lg:w-72 lg:h-[360px] flex items-center justify-center z-[60]"
    : "fixed bottom-4 right-4 w-80 h-[440px] lg:w-96 lg:h-[520px] flex items-center justify-center z-[60]";
    
  const modalClasses = isCompactMode
    ? "bg-white/95 backdrop-blur-lg rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.12)] w-full max-w-[250px] lg:max-w-[280px] max-h-[300px] lg:max-h-[340px] flex flex-col border border-white/40 neo-glassmorphism animate-in slide-in-from-bottom-2 duration-300"
    : "bg-white/95 backdrop-blur-lg rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.12)] w-full max-w-[320px] lg:max-w-[380px] max-h-[420px] lg:max-h-[500px] flex flex-col border border-white/40 neo-glassmorphism animate-in slide-in-from-bottom-2 duration-300";

  return (
      <div className={containerClasses}>
        <div className={modalClasses}>
          {/* Neumorphic Header */}
          <div className={`flex items-center justify-between border-b border-white/20 bg-gradient-to-r from-[#c084fc] to-[#d8b4fe] text-white rounded-t-2xl ${
            isCompactMode ? 'p-2 lg:p-3' : 'p-3 lg:p-4'
          }`}>
            <div className={`flex items-center ${isCompactMode ? 'gap-2' : 'gap-2 lg:gap-3'}`}>
              <div className={`bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-[inset_0_0_10px_rgba(255,255,255,0.3)] ${
                isCompactMode ? 'w-5 h-5 lg:w-6 lg:h-6' : 'w-6 h-6 lg:w-8 lg:h-8'
              }`}>
                <Send className={`text-white ${
                  isCompactMode ? 'h-2 w-2 lg:h-3 lg:w-3' : 'h-3 w-3 lg:h-4 lg:w-4'
                }`} />
              </div>
              <h3 className={`font-medium drop-shadow-sm ${
                isCompactMode ? 'text-xs' : 'text-xs lg:text-sm'
              }`}>Forward Message</h3>
            </div>
            <button
              onClick={handleClose}
              className={`hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105 ${
                isCompactMode ? 'p-1 lg:p-1.5' : 'p-1.5 lg:p-2'
              }`}
            >
              <X className={`${
                isCompactMode ? 'h-2 w-2 lg:h-3 lg:w-3' : 'h-3 w-3 lg:h-4 lg:w-4'
              }`} />
            </button>
          </div>

          {/* Search Section */}
          <div className={`border-b border-white/20 bg-white/50 backdrop-blur-sm ${
            isCompactMode ? 'p-2 lg:p-3' : 'p-3 lg:p-4'
          }`}>
            <div className="relative">
              <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-[#6d28d9] ${
                isCompactMode ? 'h-3 w-3 lg:h-4 lg:w-4' : 'h-4 w-4'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className={`w-full bg-white/80 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-[#c084fc]/50 focus:border-[#c084fc] transition-all duration-200 text-[#6d28d9] placeholder-gray-400 ${
                  isCompactMode ? 'pl-6 lg:pl-8 pr-2 py-1 lg:py-1.5 text-xs' : 'pl-8 pr-3 py-1.5 lg:py-2 text-xs lg:text-sm'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#6d28d9] transition-colors ${
                    isCompactMode ? 'p-0.5' : 'p-1'
                  }`}
                >
                  <X className={`${
                    isCompactMode ? 'h-2 w-2 lg:h-3 lg:w-3' : 'h-3 w-3'
                  }`} />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className={`flex-1 overflow-y-auto neo-scroll ${
            isCompactMode ? 'p-3 lg:p-4' : 'p-4 lg:p-6'
          }`}>
            <div className={`font-semibold text-[#6d28d9] flex items-center gap-2 ${
              isCompactMode ? 'text-xs lg:text-sm mb-2 lg:mb-3' : 'text-sm lg:text-base mb-3 lg:mb-4'
            }`}>
              <span className={`bg-[#86efac] rounded-full ${
                isCompactMode ? 'w-1 h-1 lg:w-1.5 lg:h-1.5' : 'w-1.5 h-1.5 lg:w-2 lg:h-2'
              }`}></span>
              Select conversations:
            </div>
            <div className={`${
              isCompactMode ? 'space-y-1 lg:space-y-2' : 'space-y-2 lg:space-y-3'
            }`}>
              {filteredConversations.length === 0 ? (
                <div className={`text-center text-gray-500 ${
                  isCompactMode ? 'py-4 text-xs' : 'py-6 text-sm'
                }`}>
                  {searchQuery ? 'No conversations found' : 'No conversations available'}
                </div>
              ) : (
                filteredConversations.map(conversation => {
                const partner = getConversationPartner(conversation, currentUserId);
                const isSelected = selectedConversations.includes(conversation.id);
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleToggleConversation(conversation.id)}
                    className={`w-full flex items-center rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                      isCompactMode ? 'gap-1 lg:gap-2 p-1.5 lg:p-2' : 'gap-2 lg:gap-3 p-2 lg:p-3'
                    } ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#c084fc]/20 to-[#d8b4fe]/20 border border-[#c084fc]/30 shadow-[0_6px_20px_rgba(192,132,252,0.12)]' 
                        : 'bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 shadow-[inset_0_0_10px_rgba(255,255,255,0.8)]'
                    }`}
                  >
                    <div className="relative">
                      <div className={`bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-xl flex items-center justify-center text-white font-bold shadow-[0_3px_10px_rgba(109,40,217,0.3)] ${
                        isCompactMode ? 'w-5 h-5 lg:w-6 lg:h-6 text-xs' : 'w-6 h-6 lg:w-8 lg:h-8 text-xs lg:text-sm'
                      }`}>
                        {partner?.avatar}
                      </div>
                      {isSelected && (
                        <div className={`absolute -top-0.5 -right-0.5 bg-gradient-to-br from-[#86efac] to-[#4ade80] rounded-full flex items-center justify-center shadow-[0_3px_8px_rgba(134,239,172,0.4)] ${
                          isCompactMode ? 'w-3 h-3 lg:w-4 lg:h-4' : 'w-4 h-4 lg:w-5 lg:h-5'
                        }`}>
                          <Check className={`text-white ${
                            isCompactMode ? 'h-1.5 w-1.5 lg:h-2 lg:w-2' : 'h-2 w-2 lg:h-3 lg:w-3'
                          }`} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium text-[#6d28d9] truncate ${
                        isCompactMode ? 'text-xs' : 'text-xs lg:text-sm'
                      }`}>{partner?.name}</div>
                      <div className={`text-gray-500 ${
                        isCompactMode ? 'text-xs' : 'text-xs lg:text-sm'
                      }`}>
                        {conversation.type === 'group' ? 'Group' : 'Direct'}
                      </div>
                    </div>
                  </button>
                );
              }))}
            </div>
          </div>

          {/* Neumorphic Footer */}
          <div className={`border-t border-white/20 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm rounded-b-2xl flex justify-end ${
            isCompactMode ? 'p-2 lg:p-3 gap-1 lg:gap-2' : 'p-3 lg:p-4 gap-2 lg:gap-3'
          }`}>
            <button
              onClick={handleClose}
              className={`text-[#6d28d9] bg-white/70 backdrop-blur-sm rounded-lg hover:bg-white/90 transition-all duration-300 font-medium shadow-[inset_0_0_10px_rgba(255,255,255,0.8)] hover:scale-105 border border-white/30 ${
                isCompactMode ? 'px-2 py-1 lg:px-3 lg:py-1.5 text-xs' : 'px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedConversations.length === 0}
              className={`rounded-lg font-medium transition-all duration-300 ${
                isCompactMode ? 'px-2 py-1 lg:px-3 lg:py-1.5 text-xs' : 'px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm'
              } ${
                selectedConversations.length > 0
                  ? 'bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] text-white shadow-[0_6px_20px_rgba(192,132,252,0.3)] hover:shadow-[0_8px_25px_rgba(192,132,252,0.4)] hover:scale-105'
                  : 'bg-gray-200/70 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              Forward ({selectedConversations.length})
            </button>
          </div>
        </div>
      </div>
    );
};

export default ForwardModal;
