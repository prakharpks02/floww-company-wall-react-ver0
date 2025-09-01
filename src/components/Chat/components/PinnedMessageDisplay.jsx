import React from 'react';
import { Pin, X } from 'lucide-react';

const PinnedMessageDisplay = ({
  pinnedMessage,
  onUnpin,
  isDesktop = false,
  isCompact = false
}) => {
  if (!pinnedMessage) return null;

  const containerClass = isCompact 
    ? "bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 p-2 mx-2 mt-2 rounded-lg shadow-sm"
    : isDesktop 
    ? "bg-gradient-to-r from-[#86efac]/20 to-[#4ade80]/20 backdrop-blur-sm border border-[#86efac]/30 p-4 rounded-2xl shadow-[inset_0_0_20px_rgba(134,239,172,0.2)]"
    : "bg-gradient-to-r from-green-100 to-green-50 border border-green-200 p-3 mx-4 mt-4 rounded-lg";

  const pinIconClass = isCompact ? "h-3 w-3 text-purple-600" : isDesktop ? "h-4 w-4 text-[#86efac]" : "h-4 w-4 text-green-600";
  const titleClass = isCompact ? "text-xs font-semibold text-purple-700" : isDesktop ? "text-sm font-semibold text-[#86efac]" : "text-sm font-semibold text-green-700";
  const textClass = isCompact ? "text-gray-800 text-xs" : isDesktop ? "text-[#1f2937]" : "text-gray-800 text-sm";
  const buttonClass = isCompact 
    ? "p-1 hover:bg-purple-100 rounded transition-colors"
    : isDesktop 
    ? "p-2 hover:bg-white/30 rounded-xl transition-colors"
    : "p-1 hover:bg-green-100 rounded transition-colors";
  const xIconClass = isCompact ? "h-3 w-3 text-gray-600" : isDesktop ? "h-4 w-4 text-[#6b7280]" : "h-4 w-4 text-gray-600";

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Pin className={pinIconClass} />
            <span className={titleClass}>Pinned Message</span>
          </div>
          <p className={textClass}>
            {pinnedMessage.message.text}
          </p>
        </div>
        <button
          onClick={onUnpin}
          className={buttonClass}
        >
          <X className={xIconClass} />
        </button>
      </div>
    </div>
  );
};

export default PinnedMessageDisplay;
