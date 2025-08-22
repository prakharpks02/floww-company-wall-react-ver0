import React from 'react';
import { AtSign, X } from 'lucide-react';

const MentionsSection = ({ 
  mentions, 
  showMentions, 
  onShowMentions, 
  onAddMention, 
  onRemoveMention,
  filterEmployees 
}) => {
  const [mentionSearch, setMentionSearch] = React.useState('');
  const filteredEmployees = filterEmployees(mentionSearch);

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
              onChange={(e) => setMentionSearch(e.target.value)}
              placeholder="Search employees..."
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
            {filteredEmployees.map(employee => (
              <button
                key={employee.employee_id || employee.user_id}
                type="button"
                onClick={() => {
                  onAddMention(employee);
                  onShowMentions(false);
                  setMentionSearch('');
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
              >
                <div className="font-medium">{employee.name}</div>
                <div className="text-gray-500 text-xs">{employee.email}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionsSection;
