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
      return {
        id: Math.random().toString(36),
        url: response.file_url || response.url,
        name: file.name,
        type: type,
        file: file
      };
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
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
          console.error('Failed to upload video:', error);
        }
      }
    }
  };

  const handleDocumentUpload = async (files) => {
    for (const file of Array.from(files)) {
      try {
        const uploadedDocument = await uploadMedia(file, 'document');
        setDocuments(prev => [...prev, {
          ...uploadedDocument,
          isPDF: file.type === 'application/pdf'
        }]);
      } catch (error) {
        console.error('Failed to upload document:', error);
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
      console.error('Error processing cropped image:', error);
    }
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      try {
        const url = new URL(linkUrl);
        const newLink = {
          id: Math.random().toString(36),
          url: linkUrl,
          link: linkUrl,
          title: url.hostname,
          description: 'External link'
        };
        setLinks(prev => [...prev, newLink]);
        setLinkUrl('');
        setShowLinkInput(false);
      } catch (error) {
        console.error('Invalid URL');
      }
    }
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const removeVideo = (videoId) => {
    setVideos(prev => prev.filter(vid => vid.id !== videoId));
  };

  const removeDocument = (docId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const removeLink = (linkId) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));
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
