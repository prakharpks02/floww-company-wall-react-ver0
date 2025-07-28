import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Eye, File, FileImage, Music, Video } from 'lucide-react';

const DocumentViewer = ({ file, className = "" }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-8 w-8 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-8 w-8 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-8 w-8 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <Music className="h-8 w-8 text-pink-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-8 w-8 text-indigo-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canPreview = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(extension);
  };

  const handleDownload = () => {
    // In a real app, this would trigger a download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    if (canPreview(file.name)) {
      setIsPreviewOpen(true);
    } else {
      // Open in new tab for non-previewable files
      window.open(file.url, '_blank');
    }
  };

  const renderPreview = () => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <iframe
            src={file.url}
            className="w-full h-full border-none"
            title={file.name}
          />
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        );
      case 'txt':
        return (
          <div className="w-full h-full p-4 bg-white overflow-auto">
            <pre className="whitespace-pre-wrap text-sm">{file.content}</pre>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Preview not available</p>
          </div>
        );
    }
  };

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center space-x-4">
          {/* File Icon */}
          <div className="flex-shrink-0">
            {getFileIcon(file.name)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </h4>
            <p className="text-xs text-gray-500">
              {getFileSize(file.size || 0)} • {file.type || 'Unknown type'}
            </p>
            {file.uploadedAt && (
              <p className="text-xs text-gray-400">
                Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {canPreview(file.name) && (
              <button
                onClick={handlePreview}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar for uploading files */}
        {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{file.uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${file.uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-11/12 h-5/6 bg-white rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {file.name}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-500 hover:text-purple-600 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="w-full h-full p-4 overflow-auto">
              {renderPreview()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentViewer;
