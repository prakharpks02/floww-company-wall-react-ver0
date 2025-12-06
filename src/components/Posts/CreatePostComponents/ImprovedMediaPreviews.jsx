import React from 'react';
import { X, FileText, Loader2, AlertCircle } from 'lucide-react';
import PDFPreview from '../../Media/PDFPreview';

const ImprovedMediaPreviews = ({ 
  images, 
  videos, 
  documents, 
  links,
  uploadingImages = [],
  uploadingVideos = [],
  uploadingDocuments = [],
  uploadErrors = {},
  onRemoveImage, 
  onRemoveVideo, 
  onRemoveDocument, 
  onRemoveLink,
  onRetryUpload
}) => {
  return (
    <div className="space-y-4">
      {/* Image Previews */}
      {(images.length > 0 || uploadingImages.length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {/* Uploaded Images */}
            {images.map((imageUrl, index) => (
              <div key={`uploaded-${index}`} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/api/placeholder/100/100';
                  }}
                />
                <button
                  onClick={() => onRemoveImage(imageUrl)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {/* Uploading Images */}
            {uploadingImages.map((uploadingImage, index) => (
              <div key={`uploading-${index}`} className="relative group">
                <div className="w-full h-24 rounded border bg-gray-100 flex items-center justify-center">
                  {uploadingImage.error ? (
                    <div className="text-center">
                      <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-red-600">Failed</p>
                      {onRetryUpload && (
                        <button
                          onClick={() => onRetryUpload(uploadingImage)}
                          className="text-xs text-blue-600 underline"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Uploading...</p>
                    </div>
                  )}
                </div>
                
                {/* Preview of uploading image */}
                {uploadingImage.file && !uploadingImage.error && (
                  <img
                    src={uploadingImage.preview || URL.createObjectURL(uploadingImage.file)}
                    alt="Uploading..."
                    className="absolute inset-0 w-full h-24 object-cover rounded border opacity-50"
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Show upload errors */}
          {uploadErrors.images && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {uploadErrors.images}
            </div>
          )}
        </div>
      )}

      {/* Video Previews */}
      {(videos.length > 0 || uploadingVideos.length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Videos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Uploaded Videos */}
            {videos.map((videoUrl, index) => (
              <div key={`video-uploaded-${index}`} className="relative group">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-32 object-cover rounded border"
                />
                <button
                  onClick={() => onRemoveVideo(videoUrl)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove video"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {/* Uploading Videos */}
            {uploadingVideos.map((uploadingVideo, index) => (
              <div key={`video-uploading-${index}`} className="relative group">
                <div className="w-full h-32 rounded border bg-gray-100 flex items-center justify-center">
                  {uploadingVideo.error ? (
                    <div className="text-center">
                      <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-red-600">Failed</p>
                      {onRetryUpload && (
                        <button
                          onClick={() => onRetryUpload(uploadingVideo)}
                          className="text-xs text-blue-600 underline"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Uploading video...</p>
                      <p className="text-xs text-gray-500">{uploadingVideo.file?.name}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Show upload errors */}
          {uploadErrors.videos && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {uploadErrors.videos}
            </div>
          )}
        </div>
      )}

      {/* Document Previews */}
      {(documents.length > 0 || uploadingDocuments.length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
          <div className="space-y-2">
            {/* Uploaded Documents */}
            {documents.map((docUrl, index) => (
              <div key={`doc-uploaded-${index}`} className="relative group">
                {docUrl.toLowerCase().includes('.pdf') ? (
                  <div className="border rounded">
                    <PDFPreview url={docUrl} />
                    <button
                      onClick={() => onRemoveDocument(docUrl)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove document"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-gray-50 border rounded p-3">
                    <FileText size={20} className="text-blue-500" />
                    <span className="flex-1 text-sm">{docUrl.split('/').pop()}</span>
                    <button
                      onClick={() => onRemoveDocument(docUrl)}
                      className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove document"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Uploading Documents */}
            {uploadingDocuments.map((uploadingDoc, index) => (
              <div key={`doc-uploading-${index}`} className="flex items-center space-x-2 bg-gray-50 border rounded p-3">
                <FileText size={20} className="text-blue-500" />
                <div className="flex-1">
                  <div className="text-sm">{uploadingDoc.file?.name}</div>
                  {uploadingDoc.error ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-red-600">Upload failed</span>
                      {onRetryUpload && (
                        <button
                          onClick={() => onRetryUpload(uploadingDoc)}
                          className="text-xs text-blue-600 underline"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Uploading...</span>
                  )}
                </div>
                <div className="w-5 h-5 flex items-center justify-center">
                  {uploadingDoc.error ? (
                    <AlertCircle size={16} className="text-red-500" />
                  ) : (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Show upload errors */}
          {uploadErrors.documents && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {uploadErrors.documents}
            </div>
          )}
        </div>
      )}

      {/* Link Previews */}
      {links.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Links</h4>
          <div className="space-y-2">
            {links.map((linkUrl, index) => (
              <div key={`link-${index}`} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-3">
                <div>
                  <div className="text-sm font-medium text-blue-800">{new URL(linkUrl).hostname}</div>
                  <div className="text-xs text-blue-600">{linkUrl}</div>
                </div>
                <button
                  onClick={() => onRemoveLink(linkUrl)}
                  className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  title="Remove link"
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

export default ImprovedMediaPreviews;