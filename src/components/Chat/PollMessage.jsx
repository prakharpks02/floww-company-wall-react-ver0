import React, { useState } from 'react';
import { BarChart3, Users, Check } from 'lucide-react';
import { getEmployeeById } from './utils/dummyData';

const PollMessage = ({ poll, currentUserId, onVote, isOwnMessage = false, isCompact = false }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleOptionSelect = (optionIndex) => {
    if (poll.allowMultipleAnswers) {
      const newSelected = selectedOptions.includes(optionIndex)
        ? selectedOptions.filter(i => i !== optionIndex)
        : [...selectedOptions, optionIndex];
      setSelectedOptions(newSelected);
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote(selectedOptions);
      setSelectedOptions([]);
    }
  };

  const hasUserVoted = () => {
    return Object.values(poll.votes).some(voters => 
      voters.includes(currentUserId)
    );
  };

  const getUserVotes = () => {
    const userVotes = [];
    Object.entries(poll.votes).forEach(([optionIndex, voters]) => {
      if (voters.includes(currentUserId)) {
        userVotes.push(parseInt(optionIndex));
      }
    });
    return userVotes;
  };

  const getTotalVotes = () => {
    return Object.values(poll.votes).reduce((total, voters) => total + voters.length, 0);
  };

  const getOptionPercentage = (optionIndex) => {
    const totalVotes = getTotalVotes();
    if (totalVotes === 0) return 0;
    return Math.round((poll.votes[optionIndex]?.length || 0) / totalVotes * 100);
  };

  const userVotes = getUserVotes();
  const hasVoted = hasUserVoted();
  const totalVotes = getTotalVotes();

  return (
    <div className={`rounded-lg ${isOwnMessage ? 'p-0' : 'p-0'} ${isCompact ? 'w-full max-w-[260px]' : 'max-w-xl'} w-full`}>
      {/* Poll Header */}
      <div className={`flex items-center gap-1 ${isCompact ? 'mb-1' : 'mb-3'}`}>
        <div className={`${isCompact ? 'w-4 h-4' : 'w-8 h-8'} ${isOwnMessage ? 'bg-white/20' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
          <BarChart3 className={`${isCompact ? 'h-2 w-2' : 'h-4 w-4'} text-white`} />
        </div>
        <span className={`font-medium ${isOwnMessage ? 'text-white' : 'text-gray-900'} ${isCompact ? 'text-xs' : 'text-sm'}`}>Poll</span>
      </div>

      {/* Question */}
      <h3 className={`font-semibold ${isOwnMessage ? 'text-white' : 'text-gray-900'} ${isCompact ? 'mb-1 text-xs' : 'mb-4 text-sm'} leading-relaxed break-words`}>
        {poll.question}
      </h3>

      {/* Options */}
      <div className={`${isCompact ? 'space-y-0.5 mb-0.5' : 'space-y-2 mb-4'}`}>
        {poll.options.map((option, index) => {
          const votes = poll.votes[index] || [];
          const percentage = getOptionPercentage(index);
          const isSelected = selectedOptions.includes(index);
          const isUserVote = userVotes.includes(index);

          return (
            <div key={index} className="relative">
              <button
                onClick={() => !hasVoted && handleOptionSelect(index)}
                disabled={hasVoted}
                className={`w-full text-left ${isCompact ? 'p-1 px-1.5' : 'p-3'} rounded-lg border transition-all duration-200 ${
                  hasVoted
                    ? 'cursor-default'
                    : 'hover:bg-black/5 cursor-pointer'
                } ${
                  isSelected
                    ? `border-yellow-400 ${isOwnMessage ? 'bg-white/20' : 'bg-yellow-50'}`
                    : isUserVote
                    ? `border-yellow-400 ${isOwnMessage ? 'bg-white/20' : 'bg-yellow-50'}`
                    : `${isOwnMessage ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-white'}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {!hasVoted && (
                      <div className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border-2 transition-colors ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400'
                          : `${isOwnMessage ? 'border-white/50' : 'border-gray-300'}`
                      }`}>
                        {isSelected && (
                          <Check className={`${isCompact ? 'h-1.5 w-1.5 m-0.5' : 'h-2.5 w-2.5 m-0.5'} text-white`} />
                        )}
                      </div>
                    )}
                    {hasVoted && isUserVote && (
                      <Check className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-yellow-400`} />
                    )}
                    <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium ${isOwnMessage ? 'text-white' : 'text-gray-900'} break-words flex-1 min-w-0`}>
                      {option}
                    </span>
                  </div>
                  
                  {hasVoted && (
                    <div className="flex items-center gap-2">
                      <span className={`${isCompact ? 'text-xs' : 'text-xs'} ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>{votes.length}</span>
                      <span className={`${isCompact ? 'text-xs' : 'text-xs'} font-medium ${isOwnMessage ? 'text-white' : 'text-gray-700'}`}>
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {hasVoted && (
                  <div className={`${isCompact ? 'mt-1' : 'mt-2'} w-full ${isOwnMessage ? 'bg-white/20' : 'bg-gray-200'} rounded-full ${isCompact ? 'h-1' : 'h-1.5'}`}>
                    <div
                      className={`bg-yellow-400 ${isCompact ? 'h-1' : 'h-1.5'} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Vote Button */}
      {!hasVoted && selectedOptions.length > 0 && (
        <button
          onClick={handleVote}
          className={`w-full ${isOwnMessage ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'} ${isCompact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm'} rounded-lg font-medium transition-colors`}
        >
          Vote
        </button>
      )}

      {/* Poll Stats */}
      <div className={`flex items-center justify-between ${isCompact ? 'text-xs text-[9px]' : 'text-xs'} ${isOwnMessage ? 'text-white/70' : 'text-gray-500'} ${isCompact ? 'mt-0.5 pt-0.5' : 'mt-4 pt-3'} border-t ${isOwnMessage ? 'border-white/20' : 'border-gray-100'}`}>
        <div className="flex items-center gap-1">
          <Users className={`${isCompact ? 'h-2 w-2' : 'h-3 w-3'}`} />
          <span>{totalVotes} votes</span>
        </div>
        <div className="flex items-center gap-1">
          {poll.allowMultipleAnswers && isCompact && (
            <span className={`${isOwnMessage ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'} px-1 py-0.5 text-[10px] rounded`}>
              Multi
            </span>
          )}
          {poll.allowMultipleAnswers && !isCompact && (
            <span className={`${isOwnMessage ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'} px-2 py-1 text-xs rounded`}>
              Multiple answers
            </span>
          )}
          <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Recent Voters */}
      {hasVoted && totalVotes > 0 && !isCompact && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Recent voters:</div>
          <div className="flex -space-x-1">
            {Object.values(poll.votes)
              .flat()
              .slice(0, 5)
              .map((voterId, index) => {
                const voter = getEmployeeById(voterId);
                return (
                  <div
                    key={`${voterId}-${index}`}
                    className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                    title={voter?.name}
                  >
                    {voter?.avatar}
                  </div>
                );
              })}
            {totalVotes > 5 && (
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                +{totalVotes - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PollMessage;
