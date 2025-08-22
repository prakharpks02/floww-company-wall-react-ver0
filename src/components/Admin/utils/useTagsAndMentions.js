// Custom hooks for tags and mentions handling
import { useState } from 'react';
import { adminAPI } from '../../../services/adminAPI';

export const useTagsAndMentions = (tags, getAllEmployees, showError) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newMention, setNewMention] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [loadingMentions, setLoadingMentions] = useState(false);

  const fetchMentionSuggestions = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setMentionSuggestions([]);
      return;
    }

    setLoadingMentions(true);
    try {
      const response = await adminAPI.getUsersForMentions(searchTerm, 10);
      const users = response.data || response.users || [];
      setMentionSuggestions(users);
    } catch (error) {
      console.error('Error fetching admin mention suggestions:', error);
      setMentionSuggestions([]);
    } finally {
      setLoadingMentions(false);
    }
  };

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

  const handleAddMention = async (selectedUser = null) => {
    let mentionedUser = selectedUser;
    
    // If no user selected, try to find by search term
    if (!mentionedUser && newMention.trim()) {
      try {
        // Get users from API
        const response = await adminAPI.getUsersForMentions(newMention, 10);
        const users = response.data || response.users || [];
        
        mentionedUser = users.find(user => 
          user.name?.toLowerCase().includes(newMention.toLowerCase()) ||
          user.email?.toLowerCase().includes(newMention.toLowerCase()) ||
          user.employee_id?.toLowerCase().includes(newMention.toLowerCase())
        );

        if (!mentionedUser) {
          showError('User not found. Please check the name or email.');
          return;
        }
      } catch (error) {
        console.error('Error searching for user:', error);
        showError('Failed to search for user. Please try again.');
        return;
      }
    }

    if (!mentionedUser) {
      showError('Please select a user to mention.');
      return;
    }

    // Check if user is already mentioned
    if (mentions.some(mention => mention.user_id === mentionedUser.employee_id || mention.user_id === mentionedUser.id)) {
      showError('This user is already mentioned');
      return;
    }

    const newMentionObj = {
      user_id: mentionedUser.employee_id || mentionedUser.id,
      name: mentionedUser.name || mentionedUser.employee_name,
      email: mentionedUser.email
    };

    setMentions(prev => [...prev, newMentionObj]);
    setNewMention('');
    setShowMentions(false);
    setMentionSuggestions([]);
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
    setMentionSuggestions([]);
  };

  return {
    // State
    selectedTags,
    mentions,
    newTag,
    newMention,
    showMentions,
    mentionSuggestions,
    loadingMentions,
    
    // Actions
    handleAddTag,
    handleAddMention,
    removeTag,
    removeMention,
    clearTagsAndMentions,
    fetchMentionSuggestions,
    
    // Setters
    setNewTag,
    setNewMention,
    setShowMentions
  };
};
