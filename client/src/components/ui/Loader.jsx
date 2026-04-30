import React from 'react';

const Loader = ({ 
  fullScreen = false, 
  overlay = false, 
  size = 'md', 
  text = '',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[2.5px]',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-[5px]'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-deep' 
    : overlay 
      ? 'absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg-deep/60 backdrop-blur-sm'
      : `flex flex-col items-center justify-center ${className}`;

  return (
    <div className={containerClasses}>
      <div className={`spinner ${sizeClasses[size] || sizeClasses.md}`} />
      {text && <p className="mt-4 text-text-secondary font-medium animate-pulse">{text}</p>}
    </div>
  );
};

export default Loader;
