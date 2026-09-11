import React from 'react';

interface PromoteITLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function PromoteITLogo({ className = "w-8 h-8" }: PromoteITLogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
      aria-label="promote-IT Logo"
      role="img"
    >
      <defs>
        <linearGradient id="promotePrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--color-primary))" />
          <stop offset="100%" stopColor="rgb(var(--color-secondary))" />
        </linearGradient>
        <linearGradient id="promoteAccentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(var(--color-accent))" />
          <stop offset="100%" stopColor="rgb(var(--color-primary))" />
        </linearGradient>
      </defs>
      
      {/* Background Soft Glow - adapts to theme via currentColor */}
      <circle cx="50" cy="50" r="44" fill="currentColor" fillOpacity="0.04" />

      {/* Film Camera Aperture / Outer Geometric Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="38" 
        stroke="url(#promotePrimaryGrad)" 
        strokeWidth="5" 
        className="drop-shadow-sm" 
      />
      
      {/* Interlocking Delta Prism Nodes */}
      <polygon 
        points="50,22 74,64 26,64" 
        stroke="url(#promoteAccentGrad)" 
        strokeWidth="4" 
        strokeLinejoin="round" 
        fill="none" 
      />
      <polygon 
        points="50,78 26,36 74,36" 
        stroke="url(#promotePrimaryGrad)" 
        strokeWidth="4" 
        strokeLinejoin="round" 
        fill="none" 
      />
      
      {/* Central High-Tech Lens Core */}
      <circle cx="50" cy="50" r="11" fill="url(#promoteAccentGrad)" />
      <circle cx="50" cy="50" r="5" fill="rgb(var(--color-primary))" />
      
      {/* Kinetic Audio Waves */}
      <path 
        d="M 22 50 Q 36 32 50 50 T 78 50" 
        stroke="url(#promotePrimaryGrad)" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none" 
        opacity="0.8" 
      />
      <path 
        d="M 22 50 Q 36 68 50 50 T 78 50" 
        stroke="url(#promoteAccentGrad)" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none" 
        opacity="0.8" 
      />
    </svg>
  );
}
