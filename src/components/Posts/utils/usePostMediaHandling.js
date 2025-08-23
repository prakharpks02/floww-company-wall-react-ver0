// Custom hook for media handling in posts
import { useState, useRef } from 'react';
import { mediaAPI } from '../../../services/api';

export const usePostMediaHandling = () => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToProcess, setImageToProcess] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const uploadMedia = async (file, type) => {
    try {
      // Use the correct API method - mediaAPI.uploadFile
      const response = await mediaAPI.uploadFile(file, type);
      // Return only the URL string
      return response.file_url || response.url;
    } catch (error) {
      throw error;
    }
  };

  const handleImageUpload = (files) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        setImageToProcess(file);
        setShowCropModal(true);
      }
    });
  };

  const handleVideoUpload = async (files) => {
    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/')) {
        try {
          const uploadedVideo = await uploadMedia(file, 'video');
          setVideos(prev => [...prev, uploadedVideo]);
        } catch (error) {
         
        }
      }
    }
  };

  const handleDocumentUpload = async (files) => {
    for (const file of Array.from(files)) {
      try {
        const uploadedDocument = await uploadMedia(file, 'document');
        setDocuments(prev => [...prev, uploadedDocument]);
      } catch (error) {
      
      }
    }
  };

  const handleCropComplete = async (croppedBlob, originalFile) => {
    try {
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: originalFile.type,
      });
      
      const uploadedImage = await uploadMedia(croppedFile, 'image');
      setImages(prev => [...prev, uploadedImage]);
      setShowCropModal(false);
      setImageToProcess(null);
    } catch (error) {
     
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
    
    // Refs
    fileInputRef,
    videoInputRef,
    documentInputRef,
    
    // Actions
    handleImageUpload,
    handleVideoUpload,
    handleDocumentUpload,
    handleCropComplete,
    addLink,
    removeImage,
    removeVideo,
    removeDocument,
    removeLink,
    
    // Setters
    setLinkUrl,
    setShowLinkInput,
    setShowCropModal
  };
};
