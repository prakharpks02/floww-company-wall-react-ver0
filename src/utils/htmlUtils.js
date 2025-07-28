// Utility functions for handling HTML content from the rich text editor

export const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in a real app, use a library like DOMPurify
  const allowedTags = ['p', 'strong', 'em', 'ul', 'li', 'br'];
  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove any script tags or dangerous elements
  const scripts = div.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove any non-allowed tags
  const allElements = div.querySelectorAll('*');
  allElements.forEach(element => {
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      // Replace with span to preserve content
      const span = document.createElement('span');
      span.innerHTML = element.innerHTML;
      element.parentNode.replaceChild(span, element);
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

export const truncateText = (text, maxLength = 200) => {
  const plainText = extractPlainText(text);
  if (plainText.length <= maxLength) return text;
  
  return plainText.substring(0, maxLength) + '...';
};
