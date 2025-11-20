// Custom hook for post creation and editing
import { useState } from 'react';

export const usePostCreation = (createPost, editPost, editingPost, onClose) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(editingPost?.content || '');
  const [selectedTags, setSelectedTags] = useState(editingPost?.tags || []);
  const [mentions, setMentions] = useState(editingPost?.mentions || []);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addMention = (employee) => {
    const mention = {
      user_id: employee.employee_id || employee.user_id || employee.id,
      name: employee.name || employee.employee_name,
      email: employee.email
    };

    if (!mentions.some(m => m.user_id === mention.user_id)) {
      setMentions(prev => [...prev, mention]);
    }
  };

  const removeMention = (mentionToRemove) => {
    setMentions(prev => prev.filter(m => m.user_id !== mentionToRemove.user_id));
  };

  // Helper function to extract mentions from HTML content
  const extractMentionsFromContent = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return [];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Look for mention spans with either data-user-id attribute or mention class
    const mentionElements = tempDiv.querySelectorAll('span[data-user-id], span.mention');
    
    // Return array of employee_ids as strings
    const extractedMentions = Array.from(mentionElements).map(element => {
      const employee_id = element.getAttribute('data-user-id') || element.getAttribute('data-employee_id');

      
      // Return just the employee_id as a string
      return employee_id || null;
    }).filter(Boolean); // Remove null entries
    

    return extractedMentions;
  };

  const handleSubmit = async (mediaData) => {
    if (!content.trim() && !mediaData.images.length && !mediaData.videos.length && !mediaData.documents.length) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract mentions from HTML content
      const extractedMentions = extractMentionsFromContent(content);
      
      const postData = {
        content: content.trim(),
        tags: selectedTags,
        images: mediaData.images,
        videos: mediaData.videos,
        documents: mediaData.documents,
        links: mediaData.links,
        mentions: extractedMentions // Use extracted mentions from content
      };

      if (editingPost) {
        await editPost(editingPost.post_id, postData);
      } else {
        await createPost(postData);
      }

      // Reset form
      setContent('');
      setSelectedTags([]);
      setMentions([]);
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    content,
    setContent,
    selectedTags,
    mentions,
    isSubmitting,
    handleTagToggle,
    addMention,
    removeMention,
    handleSubmit
  };
};
