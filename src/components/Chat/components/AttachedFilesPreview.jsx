import React from 'react';
import { X, Image, Video, FileText } from 'lucide-react';

const AttachedFilesPreview = ({ fileUrls, onRemove, className = '' }) => {
  if (!fileUrls || fileUrls.length === 0) return null;

  // Support both string URLs and { url, name } objects
  const validFiles = fileUrls
    .map(f => {
      if (typeof f === 'string') return { url: f };
      if (f && typeof f.url === 'string') return f;
      return null;
    })
    .filter(f => f && f.url && f.url.trim() !== '');

  if (validFiles.length === 0) return null;

  const getFileType = (file) => {
    const url = file.url;
    if (!url || typeof url !== 'string') return 'document';
    const ext = url.split('.').pop().toLowerCase().split('?')[0];
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video';
    return 'document';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4 text-green-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {validFiles.map((file, index) => {
        const type = getFileType(file);
        const fileName = file.name || (file.url.split('/').pop().split('?')[0]);
        return (
          <div
            key={index}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0">
              {getFileIcon(type)}
            </div>
            {type === 'image' ? (
              <img
                src={file.url}
                alt="Attached"
                className="h-10 w-10 object-cover rounded"
              />
            ) : (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">
                  {fileName}
                </span>
                <span className="text-xs text-gray-500 capitalize">{type}</span>
              </div>
            )}
            <button
              onClick={() => onRemove(index)}
              className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
              title="Remove"
            >
              <X className="h-3 w-3 text-red-500" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AttachedFilesPreview;
