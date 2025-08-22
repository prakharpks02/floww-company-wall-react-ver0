import React from 'react';
import { AtSign, X } from 'lucide-react';

const MentionsSection = ({ 
  mentions, 
  showMentions, 
  onShowMentions, 
  onAddMention, 
  onRemoveMention,
  filterEmployees,
  mentionSuggestions,
  loadingMentions,
  onFetchMentionSuggestions
}) => {
  const [mentionSearch, setMentionSearch] = React.useState('');
  
  // Use API suggestions if available, otherwise fall back to filter function
  const filteredEmployees = mentionSuggestions || filterEmployees(mentionSearch);

  const handleSearchChange = (value) => {
    setMentionSearch(value);
    if (onFetchMentionSuggestions) {
      onFetchMentionSuggestions(value);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AtSign size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Mentions</span>
        </div>
        
        {!showMentions && (
          <button
            type="button"
            onClick={() => onShowMentions(true)}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Add mention
          </button>
        )}
      </div>

      {/* Selected Mentions */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map(mention => (
            <span
              key={mention.user_id}
              className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
            >
              @{mention.name}
              <button
                type="button"
                onClick={() => onRemoveMention(mention)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Mention Search */}
      {showMentions && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={mentionSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Type to search for users..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => onShowMentions(false)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Employee List */}
          <div className="max-h-40 overflow-y-auto border rounded-md">
            {loadingMentions && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Searching...
              </div>
            )}
            {!loadingMentions && filteredEmployees && filteredEmployees.map(employee => (
              <button
                key={employee.employee_id || employee.user_id || employee.id}
                type="button"
                onClick={() => {
                  onAddMention(employee);
                  onShowMentions(false);
                  setMentionSearch('');
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
              >
                <div className="font-medium">{employee.name || employee.employee_name}</div>
                <div className="text-gray-500 text-xs">{employee.email}</div>
                {(employee.job_title || employee.position) && (
                  <div className="text-blue-600 text-xs">{employee.job_title || employee.position}</div>
                )}
              </button>
            ))}
            {!loadingMentions && (!filteredEmployees || filteredEmployees.length === 0) && mentionSearch && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionsSection;
