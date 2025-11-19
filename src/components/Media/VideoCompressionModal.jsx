import React, { useState, useEffect } from 'react';
import { X, Loader2, Video, Zap, FileText, Clock, Monitor } from 'lucide-react';
import { formatFileSize } from '../../utils/helpers';
import { getVideoInfo, formatDuration, getCompressionRecommendation } from '../../utils/videoUtils';

const VideoCompressionModal = ({ isOpen, onClose, videoFile, onCompressionComplete }) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [compressionSettings, setCompressionSettings] = useState({
    quality: 'medium', // low, medium, high
    maxWidth: 1280,
    maxHeight: 720
  });

  useEffect(() => {
    if (videoFile) {
      getVideoInfo(videoFile).then(info => {
        setVideoInfo(info);
        
        // Auto-select compression level based on file
        const recommendation = getCompressionRecommendation(videoFile, info);
        if (recommendation.settings) {
          setCompressionSettings(prev => ({
            ...prev,
            quality: recommendation.settings
          }));
        }
      });
    }
  }, [videoFile]);

  if (!isOpen || !videoFile) return null;

  const originalSizeMB = videoFile.size / (1024 * 1024);
  const estimatedSize = VideoCompressor.getEstimatedSize(videoFile.size);

  const qualitySettings = {
    low: { maxWidth: 854, maxHeight: 480, maxSizeMB: 5, quality: 0.5 },
    medium: { maxWidth: 1280, maxHeight: 720, maxSizeMB: 10, quality: 0.7 },
    high: { maxWidth: 1920, maxHeight: 1080, maxSizeMB: 20, quality: 0.8 }
  };

  const handleCompress = async () => {
    try {
      setIsCompressing(true);
      setCompressionProgress(0);

      const settings = qualitySettings[compressionSettings.quality];
      const compressor = new VideoCompressor(settings);

      const compressedFile = await compressor.compressVideo(
        videoFile,
        (progress) => setCompressionProgress(progress)
      );

      onCompressionComplete(compressedFile);
      onClose();
    } catch (error) {
      alert('Video compression failed. The original video will be used.');
      onCompressionComplete(videoFile);
      onClose();
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const handleSkipCompression = () => {
    onCompressionComplete(videoFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Video Compression</h3>
          <button
            onClick={onClose}
            disabled={isCompressing}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Video className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-gray-900">{videoFile.name}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Size: <span className="font-medium">{formatFileSize(videoFile.size)}</span></div>
              {videoInfo && (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{videoInfo.durationFormatted}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Monitor className="h-3 w-3" />
                      <span>{videoInfo.width}×{videoInfo.height}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Compression Status */}
          {isCompressing ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Compressing video...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {Math.round(compressionProgress)}% complete
              </div>
            </div>
          ) : (
            <>
              {/* Quality Settings */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Compression Quality
                </label>
                <div className="space-y-2">
                  {Object.entries(qualitySettings).map(([key, settings]) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="quality"
                        value={key}
                        checked={compressionSettings.quality === key}
                        onChange={(e) => setCompressionSettings(prev => ({
                          ...prev,
                          quality: e.target.value
                        }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{key}</span>
                          <span className="text-xs text-gray-500">
                            {settings.maxWidth}x{settings.maxHeight}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Target: ~{formatFileSize(estimatedSize.average)} 
                          {key === 'low' && ' (Best compression)'}
                          {key === 'medium' && ' (Balanced)'}
                          {key === 'high' && ' (Best quality)'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Comparison */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm text-blue-900">Estimated Result</span>
                </div>
                <div className="text-sm text-blue-800">
                  <div>Original: {formatFileSize(videoFile.size)}</div>
                  <div>Compressed: ~{formatFileSize(estimatedSize.average)}</div>
                  <div className="font-medium">
                    Savings: ~{Math.round((1 - estimatedSize.average / videoFile.size) * 100)}%
                  </div>
                </div>
              </div>

              {/* Browser Support Check */}
              {!VideoCompressor.isSupported() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Video compression is not fully supported in your browser. The original file will be used.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {!isCompressing && (
          <div className="flex space-x-3 p-4 border-t">
            <button
              onClick={handleSkipCompression}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Use Original
            </button>
            <button
              onClick={handleCompress}
              disabled={!VideoCompressor.isSupported()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Compress Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCompressionModal;
