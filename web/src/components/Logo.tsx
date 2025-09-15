import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#00D4FF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#6C5CE7', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="swapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#00D4FF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#6C5CE7', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="16" cy="16" r="15" fill="url(#logoGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      
      {/* Flow "F" letter */}
      <path d="M10 8h8v2h-6v4h5v2h-5v6h-2V8z" fill="white" opacity="0.9"/>
      
      {/* Swap arrows */}
      <g transform="translate(18, 18)">
        {/* Arrow 1 */}
        <path d="M-2 -2 L2 -2 L2 -4 L6 0 L2 4 L2 2 L-2 2 Z" fill="url(#swapGradient)" opacity="0.8"/>
        {/* Arrow 2 */}
        <path d="M2 2 L-2 2 L-2 4 L-6 0 L-2 -4 L-2 -2 L2 -2 Z" fill="url(#swapGradient)" opacity="0.8"/>
      </g>
      
      {/* Decorative dots */}
      <circle cx="8" cy="24" r="1" fill="white" opacity="0.6"/>
      <circle cx="24" cy="8" r="1" fill="white" opacity="0.6"/>
    </svg>
  );
};
