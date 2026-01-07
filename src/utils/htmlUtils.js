// Utility functions for handling HTML content from the rich text editor

export const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in a real app, use a library like DOMPurify
  const allowedTags = ['p', 'strong', 'em', 'ul', 'li', 'br', 'span', 'div'];
  const allowedAttributes = ['class', 'data-user-id', 'data-employee_name', 'data-employee_username', 'style'];
  
  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove any script tags or dangerous elements
  const scripts = div.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove any non-allowed tags but preserve mentions
  const allElements = div.querySelectorAll('*');
  allElements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    
    // Allow mention spans
    if (tagName === 'span' && element.classList.contains('mention')) {
      return;
    }
    
    if (!allowedTags.includes(tagName)) {
      // Replace with span to preserve content
      const span = document.createElement('span');
      span.innerHTML = element.innerHTML;
      element.parentNode.replaceChild(span, element);
    } else {
      // Remove non-allowed attributes
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name);
        }
      });
    }
  });

  return div.innerHTML;
};

export const formatTextForDisplay = (content) => {
  if (!content) return '';
  
  // If it's already HTML, sanitize and return
  if (content.includes('<')) {
    return sanitizeHtml(content);
  }
  
  // If it's plain text, convert to HTML
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

export const extractPlainText = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const extractMentionsFromText = (text) => {
  // Extract @mentions from plain text
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      text: match[0], // @username
      username: match[1], // username (could be display name or username)
      employee_username: match[1], // Use the same value for employee_username
      employee_name: match[1]
    });
  }
  
  return mentions;
};

export const processCommentData = (content, mentionsData = []) => {
  // For plain text comments, we'll get mentions from the MentionInput component
  return {
    content: content,
    mentions: mentionsData
  };
};

export const truncateText = (text, maxLength = 200) => {
  const plainText = extractPlainText(text);
  if (plainText.length <= maxLength) return text;
  
  return plainText.substring(0, maxLength) + '...';
};

// Function to highlight mentions in comment text
export const highlightMentions = (text) => {
  if (!text) return '';
  
  // Enhanced regex to match @mentions with full names (including spaces, dots, hyphens)
  // This will match: @Sakshi Jadhav, @John.Doe, @Mary-Jane, etc.
  // Updated to be more precise about word boundaries
  const mentionRegex = /@([a-zA-Z0-9]+(?:[\s\.\-_][a-zA-Z0-9]+)*)/g;
  
  return text.replace(mentionRegex, (match, username) => {
    // Keep @ outside the highlighted span to avoid styling it
    return `@<span class="mention">${username}</span>`;
  });
};
