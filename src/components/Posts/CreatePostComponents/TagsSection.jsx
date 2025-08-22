import React from 'react';
import { Hash } from 'lucide-react';

const TagsSection = ({ tags, selectedTags, onTagToggle }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Hash size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Tags</span>
      </div>
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {tags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagToggle(tag.name)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedTags.includes(tag.name)
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}
      
      {selectedTags.length > 0 && (
        <div className="text-xs text-gray-500">
          {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

export default TagsSection;
