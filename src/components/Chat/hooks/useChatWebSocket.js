import { useEffect, useCallback, useRef } from 'react';
import { enhancedChatAPI, chatWebSocket } from '../chatapi';

/**
 * Custom hook for managing WebSocket chat connections
 * @param {string} roomId - The chat room ID to connect to
 * @param {Object} options - Configuration options
 * @returns {Object} WebSocket state and methods
 */
export const useChatWebSocket = (roomId, options = {}) => {
  const {
    onMessage = null,
    onConnection = null,
    onError = null,
    autoConnect = true
  } = options;

  const messageCallbackRef = useRef(onMessage);
  const connectionCallbackRef = useRef(onConnection);
  const errorCallbackRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    messageCallbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    connectionCallbackRef.current = onConnection;
  }, [onConnection]);

  useEffect(() => {
    errorCallbackRef.current = onError;
  }, [onError]);

  // Connect to WebSocket when roomId changes
  useEffect(() => {
    if (!roomId || !autoConnect) {
      return;
    }
    enhancedChatAPI.connectToRoom(roomId);

    return () => {
      enhancedChatAPI.disconnectFromRoom();
    };
  }, [roomId, autoConnect]);

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribeMessage = enhancedChatAPI.onMessage((data) => {
      if (messageCallbackRef.current) {
        messageCallbackRef.current(data);
      } else {
      }
    });

    const unsubscribeConnection = enhancedChatAPI.onConnection((isConnected) => {
      if (connectionCallbackRef.current) {
        connectionCallbackRef.current(isConnected);
      } else {
      }
    });

    const unsubscribeError = enhancedChatAPI.onError((error) => {
      if (errorCallbackRef.current) {
        errorCallbackRef.current(error);
      } else {
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeError();
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((content, senderId, fileUrls = [], replyToMessageId = null) => {
    
    
    try {
      enhancedChatAPI.sendMessage(content, senderId, fileUrls, replyToMessageId);
      return true;
    } catch (error) {
      
      return false;
    }
  }, []);

  // Manual connection control
  const connect = useCallback(() => {
    if (roomId) {
      enhancedChatAPI.connectToRoom(roomId);
    } else {
    }
  }, [roomId]);

  const disconnect = useCallback(() => {
    enhancedChatAPI.disconnectFromRoom();
  }, []);

  // Get current connection status
  const getConnectionStatus = useCallback(() => {
    const status = enhancedChatAPI.getConnectionStatus();
    return status;
  }, []);

  return {
    sendMessage,
    connect,
    disconnect,
    getConnectionStatus,
    isConnected: chatWebSocket.isConnected,
    roomId: chatWebSocket.roomId
  };
};

export default useChatWebSocket;