import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'جاري التحميل...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`loading-spinner ${sizeClasses[size]} mb-4`}></div>
      {text && <p className="text-themed-text-sec text-sm font-medium animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;