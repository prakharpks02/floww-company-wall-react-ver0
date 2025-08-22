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
      user_id: employee.employee_id || employee.user_id,
      name: employee.name,
      email: employee.email
    };

    if (!mentions.some(m => m.user_id === mention.user_id)) {
      setMentions(prev => [...prev, mention]);
    }
  };

  const removeMention = (mentionToRemove) => {
    setMentions(prev => prev.filter(m => m.user_id !== mentionToRemove.user_id));
  };

  const handleSubmit = async (mediaData) => {
    if (!content.trim() && !mediaData.images.length && !mediaData.videos.length && !mediaData.documents.length) {
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        content: content.trim(),
        tags: selectedTags,
        images: mediaData.images,
        videos: mediaData.videos,
        documents: mediaData.documents,
        links: mediaData.links,
        mentions: mentions
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
      console.error('Error creating/editing post:', error);
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
