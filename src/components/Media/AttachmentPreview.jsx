import React from 'react';
import { X, Eye } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import DocumentViewer from './DocumentViewer';

const AttachmentPreview = ({ attachments, onRemove, className = "" }) => {
  if (!attachments || attachments.length === 0) return null;

  const renderAttachment = (attachment, index) => {
    const { type, file, preview } = attachment;

    switch (type) {
      case 'image':
        return (
          <div key={index} className="relative group">
            <img
              src={preview || URL.createObjectURL(file)}
              alt={file.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="truncate">{file.name}</p>
            </div>
          </div>
        );

      case 'video':
        return (
          <div key={index} className="relative group">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-purple-600">
                🎥
              </div>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="truncate">{file.name}</p>
            </div>
          </div>
        );

      case 'document':
        return (
          <div key={index} className="relative group">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-green-600">
                📄
              </div>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="truncate">{file.name}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`mt-4 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {attachments.map(renderAttachment)}
      </div>
    </div>
  );
};

export default AttachmentPreview;
