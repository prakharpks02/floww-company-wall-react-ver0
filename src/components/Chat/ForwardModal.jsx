import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
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

  // Different styling for compact mode
  if (isCompact) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-[500px] flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-[280px] max-h-[400px] flex flex-col border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-semibold">Forward Message</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message Preview */}
          <div className="p-3 border-b bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Message to forward:</div>
            <div className="bg-white p-2 rounded border text-xs max-h-12 overflow-y-auto">
              {message?.text}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-medium mb-2">Select conversations:</div>
            <div className="space-y-1">
              {conversations.map(conversation => {
                const partner = getConversationPartner(conversation, currentUserId);
                const isSelected = selectedConversations.includes(conversation.id);
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleToggleConversation(conversation.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {partner?.avatar}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-xs truncate">{partner?.name}</div>
                      <div className="text-xs text-gray-500">
                        {conversation.type === 'group' ? 'Group' : 'Direct'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedConversations.length === 0}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forward ({selectedConversations.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Forward Message</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 border-b bg-gray-50">
          <div className="text-xs text-gray-500 mb-1">Message to forward:</div>
          <div className="bg-white p-2 rounded border text-sm max-h-20 overflow-y-auto">
            {message?.text}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm font-medium mb-3">Select conversations:</div>
          <div className="space-y-2">
            {conversations.map(conversation => {
              const partner = getConversationPartner(conversation, currentUserId);
              const isSelected = selectedConversations.includes(conversation.id);
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => handleToggleConversation(conversation.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {partner?.avatar}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{partner?.name}</div>
                    <div className="text-xs text-gray-500">
                      {conversation.type === 'group' ? 'Group' : 'Direct'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Forward ({selectedConversations.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
