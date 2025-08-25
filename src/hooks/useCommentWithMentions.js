import { useState, useCallback } from 'react';

export const useCommentWithMentions = () => {
  const [commentText, setCommentText] = useState('');
  const [mentions, setMentions] = useState([]);

  const handleTextChange = useCallback((text) => {
    setCommentText(text);
  }, []);

  const handleMentionsChange = useCallback((newMentions) => {
    setMentions(newMentions);
  }, []);

  const getCommentData = useCallback(() => {
    return {
      content: commentText,
      mentions: mentions
    };
  }, [commentText, mentions]);

  const clearComment = useCallback(() => {
    setCommentText('');
    setMentions([]);
  }, []);

  return {
    commentText,
    mentions,
    handleTextChange,
    handleMentionsChange,
    getCommentData,
    clearComment
  };
};
