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
    console.log('🎣 Hook: WebSocket connection effect triggered', { roomId, autoConnect });
    
    if (!roomId || !autoConnect) {
      console.log('🎣 Hook: Skipping WebSocket connection', { roomId, autoConnect });
      return;
    }

    console.log('🎣 Hook: Connecting to WebSocket for room:', roomId);
    enhancedChatAPI.connectToRoom(roomId);

    return () => {
      console.log('🎣 Hook: Cleanup - Disconnecting from WebSocket for room:', roomId);
      enhancedChatAPI.disconnectFromRoom();
    };
  }, [roomId, autoConnect]);

  // Subscribe to WebSocket events
  useEffect(() => {
    console.log('🎣 Hook: Setting up WebSocket event subscriptions');
    
    const unsubscribeMessage = enhancedChatAPI.onMessage((data) => {
      console.log('🎣 Hook: Message received via subscription:', data);
      if (messageCallbackRef.current) {
        console.log('🎣 Hook: Calling message callback');
        messageCallbackRef.current(data);
      } else {
        console.log('🎣 Hook: No message callback registered');
      }
    });

    const unsubscribeConnection = enhancedChatAPI.onConnection((isConnected) => {
      console.log('🎣 Hook: Connection status changed:', isConnected);
      if (connectionCallbackRef.current) {
        console.log('🎣 Hook: Calling connection callback');
        connectionCallbackRef.current(isConnected);
      } else {
        console.log('🎣 Hook: No connection callback registered');
      }
    });

    const unsubscribeError = enhancedChatAPI.onError((error) => {
      console.log('🎣 Hook: Error received via subscription:', error);
      if (errorCallbackRef.current) {
        console.log('🎣 Hook: Calling error callback');
        errorCallbackRef.current(error);
      } else {
        console.log('🎣 Hook: No error callback registered');
      }
    });

    return () => {
      console.log('🎣 Hook: Cleaning up WebSocket event subscriptions');
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeError();
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((content, senderId, fileUrls = [], replyToMessageId = null) => {
    console.log('🎣 useChatWebSocket sendMessage hook called');
    console.log('🔍 Hook parameters:', { content, senderId, fileUrls, replyToMessageId });
    
    try {
      enhancedChatAPI.sendMessage(content, senderId, fileUrls, replyToMessageId);
      console.log('✅ Hook: Message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Hook: Failed to send message:', error);
      console.error('🔍 Hook error details:', {
        message: error.message,
        stack: error.stack,
        parameters: { content, senderId, fileUrls, replyToMessageId }
      });
      return false;
    }
  }, []);

  // Manual connection control
  const connect = useCallback(() => {
    console.log('🎣 Hook: Manual connect called for room:', roomId);
    if (roomId) {
      enhancedChatAPI.connectToRoom(roomId);
    } else {
      console.warn('🎣 Hook: Cannot connect - no room ID provided');
    }
  }, [roomId]);

  const disconnect = useCallback(() => {
    console.log('🎣 Hook: Manual disconnect called');
    enhancedChatAPI.disconnectFromRoom();
  }, []);

  // Get current connection status
  const getConnectionStatus = useCallback(() => {
    const status = enhancedChatAPI.getConnectionStatus();
    console.log('🎣 Hook: getConnectionStatus called, returning:', status);
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