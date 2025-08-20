import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { X, RotateCw, Crop, Download } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

// Helper function to create a crop with aspect ratio
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const ImageCropModal = ({ 
  imageFile, 
  onSave, 
  onCancel, 
  isOpen 
}) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(undefined);
  const [imageSrc, setImageSrc] = useState('');
  const [quality, setQuality] = useState(0.8);
  
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Load image when file changes
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onImageLoad = useCallback((e) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }, [aspect]);

  // Generate preview canvas
  React.useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
        rotate,
        quality
      );
    }
  }, [completedCrop, scale, rotate, quality]);

  const handleSave = useCallback(async () => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      // Generate the cropped image
      await canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
        rotate,
        quality
      );
      
      // Convert canvas to blob
      previewCanvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], imageFile.name, {
              type: imageFile.type,
              lastModified: Date.now(),
            });
            onSave(croppedFile);
          }
        },
        imageFile.type,
        quality
      );
    } else {
      // If no crop is applied, use original file
      onSave(imageFile);
    }
  }, [completedCrop, scale, rotate, quality, imageFile, onSave]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Crop & Resize Image</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Aspect Ratio */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Aspect Ratio:</label>
              <select
                value={aspect || 'free'}
                onChange={(e) => {
                  const newAspect = e.target.value === 'free' ? undefined : parseFloat(e.target.value);
                  setAspect(newAspect);
                  if (newAspect && imgRef.current) {
                    const { width, height } = imgRef.current;
                    setCrop(centerAspectCrop(width, height, newAspect));
                  }
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free</option>
                <option value={1}>Square (1:1)</option>
                <option value={16/9}>Widescreen (16:9)</option>
                <option value={4/3}>Standard (4:3)</option>
                <option value={3/2}>Photo (3:2)</option>
                <option value={9/16}>Portrait (9:16)</option>
              </select>
            </div>

            {/* Scale */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Scale:</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-600">{scale.toFixed(1)}x</span>
            </div>

            {/* Rotation */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Rotate:</label>
              <button
                onClick={() => setRotate((prev) => (prev + 90) % 360)}
                className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="Rotate 90° clockwise"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">{rotate}°</span>
            </div>

            {/* Quality */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Quality:</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-600">{Math.round(quality * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Image Editor */}
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Image with Crop */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Original Image</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-checkered">
                {imageSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="max-w-full"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imageSrc}
                      style={{ 
                        transform: `scale(${scale}) rotate(${rotate}deg)`,
                        maxHeight: '400px',
                        width: 'auto'
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-checkered">
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    border: '1px solid black',
                    objectFit: 'contain',
                    width: '100%',
                    maxHeight: '400px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Crop className="h-4 w-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to draw image on canvas
async function canvasPreview(
  image,
  canvas,
  crop,
  scale = 1,
  rotate = 0,
  quality = 0.8,
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = rotate * Math.PI / 180;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.restore();
}

export default ImageCropModal;
