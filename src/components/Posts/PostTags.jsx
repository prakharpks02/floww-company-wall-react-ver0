import React from 'react';
import { Hash } from 'lucide-react';

const PostTags = ({ tags }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map((tag, index) => {
        // Handle both string tags and object tags from backend
        const tagName = typeof tag === 'string' ? tag : tag.tag_name || tag.name || 'tag';
        // Use index to ensure unique keys even with duplicate tag names
        const tagKey = `${tagName}-${index}`;
        
        return (
          <span
            key={tagKey}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: '#9f7aea' }}
          >
            <Hash className="h-3 w-3 mr-1" />
            {tagName}
          </span>
        );
      })}
    </div>
  );
};

export default PostTags;
