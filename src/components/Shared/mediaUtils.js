// Shared utility functions for media handling
export const validateFileSize = (file, maxSizeMB = 10) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.some(type => file.type.startsWith(type));
};

export const generateMediaId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const createMediaItem = (file, url, type) => {
  return {
    id: generateMediaId(),
    url: url,
    name: file.name,
    type: type,
    file: file,
    size: file.size
  };
};

// Validation constants
export const VALIDATION_RULES = {
  image: {
    maxSize: 10, // MB
    allowedTypes: ['image/'],
    maxCount: 10
  },
  video: {
    maxSize: 100, // MB
    allowedTypes: ['video/'],
    maxCount: 5
  },
  document: {
    maxSize: 50, // MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/'],
    maxCount: 10
  }
};
