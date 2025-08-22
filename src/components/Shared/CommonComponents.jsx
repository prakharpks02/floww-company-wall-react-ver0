// Common loading states and error handling
import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const LoadingSpinner = ({ size = 16, text = 'Loading...' }) => (
  <div className="flex items-center space-x-2">
    <Loader2 className={`w-${size/4} h-${size/4} animate-spin`} />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

export const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-800 underline hover:no-underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  </div>
);

export const SuccessMessage = ({ message }) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="flex items-center space-x-3">
      <CheckCircle className="w-5 h-5 text-green-500" />
      <p className="text-sm text-green-700">{message}</p>
    </div>
  </div>
);

export const InfoMessage = ({ message }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-center space-x-3">
      <Info className="w-5 h-5 text-blue-500" />
      <p className="text-sm text-blue-700">{message}</p>
    </div>
  </div>
);
