import React, { useState } from 'react';
import { X, Check, Send } from 'lucide-react';
import { getConversationPartner } from './utils/dummyData';

const ForwardModal = ({ isOpen, onClose, onForward, conversations, currentUserId, message, isCompact = false }) => {
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

  // Compact mode with neumorphic styling
  if (isCompact) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-[500px] flex items-center justify-center z-[60]">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] w-full max-w-[320px] max-h-[450px] flex flex-col border border-white/40 neo-glassmorphism animate-in slide-in-from-bottom-2 duration-300">
          {/* Neumorphic Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-[#c084fc] to-[#d8b4fe] text-white rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,255,255,0.3)]">
                <Send className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold drop-shadow-sm">Forward Message</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message Preview */}
          <div className="p-4 border-b border-white/20 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm">
            <div className="text-xs font-medium text-[#6d28d9] mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#c084fc] rounded-full"></span>
              Message to forward:
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-white/30 text-sm max-h-16 overflow-y-auto shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] text-[#6d28d9] neo-scroll">
              {message?.text}
            </div>
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
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#c084fc]/20 to-[#d8b4fe]/20 border border-[#c084fc]/30 shadow-[0_8px_25px_rgba(192,132,252,0.15)]' 
                        : 'bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 shadow-[inset_0_0_15px_rgba(255,255,255,0.8)]'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-2xl flex items-center justify-center text-white text-xs font-bold shadow-[0_4px_15px_rgba(109,40,217,0.3)]">
                        {partner?.avatar}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#86efac] to-[#4ade80] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(134,239,172,0.4)]">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-xs text-[#6d28d9] truncate">{partner?.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {conversation.type === 'group' ? 'Group Chat' : 'Direct Message'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Neumorphic Footer */}
          <div className="p-4 border-t border-white/20 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm rounded-b-3xl flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#6d28d9] bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-all duration-300 font-medium shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:scale-105 border border-white/30"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedConversations.length === 0}
              className={`px-4 py-2 text-xs rounded-xl font-medium transition-all duration-300 ${
                selectedConversations.length > 0
                  ? 'bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] text-white shadow-[0_8px_25px_rgba(192,132,252,0.3)] hover:shadow-[0_12px_35px_rgba(192,132,252,0.4)] hover:scale-105'
                  : 'bg-gray-200/70 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              Forward ({selectedConversations.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full screen modal with neumorphic styling
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.15)] w-full max-w-md max-h-[90vh] flex flex-col border border-white/40 neo-glassmorphism animate-in zoom-in-95 duration-300">
        {/* Neumorphic Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-[#c084fc] to-[#d8b4fe] text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]">
              <Send className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold drop-shadow-sm">Forward Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 hover:scale-105 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm">
          <div className="text-sm font-semibold text-[#6d28d9] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#c084fc] rounded-full"></span>
            Message to forward:
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/30 text-sm max-h-24 overflow-y-auto shadow-[inset_0_0_20px_rgba(255,255,255,0.8)] text-[#6d28d9] neo-scroll">
            {message?.text}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-6 neo-scroll">
          <div className="text-sm font-semibold text-[#6d28d9] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#86efac] rounded-full"></span>
            Select conversations:
          </div>
          <div className="space-y-3">
            {conversations.map(conversation => {
              const partner = getConversationPartner(conversation, currentUserId);
              const isSelected = selectedConversations.includes(conversation.id);
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => handleToggleConversation(conversation.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#c084fc]/20 to-[#d8b4fe]/20 border border-[#c084fc]/30 shadow-[0_8px_25px_rgba(192,132,252,0.15)]' 
                      : 'bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 shadow-[inset_0_0_20px_rgba(255,255,255,0.8)]'
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-[0_6px_20px_rgba(109,40,217,0.3)]">
                      {partner?.avatar}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#86efac] to-[#4ade80] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(134,239,172,0.4)]">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-[#6d28d9] truncate">{partner?.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {conversation.type === 'group' ? 'Group Chat' : 'Direct Message'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Neumorphic Footer */}
        <div className="p-6 border-t border-white/20 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm rounded-b-3xl flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[#6d28d9] bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white/90 transition-all duration-300 font-medium shadow-[inset_0_0_20px_rgba(255,255,255,0.8)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:scale-105 border border-white/30"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              selectedConversations.length > 0
                ? 'bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] text-white shadow-[0_8px_25px_rgba(192,132,252,0.3)] hover:shadow-[0_12px_35px_rgba(192,132,252,0.4)] hover:scale-105'
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
