import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';

const PDFPreview = ({ url, className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load PDF');
  };

  return (
    <div className={`relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Simple Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-end space-x-2">
        <button
          onClick={handleOpenInNewTab}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleDownload}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* PDF Content */}
      <div className="relative h-96">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <iframe
          src={url}
          className="w-full h-full border-0"
          title="PDF Preview"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default PDFPreview;
