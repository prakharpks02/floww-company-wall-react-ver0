import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  autoClose = false, 
  autoCloseDelay = 5000,
  showIcon = true,
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for fade-out animation
    }
  };

  if (!isVisible) return null;

  const getAlertStyles = () => {
    const baseStyles = "rounded-lg border shadow-sm transition-all duration-300 ease-in-out transform";
    
    switch (type) {
      case 'success':
        return {
          container: `${baseStyles} bg-green-50 border-green-200 text-green-800`,
          icon: 'text-green-600',
          iconComponent: CheckCircle2
        };
      case 'error':
        return {
          container: `${baseStyles} bg-red-50 border-red-200 text-red-800`,
          icon: 'text-red-600',
          iconComponent: XCircle
        };
      case 'warning':
        return {
          container: `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`,
          icon: 'text-yellow-600',
          iconComponent: AlertTriangle
        };
      case 'info':
      default:
        return {
          container: `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`,
          icon: 'text-blue-600',
          iconComponent: Info
        };
    }
  };

  const styles = getAlertStyles();
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={`${styles.container} p-4 ${className} ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        {showIcon && (
          <div className={`flex-shrink-0 ${styles.icon}`}>
            <IconComponent className="h-5 w-5" aria-hidden="true" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold mb-1 leading-5">
              {title}
            </h3>
          )}
          {message && (
            <div className="text-sm leading-5">
              {typeof message === 'string' ? (
                <p>{message}</p>
              ) : (
                message
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
              }`}
              aria-label="Close alert"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast notification component for floating alerts
export const AlertToast = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 4000,
  position = 'top-right',
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for slide-out animation
    }
  };

  if (!isVisible) return null;

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
      default:
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
    }
  };

  const getToastStyles = () => {
    const baseStyles = "rounded-lg shadow-lg border transition-all duration-300 ease-in-out transform max-w-sm w-full";
    
    switch (type) {
      case 'success':
        return {
          container: `${baseStyles} bg-white border-green-200`,
          icon: 'text-green-600',
          iconComponent: CheckCircle
        };
      case 'error':
        return {
          container: `${baseStyles} bg-white border-red-200`,
          icon: 'text-red-600',
          iconComponent: AlertCircle
        };
      case 'warning':
        return {
          container: `${baseStyles} bg-white border-yellow-200`,
          icon: 'text-yellow-600',
          iconComponent: AlertTriangle
        };
      case 'info':
      default:
        return {
          container: `${baseStyles} bg-white border-blue-200`,
          icon: 'text-blue-600',
          iconComponent: Info
        };
    }
  };

  const styles = getToastStyles();
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={`fixed z-50 ${getPositionStyles()} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className={`${styles.container} p-4 ${className}`}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        {...props}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            <IconComponent className="h-5 w-5" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-5">
                {title}
              </h3>
            )}
            {message && (
              <div className="text-sm text-gray-600 leading-5">
                {typeof message === 'string' ? (
                  <p>{message}</p>
                ) : (
                  message
                )}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md p-1.5 transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for easy toast management
export const useAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (alert) => {
    const id = Date.now() + Math.random();
    const newAlert = { ...alert, id };
    setAlerts(prev => [...prev, newAlert]);
    return id;
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const showSuccess = (title, message, options = {}) => {
    return addAlert({ type: 'success', title, message, ...options });
  };

  const showError = (title, message, options = {}) => {
    return addAlert({ type: 'error', title, message, ...options });
  };

  const showWarning = (title, message, options = {}) => {
    return addAlert({ type: 'warning', title, message, ...options });
  };

  const showInfo = (title, message, options = {}) => {
    return addAlert({ type: 'info', title, message, ...options });
  };

  const AlertContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map(alert => (
        <AlertToast
          key={alert.id}
          {...alert}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeAlert,
    AlertContainer
  };
};

export default Alert;
