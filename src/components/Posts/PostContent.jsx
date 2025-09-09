import React from 'react';
import { highlightMentions } from '../../utils/htmlUtils';

const PostContent = ({ content }) => {
  const renderContent = (content) => {
    // Highlight mentions in the content
    const highlightedContent = highlightMentions(content || '');
    
    return (
      <div 
        className="prose prose-sm max-w-none text-gray-900"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
        style={{ color: '#111827' }}
      />
    );
  };

  return (
    <div className="mb-4">
      {renderContent(content)}
    </div>
  );
};

export default PostContent;
