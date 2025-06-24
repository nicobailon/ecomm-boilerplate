import React from 'react';
import { sanitizeText } from './placeholder-images-utils';

interface PlaceholderImageProps {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  width = 400,
  height = 400,
  text = 'Product',
  className = '',
}) => {
  const safeText = sanitizeText(text);
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <rect width={width} height={height} fill="#f3f4f6" />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fill="#6b7280"
        fontFamily="system-ui"
        fontSize="20"
      >
        {safeText}
      </text>
    </svg>
  );
};

