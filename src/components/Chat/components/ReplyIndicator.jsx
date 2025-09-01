import React from 'react';
import { X } from 'lucide-react';

const ReplyIndicator = ({
  replyToMessage,
  getEmployeeById,
  onCancel,
  isDesktop = false
}) => {
  if (!replyToMessage) return null;

  const containerClass = isDesktop 
    ? "mb-4 bg-gradient-to-r from-[#c084fc]/20 to-[#d8b4fe]/20 backdrop-blur-sm border border-[#c084fc]/30 p-4 rounded-2xl"
    : "mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg";

  const titleClass = isDesktop 
    ? "text-sm font-medium text-[#6d28d9] mb-1"
    : "text-sm font-medium text-blue-700 mb-1";

  const textClass = isDesktop 
    ? "text-sm text-[#6b7280] truncate"
    : "text-sm text-blue-600 truncate";

  const buttonClass = isDesktop 
    ? "p-2 hover:bg-white/30 rounded-xl transition-colors"
    : "p-1 hover:bg-blue-100 rounded transition-colors";

  const xIconClass = isDesktop 
    ? "h-4 w-4 text-[#6b7280]"
    : "h-4 w-4 text-blue-600";

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={titleClass}>
            Replying to {getEmployeeById(replyToMessage.senderId)?.name}
          </div>
          <div className={textClass}>
            {replyToMessage.text}
          </div>
        </div>
        <button
          onClick={onCancel}
          className={buttonClass}
        >
          <X className={xIconClass} />
        </button>
      </div>
    </div>
  );
};

export default ReplyIndicator;
