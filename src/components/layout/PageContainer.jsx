import React from 'react';

export default function PageContainer({
  children,
  maxWidth = 'fluid', // 'fluid' | 'full' | '7xl' | '6xl' | '5xl'
  className = '',
}) {
  const maxWidthMap = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    fluid: 'max-w-[1760px]',
    full: 'max-w-none',
  };

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 ${
        maxWidthMap[maxWidth] || maxWidthMap.fluid
      } ${className}`}
    >
      {children}
    </div>
  );
}
