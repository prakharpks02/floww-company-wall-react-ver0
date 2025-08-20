import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext_token';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize with sample notifications
  useEffect(() => {
    if (user) {
      const sampleNotifications = [
        {
          id: '1',
          type: 'like',
          title: 'New Like',
          message: 'Michael Chen liked your post about HR Community Wall',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/dashboard'
        },
        {
          id: '2',
          type: 'comment',
          title: 'New Comment',
          message: 'Emily Rodriguez commented on your post',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/dashboard'
        },
        {
          id: '3',
          type: 'mention',
          title: 'You were mentioned',
          message: 'David Kumar mentioned you in a post about training materials',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/dashboard'
        },
        {
          id: '4',
          type: 'announcement',
          title: 'New Announcement',
          message: 'HR Policy updates have been posted',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b5b34b7d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/dashboard'
        },
        {
          id: '5',
          type: 'achievement',
          title: 'Recognition',
          message: 'You received recognition in the monthly achievements post',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/dashboard'
        }
      ];

      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter(n => !n.read).length);
    }
  }, [user]);

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '💖';
      case 'comment': return '💬';
      case 'mention': return '👤';
      case 'announcement': return '📢';
      case 'achievement': return '🏆';
      default: return '🔔';
    }
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
