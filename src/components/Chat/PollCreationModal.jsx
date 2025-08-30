import React, { useState } from 'react';
import { X, Plus, Trash2, Check, BarChart3 } from 'lucide-react';

const PollCreationModal = ({ isOpen, onClose, onCreatePoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);

  if (!isOpen) return null;

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    const validOptions = options.filter(option => option.trim() !== '');
    
    if (question.trim() && validOptions.length >= 2) {
      onCreatePoll({
        question: question.trim(),
        options: validOptions,
        allowMultipleAnswers,
        createdAt: new Date().toISOString(),
        votes: validOptions.reduce((acc, _, index) => {
          acc[index] = [];
          return acc;
        }, {})
      });
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setAllowMultipleAnswers(false);
      onClose();
    }
  };

  const isValid = question.trim() && options.filter(option => option.trim() !== '').length >= 2;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.15)] border border-white/30 neo-glassmorphism animate-in zoom-in-95 duration-300">
        {/* Neumorphic Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-[#86efac] to-[#4ade80] text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold drop-shadow-sm">Create a Poll</h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 hover:scale-105 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto neo-scroll">
          {/* Question */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#6d28d9] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#86efac] rounded-full"></span>
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#86efac] focus:border-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.8)] hover:bg-white/90 transition-all duration-300 text-[#6d28d9] placeholder:text-gray-400"
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
              <span className="px-2 py-1 bg-[#c084fc]/20 rounded-full">{question.length}/100 characters</span>
              {question.trim() && <span className="text-[#86efac] font-medium">✓ Looking good!</span>}
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#6d28d9] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#c084fc] rounded-full"></span>
              Options
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c084fc] focus:border-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.8)] hover:bg-white/90 transition-all duration-300 text-[#6d28d9] placeholder:text-gray-400 pr-10"
                      maxLength={50}
                    />
                    {option.trim() && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#86efac] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(134,239,172,0.3)]">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-3 text-red-500 hover:bg-red-50/70 rounded-2xl transition-all duration-300 hover:scale-105 bg-white/50 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.8)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Option Button */}
            {options.length < 10 && (
              <button
                onClick={addOption}
                className="mt-4 flex items-center gap-3 px-4 py-3 text-[#6d28d9] hover:text-[#7c3aed] bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-2xl transition-all duration-300 font-medium shadow-[inset_0_0_20px_rgba(255,255,255,0.8)] hover:shadow-[0_8px_25px_rgba(109,40,217,0.15)] hover:scale-105 border border-white/30 w-full justify-center"
              >
                <div className="w-6 h-6 bg-[#c084fc] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(192,132,252,0.3)]">
                  <Plus className="h-3 w-3 text-white" />
                </div>
                Add another option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="mb-6">
            <label className="flex items-center gap-4 cursor-pointer p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/80 transition-all duration-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.8)]">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={allowMultipleAnswers}
                  onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-xl border-2 transition-all duration-300 shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] ${
                  allowMultipleAnswers 
                    ? 'bg-gradient-to-br from-[#86efac] to-[#4ade80] border-[#86efac] shadow-[0_4px_15px_rgba(134,239,172,0.4)]' 
                    : 'border-gray-300 bg-white/50'
                }`}>
                  {allowMultipleAnswers && (
                    <Check className="h-4 w-4 text-white m-0.5 drop-shadow-sm" />
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-[#6d28d9]">Allow multiple answers</span>
                <p className="text-xs text-gray-500 mt-0.5">Users can select more than one option</p>
              </div>
            </label>
          </div>
        </div>

        {/* Neumorphic Footer */}
        <div className="p-6 border-t border-white/20 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm rounded-b-3xl">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-[#6d28d9] bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white/90 transition-all duration-300 font-medium shadow-[inset_0_0_20px_rgba(255,255,255,0.8)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:scale-105 border border-white/30"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePoll}
              disabled={!isValid}
              className={`flex-1 px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-[0_8px_25px_rgba(134,239,172,0.3)] hover:scale-105 ${
                isValid
                  ? 'bg-gradient-to-br from-[#86efac] to-[#4ade80] text-white hover:shadow-[0_12px_35px_rgba(134,239,172,0.4)]'
                  : 'bg-gray-200/70 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              Create Poll
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollCreationModal;
