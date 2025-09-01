import React, { useState } from 'react';
import { X } from 'lucide-react';

const PinModal = ({ isOpen, onClose, onPin, type, item, isCompact = false }) => {
  const [selectedDuration, setSelectedDuration] = useState('7days');

  console.log('PinModal render - isOpen:', isOpen, 'type:', type, 'item:', item);

  if (!isOpen) return null;

  const durations = [
    { value: '24hours', label: '24 hours' },
    { value: '7days', label: '7 days' },
    { value: '30days', label: '30 days' },
    { value: 'forever', label: 'Forever' }
  ];

  const handlePin = () => {
    console.log('=== PinModal - handlePin START ===');
    console.log('PinModal - handlePin called with duration:', selectedDuration);
    console.log('PinModal - onPin prop type:', typeof onPin);
    console.log('PinModal - type prop:', type);
    console.log('PinModal - item prop:', item);
    console.log('PinModal - item ID:', item?.id);
    console.log('PinModal - item participants:', !!item?.participants);
    console.log('PinModal - item type property:', item?.type);
    
    if (typeof onPin === 'function') {
      console.log('PinModal - Calling onPin with duration:', selectedDuration);
      onPin(selectedDuration);
    } else {
      console.error('PinModal - onPin is not a function:', onPin);
    }
    
    console.log('PinModal - About to close modal');
    onClose();
    console.log('=== PinModal - handlePin END ===');
  };

  // Different styling for compact mode
  if (isCompact) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-[500px] flex items-center justify-center z-[70]">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_25px_80px_rgba(109,40,217,0.25)] w-full max-w-[280px] p-4 border border-white/40">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-[#1f2937]">
              Pin Duration
            </h3>
            <button
              onClick={onClose}
              className="p-2 bg-white/70 backdrop-blur-sm hover:bg-red-50/70 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105"
            >
              <X className="h-3 w-3 text-[#6b7280] hover:text-red-500" />
            </button>
          </div>

          <p className="text-xs text-[#6b7280] mb-4">Choose duration. You can unpin anytime.</p>

          {/* Duration Options */}
          <div className="space-y-2 mb-4">
            {durations.map(duration => (
              <label key={duration.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-white/50 transition-all duration-300">
                <div className="relative">
                  <input
                    type="radio"
                    name="duration"
                    value={duration.value}
                    checked={selectedDuration === duration.value}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    selectedDuration === duration.value 
                      ? 'border-[#6d28d9] bg-[#6d28d9] shadow-[0_2px_8px_rgba(109,40,217,0.3)]' 
                      : 'border-[#d1d5db] hover:border-[#6d28d9]/50'
                  }`}>
                    {selectedDuration === duration.value && (
                      <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-[#1f2937]">{duration.label}</span>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs text-[#6b7280] hover:text-[#1f2937] bg-white/70 hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handlePin}
              className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white rounded-xl shadow-[0_2px_8px_rgba(109,40,217,0.3)] hover:shadow-[0_4px_12px_rgba(109,40,217,0.4)] transition-all duration-300"
            >
              Pin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_25px_80px_rgba(109,40,217,0.25)] w-full max-w-md p-6 border border-white/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-[#1f2937]">
            Pin Duration
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/70 backdrop-blur-sm hover:bg-red-50/70 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105"
          >
            <X className="h-4 w-4 text-[#6b7280] hover:text-red-500" />
          </button>
        </div>

        <p className="text-sm text-[#6b7280] mb-6">Choose how long to pin this item. You can unpin at any time.</p>

        {/* Duration Options */}
        <div className="space-y-3 mb-6">
          {durations.map(duration => (
            <label key={duration.value} className="flex items-center gap-4 cursor-pointer p-3 rounded-2xl hover:bg-white/50 transition-all duration-300">
              <div className="relative">
                <input
                  type="radio"
                  name="duration"
                  value={duration.value}
                  checked={selectedDuration === duration.value}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  selectedDuration === duration.value 
                    ? 'border-[#6d28d9] bg-[#6d28d9] shadow-[0_4px_16px_rgba(109,40,217,0.3)]' 
                    : 'border-[#d1d5db] hover:border-[#6d28d9]/50'
                }`}>
                  {selectedDuration === duration.value && (
                    <div className="w-3 h-3 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  )}
                </div>
              </div>
              <span className="text-base text-[#1f2937]">{duration.label}</span>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#6b7280] hover:text-[#1f2937] bg-white/70 hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handlePin}
            className="px-6 py-2 bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white rounded-xl shadow-[0_4px_16px_rgba(109,40,217,0.3)] hover:shadow-[0_6px_20px_rgba(109,40,217,0.4)] transition-all duration-300 hover:scale-105"
          >
            Pin
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinModal;
