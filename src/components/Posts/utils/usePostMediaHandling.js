// Custom hook for media handling in posts
import { useState, useRef, useEffect } from 'react';
import { mediaAPI } from '../../../services/api.jsx';
import { formatFileSize } from '../../../utils/helpers';
import { VideoCompressor, getCompressionRecommendation, getVideoInfo } from '../../../utils/videoUtils';

export const usePostMediaHandling = () => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToProcess, setImageToProcess] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  
  // Upload progress tracking
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showVideoCompressionModal, setShowVideoCompressionModal] = useState(false);
  const [videoToCompress, setVideoToCompress] = useState(null);
  const [onVideoCompressed, setOnVideoCompressed] = useState(null);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const uploadMedia = async (file, type, fileId) => {
    try {
      // Update progress to uploading
      if (fileId) {
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 50, status: 'uploading' } : f
        ));
      }

      // Use the correct API method - mediaAPI.uploadFile
      const response = await mediaAPI.uploadFile(file, type);
    
      // Return only the URL string - check nested data structure
      const url = response.data?.file_url || response.file_url || response.data?.url || response.url;
    
      // Update to completed
      if (fileId) {
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 100, status: 'completed', url } : f
        ));
      }

      return url;
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update to failed
      if (fileId) {
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'failed', error: error.message } : f
        ));
      }
      
      throw error;
    }
  };

  const [pendingImages, setPendingImages] = useState([]);

  const handleImageUpload = async (files) => {
    // Support multiple image uploads
    const validFiles = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      // Set all pending images
      setPendingImages(validFiles);
      // Show crop modal for first image
      setImageToProcess(validFiles[0]);
      setShowCropModal(true);
    }
  };

  const handleVideoUpload = async (files) => {
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) continue;

      // Check file size limit
      if (file.size > MAX_VIDEO_SIZE) {
        const fileSize = formatFileSize(file.size);
        alert(`Video file "${file.name}" (${fileSize}) is too large. Maximum size allowed is 50MB.`);
        continue;
      }

      const fileId = `video-${Date.now()}-${Math.random()}`;
      
      // Add to uploading list with analyzing state
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
            
            const uploadedVideoUrl = await uploadMedia(compressedFile, 'video', fileId);
            const videoObject = {
              url: uploadedVideoUrl,
              name: file.name,
              id: fileId,
              type: 'video'
            };
            setVideos(prev => [...prev, videoObject]);
            
            // Auto-remove from uploading list
            requestAnimationFrame(() => {
              setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
            });
          });
        } else {
          // Upload without compression
          setUploadingFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'uploading' } : f
          ));
          
          const uploadedVideoUrl = await uploadMedia(file, 'video', fileId);
          const videoObject = {
            url: uploadedVideoUrl,
            name: file.name,
            id: fileId,
            type: 'video'
          };
          setVideos(prev => [...prev, videoObject]);
          
          // Auto-remove from uploading list
          requestAnimationFrame(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          });
        }
      } catch (error) {
        console.error(`Failed to process video "${file.name}":`, error);
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'failed', error: error.message } : f
        ));
        alert(`Failed to upload video "${file.name}". Please try again.`);
      }
    }
  };

  const handleDocumentUpload = async (files) => {
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
        const uploadedDocumentUrl = await uploadMedia(file, 'document', fileId);
        const documentObject = {
          url: uploadedDocumentUrl,
          name: file.name,
          id: fileId,
          type: 'document',
          isPDF: file.type === 'application/pdf',
          size: file.size
        };
        setDocuments(prev => [...prev, documentObject]);
        
        // Auto-remove from uploading list
        requestAnimationFrame(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        });
      } catch (error) {
        console.error(`Failed to upload document "${file.name}":`, error);
      }
    }
  };

  const handleCropComplete = async (croppedBlob, originalFile) => {
    try {
      const fileId = `image-${Date.now()}-${Math.random()}`;
      
      setUploadingFiles(prev => [...prev, {
        id: fileId,
        name: originalFile.name,
        type: 'image',
        size: originalFile.size,
        progress: 0,
        status: 'uploading',
        preview: URL.createObjectURL(originalFile)
      }]);

      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: originalFile.type,
      });
      
      const uploadedImageUrl = await uploadMedia(croppedFile, 'image', fileId);
      const imageObject = {
        url: uploadedImageUrl,
        name: originalFile.name,
        id: fileId,
        type: 'image'
      };
      setImages(prev => [...prev, imageObject]);
      
      // Auto-remove from uploading list
      requestAnimationFrame(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      });
      
      // Process next image
      processNextImage(originalFile);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      processNextImage(originalFile);
    }
  };

  const handleSkipCrop = async (originalFile) => {
    try {
      const fileId = `image-${Date.now()}-${Math.random()}`;
      
      setUploadingFiles(prev => [...prev, {
        id: fileId,
        name: originalFile.name,
        type: 'image',
        size: originalFile.size,
        progress: 0,
        status: 'uploading',
        preview: URL.createObjectURL(originalFile)
      }]);
      
      const uploadedImageUrl = await uploadMedia(originalFile, 'image', fileId);
      const imageObject = {
        url: uploadedImageUrl,
        name: originalFile.name,
        id: fileId,
        type: 'image'
      };
      setImages(prev => [...prev, imageObject]);
      
      // Auto-remove from uploading list
      requestAnimationFrame(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      });
      
      // Process next image
      processNextImage(originalFile);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      processNextImage(originalFile);
    }
  };

  const processNextImage = (currentFile) => {
    const currentIndex = pendingImages.findIndex(f => f === currentFile);
    const nextImage = pendingImages[currentIndex + 1];
    
    if (nextImage) {
      setImageToProcess(nextImage);
    } else {
      // All images processed
      setShowCropModal(false);
      setImageToProcess(null);
      setPendingImages([]);
    }
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      try {
        const url = new URL(linkUrl);
        // Store only the URL string
        setLinks(prev => [...prev, linkUrl]);
        setLinkUrl('');
        setShowLinkInput(false);
      } catch (error) {
       
      }
    }
  };

  const removeImage = (imageUrl) => {
    setImages(prev => prev.filter(img => (typeof img === 'string' ? img : img.url) !== imageUrl));
  };

  const removeVideo = (videoUrl) => {
    setVideos(prev => prev.filter(vid => (typeof vid === 'string' ? vid : vid.url) !== videoUrl));
  };

  const removeDocument = (docUrl) => {
    setDocuments(prev => prev.filter(doc => (typeof doc === 'string' ? doc : doc.url) !== docUrl));
  };

  const removeLink = (linkUrl) => {
    setLinks(prev => prev.filter(link => link !== linkUrl));
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
    images,
    videos,
    documents,
    links,
    showCropModal,
    imageToProcess,
    linkUrl,
    showLinkInput,
    uploadingFiles,
    showVideoCompressionModal,
    videoToCompress,
    pendingImages,
    
    // Refs
    fileInputRef,
    videoInputRef,
    documentInputRef,
    
    // Actions
    handleImageUpload,
    handleVideoUpload,
    handleDocumentUpload,
    handleCropComplete,
    handleSkipCrop,
    addLink,
    removeImage,
    removeVideo,
    removeDocument,
    removeLink,
    removeUploadingFile,
    clearCompletedUploads,
    handleVideoCompressionComplete,
    handleVideoCompressionCancel,
    
    // Setters
    setLinkUrl,
    setShowLinkInput,
    setShowCropModal
  };
};
