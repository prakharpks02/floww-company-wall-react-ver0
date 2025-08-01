import React from 'react';

const PostContent = ({ content }) => {
  const renderContent = (content) => {
    return (
      <div 
        className="prose prose-sm max-w-none text-gray-900"
        dangerouslySetInnerHTML={{ __html: content }}
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
