import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, Underline, AlignLeft, AlignCenter, AlignRight,PaintBucket  } from 'lucide-react';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "What's on your mind?", 
  className = "" 
}) => {
  const editorRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [fontSize, setFontSize] = useState('14');
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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
      const url = `http://127.0.0.1:8000/api/wall/get_user_for_mentions?query=${encodeURIComponent(query)}&limit=10`;
      console.log('Fetching users from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response data:', responseData);
        
        // Extract the users array from the data property
        const users = responseData.data || [];
        setUsers(users);
      } else {
        console.error('Failed to fetch users for mentions, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users for mentions:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Debounced version of fetchUsers
  const debouncedFetchUsers = debounce(fetchUsers, 300);

  // Set initial content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // Handle mentions
      const text = e.target.innerText;
      const caretPos = getCaretPosition();
      const beforeCaret = text.substring(0, caretPos);
      const mentionMatch = beforeCaret.match(/@(\w*)$/);
      
      if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setShowMentions(true);
        
        // Fetch users from API when mention query changes
        debouncedFetchUsers(mentionMatch[1]);
        
        // Get caret position for dropdown
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();
          
          setMentionPosition({
            top: rect.bottom - editorRect.top + 5,
            left: rect.left - editorRect.left
          });
        }
      } else {
        setShowMentions(false);
        setMentionQuery('');
        setUsers([]);
      }
    }
  };

  const getCaretPosition = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const insertMention = (user) => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const text = textNode.textContent;
    const mentionIndex = text.lastIndexOf('@', range.startOffset - 1);
    
    if (mentionIndex !== -1) {
      // Remove the @ and partial text
      const beforeMention = text.substring(0, mentionIndex);
      const afterMention = text.substring(range.startOffset);
      
      // Create mention element
      const mentionSpan = document.createElement('span');
      mentionSpan.className = 'mention bg-purple-100 text-purple-800 px-1 rounded';
      mentionSpan.setAttribute('data-user-id', user.user_id || user.id);
      mentionSpan.setAttribute('contenteditable', 'false');
      mentionSpan.textContent = `@${user.username}`;
      
      // Replace text
      textNode.textContent = beforeMention;
      textNode.parentNode.insertBefore(mentionSpan, textNode.nextSibling);
      textNode.parentNode.insertBefore(document.createTextNode(' ' + afterMention), mentionSpan.nextSibling);
      
      // Move cursor after mention
      const newRange = document.createRange();
      newRange.setStartAfter(mentionSpan);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    setShowMentions(false);
    setMentionQuery('');
    handleInput({ target: editorRef.current });
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput({ target: editorRef.current });
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
        // Handle mention selection (simplified for now)
        return;
      }
      if (e.key === 'Enter' && users.length > 0) {
        e.preventDefault();
        insertMention(users[0]);
        return;
      }
    }

    // Handle Enter key to create new paragraphs
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand('insertHTML', '<br><br>');
    }
  };

  const isCommandActive = (command) => {
    return document.queryCommandState(command);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    executeCommand('fontSize', '3'); // Use size 3 and override with CSS
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        try {
          range.surroundContents(span);
        } catch (e) {
          // If can't surround, insert HTML
          executeCommand('insertHTML', `<span style="font-size: ${size}px">${range.toString()}</span>`);
        }
      }
    }
  };

  const handleFontFamilyChange = (family) => {
    setFontFamily(family);
    executeCommand('fontName', family);
  };

  return (
<div className={`border border-gray-300 rounded-lg overflow-hidden relative  ${className}`}>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b  border-gray-200 p-2 flex items-center space-x-1 flex-wrap">
        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="text-xs cursor-pointer border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value="system-ui" >System</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier</option>
        </select>

        {/* Font Size */}
      <select
  value={fontSize}
  onChange={(e) => handleFontSizeChange(e.target.value)}
  className="text-xs border cursor-pointer border-gray-300 rounded px-2 py-1 bg-white w-32"
>
  <option value="16">Normal</option>
  <option value="12">Sub Heading</option>
  <option value="24">Heading 1</option>
  <option value="20">Heading 2</option>
</select>


        <div className="border-l border-gray-300 h-6 mx-1"></div>

        {/* Formatting Buttons */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className={`p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors ${
            isCommandActive('bold') ? 'bg-gray-200 text-purple-600' : 'text-gray-600'
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className={`p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors ${
            isCommandActive('italic') ? 'bg-gray-200 text-purple-600' : 'text-gray-600'
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className={`p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors ${
            isCommandActive('underline') ? 'bg-gray-200 text-purple-600' : 'text-gray-600'
          }`}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="border-l border-gray-300 h-6 mx-1"></div>

        {/* Alignment Buttons */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors text-gray-600"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors text-gray-600"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors text-gray-600"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="border-l border-gray-300 h-6 mx-1"></div>

        {/* List Button */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className={`p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors ${
            isCommandActive('insertUnorderedList') ? 'bg-gray-200 text-purple-600' : 'text-gray-600'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        {/* Color Picker */}
       <label
    htmlFor="text-color-picker"
    className="relative group inline-flex items-center cursor-pointer justify-center w-8 h-8 border border-gray-300 rounded hover:border-gray-500 transition-colors bg-white shadow-sm"
    title="Text Color"
  >
    <PaintBucket className="w-4 h-4 text-gray-600 group-hover:text-black " />
    <input
      type="color"
      id="text-color-picker"
      onChange={(e) => executeCommand('foreColor', e.target.value)}
      className="absolute inset-0 opacity-0 cursor-pointer"
    />
  </label>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        onKeyDown={handleKeyDown}
        className={`min-h-[150px] p-4 focus:outline-none ${
          isActive ? 'ring-2' : ''
        }`}
        style={{
          minHeight: '150px',
          maxHeight: '300px',
          overflowY: 'auto',
          lineHeight: '1.5',
          color: '#111827',
          '--tw-ring-color': '#9f7aea',
          'borderColor': isActive ? '#9f7aea' : '#d1d5db'
        }}
        data-placeholder={placeholder}
      />

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
                key={user.user_id || user.id}
                onClick={() => insertMention(user)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 border-none bg-transparent"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {(() => {
                      const userName = user.username || user.email || 'User';
                      return (typeof userName === 'string' ? userName : 'U')[0].toUpperCase();
                    })()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">@{user.username}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
            ))
          ) : mentionQuery.length > 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No users found for "{mentionQuery}"
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              Start typing to search users...
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
        Type @ to mention someone • Use the toolbar for formatting
      </div>
    </div>
  );
};

export default RichTextEditor;
