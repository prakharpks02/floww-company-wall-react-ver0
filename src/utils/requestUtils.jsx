// =============================================================================
// API REQUEST UTILITIES
// =============================================================================

// Debounce function to prevent rapid API calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function to limit API call frequency
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Request deduplication for identical requests
class RequestDeduplicator {
  constructor(cacheDuration = 1000) {
    this.cache = new Map();
    this.cacheDuration = cacheDuration;
  }

  getCacheKey(url, options = {}) {
    return `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || {})}`;
  }

  async request(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    
    // Check if there's a cached request in progress
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
     
        return cached.promise;
      }
    }

    // Create new request
    const requestPromise = fetch(url, options);
    
    // Cache the request promise
    this.cache.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    // Clean up cache after request completes
    requestPromise.finally(() => {
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheDuration);
    });

    return requestPromise;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Request queue to manage API call order
class RequestQueue {
  constructor(maxConcurrent = 3) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject
      });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process(); // Process next item in queue
    }
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();

// Rate limiter for API calls
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return this.requests.length < this.maxRequests;
  }

  makeRequest() {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests.push(Date.now());
    return true;
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Utility to add request logging
export const logRequest = (method, url, data = null) => {

};

// Utility to handle API errors consistently
export const handleApiError = (error, context = '') => {
  // In production, you might want to send errors to a logging service
  if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
    // Only log in debug mode
  }
  
  // Return standardized error format
  return {
    success: false,
    error: error.message || 'An unknown error occurred',
    context
  };
};
