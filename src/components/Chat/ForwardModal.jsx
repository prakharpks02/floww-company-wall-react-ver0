import React, { useState } from 'react';
import { X, Check, Send } from 'lucide-react';
import { getConversationPartner } from './utils/dummyData';

const ForwardModal = ({ isOpen, onClose, onForward, conversations, currentUserId, message }) => {
  const [selectedConversations, setSelectedConversations] = useState([]);

  if (!isOpen) return null;

  const handleToggleConversation = (convId) => {
    setSelectedConversations(prev => 
      prev.includes(convId) 
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    );
  };

  const handleForward = () => {
    onForward(selectedConversations);
    setSelectedConversations([]);
    onClose();
  };

  // Always use compact mode with neumorphic styling
  return (
      <div className="fixed bottom-4 right-4 w-72 h-[320px] flex items-center justify-center z-[60]">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.12)] w-full max-w-[280px] max-h-[300px] flex flex-col border border-white/40 neo-glassmorphism animate-in slide-in-from-bottom-2 duration-300">
          {/* Neumorphic Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/20 bg-gradient-to-r from-[#c084fc] to-[#d8b4fe] text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-[inset_0_0_10px_rgba(255,255,255,0.3)]">
                <Send className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-xs font-medium drop-shadow-sm">Forward Message</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-4 neo-scroll">
            <div className="text-sm font-semibold text-[#6d28d9] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#86efac] rounded-full"></span>
              Select conversations:
            </div>
            <div className="space-y-2">
              {conversations.map(conversation => {
                const partner = getConversationPartner(conversation, currentUserId);
                const isSelected = selectedConversations.includes(conversation.id);
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleToggleConversation(conversation.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#c084fc]/20 to-[#d8b4fe]/20 border border-[#c084fc]/30 shadow-[0_6px_20px_rgba(192,132,252,0.12)]' 
                        : 'bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 shadow-[inset_0_0_10px_rgba(255,255,255,0.8)]'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-[0_3px_10px_rgba(109,40,217,0.3)]">
                        {partner?.avatar}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-[#86efac] to-[#4ade80] rounded-full flex items-center justify-center shadow-[0_3px_8px_rgba(134,239,172,0.4)]">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-xs text-[#6d28d9] truncate">{partner?.name}</div>
                      <div className="text-xs text-gray-500">
                        {conversation.type === 'group' ? 'Group' : 'Direct'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Neumorphic Footer */}
          <div className="p-3 border-t border-white/20 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm rounded-b-2xl flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#6d28d9] bg-white/70 backdrop-blur-sm rounded-lg hover:bg-white/90 transition-all duration-300 font-medium shadow-[inset_0_0_10px_rgba(255,255,255,0.8)] hover:scale-105 border border-white/30"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedConversations.length === 0}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-300 ${
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
