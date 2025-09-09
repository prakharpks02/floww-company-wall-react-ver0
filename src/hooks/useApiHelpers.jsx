import { useEffect, useRef, useState } from 'react';

// Hook to manage API request cancellation on component unmount
export const useApiCleanup = () => {
  const abortControllersRef = useRef(new Set());

  // Function to create an abort controller and track it
  const createAbortController = () => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    return controller;
  };

  // Function to manually remove a controller when request completes
  const removeController = (controller) => {
    abortControllersRef.current.delete(controller);
  };

  // Cleanup all ongoing requests on unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      });
      abortControllersRef.current.clear();
    };
  }, []);

  return { createAbortController, removeController };
};

// Hook to debounce API calls
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook to throttle function calls
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return (...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  };
};
