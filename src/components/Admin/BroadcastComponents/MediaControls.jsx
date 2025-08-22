import React from 'react';
import { Upload, Image, Video, Link, Plus, X } from 'lucide-react';

const MediaControls = ({ 
  fileInputRef,
  videoInputRef,
  documentInputRef,
  linkUrl,
  showLinkInput,
  onImageUpload,
  onVideoUpload,
  onDocumentUpload,
  onAddLink,
  onLinkUrlChange,
  onShowLinkInput,
  onHideLinkInput
}) => {
  return (
    <div className="space-y-4">
      {/* Media Upload Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
        >
          <Image size={16} />
          <span>Add Images</span>
        </button>
        
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Video size={16} />
          <span>Add Videos</span>
        </button>
        
        <button
          type="button"
          onClick={() => documentInputRef.current?.click()}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
        >
          <Upload size={16} />
          <span>Add Documents</span>
        </button>
        
        <button
          type="button"
          onClick={() => onShowLinkInput(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
        >
          <Link size={16} />
          <span>Add Link</span>
        </button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => onLinkUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddLink();
              }
            }}
          />
          <button
            type="button"
            onClick={onAddLink}
            className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => onHideLinkInput(false)}
            className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onImageUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => onVideoUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf"
        multiple
        onChange={(e) => onDocumentUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default MediaControls;
