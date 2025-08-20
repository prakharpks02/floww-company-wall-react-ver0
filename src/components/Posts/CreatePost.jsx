import React, { useState, useRef } from 'react';
import RichTextEditor from '../Editor/RichTextEditor';
import PDFPreview from '../Media/PDFPreview';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext_token';
import { mediaAPI } from '../../services/api';
import {
  X,
  Image,
  Video,
  FileText,
  Link,
  Hash,
  AtSign,
  Send,
  Loader2
} from 'lucide-react';

const CreatePost = ({ onClose, editingPost = null }) => {
  const { createPost, editPost, tags } = usePost();
  const { user, getAllEmployees } = useAuth();
  const [content, setContent] = useState(editingPost?.content || '');
  const [selectedTags, setSelectedTags] = useState(editingPost?.tags || []);
  const [images, setImages] = useState(editingPost?.images || []);
  const [videos, setVideos] = useState(editingPost?.videos || []);
  const [documents, setDocuments] = useState(editingPost?.documents || []);
  const [links, setLinks] = useState(editingPost?.links || []);
  const [mentions, setMentions] = useState(editingPost?.mentions || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const allEmployees = getAllEmployees();

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Show loading state for this file
        const tempId = Date.now() + Math.random();
        const tempImage = {
          id: tempId,
          url: '',
          name: file.name,
          size: file.size,
          isUploading: true
        };
        setImages(prev => [...prev, tempImage]);

        // Upload to backend
        const uploadResult = await mediaAPI.uploadFile(file, 'image');
        
        // Update with actual URL from backend
        setImages(prev => prev.map(img => 
          img.id === tempId 
            ? { ...img, url: uploadResult.url, isUploading: false }
            : img
        ));
        
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Remove failed upload
        setImages(prev => prev.filter(img => img.id !== tempId));
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Show loading state for this file
        const tempId = Date.now() + Math.random();
        const tempVideo = {
          id: tempId,
          url: '',
          name: file.name,
          size: file.size,
          isUploading: true
        };
        setVideos(prev => [...prev, tempVideo]);

        // Upload to backend
        const uploadResult = await mediaAPI.uploadFile(file, 'video');
        
        // Update with actual URL from backend
        setVideos(prev => prev.map(vid => 
          vid.id === tempId 
            ? { ...vid, url: uploadResult.url, isUploading: false }
            : vid
        ));
        
      } catch (error) {
        console.error('Failed to upload video:', error);
        // Remove failed upload
        setVideos(prev => prev.filter(vid => vid.id !== tempId));
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Show loading state for this file
        const tempId = Date.now() + Math.random();
        const tempDoc = {
          id: tempId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: '',
          isPDF: file.type === 'application/pdf',
          isUploading: true
        };
        setDocuments(prev => [...prev, tempDoc]);

        // Upload to backend
        const uploadResult = await mediaAPI.uploadFile(file, 'document');
        
        // Update with actual URL from backend
        setDocuments(prev => prev.map(doc => 
          doc.id === tempId 
            ? { ...doc, url: uploadResult.url, isUploading: false }
            : doc
        ));
        
      } catch (error) {
        console.error('Failed to upload document:', error);
        // Remove failed upload
        setDocuments(prev => prev.filter(doc => doc.id !== tempId));
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      setLinks(prev => [...prev, {
        id: Date.now(),
        url: linkUrl,
        title: linkUrl,
        description: 'External link'
      }]);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const handleMentionUser = (employee) => {
    setMentions(prev => [...prev, employee]);
    setShowMentions(false);
  };

  // Extract mentions from editor HTML content
  const extractMentionsFromContent = (html) => {
    const mentionsArr = [];
    if (!html) return mentionsArr;
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // Find all span elements with class 'mention'
    const mentionSpans = doc.querySelectorAll('span.mention');
    mentionSpans.forEach(span => {
      const userId = span.getAttribute('data-user-id');
      const username = span.textContent.replace(/^@/, '');
      if (userId && username) {
        mentionsArr.push({ user_id: userId, username });
      }
    });
    return mentionsArr;
  };

  const removeItem = (type, id) => {
    switch (type) {
      case 'image':
        setImages(prev => prev.filter(item => item.id !== id));
        break;
      case 'video':
        setVideos(prev => prev.filter(item => item.id !== id));
        break;
      case 'document':
        setDocuments(prev => prev.filter(item => item.id !== id));
        break;
      case 'link':
        setLinks(prev => prev.filter(item => item.id !== id));
        break;
      case 'mention':
        setMentions(prev => prev.filter(item => item.id !== id));
        break;
    }
  };

  const handleSubmit = async () => {
    // Check if content has meaningful text (strip HTML tags for validation)
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      alert('Please enter some content for your post.');
      return;
    }

    // Check if any uploads are still in progress
    const hasUploadingFiles = images.some(img => img.isUploading) || 
                             videos.some(vid => vid.isUploading) || 
                             documents.some(doc => doc.isUploading);
    
    if (hasUploadingFiles) {
      alert('Please wait for all files to finish uploading before posting.');
      return;
    }

    // Extract mentions from content before submitting
    const extractedMentions = extractMentionsFromContent(content);

    setIsSubmitting(true);
    try {
      const postData = {
        content,
        tags: selectedTags,
        images: images.filter(img => img.url), // Only include successfully uploaded images
        videos: videos.filter(vid => vid.url), // Only include successfully uploaded videos
        documents: documents.filter(doc => doc.url), // Only include successfully uploaded documents
        links,
        mentions: extractedMentions
      };

      if (editingPost) {
        const updateData = {
          ...postData,
          post_id: editingPost.post_id || editingPost.id
        };
        await editPost(editingPost.post_id || editingPost.id, updateData);
      } else {
        await createPost(postData);
      }

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user is blocked
  if (user?.is_blocked === true || user?.is_blocked === "true") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Your account has been temporarily restricted from creating posts. 
              Please contact an administrator for more information.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.position}</p>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="mb-6">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="What's on your mind? Share with the HR team..."
              className="bg-white"
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'text-white border' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedTags.includes(tag) ? '#9f7aea' : undefined,
                    borderColor: selectedTags.includes(tag) ? '#9f7aea' : undefined
                  }}
                >
                  <Hash className="inline h-3 w-3 mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Media Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attachments
            </label>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Image className="h-4 w-4" />
                <span>Add Images</span>
              </button>
              
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Video className="h-4 w-4" />
                <span>Add Video</span>
              </button>
              
              <button
                onClick={() => documentInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Add Document</span>
              </button>
              
              <button
                onClick={() => setShowLinkInput(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Link className="h-4 w-4" />
                <span>Add Link</span>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <input
              ref={documentInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={handleDocumentUpload}
              className="hidden"
            />

            {/* Link Input */}
            {showLinkInput && (
              <div className="flex space-x-2 mb-4">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Enter URL..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2"
                  style={{ 
                    '--tw-ring-color': '#9f7aea',
                    'borderColor': 'var(--focus-border, #d1d5db)'
                  }}
                  onFocus={(e) => e.target.style.setProperty('--focus-border', '#9f7aea')}
                  onBlur={(e) => e.target.style.setProperty('--focus-border', '#d1d5db')}
                />
                <button
                  onClick={handleAddLink}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                  style={{ backgroundColor: '#9f7aea' }}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowLinkInput(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Mentions Dropdown */}
            {showMentions && (
              <div className="mb-4 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {allEmployees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => handleMentionUser(employee)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 text-left"
                  >
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.position}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Preview Attachments */}
            <div className="space-y-4">
              {/* Images */}
              {images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {images.map(image => (
                      <div key={image.id} className="relative group">
                        {image.isUploading ? (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                              <p className="text-xs text-gray-500">Uploading...</p>
                            </div>
                          </div>
                        ) : image.url ? (
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-red-100 rounded-lg flex items-center justify-center">
                            <p className="text-xs text-red-600">Upload failed</p>
                          </div>
                        )}
                        {!image.isUploading && (
                          <button
                            onClick={() => removeItem('image', image.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Videos</h4>
                  <div className="space-y-2">
                    {videos.map(video => (
                      <div key={video.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {video.isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                          ) : (
                            <Video className="h-5 w-5 text-purple-600" />
                          )}
                          <div>
                            <span className="text-sm font-medium">{video.name}</span>
                            {video.isUploading && (
                              <p className="text-xs text-gray-500">Uploading...</p>
                            )}
                          </div>
                        </div>
                        {!video.isUploading && (
                          <button
                            onClick={() => removeItem('video', video.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                  <div className="space-y-4">
                    {documents.map(doc => (
                      <div key={doc.id} className="relative">
                        {doc.isUploading ? (
                          // Upload in progress
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                              <div>
                                <span className="text-sm font-medium">{doc.name}</span>
                                <p className="text-xs text-gray-500">Uploading...</p>
                              </div>
                            </div>
                          </div>
                        ) : doc.isPDF && doc.url ? (
                          // PDF Preview
                          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div className="flex items-center justify-between p-3 bg-red-50 border-b border-gray-200">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">PDF</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                                  <p className="text-xs text-gray-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem('document', doc.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="h-64">
                              <PDFPreview url={doc.url} />
                            </div>
                          </div>
                        ) : (
                          // Regular Document or upload failed
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-green-600" />
                              <div>
                                <span className="text-sm font-medium">{doc.name}</span>
                                <p className="text-xs text-gray-500">
                                  {doc.url ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Upload failed'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem('document', doc.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {links.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Links</h4>
                  <div className="space-y-2">
                    {links.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Link className="h-5 w-5 text-orange-600" />
                          <span className="text-sm font-medium">{link.url}</span>
                        </div>
                        <button
                          onClick={() => removeItem('link', link.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentions */}
              {mentions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Mentions</h4>
                  <div className="flex flex-wrap gap-2">
                    {mentions.map(mention => (
                      <div key={mention.id} className="flex items-center space-x-2 bg-pink-50 px-3 py-1 rounded-full">
                        <AtSign className="h-4 w-4 text-pink-600" />
                        <span className="text-sm font-medium text-pink-800">{mention.name}</span>
                        <button
                          onClick={() => removeItem('mention', mention.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {content.replace(/<[^>]*>/g, '').trim() ? `${content.replace(/<[^>]*>/g, '').length} characters` : 'Start typing...'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.replace(/<[^>]*>/g, '').trim() || isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#9f7aea' }}
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Posting...' : editingPost ? 'Update Post' : 'Post'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
