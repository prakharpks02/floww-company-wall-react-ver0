import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import { postsAPI } from '../../services/api.jsx';
import PostCard from './PostCard';
import Alert from '../UI/Alert';
import { ArrowLeft, Home, Loader } from 'lucide-react';

// ShareFooter component for unauthenticated users
function ShareFooter() {
  const [copied, setCopied] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  const handleCopy = async () => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        // Use fallback for older browsers or non-secure contexts
        fallbackCopyTextToClipboard(window.location.href);
      }
      setCopied(true);
      setShowAlert(true);
      setTimeout(() => {
        setCopied(false);
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      // Try fallback method if clipboard API fails
      fallbackCopyTextToClipboard(window.location.href);
      
      // Still show the alert even if clipboard API fails
      setCopied(true);
      setShowAlert(true);
      setTimeout(() => {
        setCopied(false);
        setShowAlert(false);
      }, 3000);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  return (
    <div className="w-full">
      {showAlert && (
        <div className="mb-4 w-full">
          <Alert
            type="success"
            message="Link copied to clipboard!"
            onClose={() => setShowAlert(false)}
          />
        </div>
      )}
      <button
        onClick={handleCopy}
        className="inline-flex items-center px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#9f7aea' }}
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15V5a2 2 0 0 1 2-2h10"/>
        </svg>
        {copied ? 'Link Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}

// Simple post display component for public view without context dependencies
const PublicPostCard = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Post Header */}
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={post.authorAvatar || post.author_avatar || import.meta.env.VITE_FALLBACK_AVATAR_URL}
          alt={post.authorName || post.author_name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-gray-900">{post.authorName || post.author_name}</h3>
          <p className="text-sm text-gray-500">{post.authorPosition || post.author_position}</p>
          <p className="text-xs text-gray-400">
            {post.created_at ? new Date(post.created_at).toLocaleString() : ''}
          </p>
        </div>
      </div>
      
      {/* Post Content */}
      <div className="prose prose-sm max-w-none mb-4">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
      
      {/* Post Media */}
      {post.images && post.images.length > 0 && (
        <div className="mb-4">
          <div className="grid gap-2">
            {post.images.map((image, idx) => (
              <img
                key={idx}
                src={image.url}
                alt="Post attachment"
                className="rounded-lg max-w-full h-auto"
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs rounded-full"
              style={{ backgroundColor: (tag.color || '#3B82F6') + '20', color: tag.color || '#3B82F6' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
      {/* Public viewing notice */}
      <div className="text-center py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          You're viewing a shared post. Join to interact with more content!
        </p>
      </div>
    </div>
  );
};

// Component for authenticated users with full context
const AuthenticatedSinglePostView = ({ postId }) => {
  // This should only be called when user is authenticated and contexts are available
  let posts = [];
  let user = null;
  
  try {
    const { posts: contextPosts } = usePost();
    const { user: authUser } = useAuth();
    posts = contextPosts || [];
    user = authUser;
  } catch (error) {
    // If contexts are not available, fall back to public view
    return PublicSinglePostView({ postId });
  }

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to find post in local state first
        const localPost = posts.find(p => 
          p.id === postId || 
          p.post_id === postId ||
          String(p.id) === postId || 
          String(p.post_id) === postId
        );
        if (localPost) {
          const normalizedLocalPost = {
            ...localPost,
            authorAvatar: localPost.author?.avatar || localPost.authorAvatar || localPost.author_avatar || 
                         import.meta.env.VITE_FALLBACK_AVATAR_URL,
            authorName: localPost.author?.username || localPost.authorName || localPost.author_name || 'Anonymous',
            authorPosition: localPost.author?.position || 
                           localPost.author?.job_title || 
                           localPost.authorPosition || 
                           localPost.author_position || 
                           'Employee'
          };
          setPost(normalizedLocalPost);
          setLoading(false);
          return;
        }
        
        // Fetch from API if not found locally
        const response = await postsAPI.getPostById(postId);
        
        if (response && response.data) {
          const media = response.data.media || [];
          const images = [];
          const videos = [];
          const documents = [];
          const links = [];
          
          media.forEach((mediaItem, idx) => {
            if (!mediaItem || !mediaItem.link) return;
            const url = mediaItem.link;
            const mediaObj = {
              id: `media-${idx}-${Date.now()}`,
              url: url,
              name: url.split('/').pop() || 'Media file'
            };
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              images.push(mediaObj);
            } else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
              videos.push(mediaObj);
            } else if (url.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i)) {
              documents.push(mediaObj);
            } else {
              links.push(mediaObj);
            }
          });

          const normalizedPost = {
            ...response.data,
            id: response.data.post_id || response.data.id,
            post_id: response.data.post_id || response.data.id,
            content: response.data.post_content || response.data.content || '',
            authorAvatar: response.data.author?.avatar || 
                         response.data.author_avatar || 
                         import.meta.env.VITE_FALLBACK_AVATAR_URL,
            authorName: response.data.author?.username || 
                       response.data.author_name || 
                       response.data.author?.name || 
                       'Anonymous',
            authorPosition: response.data.author?.position || 
                           response.data.author?.job_title || 
                           response.data.author_position || 
                           'Employee',
            images,
            videos,
            documents,
            links,
            tags: response.data.tags || []
          };

          setPost(normalizedPost);
        } else {
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, posts]);

  return { post, loading, error, user };
};

// Component for unauthenticated users without context dependencies
const PublicSinglePostView = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch directly from API for public access
        const response = await postsAPI.getPostById(postId);
        
        if (response && response.data) {
          const media = response.data.media || [];
          const images = [];
          const videos = [];
          const documents = [];
          const links = [];
          
          media.forEach((mediaItem, idx) => {
            if (!mediaItem || !mediaItem.link) return;
            const url = mediaItem.link;
            const mediaObj = {
              id: `media-${idx}-${Date.now()}`,
              url: url,
              name: url.split('/').pop() || 'Media file'
            };
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              images.push(mediaObj);
            } else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
              videos.push(mediaObj);
            } else if (url.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i)) {
              documents.push(mediaObj);
            } else {
              links.push(mediaObj);
            }
          });

          const normalizedPost = {
            ...response.data,
            id: response.data.post_id || response.data.id,
            post_id: response.data.post_id || response.data.id,
            content: response.data.post_content || response.data.content || '',
            authorAvatar: response.data.author?.avatar || 
                         response.data.author_avatar || 
                         import.meta.env.VITE_FALLBACK_AVATAR_URL,
            authorName: response.data.author?.username || 
                       response.data.author_name || 
                       response.data.author?.name || 
                       'Anonymous',
            authorPosition: response.data.author?.position || 
                           response.data.author?.job_title || 
                           response.data.author_position || 
                           'Employee',
            images,
            videos,
            documents,
            links,
            tags: response.data.tags || []
          };

          setPost(normalizedPost);
        } else {
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  return { post, loading, error, user: null };
};

const SinglePostView = () => {
  const { postId } = useParams();
  
  // Try to get user from AuthContext if available, otherwise assume public access
  let user = null;
  let posts = [];
  let isAuthContextAvailable = false;
  
  try {
    const authContext = useAuth();
    user = authContext?.user;
    isAuthContextAvailable = true;
  } catch (error) {
    // AuthContext not available - public access
    user = null;
    isAuthContextAvailable = false;
  }

  // Try to get posts from PostContext if user is authenticated
  try {
    if (user && isAuthContextAvailable) {
      const postContext = usePost();
      posts = postContext?.posts || [];
    }
  } catch (error) {
    // PostContext not available
    posts = [];
  }

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For authenticated users, try to find post in local state first
        if (user && posts.length > 0) {
          const localPost = posts.find(p => 
            p.id === postId || 
            p.post_id === postId ||
            String(p.id) === postId || 
            String(p.post_id) === postId
          );
          if (localPost) {
            const normalizedLocalPost = {
              ...localPost,
              authorAvatar: localPost.author?.avatar || localPost.authorAvatar || localPost.author_avatar || 
                           import.meta.env.VITE_FALLBACK_AVATAR_URL,
              authorName: localPost.author?.username || localPost.authorName || localPost.author_name || 'Anonymous',
              authorPosition: localPost.author?.position || 
                             localPost.author?.job_title || 
                             localPost.authorPosition || 
                             localPost.author_position || 
                             'Employee'
            };
            setPost(normalizedLocalPost);
            setLoading(false);
            return;
          }
        }
        
        // Fetch from API for both authenticated and unauthenticated users
        const response = await postsAPI.getPostById(postId);
       
        if (response && response.status === "success" && response.data) {
        
          const media = response.data.media || [];
          const images = [];
          const videos = [];
          const documents = [];
          const links = [];
          
          media.forEach((mediaItem, idx) => {
            if (!mediaItem || !mediaItem.link) return;
            
            // Handle case where link is a stringified object
            let url = mediaItem.link;
            if (typeof url === 'string' && url.startsWith("{'link':")) {
              try {
                // Extract URL from stringified object format: "{'link': 'actual_url'}"
                const match = url.match(/'link':\s*'([^']+)'/);
                if (match && match[1]) {
                  url = match[1];
                }
              } catch (error) {
                console.error('Error parsing media link:', error);
                return; // Skip this media item if we can't parse it
              }
            }
            
            if (!url || typeof url !== 'string') return;
            
            const mediaObj = {
              id: `media-${idx}-${Date.now()}`,
              url: url,
              name: url.split('/').pop() || 'Media file'
            };
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              images.push(mediaObj);
            } else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
              videos.push(mediaObj);
            } else if (url.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i)) {
              documents.push(mediaObj);
            } else {
              links.push(mediaObj);
            }
          });

          const normalizedPost = {
            ...response.data,
            id: response.data.post_id,
            post_id: response.data.post_id,
            content: response.data.content || '',
            created_at: response.data.created_at,
            authorAvatar: response.data.author?.profile_picture_link || 
                         import.meta.env.VITE_FALLBACK_AVATAR_URL,
            authorName: response.data.author?.employee_name || 'Anonymous',
            authorPosition: response.data.author?.job_title || 'Employee',
            author_name: response.data.author?.employee_name || 'Anonymous',
            author_avatar: response.data.author?.profile_picture_link || 
                          import.meta.env.VITE_FALLBACK_AVATAR_URL,
            author_position: response.data.author?.job_title || 'Employee',
            images,
            videos,
            documents,
            links,
            tags: response.data.tags || [],
            mentions: response.data.mentions || [],
            comments: response.data.comments || [],
            reactions: response.data.reaction_counts || {},
            is_comments_allowed: response.data.is_comments_allowed,
            is_broadcast: response.data.is_broadcast
          };

        
          setPost(normalizedPost);
        } else {
    
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]); // Remove posts from dependencies to prevent multiple API calls

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-purple-600 mr-3" />
              <span className="text-gray-600">Loading post...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state or post not found
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              {user ? (
                <Link
                  to="/employee/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Feed</span>
                </Link>
              ) : (
                <button
                  onClick={() => window.location.href = import.meta.env.VITE_APP_BASE_URL}
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Go to Floww</span>
                </button>
              )}
            </div>
          </div>

          {/* Post Not Found */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The post you're looking for doesn't exist or may have been deleted."}
            </p>
            {user ? (
              <Link
                to="/employee/dashboard"
                className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#9f7aea' }}
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            ) : (
              <button
                onClick={() => window.location.href = import.meta.env.VITE_APP_BASE_URL}
                className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#9f7aea' }}
              >
                <Home className="h-4 w-4 mr-2" />
                Visit Floww
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state - show the post
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {user ? (
              <Link
                to="/employee/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Feed</span>
              </Link>
            ) : null}
            <div className="text-sm text-gray-500">
              {user ? 'Shared Post' : 'Public Post'}
            </div>
            {user ? (
              <Link
                to="/employee/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Post Card */}
        {user ? (
          <PostCard post={post} isPublicView={false} />
        ) : (
          <PublicPostCard post={post} />
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            {user ? 'Want to see more posts like this?' : 'Share this post with others!'}
          </p>
          {user ? (
            <Link
              to="/employee/dashboard"
              className="inline-flex items-center px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#9f7aea' }}
            >
              <Home className="h-4 w-4 mr-2" />
              View More Posts
            </Link>
          ) : (
            <ShareFooter />
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper component that conditionally provides context
const SinglePostViewWrapper = () => {
  // Check if we're within AuthProvider context
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (error) {
    // If useAuth throws (outside AuthProvider), user remains null
    user = null;
  }
  
  if (user) {
    // For authenticated users, render within existing PostProvider context
    return <SinglePostView />;
  }
  
  // For unauthenticated users, render without PostContext dependency
  return <SinglePostView />;
};

export default SinglePostViewWrapper;