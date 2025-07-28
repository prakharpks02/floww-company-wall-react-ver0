import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Download, RotateCw, Home } from 'lucide-react';

const PDFPreview = ({ url, className = '' }) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
          case '0':
            e.preventDefault();
            setZoom(1);
            break;
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load PDF');
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''} ${className}`}
      tabIndex={0}
    >
      {/* Controls */}
      <div className={`absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-2 flex items-center justify-between z-10 ${
        isFullscreen ? 'bg-gray-800 border-gray-600' : ''
      }`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
              isFullscreen ? 'text-white hover:bg-gray-700' : 'text-gray-700'
            }`}
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <span className={`text-sm font-medium min-w-[50px] text-center ${
            isFullscreen ? 'text-white' : 'text-gray-700'
          }`}>
            {zoomPercentage}%
          </span>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
              isFullscreen ? 'text-white hover:bg-gray-700' : 'text-gray-700'
            }`}
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            onClick={resetZoom}
            className={`p-1 rounded hover:bg-gray-100 ${
              isFullscreen ? 'text-white hover:bg-gray-700' : 'text-gray-700'
            }`}
            title="Reset Zoom (Ctrl+0)"
          >
            <Home className="h-4 w-4" />
          </button>

          <button
            onClick={handleRotate}
            className={`p-1 rounded hover:bg-gray-100 ${
              isFullscreen ? 'text-white hover:bg-gray-700' : 'text-gray-700'
            }`}
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className={`p-1 rounded hover:bg-gray-100 ${
              isFullscreen ? 'text-white hover:bg-gray-700' : 'text-gray-700'
            }`}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-1 rounded hover:bg-gray-100 ${
              isFullscreen ? 'text-white hover:bg-gray-700' : 'text-gray-700'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className={`${isFullscreen ? 'pt-12 h-full' : 'pt-10 h-full'} overflow-auto`}>
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
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
                className="text-purple-600 hover:text-purple-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!error && (
          <div 
            className="flex items-center justify-center h-full p-4"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0 bg-white shadow-lg"
              title="PDF Preview"
              onLoad={handleLoad}
              onError={handleError}
              style={{
                minHeight: isFullscreen ? 'calc(100vh - 96px)' : '400px',
                maxWidth: '100%'
              }}
            />
          </div>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 opacity-75">
          <div>Ctrl +/- : Zoom • F: Fullscreen • Esc: Exit</div>
        </div>
      )}
    </div>
  );
};

export default PDFPreview;
