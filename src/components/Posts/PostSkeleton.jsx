import React from 'react';

const PostSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>

          {/* Media placeholder (sometimes) */}
          {index % 3 === 0 && (
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          )}

          {/* Mentions */}
          {index % 4 === 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="h-6 bg-gray-200 rounded-full w-12"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded-full w-16"></div>
              <div className="h-8 bg-gray-200 rounded-full w-20"></div>
              <div className="h-8 bg-gray-200 rounded-full w-12"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-8"></div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostSkeleton;
