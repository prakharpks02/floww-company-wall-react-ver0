import React, { useState, useRef, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/api.jsx';
import { adminAPI } from '../../services/adminAPI.jsx';
import { highlightMentions } from '../../utils/htmlUtils';

const MentionInput = ({ 
  value, 
  onChange, 
  placeholder = "Add a comment...", 
  className = "",
  isAdmin = false,
  rows = 2,
  maxLength = 500,
  disabled = false,
  onMentionsChange = () => {} // New prop to pass mentions back to parent
}) => {
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentMentions, setCurrentMentions] = useState([]);
  const [highlightedText, setHighlightedText] = useState('');

  // Effect to update highlighted text when value changes
  useEffect(() => {
    if (value) {
      const highlighted = highlightMentions(value);
      setHighlightedText(highlighted);
    } else {
      setHighlightedText('');
    }
  }, [value]);

  // Effect to extract mentions from initial value (for editing mode)
  useEffect(() => {
    if (value && currentMentions.length === 0) {
      // Extract @mentions from the text
      const mentionRegex = /@([a-zA-Z0-9\s\.\-_]+?)(?=\s|$|[^\w\s\.\-_])/g;
      const foundMentions = [];
      let match;
      
      while ((match = mentionRegex.exec(value)) !== null) {
        const mentionName = match[1].trim();
        // Create a basic mention object (we don't have employee_id from text, so this is limited)
        foundMentions.push({
          employee_id: '', // We can't determine this from text alone
          employee_name: mentionName,
          username: mentionName
        });
      }
      
      if (foundMentions.length > 0) {
        setCurrentMentions(foundMentions);
        onMentionsChange(foundMentions);
      }
    }
  }, [value]);

  // Debounce function for API calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Fetch users from API
  const fetchUsers = async (query) => {
    if (!query || query.length < 1) {
      setUsers([]);
      return;
    }

    setIsLoadingUsers(true);
    try {
      let responseData;
      
      // Use proper API service based on admin context
      if (isAdmin) {
        responseData = await adminAPI.getUsersForMentions(query, 10);
      } else {
        responseData = await userAPI.getUsersForMentions(query, 10);
      }
      
      // Extract the users array from the response
      const users = responseData.data || responseData.users || responseData || [];
      setUsers(Array.isArray(users) ? users : []);
      
    } catch (error) {
      // Provide fallback empty array when API is not available
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Debounced version of fetchUsers
  const debouncedFetchUsers = debounce(fetchUsers, 300);

  const handleInput = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Update highlighted text
    const highlighted = highlightMentions(newValue);
    setHighlightedText(highlighted);
    
    // Sync scroll position with overlays
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    
    // Sync mentions with text content - remove mentions that are no longer in the text
    const updatedMentions = currentMentions.filter(mention => {
      const mentionText = `@${mention.employee_name}`;
      const isStillInText = newValue.includes(mentionText);

      return isStillInText;
    });
    

    
    // Update mentions if any were removed
    if (updatedMentions.length !== currentMentions.length) {

      setCurrentMentions(updatedMentions);
      onMentionsChange(updatedMentions);
    }
    
    // Handle mentions
    const caretPos = e.target.selectionStart;
    const beforeCaret = newValue.substring(0, caretPos);
    const mentionMatch = beforeCaret.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      
      // Fetch users from API when mention query changes
      debouncedFetchUsers(mentionMatch[1]);
      
      // Calculate dropdown position
      const textarea = textareaRef.current;
      if (textarea) {
        const textBeforeCaret = beforeCaret;
        const lines = textBeforeCaret.split('\n');
        const currentLine = lines.length - 1;
        const currentColumn = lines[lines.length - 1].length;
        
        // Approximate position calculation
        const lineHeight = 20;
        const charWidth = 8;
        
        setMentionPosition({
          top: (currentLine + 1) * lineHeight + 5,
          left: Math.min(currentColumn * charWidth, 200)
        });
      }
    } else {
      setShowMentions(false);
      setMentionQuery('');
      setUsers([]);
    }
  };

  // Handle scroll synchronization
  const handleScroll = (e) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.target.scrollTop;
      overlayRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const insertMention = (user) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const caretPos = textarea.selectionStart;
    const text = value;
    const mentionIndex = text.lastIndexOf('@', caretPos - 1);
    
    if (mentionIndex !== -1) {
      const beforeMention = text.substring(0, mentionIndex);
      const afterMention = text.substring(caretPos);
      const displayName = user.employee_name || user.name || user.username;
      const username = user.employee_username || user.username || user.name;
      
      const newText = beforeMention + `@${displayName} ` + afterMention;
      onChange(newText);
      
      // Update highlighted text
      const highlighted = highlightMentions(newText);
      setHighlightedText(highlighted);
      
      // Update mentions list - store employee_id for backend as clean string
      const employeeId = String(user.employee_id || user.user_id || user.id || '').trim();
      
    
      
      if (employeeId) {
        const newMention = {
          employee_id: employeeId,
          employee_name: displayName,
          username: username
        };
        
   
        
        const updatedMentions = [...currentMentions, newMention];
        setCurrentMentions(updatedMentions);
        onMentionsChange(updatedMentions);
        
      
      }
      
      // Set cursor position after mention
      setTimeout(() => {
        const newCaretPos = mentionIndex + displayName.length + 2; // +2 for @ and space
        textarea.setSelectionRange(newCaretPos, newCaretPos);
        textarea.focus();
      }, 0);
    }
    
    setShowMentions(false);
    setMentionQuery('');
  };

  const handleKeyDown = (e) => {
    // Handle mention navigation
    if (showMentions) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Could implement arrow key navigation here
        return;
      }
      if (e.key === 'Enter' && users.length > 0) {
        e.preventDefault();
        insertMention(users[0]);
        return;
      }
    }
  };

  // Clear mentions when text is cleared
  useEffect(() => {
    if (!value || value.trim() === '') {
      setCurrentMentions([]);
      onMentionsChange([]);
    }
  }, [value]); // Remove onMentionsChange from dependencies to prevent infinite re-renders

  // Extract mentions from the current text
  const extractMentions = useCallback(() => {
    return currentMentions;
  }, [currentMentions]);

  // Expose extractMentions function
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.extractMentions = extractMentions;
      // Force word-break via setAttribute to ensure it's applied
      textareaRef.current.setAttribute('style', 
        textareaRef.current.getAttribute('style') + '; word-break: break-all !important; overflow-wrap: anywhere !important;'
      );
    }
  }, [extractMentions]);

  return (
    <div 
      className={className} 
      style={{ 
        position: 'relative',
        width: '100%', 
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'block'
      }}
    >
      <div style={{ position: 'relative', width: '100%', display: 'block' }}>
        {/* Textarea for input - MUST BE FIRST for proper interaction */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            resize: 'none',
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'white',
            color: '#111827',
            caretColor: '#111827',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            whiteSpace: 'pre-wrap',
            boxSizing: 'border-box',
            overflowX: 'hidden',
            overflowY: 'auto',
            minWidth: 0,
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            display: 'block'
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 0 2px rgba(159, 122, 234, 0.5)';
            e.target.style.borderColor = '#9f7aea';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = '';
            e.target.style.borderColor = '#d1d5db';
          }}
        />
      </div>
      
      {/* Character count */}
      {maxLength && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {value?.length || 0}/{maxLength} characters • Type @ to mention someone
          </span>
        </div>
      )}

      {/* Mention Dropdown */}
      {showMentions && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            maxHeight: '12rem',
            overflowY: 'auto',
            top: mentionPosition.top,
            left: mentionPosition.left,
            minWidth: '250px',
            maxWidth: '400px'
          }}
        >
          {isLoadingUsers ? (
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg style={{ animation: 'spin 1s linear infinite', height: '1rem', width: '1rem' }} viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span>Loading users...</span>
            </div>
          ) : users.length > 0 ? (
            users.map((user, index) => (
              <button
                key={user.user_id || user.id || user.employee_id}
                onClick={() => insertMention(user)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  background: 'linear-gradient(to bottom right, #c084fc, #3b82f6)',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'white' }}>
                    {(() => {
                      const userName = user.employee_name || user.name || user.email || 'User';
                      return (typeof userName === 'string' ? userName : 'U')[0].toUpperCase();
                    })()}
                  </span>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>@{user.employee_name || user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  {(user.job_title || user.position) && (
                    <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{user.job_title || user.position}</div>
                  )}
                </div>
              </button>
            ))
          ) : mentionQuery.length > 0 ? (
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {mentionQuery.length > 2 ? 
                'No users found or mention API not available yet' : 
                'Type at least 3 characters to search users'
              }
            </div>
          ) : (
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Start typing to search users...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
