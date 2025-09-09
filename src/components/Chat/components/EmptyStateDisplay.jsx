import React from 'react';
import { MessageCircle } from 'lucide-react';

const EmptyStateDisplay = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-white/30 backdrop-blur-xl rounded-r-3xl">
      <div className="text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_16px_64px_rgba(192,132,252,0.3)]">
          <MessageCircle className="h-16 w-16 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-[#1f2937] mb-3">Select a conversation</h3>
        <p className="text-[#6b7280] max-w-md mx-auto">
          Choose from your existing conversations or start a new one to begin chatting with your team
        </p>
      </div>
    </div>
  );
};

export default EmptyStateDisplay;
