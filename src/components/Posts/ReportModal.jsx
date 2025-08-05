import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { postsAPI } from '../../services/api';

const ReportModal = ({ isOpen, onClose, postId, commentId, type = 'post' }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Spam or inappropriate content',
    'Harassment or bullying',
    'False information',
    'Hate speech',
    'Violence or dangerous content',
    'Adult content',
    'Copyright violation',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      alert('Please select a reason for reporting');
      return;
    }

    const finalReason = reason === 'Other' ? customReason : reason;
    
    if (reason === 'Other' && !customReason.trim()) {
      alert('Please provide a custom reason');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (type === 'post') {
        await postsAPI.reportPost(postId, finalReason);
      } else if (type === 'comment') {
        await postsAPI.reportComment(commentId, finalReason);
      }
      
      alert(`${type === 'post' ? 'Post' : 'Comment'} reported successfully. Thank you for helping keep our community safe.`);
      onClose();
      setReason('');
      setCustomReason('');
    } catch (error) {
      console.error('Report error:', error);
      alert(error.message || `Failed to report ${type}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Report {type === 'post' ? 'Post' : 'Comment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-gray-600">
                Help us understand what's wrong with this {type}.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a reason for reporting:
            </label>
            <div className="space-y-2">
              {predefinedReasons.map((reasonOption) => (
                <label key={reasonOption} className="flex items-center">
                  <input
                    type="radio"
                    name="reason"
                    value={reasonOption}
                    checked={reason === reasonOption}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{reasonOption}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {reason === 'Other' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {customReason.length}/500 characters
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> False reports may result in action against your account. 
              Please only report content that violates our community guidelines.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Reporting...</span>
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
