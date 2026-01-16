import React, { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import { X, RotateCw, Crop, Download } from "lucide-react";
import "react-image-crop/dist/ReactCrop.css";

// Helper function to create a crop with aspect ratio
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropModal = ({
  imageFile,
  onSave,
  onCancel,
  onSkip,
  onSkipAll,
  isOpen,
  remainingImagesCount = 0,
}) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(undefined);
  const [imageSrc, setImageSrc] = useState("");
  const [quality, setQuality] = useState(0.8);

  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Load image when file changes
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || "");
      });
      reader.readAsDataURL(imageFile);

      // Reset aspect ratio and crop for new image
      setAspect(undefined);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setScale(1);
      setRotate(0);
      setQuality(0.8);
    }
  }, [imageFile]);

  const onImageLoad = useCallback(
    (e) => {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    },
    [aspect]
  );

  // Clear preview canvas when a new image loads
  React.useEffect(() => {
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext("2d");
      if (ctx) {
        previewCanvasRef.current.width = 0;
        previewCanvasRef.current.height = 0;
      }
    }
  }, [imageSrc]);

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
      ).catch((err) => console.error("Canvas preview error:", err));
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
            onSave(blob, imageFile);
          }
        },
        imageFile.type,
        quality
      );
    } else {
      // If no crop is applied, convert original image to blob
      imageFile.arrayBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: imageFile.type });
        onSave(blob, imageFile);
      });
    }
  }, [completedCrop, scale, rotate, quality, imageFile, onSave]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Crop & Resize Image
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-2 sm:p-4 border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-max sm:min-w-0">
            {/* Aspect Ratio */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Aspect:
              </label>
              <select
                value={aspect || "free"}
                onChange={(e) => {
                  const newAspect =
                    e.target.value === "free"
                      ? undefined
                      : parseFloat(e.target.value);
                  setAspect(newAspect);
                  if (newAspect && imgRef.current) {
                    const { width, height } = imgRef.current;
                    setCrop(centerAspectCrop(width, height, newAspect));
                  }
                }}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free</option>
                <option value={1}>1:1</option>
                <option value={16 / 9}>16:9</option>
                <option value={4 / 3}>4:3</option>
                <option value={3 / 2}>3:2</option>
                <option value={9 / 16}>9:16</option>
              </select>
            </div>

            {/* Scale */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Scale:
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="flex-1 sm:w-16"
              />
              <span className="text-xs sm:text-sm text-gray-600 min-w-fit">
                {scale.toFixed(1)}x
              </span>
            </div>

            {/* Rotation */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Rotate:
              </label>
              <button
                onClick={() => setRotate((prev) => (prev + 90) % 360)}
                className="p-1 sm:p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors w-full sm:w-auto"
                title="Rotate 90° clockwise"
              >
                <RotateCw className="h-4 w-4 mx-auto" />
              </button>
              <span className="text-xs sm:text-sm text-gray-600 min-w-fit">
                {rotate}°
              </span>
            </div>

            {/* Quality */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Quality:
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="flex-1 sm:w-16"
              />
              <span className="text-xs sm:text-sm text-gray-600 min-w-fit">
                {Math.round(quality * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Image Editor */}
        <div className="p-2 sm:p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            {/* Original Image with Crop */}
            <div className="space-y-1 sm:space-y-2 min-h-0">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">
                Original Image
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-checkered flex-1 flex items-center justify-center">
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
                        maxHeight: "min(300px, 40vh)",
                        width: "auto",
                        maxWidth: "100%",
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-1 sm:space-y-2 min-h-0">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">
                Preview
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-checkered flex-1 flex items-center justify-center min-h-[200px]">
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    objectFit: "contain",
                    maxWidth: "100%",
                    maxHeight: "min(300px, 40vh)",
                  }}
                  className="max-w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 p-2 sm:p-4 border-t border-gray-200 bg-white">
          <div>
            {remainingImagesCount > 0 && (
              <span className="text-xs sm:text-sm text-gray-600">
                {remainingImagesCount} image
                {remainingImagesCount > 1 ? "s" : ""} remaining
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="px-3 sm:px-6 py-2 text-xs sm:text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {onSkipAll && remainingImagesCount > 0 && (
              <button
                onClick={onSkipAll}
                className="px-3 sm:px-6 py-2 text-xs sm:text-sm text-orange-700 border border-orange-300 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors font-medium truncate"
              >
                Skip All ({remainingImagesCount + 1})
              </button>
            )}
            {onSkip && (
              <button
                onClick={() => onSkip(imageFile)}
                className="px-3 sm:px-6 py-2 text-xs sm:text-sm text-blue-700 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                Skip This
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Crop className="h-4 w-4" />
              <span>Apply</span>
            </button>
          </div>
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
  quality = 0.8
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = (rotate * Math.PI) / 180;
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
    image.naturalHeight
  );

  ctx.restore();
}

export default ImageCropModal;
