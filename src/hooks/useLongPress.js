import { useRef, useCallback } from 'react';

export const useLongPress = (onLongPress, onShortPress, delay = 500) => {
  const timeoutRef = useRef();
  const isLongPress = useRef(false);

  const start = useCallback((event) => {
    event.preventDefault();
    isLongPress.current = false;
    
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress && onLongPress(event);
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((event) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (!isLongPress.current && onShortPress) {
      onShortPress(event);
    }
  }, [onShortPress]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isLongPress.current = false;
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: cancel,
  };
};
