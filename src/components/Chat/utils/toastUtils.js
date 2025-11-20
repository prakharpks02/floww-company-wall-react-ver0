import toast from 'react-hot-toast';

// Toast utility functions for consistent messaging across chat components
export const chatToast = {
  // Success messages
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
      ...options,
    });
  },

  // Error messages
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
      ...options,
    });
  },

  // Info/Loading messages
  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6d28d9',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      ...options,
    });
  },

  // Promise-based toast for async operations
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Processing...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        position: 'top-right',
        style: {
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
        },
        ...options,
      }
    );
  },

  // Custom toast with custom styling
  custom: (message, options = {}) => {
    return toast(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#fff',
        color: '#1f2937',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      ...options,
    });
  },

  // Dismiss a specific toast or all toasts
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  // Chat-specific toast messages
  messageSent: () => {
    return chatToast.success('Message sent successfully');
  },

  messageDeleted: () => {
    return chatToast.success('Message deleted');
  },

  messageEdited: () => {
    return chatToast.success('Message updated');
  },

  groupCreated: (groupName) => {
    return chatToast.success(`Group "${groupName}" created successfully`);
  },

  groupUpdated: () => {
    return chatToast.success('Group updated successfully');
  },

  memberAdded: (memberName) => {
    return chatToast.success(`${memberName} added to group`);
  },

  memberRemoved: (memberName) => {
    return chatToast.success(`${memberName} removed from group`);
  },

  leftGroup: () => {
    return chatToast.success('You left the group');
  },

  messagePinned: () => {
    return chatToast.success('Message pinned');
  },

  messageUnpinned: () => {
    return chatToast.success('Message unpinned');
  },

  conversationMarkedFavorite: () => {
    return chatToast.success('Added to favorites');
  },

  conversationUnmarkedFavorite: () => {
    return chatToast.success('Removed from favorites');
  },

  conversationPinned: () => {
    return chatToast.success('Conversation pinned');
  },

  conversationUnpinned: () => {
    return chatToast.success('Conversation unpinned');
  },

  // Error messages
  sendMessageFailed: () => {
    return chatToast.error('Failed to send message');
  },

  deleteMessageFailed: () => {
    return chatToast.error('Failed to delete message');
  },

  connectionError: () => {
    return chatToast.error('Connection error. Please try again.');
  },

  networkError: () => {
    return chatToast.error('Network error. Check your connection.');
  },

  permissionDenied: () => {
    return chatToast.error('Permission denied');
  },
};

export default chatToast;
