import React from 'react';

export default function PageContainer({
  children,
  maxWidth = '7xl', // '5xl' | '6xl' | '7xl' | 'full'
  className = '',
}) {
  const maxWidthMap = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${
        maxWidthMap[maxWidth] || maxWidthMap['7xl']
      } ${className}`}
    >
      {children}
    </div>
  );
}
