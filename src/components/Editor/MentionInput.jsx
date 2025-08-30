import React, { useState, useRef, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/api';
import { adminAPI } from '../../services/adminAPI';
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
    
    console.log('🔍 MentionInput handleInput - newValue:', newValue);
    console.log('🔍 MentionInput handleInput - currentMentions before:', currentMentions);
    
    // Sync mentions with text content - remove mentions that are no longer in the text
    const updatedMentions = currentMentions.filter(mention => {
      const mentionText = `@${mention.employee_name}`;
      const isStillInText = newValue.includes(mentionText);
      console.log(`🔍 Checking mention "${mentionText}" - still in text: ${isStillInText}`);
      return isStillInText;
    });
    
    console.log('🔍 MentionInput handleInput - updatedMentions after filter:', updatedMentions);
    
    // Update mentions if any were removed
    if (updatedMentions.length !== currentMentions.length) {
      console.log('🔍 MentionInput - mentions changed, updating...');
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
      
      console.log('🔍 MentionInput - User object:', user);
      console.log('🔍 MentionInput - Extracted employee_id:', employeeId);
      
      if (employeeId) {
        const newMention = {
          employee_id: employeeId,
          employee_name: displayName,
          username: username
        };
        
        console.log('🔍 MentionInput - Created mention object:', newMention);
        
        const updatedMentions = [...currentMentions, newMention];
        setCurrentMentions(updatedMentions);
        onMentionsChange(updatedMentions);
        
        console.log('🔍 MentionInput - Final mentions array:', updatedMentions);
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
    }
  }, [extractMentions]);

  return (
    <div className={`relative ${className}`}>
      {/* Visual overlay for highlighting mentions */}
      <div
        ref={overlayRef}
        className="absolute inset-0 px-3 py-2 pointer-events-none text-sm whitespace-pre-wrap break-words overflow-hidden z-10"
        style={{
          color: 'transparent',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          border: '1px solid transparent', // Match textarea border
          borderRadius: '0.5rem', // Match textarea border radius
        }}
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
      
      {/* Textarea for input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-200 relative z-20 bg-transparent"
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          color: value && highlightedText ? 'transparent' : 'inherit'
        }}
      />
      
      {/* Fallback text when highlighting is active */}
      {value && highlightedText && (
        <div
          className="absolute inset-0 px-3 py-2 pointer-events-none text-sm whitespace-pre-wrap break-words overflow-hidden z-30"
          style={{
            lineHeight: '1.5',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            border: '1px solid transparent',
            borderRadius: '0.5rem',
            color: '#111827' // Default text color
          }}
          dangerouslySetInnerHTML={{ __html: highlightedText }}
        />
      )}
      
      {/* Character count */}
      {maxLength && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">
            {value?.length || 0}/{maxLength} characters • Type @ to mention someone
          </span>
        </div>
      )}

      {/* Mention Dropdown */}
      {showMentions && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: mentionPosition.top,
            left: mentionPosition.left,
            minWidth: '250px'
          }}
        >
          {isLoadingUsers ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span>Loading users...</span>
            </div>
          ) : users.length > 0 ? (
            users.map((user, index) => (
              <button
                key={user.user_id || user.id || user.employee_id}
                onClick={() => insertMention(user)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 border-none bg-transparent"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {(() => {
                      const userName = user.employee_name || user.name || user.employee_name || user.email || 'User';
                      return (typeof userName === 'string' ? userName : 'U')[0].toUpperCase();
                    })()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">@{user.employee_name || user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  {(user.job_title || user.position) && (
                    <div className="text-xs text-blue-600">{user.job_title || user.position}</div>
                  )}
                </div>
              </button>
            ))
          ) : mentionQuery.length > 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {mentionQuery.length > 2 ? 
                'No users found or mention API not available yet' : 
                'Type at least 3 characters to search users'
              }
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              Start typing to search users...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
