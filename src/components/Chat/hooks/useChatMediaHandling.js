// Custom hook for media handling in chat
import { useState } from 'react';
import { mediaAPI } from '../../../services/api.jsx';
import { formatFileSize } from '../../../utils/helpers';
import { VideoCompressor, getCompressionRecommendation, getVideoInfo } from '../../../utils/videoUtils';

export const useChatMediaHandling = () => {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showVideoCompressionModal, setShowVideoCompressionModal] = useState(false);
  const [videoToCompress, setVideoToCompress] = useState(null);
  const [onVideoCompressed, setOnVideoCompressed] = useState(null);

  const uploadMedia = async (file, type, fileId) => {
    try {
      // Update progress
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 50, status: 'uploading' } : f
      ));

      // Use the correct API method
      const response = await mediaAPI.uploadFile(file, type);
      
      // Extract URL from response
      const url = response.data?.file_url || response.file_url || response.data?.url || response.url;
      
      // Update to completed
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 100, status: 'completed', url } : f
      ));

      return url;
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update to failed
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'failed', error: error.message } : f
      ));
      
      throw error;
    }
  };

  const handleImageUpload = async (files) => {
    const uploadedUrls = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      const fileId = `image-${Date.now()}-${Math.random()}`;
      
      // Add to uploading list
      setUploadingFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        type: 'image',
        size: file.size,
        progress: 0,
        status: 'pending',
        preview: URL.createObjectURL(file)
      }]);

      try {
        const url = await uploadMedia(file, 'image', fileId);
        uploadedUrls.push(url);
        
        // Auto-remove from uploading list after 2 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        }, 2000);
      } catch (error) {
        console.error(`Failed to upload image "${file.name}":`, error);
      }
    }

    return uploadedUrls;
  };

  const handleVideoUpload = async (files, onUrlsReady) => {
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) continue;

      // Check file size
      if (file.size > MAX_VIDEO_SIZE) {
        const fileSize = formatFileSize(file.size);
        alert(`Video "${file.name}" (${fileSize}) is too large. Maximum size is 50MB.`);
        continue;
      }

      const fileId = `video-${Date.now()}-${Math.random()}`;
      
      // Add to uploading list with loading state
      setUploadingFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        type: 'video',
        size: file.size,
        progress: 0,
        status: 'analyzing',
        preview: null
      }]);

      try {
        // Get video info and check if compression is recommended
        const videoInfo = await getVideoInfo(file);
        const recommendation = getCompressionRecommendation(file, videoInfo);

        if (recommendation.shouldCompress && file.size > 20 * 1024 * 1024) {
          // Show compression modal for large videos
          setVideoToCompress(file);
          setShowVideoCompressionModal(true);
          
          // Store callback for when compression is complete
          setOnVideoCompressed(() => async (compressedFile) => {
            setShowVideoCompressionModal(false);
            setVideoToCompress(null);
            
            // Update status to uploading
            setUploadingFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f
            ));
            
            const url = await uploadMedia(compressedFile, 'video', fileId);
            if (onUrlsReady) onUrlsReady([url]);
            
            // Auto-remove from uploading list after 2 seconds
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
            }, 2000);
          });
        } else {
          // Upload without compression
          setUploadingFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'uploading' } : f
          ));
          
          const url = await uploadMedia(file, 'video', fileId);
          if (onUrlsReady) onUrlsReady([url]);
          
          // Auto-remove from uploading list after 2 seconds
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          }, 2000);
        }
      } catch (error) {
        console.error(`Failed to process video "${file.name}":`, error);
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'failed', error: error.message } : f
        ));
      }
    }
  };

  const handleDocumentUpload = async (files) => {
    const uploadedFiles = [];
    const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50MB

    for (const file of Array.from(files)) {
      // Check file size
      if (file.size > MAX_DOC_SIZE) {
        alert(`Document "${file.name}" is too large. Maximum size is 50MB.`);
        continue;
      }

      const fileId = `doc-${Date.now()}-${Math.random()}`;
      
      // Add to uploading list
      setUploadingFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        type: 'document',
        size: file.size,
        progress: 0,
        status: 'pending'
      }]);

      try {
        const url = await uploadMedia(file, 'document', fileId);
        uploadedFiles.push({ url, name: file.name });
        // Auto-remove from uploading list after 2 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        }, 2000);
      } catch (error) {
        console.error(`Failed to upload document "${file.name}":`, error);
      }
    }

    return uploadedFiles;
  };

  const removeUploadingFile = (fileId) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearCompletedUploads = () => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const handleVideoCompressionComplete = (compressedFile) => {
    if (onVideoCompressed) {
      onVideoCompressed(compressedFile);
    }
    setShowVideoCompressionModal(false);
    setVideoToCompress(null);
    setOnVideoCompressed(null);
  };

  const handleVideoCompressionCancel = () => {
    // If user cancels compression, upload original file
    if (videoToCompress && onVideoCompressed) {
      onVideoCompressed(videoToCompress);
    }
    setShowVideoCompressionModal(false);
    setVideoToCompress(null);
    setOnVideoCompressed(null);
  };

  return {
    // State
    uploadingFiles,
    showVideoCompressionModal,
    videoToCompress,
    
    // Actions
    handleImageUpload,
    handleVideoUpload,
    handleDocumentUpload,
    removeUploadingFile,
    clearCompletedUploads,
    handleVideoCompressionComplete,
    handleVideoCompressionCancel,
    
    // Setters
    setShowVideoCompressionModal
  };
};
