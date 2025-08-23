// Custom hooks for broadcast message functionality
import { useState } from 'react';
import { adminAPI } from '../../../services/adminAPI';

export const useBroadcastActions = (showSuccess, showError, showWarning) => {
  const [loading, setLoading] = useState(false);

  const sendBroadcast = async (broadcastData) => {
    setLoading(true);
    try {
    
      
      // Validate required fields
      if (!broadcastData.content || broadcastData.content.trim() === '') {
        showWarning('Please enter some content for the broadcast.');
        return false;
      }

      // Format media array for API - combine all media types into one array
      const mediaArray = [
        ...broadcastData.media.images,
        ...broadcastData.media.videos,
        ...broadcastData.media.documents,
        ...broadcastData.media.links
      ];

      // Use the correct API method - broadcastMessage
      const response = await adminAPI.broadcastMessage(
        broadcastData.content,
        mediaArray,
        broadcastData.mentions || [],
        broadcastData.tags || []
      );
      
      
      showSuccess('Broadcast message sent successfully to all users!');
      return true;
    } catch (error) {
      console.error('❌ Error sending broadcast:', error);
      showError(`Failed to send broadcast: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadMedia = async (file, type) => {
    try {
    
      
      // Create FormData for admin upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Use admin API for file uploads
      const response = await adminAPI.uploadFile(formData);
     
      
      // Return only the URL string instead of object
      return response.data?.file_url || response.file_url || response.url;
    } catch (error) {
      console.error(`❌ Error uploading ${type}:`, error);
      showError(`Failed to upload ${type}: ${error.message}`);
      return null;
    }
  };

  return {
    loading,
    sendBroadcast,
    uploadMedia
  };
};
