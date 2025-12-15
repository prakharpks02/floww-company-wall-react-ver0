import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, ArrowLeft, MoreVertical } from 'lucide-react';

const ImageViewer = ({ images, initialIndex = 0, isOpen, onClose, authorName, authorAvatar, timestamp, isChat = false }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll and layout shifts
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'r' || e.key === 'R') handleRotate();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, currentIndex, images.length]);

  // Preload the current image
  useEffect(() => {
    if (isOpen && images && images.length > 0) {
      const currentImage = images[currentIndex];
      const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage?.url;
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
      }
    }
  }, [isOpen, images, currentIndex]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage.url;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const content = (
    <div 
      className="fixed inset-0 bg-black flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
        zIndex: isChat ? 9999 : 200
      }}
    >
      {/* Header */}
      <div className="bg-[#202c33] px-3 py-2.5 z-10">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
              title="Back (Esc)"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden border-2 border-gray-500">
              {authorAvatar ? (
                <img 
                  src={authorAvatar} 
                  alt={authorName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = (authorName ? authorName.charAt(0).toUpperCase() : 'U');
                  }}
                />
              ) : (
                <span>{authorName ? authorName.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {authorName && (
                <div className="font-medium text-white truncate text-[15px]">{authorName}</div>
              )}
              {timestamp && (
                <div className="text-xs text-gray-400">{timestamp}</div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-0 flex-shrink-0">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2.5 hover:bg-white hover:bg-opacity-10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2.5 hover:bg-white hover:bg-opacity-10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2.5 hover:bg-white hover:bg-opacity-10 rounded-full"
              title="Rotate (R)"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              className="p-2.5 hover:bg-white hover:bg-opacity-10 rounded-full"
              title="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-700 bg-opacity-70 hover:bg-opacity-90 rounded-full text-white z-20 shadow-lg"
                title="Previous (←)"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-700 bg-opacity-70 hover:bg-opacity-90 rounded-full text-white z-20 shadow-lg"
                title="Next (→)"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
          </>
        )}

        {/* Image Container */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            src={imageUrl}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center center',
              willChange: 'transform'
            }}
            draggable={false}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.error('Failed to load image:', imageUrl);
              setImageLoaded(true);
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      </div>

      {/* Footer with image counter and thumbnail strip */}
      {images.length > 1 && (
        <div className="bg-[#1f1f1f] px-4 py-0 z-10">
          <div className="text-center text-white text-xs mb-2">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-1">
            {images.map((img, idx) => {
              const thumbUrl = typeof img === 'string' ? img : img.url;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoom(1);
                    setRotation(0);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`flex-shrink-0 w-14 h-14 rounded ${
                    idx === currentIndex
                      ? 'ring-2 ring-white scale-105'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Always use portal to render to document.body for full screen coverage
  return createPortal(content, document.body);
};

export default ImageViewer;
