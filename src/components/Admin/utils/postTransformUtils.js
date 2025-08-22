// Utility functions for transforming post data and handling media
export const transformPostMedia = (post) => {
  if (!post.media || !Array.isArray(post.media)) {
    return {
      ...post,
      images: [],
      videos: [],
      documents: [],
      links: []
    };
  }

  const mediaItems = {
    images: [],
    videos: [],
    documents: [],
    links: []
  };

  // Store raw media text patterns to remove from content
  const mediaTextPatterns = [];

  post.media.forEach(item => {
    let mediaUrl = null;
    
    // Handle both old format (JSON strings) and new format (simple URLs)
    if (item.link && typeof item.link === 'string') {
      // Check if it's a JSON string (old format) or a simple URL (new format)
      if (item.link.startsWith("{'") || item.link.startsWith('{"')) {
        // Old format - JSON string
        mediaTextPatterns.push(item.link);
        try {
          const fixed = item.link.replace(/'/g, '"');
          const mediaData = JSON.parse(fixed);
          mediaUrl = mediaData.url;
        } catch (e) {
          console.error('Failed to parse media link:', item.link, e);
          return;
        }
      } else {
        // New format - simple URL string
        mediaUrl = item.link;
      }
    }
    
    if (mediaUrl) {
      const mediaItem = {
        id: Math.random().toString(36),
        url: mediaUrl,
        name: mediaUrl.split('/').pop() || 'Media file'
      };
      
      // Determine media type by URL extension
      const urlLower = mediaUrl.toLowerCase();
      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        mediaItems.images.push(mediaItem);
      } else if (urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
        mediaItems.videos.push(mediaItem);
      } else if (urlLower.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i)) {
        mediaItems.documents.push({
          ...mediaItem,
          isPDF: urlLower.includes('.pdf')
        });
      } else {
        mediaItems.links.push({
          id: mediaItem.id,
          url: mediaItem.url,
          link: mediaItem.url,
          title: mediaItem.url,
          description: ''
        });
      }
    }
  });

  // Clean post content by removing raw media text
  let cleanedContent = post.content || '';
  
  // First remove exact patterns from mediaTextPatterns array
  mediaTextPatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  });
  
  // More comprehensive regex patterns to catch all media dict variations
  const comprehensiveMediaPatterns = [
    // Basic dict pattern with any content inside
    /\{[^}]*'type'[^}]*'url'[^}]*'name'[^}]*\}/gi,
    /\{[^}]*"type"[^}]*"url"[^}]*"name"[^}]*\}/gi,
    // Pattern that starts with {'type': and ends with }
    /\{'type':\s*'[^']*',\s*'url':\s*'[^']*',\s*'name':\s*'[^']*'\}/gi,
    /\{"type":\s*"[^"]*",\s*"url":\s*"[^"]*",\s*"name":\s*"[^"]*"\}/gi,
    // Catch any dict-like structure with these keys regardless of order
    /\{(?:[^}]*(?:'type'|"type"|'url'|"url"|'name'|"name")[^}]*){3,}\}/gi,
    // Pattern for long URLs in dict format
    /\{[^}]*https?:\/\/[^\s'}]+[^}]*\}/gi,
    // Pattern that might have line breaks
    /\{\s*'type'\s*:\s*'[^']*'\s*,\s*'url'\s*:\s*'[^']*'\s*,\s*'name'\s*:\s*'[^']*'\s*\}/gims,
  ];
  
  comprehensiveMediaPatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });
  
  // Clean up any remaining artifacts
  cleanedContent = cleanedContent
    .replace(/\s*,\s*,\s*/g, '') // Remove double commas
    .replace(/,\s*$/gm, '') // Remove trailing commas at end of lines
    .replace(/^\s*,/gm, '') // Remove leading commas at start of lines
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  return {
    ...post,
    content: cleanedContent,
    ...mediaItems,
    // Preserve any existing broadcast indicators
    is_broadcast: post.is_broadcast,
    isBroadcast: post.isBroadcast,
    type: post.type,
    post_type: post.post_type
  };
};

// Helper to fetch pinned posts
export const fetchPinnedPosts = async (adminAPI) => {
  try {
    console.log('Fetching pinned posts using admin API...');
   
    console.log('Pinned posts response:', response);
    
    if (response?.posts && Array.isArray(response.posts)) {
      return response.posts.map(transformPostMedia);
    }
    return [];
  } catch (e) {
    console.error('Error fetching pinned posts:', e);
    return [];
  }
};

// Helper to filter out broadcast posts
export const filterNonBroadcastPosts = (posts) => {
  return posts.filter(post => {
    // Filter out broadcast posts - check multiple possible properties
    const isBroadcast = post.is_broadcast || 
                       post.isBroadcast || 
                       post.type === 'broadcast' ||
                       post.post_type === 'broadcast' ||
                       // Check if this post was created via broadcast (temporary fix)
                       (post.is_pinned && post.content && post.content.length < 100); // Short pinned posts are likely broadcasts
    
    if (isBroadcast) {
      console.log('🚫 Filtering out broadcast post:', {
        id: post.post_id,
        content: post.content?.substring(0, 50),
        is_pinned: post.is_pinned,
        reason: {
          is_broadcast: post.is_broadcast,
          isBroadcast: post.isBroadcast,
          type: post.type,
          post_type: post.post_type,
          shortPinnedPost: (post.is_pinned && post.content && post.content.length < 100)
        }
      });
    }
    
    return !isBroadcast;
  });
};
