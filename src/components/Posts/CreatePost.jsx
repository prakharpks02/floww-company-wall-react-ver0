import React from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import RichTextEditor from '../Editor/RichTextEditor';
import ImageCropModal from '../Media/ImageCropModal';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePostCreation } from './utils/usePostCreation';
import { usePostMediaHandling } from './utils/usePostMediaHandling';
import { useMentionsHandling } from './utils/useMentionsHandling';
import TagsSection from './CreatePostComponents/TagsSection';
import MentionsSection from './CreatePostComponents/MentionsSection';
import MediaUploadSection from './CreatePostComponents/MediaUploadSection';
import ImprovedMediaPreviews from './CreatePostComponents/ImprovedMediaPreviews';

const CreatePost = ({ onClose, editingPost = null }) => {
  const { createPost, editPost, tags } = usePost();
  const { getAllEmployees } = useAuth();

  // Custom hooks
  const postCreation = usePostCreation(createPost, editPost, editingPost, onClose);
  const mediaHandling = usePostMediaHandling();
  const mentionsHandling = useMentionsHandling();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mediaData = {
      images: mediaHandling.images,
      videos: mediaHandling.videos,
      documents: mediaHandling.documents,
      links: mediaHandling.links
    };
    console.log('Submitting post with media data:', mediaData);
    await postCreation.handleSubmit(mediaData);
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-friendly"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's on your mind?
              </label>
              <RichTextEditor
                value={postCreation.content}
                onChange={postCreation.setContent}
                placeholder="Share your thoughts..."
                className="min-h-[120px] sm:min-h-[150px]"
              />
            </div>

            {/* Tags */}
            <TagsSection
              tags={tags}
              selectedTags={postCreation.selectedTags}
              onTagToggle={postCreation.handleTagToggle}
            />

            {/* Mentions - handled in text editor only */}
            {/* <MentionsSection
              mentions={postCreation.mentions}
              showMentions={mentionsHandling.showMentions}
              onShowMentions={mentionsHandling.setShowMentions}
              onAddMention={postCreation.addMention}
              onRemoveMention={postCreation.removeMention}
              filterEmployees={mentionsHandling.filterEmployees}
              mentionSuggestions={mentionsHandling.mentionSuggestions}
              loadingMentions={mentionsHandling.loadingMentions}
              onFetchMentionSuggestions={mentionsHandling.fetchMentionSuggestions}
            /> */}

            {/* Media Upload */}
            <MediaUploadSection
              fileInputRef={mediaHandling.fileInputRef}
              videoInputRef={mediaHandling.videoInputRef}
              documentInputRef={mediaHandling.documentInputRef}
              linkUrl={mediaHandling.linkUrl}
              showLinkInput={mediaHandling.showLinkInput}
              onImageUpload={mediaHandling.handleImageUpload}
              onVideoUpload={mediaHandling.handleVideoUpload}
              onDocumentUpload={mediaHandling.handleDocumentUpload}
              onAddLink={mediaHandling.addLink}
              setLinkUrl={mediaHandling.setLinkUrl}
              setShowLinkInput={mediaHandling.setShowLinkInput}
            />

            {/* Media Previews */}
            <ImprovedMediaPreviews
              images={mediaHandling.images}
              videos={mediaHandling.videos}
              documents={mediaHandling.documents}
              links={mediaHandling.links}
              onRemoveImage={mediaHandling.removeImage}
              onRemoveVideo={mediaHandling.removeVideo}
              onRemoveDocument={mediaHandling.removeDocument}
              onRemoveLink={mediaHandling.removeLink}
            />
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-friendly"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={postCreation.isSubmitting || (!postCreation.content.trim() && mediaHandling.images.length === 0 && mediaHandling.videos.length === 0 && mediaHandling.documents.length === 0)}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-friendly"
              >
                {postCreation.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{editingPost ? 'Updating...' : 'Posting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden xs:inline">{editingPost ? 'Update Post' : 'Create Post'}</span>
                    <span className="xs:hidden">{editingPost ? 'Update' : 'Post'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Image Crop Modal */}
        {mediaHandling.showCropModal && mediaHandling.imageToProcess && (
          <ImageCropModal
            isOpen={mediaHandling.showCropModal}
            onCancel={() => mediaHandling.setShowCropModal(false)}
            imageFile={mediaHandling.imageToProcess}
            onSave={(croppedBlob) => 
              mediaHandling.handleCropComplete(croppedBlob, mediaHandling.imageToProcess)
            }
          />
        )}
      </div>
    </div>
  );
};

export default CreatePost;
