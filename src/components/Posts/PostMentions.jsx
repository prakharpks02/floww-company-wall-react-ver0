import React from 'react';
import { AtSign } from 'lucide-react';

const PostMentions = ({ mentions }) => {
  // Hide mention badges - mentions are already highlighted inline in the content
  return null;
  
  if (!mentions || mentions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {mentions.map((mention, idx) => (
        <span
          key={mention.id || mention.name || idx}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
        >
          <AtSign className="h-3 w-3 mr-1" />
          {mention.name}
        </span>
      ))}
    </div>
  );
};

export default PostMentions;
