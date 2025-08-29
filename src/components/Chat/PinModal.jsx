import React, { useState } from 'react';
import { X } from 'lucide-react';

const PinModal = ({ isOpen, onClose, onPin, type, item, isCompact = false }) => {
  const [selectedDuration, setSelectedDuration] = useState('7days');

  if (!isOpen) return null;

  const durations = [
    { value: '24hours', label: '24 hours' },
    { value: '7days', label: '7 days' },
    { value: '30days', label: '30 days' }
  ];

  const handlePin = () => {
    onPin(selectedDuration);
    onClose();
  };

  // Different styling for compact mode
  if (isCompact) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-[500px] flex items-center justify-center z-[70]">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-[280px] p-4 text-white border border-gray-600">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">
              Choose how long your pin lasts
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-gray-300 mb-4">You can unpin at any time.</p>

          {/* Duration Options */}
          <div className="space-y-3 mb-4">
            {durations.map(duration => (
              <label key={duration.value} className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="duration"
                    value={duration.value}
                    checked={selectedDuration === duration.value}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedDuration === duration.value 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-400'
                  }`}>
                    {selectedDuration === duration.value && (
                      <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    )}
                  </div>
                </div>
                <span className="text-sm">{duration.label}</span>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handlePin}
              className="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Pin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Choose how long your pin lasts
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-300 mb-6">You can unpin at any time.</p>

        {/* Duration Options */}
        <div className="space-y-4 mb-6">
          {durations.map(duration => (
            <label key={duration.value} className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input
                  type="radio"
                  name="duration"
                  value={duration.value}
                  checked={selectedDuration === duration.value}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedDuration === duration.value 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-400'
                }`}>
                  {selectedDuration === duration.value && (
                    <div className="w-3 h-3 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  )}
                </div>
              </div>
              <span className="text-base">{duration.label}</span>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handlePin}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Pin
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinModal;
