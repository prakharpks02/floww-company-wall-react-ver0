// Video compression utilities
export const getVideoInfo = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      resolve({
        duration,
        durationFormatted: formatDuration(duration),
        width,
        height,
        aspectRatio: width / height
      });
    };

    video.onerror = () => {
      resolve({
        duration: 0,
        durationFormatted: '0:00',
        width: 0,
        height: 0,
        aspectRatio: 16 / 9
      });
    };

    video.src = URL.createObjectURL(file);
  });
};

export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const getCompressionRecommendation = (file, videoInfo) => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Recommend compression based on file size
  if (fileSizeMB > 50) {
    return {
      shouldCompress: true,
      settings: 'low',
      reason: 'File size is very large (>50MB). High compression recommended.'
    };
  } else if (fileSizeMB > 20) {
    return {
      shouldCompress: true,
      settings: 'medium',
      reason: 'File size is large (>20MB). Medium compression recommended.'
    };
  } else if (fileSizeMB > 10) {
    return {
      shouldCompress: false,
      settings: 'high',
      reason: 'File size is moderate. Optional compression available.'
    };
  }
  
  return {
    shouldCompress: false,
    settings: 'high',
    reason: 'File size is acceptable. Compression not required.'
  };
};

// Video Compressor Class
export class VideoCompressor {
  constructor(settings = {}) {
    this.settings = {
      maxWidth: settings.maxWidth || 1280,
      maxHeight: settings.maxHeight || 720,
      quality: settings.quality || 0.7,
      maxSizeMB: settings.maxSizeMB || 10,
      ...settings
    };
  }

  static isSupported() {
    return !!(
      window.MediaRecorder &&
      window.HTMLCanvasElement &&
      window.OffscreenCanvas
    );
  }

  static getEstimatedSize(originalSize) {
    // Rough estimate: compression typically reduces size by 50-70%
    const compressionRatio = 0.35; // Conservative estimate
    const estimated = originalSize * compressionRatio;
    
    return {
      min: estimated * 0.7,
      average: estimated,
      max: estimated * 1.3
    };
  }

  async compressVideo(file, onProgress) {
    if (!VideoCompressor.isSupported()) {
      throw new Error('Video compression is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.preload = 'metadata';
      
      video.onloadedmetadata = async () => {
        try {
          const { videoWidth, videoHeight, duration } = video;
          
          // Calculate new dimensions maintaining aspect ratio
          let width = videoWidth;
          let height = videoHeight;
          
          if (width > this.settings.maxWidth || height > this.settings.maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = this.settings.maxWidth;
              height = Math.round(width / aspectRatio);
            } else {
              height = this.settings.maxHeight;
              width = Math.round(height * aspectRatio);
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Setup MediaRecorder
          const stream = canvas.captureStream(30); // 30 fps
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8',
            videoBitsPerSecond: width * height * 30 * this.settings.quality * 0.1
          });
          
          const chunks = [];
          
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
              type: 'video/webm'
            });
            
            window.URL.revokeObjectURL(video.src);
            resolve(compressedFile);
          };
          
          mediaRecorder.onerror = (error) => {
            reject(error);
          };
          
          // Start recording
          mediaRecorder.start();
          video.currentTime = 0;
          video.play();
          
          let lastProgress = 0;
          
          video.ontimeupdate = () => {
            if (video.currentTime <= duration) {
              ctx.drawImage(video, 0, 0, width, height);
              
              const progress = (video.currentTime / duration) * 100;
              if (progress - lastProgress > 1) {
                lastProgress = progress;
                if (onProgress) onProgress(progress);
              }
            } else {
              video.pause();
              mediaRecorder.stop();
            }
          };
          
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
}
