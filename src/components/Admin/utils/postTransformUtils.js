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
    let mediaData = null;
    
    // The actual media data is in the 'link' field as a stringified Python dict
    if (item.link && typeof item.link === 'string') {
      // Store the raw text to remove from content later
      mediaTextPatterns.push(item.link);
      
      try {
        // Handle Python-style stringified dict: {'type': 'image', 'url': '...', 'name': '...'}
        const fixed = item.link.replace(/'/g, '"');
        mediaData = JSON.parse(fixed);
      } catch (e) {
        console.error('Failed to parse media link:', item.link, e);
        return;
      }
    }
    
    if (mediaData && mediaData.type && mediaData.url) {
      const mediaItem = {
        id: Math.random().toString(36),
        url: mediaData.url,
        name: mediaData.name || 'Media file',
        type: mediaData.type
      };
      
      switch (mediaData.type) {
        case 'image':
          mediaItems.images.push(mediaItem);
          break;
        case 'video':
          mediaItems.videos.push(mediaItem);
          break;
        case 'document':
          mediaItems.documents.push({
            ...mediaItem,
            isPDF: mediaData.url.toLowerCase().includes('.pdf')
          });
          break;
        case 'link':
          mediaItems.links.push({
            id: mediaItem.id,
            url: mediaItem.url,
            link: mediaItem.url,
            title: mediaItem.url,
            description: ''
          });
          break;
        default:
          console.log('Unknown media type:', mediaData.type);
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
