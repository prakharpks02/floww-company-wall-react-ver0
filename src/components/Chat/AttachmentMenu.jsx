import React from 'react';
import { Image, Camera, FileText, BarChart3 } from 'lucide-react';

const AttachmentMenu = ({ isOpen, onClose, onSelect, isGroup = false, isCompact = false }) => {
  if (!isOpen) return null;

  const attachmentOptions = [
    {
      id: 'photos-videos',
      label: 'Photos & videos',
      icon: Image,
      color: 'bg-gradient-to-br from-pink-400 to-pink-600',
      hoverColor: 'hover:from-pink-300 hover:to-pink-500',
      shadowColor: 'rgba(236,72,153,0.3)',
      action: () => onSelect('photos-videos')
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: Camera,
      color: 'bg-gradient-to-br from-red-400 to-red-600',
      hoverColor: 'hover:from-red-300 hover:to-red-500',
      shadowColor: 'rgba(239,68,68,0.3)',
      action: () => onSelect('camera')
    },
    {
      id: 'document',
      label: 'Document',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      hoverColor: 'hover:from-blue-300 hover:to-blue-500',
      shadowColor: 'rgba(59,130,246,0.3)',
      action: () => onSelect('document')
    }
  ];

  // Add poll option only for groups
  if (isGroup) {
    attachmentOptions.push({
      id: 'poll',
      label: 'Poll',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-amber-400 to-orange-500',
      hoverColor: 'hover:from-amber-300 hover:to-orange-400',
      shadowColor: 'rgba(251,191,36,0.3)',
      action: () => onSelect('poll')
    });
  }

  return (
    <>
      {/* Glassmorphism backdrop */}
      <div 
        className="fixed inset-0 z-30 bg-black/10 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Neumorphic Menu */}
      <div className={`absolute z-50 ${
        isCompact 
          ? 'bottom-full mb-3 left-2 right-2' 
          : 'bottom-full mb-4 left-4 right-4'
      }`}>
        <div className={`
          bg-white/90 backdrop-blur-lg rounded-2xl 
          shadow-[0_15px_30px_rgba(0,0,0,0.1)] 
          border border-white/40
          p-4 w-full
          ${isCompact ? 'max-w-xs mx-auto' : 'max-w-xs mx-auto'}
          neo-glassmorphism
          animate-in slide-in-from-bottom-2 duration-300
        `}>
          {/* Title */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-[#6d28d9] text-center">Share Content</h3>
            <p className="text-xs text-gray-500 text-center mt-1">Choose what you'd like to share</p>
          </div>
          
          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            {attachmentOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`
                    group flex flex-col items-center 
                    p-3 
                    rounded-xl 
                    bg-white/70 backdrop-blur-sm
                    shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] 
                    hover:shadow-[0_8px_20px_${option.shadowColor}] 
                    hover:bg-white/90
                    transition-all duration-300 
                    hover:scale-105 
                    hover:-translate-y-1
                    border border-white/30
                    neo-button
                  `}
                >
                  <div className={`
                    w-10 h-10 mb-2 
                    ${option.color} ${option.hoverColor}
                    rounded-xl flex items-center justify-center 
                    shadow-[0_6px_15px_${option.shadowColor}]
                    group-hover:shadow-[0_8px_20px_${option.shadowColor}]
                    transition-all duration-300 
                    group-hover:scale-110
                  `}>
                    <IconComponent className="h-5 w-5 text-white drop-shadow-sm" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-[#6d28d9] group-hover:text-[#7c3aed] transition-colors duration-200">
                      {option.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-200">
                      {option.id === 'photos-videos'}
                      {option.id === 'camera'}
                      {option.id === 'document'}
                      {option.id === 'poll'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Decorative element */}
          <div className="flex justify-center mt-3">
            <div className="w-8 h-0.5 bg-gradient-to-r from-[#c084fc] to-[#86efac] rounded-full opacity-60"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttachmentMenu;
