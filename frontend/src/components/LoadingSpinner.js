import React from 'react';
import { clsx } from 'clsx';

const LoadingSpinner = ({ size = 'medium', className = '', fullScreen = false }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const spinner = (
    <div className={clsx(
      'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
      sizeClasses[size],
      className
    )}>
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;