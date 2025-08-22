// Custom hook for mentions handling
import { useState } from 'react';
import { userAPI } from '../../../services/api';

export const useMentionsHandling = () => {
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
      const response = await userAPI.getUsersForMentions(searchTerm, 10);
      const users = response.data || response.users || [];
      setMentionSuggestions(users);
    } catch (error) {
      console.error('Error fetching mention suggestions:', error);
      setMentionSuggestions([]);
    } finally {
      setLoadingMentions(false);
    }
  };

  const filterEmployees = (searchTerm) => {
    // This method is kept for backward compatibility
    // but now it triggers the API call instead
    fetchMentionSuggestions(searchTerm);
    return mentionSuggestions;
  };

  return {
    showMentions,
    setShowMentions,
    filterEmployees,
    mentionSuggestions,
    loadingMentions,
    fetchMentionSuggestions
  };
};
