import { useEffect, useCallback, useState } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const measurePerformance = useCallback((name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (import.meta.env.DEV) {
      console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }, []);

  const measureAsyncPerformance = useCallback(async (name, asyncFn) => {
    const start = performance.now();
    const result = await asyncFn();
    const end = performance.now();
    
    if (import.meta.env.DEV) {
      console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }, []);

  return { measurePerformance, measureAsyncPerformance };
};

// Image lazy loading utility
export const useLazyImage = (src, options = {}) => {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  
  const loadImage = useCallback((imageElement) => {
    if (!imageElement || imageElement.src) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('loading');
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      },
      { threshold, rootMargin }
    );
    
    observer.observe(imageElement);
    
    return () => observer.unobserve(imageElement);
  }, [threshold, rootMargin]);
  
  return loadImage;
};

// Debounce hook for performance optimization
export const useDebounce = (callback, delay) => {
  const debouncedCallback = useCallback(
    (...args) => {
      const timeoutId = setTimeout(() => callback(...args), delay);
      return () => clearTimeout(timeoutId);
    },
    [callback, delay]
  );
  
  return debouncedCallback;
};

// Throttle hook for performance optimization
export const useThrottle = (callback, delay) => {
  let isThrottled = false;
  
  const throttledCallback = useCallback(
    (...args) => {
      if (isThrottled) return;
      
      isThrottled = true;
      callback(...args);
      
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    },
    [callback, delay]
  );
  
  return throttledCallback;
};

// Memory usage monitor (development only)
export const useMemoryMonitor = () => {
  useEffect(() => {
    if (!import.meta.env.DEV || !performance.memory) return;
    
    const interval = setInterval(() => {
      const memory = performance.memory;
      console.log('🧠 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }, 10000); // Log every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
};

// Network status hook for progressive enhancement
export const useNetworkStatus = () => {
  const getNetworkStatus = () => {
    if (!navigator.connection) {
      return { online: navigator.onLine, effectiveType: '4g' };
    }
    
    return {
      online: navigator.onLine,
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  };
  
  const [networkStatus, setNetworkStatus] = useState(getNetworkStatus());
  
  useEffect(() => {
    const updateNetworkStatus = () => setNetworkStatus(getNetworkStatus());
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkStatus);
    }
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);
  
  return networkStatus;
};

// Viewport size hook for responsive design
export const useViewportSize = () => {
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = useThrottle(() => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return viewportSize;
};

// Device type detection
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState('desktop');
  
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    checkDeviceType();
    const handleResize = useThrottle(checkDeviceType, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return deviceType;
};
