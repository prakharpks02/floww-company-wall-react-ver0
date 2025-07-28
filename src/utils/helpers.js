// Utility functions for the HR Community Wall

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

export const highlightMentions = (text, employees) => {
  const mentionRegex = /@(\w+)/g;
  
  return text.replace(mentionRegex, (match, username) => {
    const employee = employees.find(emp => 
      emp.name.toLowerCase().replace(/\s+/g, '') === username.toLowerCase()
    );
    
    if (employee) {
      return `<span class="mention">@${employee.name}</span>`;
    }
    
    return match;
  });
};

export const generatePostPreview = (content, maxLength = 150) => {
  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).trim() + '...';
};

export const getFileIcon = (fileType) => {
  const type = fileType.toLowerCase();
  
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎥';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('excel') || type.includes('sheet')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📺';
  if (type.includes('audio')) return '🎵';
  if (type.includes('zip') || type.includes('rar')) return '🗜️';
  
  return '📁';
};

export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid image type. Please upload JPEG, PNG, GIF, or WebP files.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB.');
  }
  
  return true;
};

export const validateVideoFile = (file) => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid video type. Please upload MP4, WebM, OGG, AVI, or MOV files.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Video size must be less than 50MB.');
  }
  
  return true;
};

export const validateDocumentFile = (file) => {
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid document type. Please upload PDF, Word, Excel, PowerPoint, or text files.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Document size must be less than 10MB.');
  }
  
  return true;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove script tags
  const scripts = div.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove event handlers
  const allElements = div.querySelectorAll('*');
  allElements.forEach(el => {
    const attributes = el.attributes;
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attrName = attributes[i].name;
      if (attrName.startsWith('on')) {
        el.removeAttribute(attrName);
      }
    }
  });
  
  return div.innerHTML;
};
