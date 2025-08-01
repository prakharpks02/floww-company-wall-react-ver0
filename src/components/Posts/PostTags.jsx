import React from 'react';
import { Hash } from 'lucide-react';

const PostTags = ({ tags }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map((tag, index) => {
        // Handle both string tags and object tags from backend
        const tagName = typeof tag === 'string' ? tag : tag.tag_name || tag.name || 'tag';
        const tagKey = typeof tag === 'string' ? tag : tag.tag_name || tag.name || `tag-${index}`;
        return (
          <span
            key={tagKey || index}
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
