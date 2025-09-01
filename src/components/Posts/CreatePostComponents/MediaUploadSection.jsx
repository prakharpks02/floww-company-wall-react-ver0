import React from 'react';
import { Image, Video, FileText, Link, Plus } from 'lucide-react';

const MediaUploadSection = ({
  fileInputRef,
  videoInputRef,
  documentInputRef,
  linkUrl,
  showLinkInput,
  onImageUpload,
  onVideoUpload,
  onDocumentUpload,
  onAddLink,
  setLinkUrl,
  setShowLinkInput
}) => {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700">Attachments</div>
      
      {/* Upload Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 text-sm"
        >
          <Image size={16} />
          <span>Images</span>
        </button>
        
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 text-sm"
          title="Upload videos (max 50MB each)"
        >
          <Video size={16} />
          <span>Videos</span>
          <span className="text-xs text-blue-600">(50MB max)</span>
        </button>
        
        <button
          type="button"
          onClick={() => documentInputRef.current?.click()}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-100 text-sm"
        >
          <FileText size={16} />
          <span>Documents</span>
        </button>
        
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="flex items-center space-x-2 px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 text-sm"
        >
          <Link size={16} />
          <span>Link</span>
        </button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="flex items-center space-x-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={onAddLink}
            className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
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

export default MediaUploadSection;
