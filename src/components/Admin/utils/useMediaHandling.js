// Custom hooks for media handling in broadcast messages
import { useState, useRef } from 'react';

export const useMediaHandling = (uploadMedia, showError) => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  
  // Image crop related state
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const handleImageSelect = (files) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showError('Please select only image files');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showError('Image file size should be less than 10MB');
        return;
      }
      
      // Add to pending images for cropping
      setPendingImages(prev => [...prev, {
        file,
        id: Math.random().toString(36)
      }]);
    });
    
    // Show crop modal if there are pending images
    if (fileArray.length > 0) {
      setShowCropModal(true);
    }
  };

  const handleVideoSelect = async (files) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (!file.type.startsWith('video/')) {
        showError('Please select only video files');
        continue;
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        showError('Video file size should be less than 100MB');
        continue;
      }
      
      const uploadedVideo = await uploadMedia(file, 'video');
      if (uploadedVideo) {
        setVideos(prev => [...prev, uploadedVideo]);
      }
    }
  };

  const handleDocumentSelect = async (files) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        showError('Document file size should be less than 50MB');
        continue;
      }
      
      const uploadedDocument = await uploadMedia(file, 'document');
      if (uploadedDocument) {
        setDocuments(prev => [...prev, uploadedDocument]);
      }
    }
  };

  const handleCropComplete = async (croppedBlob, originalFile) => {
    try {
      // Convert blob to file
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: originalFile.type,
      });
      
      const uploadedImage = await uploadMedia(croppedFile, 'image');
      if (uploadedImage) {
        setImages(prev => [...prev, uploadedImage]);
      }
      
      // Remove from pending
      setPendingImages(prev => prev.filter(img => img.file !== originalFile));
      
      // If no more pending images, close modal
      if (pendingImages.length <= 1) {
        setShowCropModal(false);
      }
    } catch (error) {
      console.error('Error processing cropped image:', error);
      showError('Failed to process cropped image');
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      // Basic URL validation
      try {
        const url = new URL(linkUrl);
        // Store only the URL string
        setLinks(prev => [...prev, linkUrl]);
        setLinkUrl('');
        setShowLinkInput(false);
      } catch (error) {
        showError('Please enter a valid URL');
      }
    }
  };

  const removeImage = (imageUrl) => {
    setImages(prev => prev.filter(img => img !== imageUrl));
  };

  const removeVideo = (videoUrl) => {
    setVideos(prev => prev.filter(vid => vid !== videoUrl));
  };

  const removeDocument = (docUrl) => {
    setDocuments(prev => prev.filter(doc => doc !== docUrl));
  };

  const removeLink = (linkUrl) => {
    setLinks(prev => prev.filter(link => link !== linkUrl));
  };

  const clearAllMedia = () => {
    setImages([]);
    setVideos([]);
    setDocuments([]);
    setLinks([]);
    setPendingImages([]);
    setShowCropModal(false);
    setLinkUrl('');
    setShowLinkInput(false);
  };

  return {
    // State
    images,
    videos,
    documents,
    links,
    showCropModal,
    currentImageFile,
    pendingImages,
    linkUrl,
    showLinkInput,
    
    // Refs
    fileInputRef,
    videoInputRef,
    documentInputRef,
    
    // Actions
    handleImageSelect,
    handleVideoSelect,
    handleDocumentSelect,
    handleCropComplete,
    handleAddLink,
    removeImage,
    removeVideo,
    removeDocument,
    removeLink,
    clearAllMedia,
    
    // Setters
    setLinkUrl,
    setShowLinkInput,
    setCurrentImageFile
  };
};
