import React from 'react';
import { X, FileText } from 'lucide-react';
import PDFPreview from '../../Media/PDFPreview';

const MediaPreviews = ({ 
  images, 
  videos, 
  documents, 
  links, 
  onRemoveImage, 
  onRemoveVideo, 
  onRemoveDocument, 
  onRemoveLink 
}) => {
  return (
    <div className="space-y-4">
      {/* Image Previews */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-24 object-cover rounded border"
                />
                <button
                  onClick={() => onRemoveImage(image.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Previews */}
      {videos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Videos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {videos.map((video) => (
              <div key={video.id} className="relative group">
                <video
                  src={video.url}
                  controls
                  className="w-full h-32 object-cover rounded border"
                />
                <button
                  onClick={() => onRemoveVideo(video.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Previews */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="relative group">
                {doc.isPDF ? (
                  <div className="border rounded">
                    <PDFPreview url={doc.url} />
                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-gray-50 border rounded p-3">
                    <FileText size={20} className="text-blue-500" />
                    <span className="flex-1 text-sm">{doc.name}</span>
                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link Previews */}
      {links.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Links</h4>
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-3">
                <div>
                  <div className="text-sm font-medium text-blue-800">{link.title}</div>
                  <div className="text-xs text-blue-600">{link.url}</div>
                </div>
                <button
                  onClick={() => onRemoveLink(link.id)}
                  className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPreviews;
