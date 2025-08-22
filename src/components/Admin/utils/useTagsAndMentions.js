// Custom hooks for tags and mentions handling
import { useState } from 'react';

export const useTagsAndMentions = (tags, getAllEmployees, showError) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newMention, setNewMention] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim()) {
      const tagToAdd = newTag.trim().toLowerCase();
      
      // Check if tag already exists in selected tags
      if (selectedTags.some(tag => tag.toLowerCase() === tagToAdd)) {
        showError('This tag is already selected');
        return;
      }
      
      // Check if it's a valid tag from the available tags or allow custom tags
      setSelectedTags(prev => [...prev, tagToAdd]);
      setNewTag('');
    }
  };

  const handleAddMention = async () => {
    if (newMention.trim()) {
      try {
        // Get all employees to find the mentioned user
        const employees = await getAllEmployees();
        const mentionedUser = employees.find(emp => 
          emp.name?.toLowerCase().includes(newMention.toLowerCase()) ||
          emp.email?.toLowerCase().includes(newMention.toLowerCase()) ||
          emp.employee_id?.toLowerCase().includes(newMention.toLowerCase())
        );

        if (!mentionedUser) {
          showError('User not found. Please check the name or email.');
          return;
        }

        // Check if user is already mentioned
        if (mentions.some(mention => mention.user_id === mentionedUser.employee_id)) {
          showError('This user is already mentioned');
          return;
        }

        const newMentionObj = {
          user_id: mentionedUser.employee_id,
          name: mentionedUser.name,
          email: mentionedUser.email
        };

        setMentions(prev => [...prev, newMentionObj]);
        setNewMention('');
        setShowMentions(false);
      } catch (error) {
        console.error('Error adding mention:', error);
        showError('Failed to add mention. Please try again.');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const removeMention = (mentionToRemove) => {
    setMentions(prev => prev.filter(mention => mention.user_id !== mentionToRemove.user_id));
  };

  const clearTagsAndMentions = () => {
    setSelectedTags([]);
    setMentions([]);
    setNewTag('');
    setNewMention('');
    setShowMentions(false);
  };

  return {
    // State
    selectedTags,
    mentions,
    newTag,
    newMention,
    showMentions,
    
    // Actions
    handleAddTag,
    handleAddMention,
    removeTag,
    removeMention,
    clearTagsAndMentions,
    
    // Setters
    setNewTag,
    setNewMention,
    setShowMentions
  };
};
