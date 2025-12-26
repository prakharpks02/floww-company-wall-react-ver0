import React from 'react';
import { X, Loader2, CheckCircle, XCircle, Image, Video, FileText } from 'lucide-react';
import { formatFileSize } from '../../../utils/helpers';

const UploadProgressDisplay = ({ uploadingFiles, onRemove, className = '' }) => {
  if (uploadingFiles.length === 0) return null;

  const getStatusIcon = (file) => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'analyzing':
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4 text-purple-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (file) => {
    switch (file.status) {
      case 'analyzing':
        return 'Analyzing...';
      case 'uploading':
        return `Uploading...`;
      case 'completed':
        return 'Uploaded';
      case 'failed':
        return file.error || 'Upload failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
          <span className="text-sm font-medium text-gray-700">
            Uploading {uploadingFiles.filter(f => f.status !== 'completed').length} file(s)
          </span>
        </div>
      </div>

      {/* File List */}
      <div className="max-h-48 overflow-y-auto">
        {uploadingFiles.map((file) => (
          <div
            key={file.id}
            className="px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex items-start space-x-2">
              {/* File Type Icon */}
              <div className="mt-0.5">{getTypeIcon(file.type)}</div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-2">
                    {getStatusIcon(file)}
                    {file.status === 'completed' && (
                      <button
                        onClick={() => onRemove(file.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Remove"
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Text */}
                <p className="text-xs text-gray-600 mt-1">
                  {getStatusText(file)}
                </p>

                {/* Progress Bar */}
                {(file.status === 'uploading' || file.status === 'analyzing') && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        file.status === 'analyzing'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-purple-600'
                      }`}
                      style={{
                        width: file.status === 'analyzing' ? '50%' : `${file.progress}%`
                      }}
                    />
                  </div>
                )}

                {/* Preview for images */}
                {file.type === 'image' && file.preview && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="mt-2 h-16 w-16 object-cover rounded"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadProgressDisplay;
