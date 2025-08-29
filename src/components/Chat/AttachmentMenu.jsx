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
          ? 'bottom-full mb-2 left-0 right-0' 
          : 'bottom-full mb-3 left-0 right-0'
      }`}>
        {/* Options */}
        <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 ${
          isCompact ? 'p-3' : 'p-4'
        } ${isCompact ? 'w-72' : 'w-80'} mx-auto`}>
          <div className={`grid ${isCompact ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'}`}>
            {attachmentOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`flex ${isCompact ? 'flex-row items-center' : 'flex-col items-center'} ${
                    isCompact ? 'p-3' : 'p-4'
                  } rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 group`}
                >
                  <div className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} ${option.color} rounded-full flex items-center justify-center ${
                    isCompact ? 'mr-3' : 'mb-3'
                  } shadow-lg group-hover:shadow-xl transition-all duration-200`}>
                    <IconComponent className={`${isCompact ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
                  </div>
                  <span className={`${isCompact ? 'text-sm' : 'text-sm'} font-medium text-gray-700 group-hover:text-gray-900 transition-colors`}>
                    {option.label}
                  </span>
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
