import React, { useState } from 'react';
// Predefined tags for admin broadcast posts
const PREDEFINED_TAGS = [
  { id: 1, name: 'Announcements' },
  { id: 2, name: 'Achievements' },
  { id: 3, name: 'General Discussion' },
  { id: 4, name: 'Policy Updates' },
  { id: 5, name: 'Ideas & Suggestions' },
  { id: 6, name: 'Training Materials' },
];
import { Hash, AtSign, Plus, X } from 'lucide-react';

const TagsAndMentionsSection = ({ 
  tags,
  selectedTags: parentSelectedTags,
  mentions,
  newTag,
  newMention,
  showMentions,
  mentionSuggestions,
  loadingMentions,
  onAddTag,
  onAddMention,
  onRemoveTag,
  onRemoveMention,
  onNewTagChange,
  onNewMentionChange,
  onShowMentions,
  onFetchMentionSuggestions,
  onToggleTag, // New prop for explicit tag toggling
  hideMentions = false // Add prop to hide mentions section completely
}) => {
  // Use provided tags prop if available, otherwise use predefined tags
  const availableTags = (tags && tags.length > 0) ? tags : PREDEFINED_TAGS;

  // Local state for selected tags (for predefined tags only)
  const [localSelectedTags, setLocalSelectedTags] = useState(parentSelectedTags || []);

  // Sync with parent if parentSelectedTags changes (for mentions, etc.)
  React.useEffect(() => {
    setLocalSelectedTags(parentSelectedTags || []);
  }, [parentSelectedTags]);

  const handleTogglePredefinedTag = (tagName) => {
    if (localSelectedTags.includes(tagName)) {
      setLocalSelectedTags(localSelectedTags.filter(t => t !== tagName));
      onRemoveTag && onRemoveTag(tagName);
    } else {
      setLocalSelectedTags([...localSelectedTags, tagName]);
      onAddTag && onAddTag(tagName);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tags Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Hash className="inline w-4 h-4 mr-1" />
          Tags
        </label>
        
        {/* Selected Tags Display */}
        {localSelectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {localSelectedTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{tag}
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveTag(tag);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* No free-form tag input: use predefined tags only */}
        <div className="text-sm text-gray-500 mb-2">
          Select tags from the predefined list below. Creating custom tags is disabled.
        </div>

        {/* Available Tags */}
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Popular tags:</div>
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTogglePredefinedTag(tag.name)}
                className={`px-2 py-1 text-xs rounded transition-colors ${localSelectedTags.includes(tag.name) ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mentions Section - Only show if not hidden */}
      {!hideMentions && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <AtSign className="inline w-4 h-4 mr-1" />
          Mentions
        </label>
        
        {/* Selected Mentions Display */}
        {mentions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {mentions.map((mention) => (
              <span
                key={mention.user_id}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                @{mention.name}
                <button
                  onClick={() => onRemoveMention(mention)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Mention Button */}
        {!showMentions && (
          <button
            type="button"
            onClick={() => onShowMentions(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
          >
            <AtSign size={16} />
            <span>Mention Someone</span>
          </button>
        )}

        {/* Mention Input */}
        {showMentions && (
          <div className="relative">
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <input
                type="text"
                value={newMention}
                onChange={(e) => {
                  onNewMentionChange(e.target.value);
                  if (onFetchMentionSuggestions) {
                    onFetchMentionSuggestions(e.target.value);
                  }
                }}
                placeholder="Type to search for users..."
                className="flex-1 px-3 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddMention();
                  }
                }}
              />
              <button
                type="button"
                onClick={onAddMention}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => onShowMentions(false)}
                className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Mention Suggestions Dropdown */}
            {mentionSuggestions && mentionSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto overflow-x-hidden">
                {loadingMentions && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Searching...
                  </div>
                )}
                {!loadingMentions && mentionSuggestions.map((user) => (
                  <button
                    key={user.employee_id || user.id}
                    type="button"
                    onClick={() => {
                      onAddMention(user);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || user.employee_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                    {(user.job_title || user.position) && (
                      <div className="text-xs text-blue-600">
                        {user.job_title || user.position}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default TagsAndMentionsSection;
