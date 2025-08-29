import React from 'react';
import { Image, Camera, FileText, BarChart3 } from 'lucide-react';

const AttachmentMenu = ({ isOpen, onClose, onSelect, isGroup = false, isCompact = false }) => {
  if (!isOpen) return null;

  const attachmentOptions = [
    {
      id: 'photos-videos',
      label: 'Photos & videos',
      icon: Image,
      color: 'bg-pink-500',
      action: () => onSelect('photos-videos')
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: Camera,
      color: 'bg-red-500',
      action: () => onSelect('camera')
    },
    {
      id: 'document',
      label: 'Document',
      icon: FileText,
      color: 'bg-blue-500',
      action: () => onSelect('document')
    }
  ];

  // Add poll option only for groups
  if (isGroup) {
    attachmentOptions.push({
      id: 'poll',
      label: 'Poll',
      icon: BarChart3,
      color: 'bg-yellow-500',
      action: () => onSelect('poll')
    });
  }

  return (
    <>
      {/* Invisible backdrop for clicking outside */}
      <div 
        className="fixed inset-0 z-30"
        onClick={onClose}
      />
      
      {/* Menu positioned above input */}
      <div className={`absolute z-50 ${
        isCompact 
          ? 'bottom-full mb-2 left-2 right-2' 
          : 'bottom-full mb-3 left-4 right-4'
      }`}>
        {/* Options */}
        <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-full ${
          isCompact ? 'max-w-xs mx-auto' : 'max-w-sm mx-auto'
        }`}>
          <div className={`grid ${isCompact ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
            {attachmentOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`flex ${isCompact ? 'flex-row' : 'flex-col'} items-center ${
                    isCompact ? 'p-3' : 'p-4'
                  } rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105`}
                >
                  <div className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} ${option.color} rounded-full flex items-center justify-center ${
                    isCompact ? 'mr-3' : 'mb-2'
                  } shadow-lg`}>
                    <IconComponent className={`${isCompact ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
                  </div>
                  <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default AttachmentMenu;
