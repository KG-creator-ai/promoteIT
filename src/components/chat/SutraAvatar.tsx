import React from 'react';

interface SutraAvatarProps {
  className?: string;
  size?: number;
}

export function SutraAvatar({ className = "w-6 h-6", size = 24 }: SutraAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="S.U.T.R.A. Bot Avatar"
      role="img"
    >
      <defs>
        <linearGradient id="sutraPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--color-primary))" />
          <stop offset="100%" stopColor="rgb(var(--color-secondary))" />
        </linearGradient>
        <linearGradient id="sutraAccentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(var(--color-accent))" />
          <stop offset="100%" stopColor="rgb(var(--color-primary))" />
        </linearGradient>
        <radialGradient id="sutraCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity="0.9" />
          <stop offset="60%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Obsidian Geometric Bot Head Base */}
      <polygon
        points="50,6 88,26 88,74 50,94 12,74 12,26"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="url(#sutraPrimaryGrad)"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Inner Glowing Aperture Ring */}
      <circle
        cx="50"
        cy="50"
        r="28"
        stroke="url(#sutraAccentGrad)"
        strokeWidth="3.5"
        strokeDasharray="6 3"
        className="animate-[spin_12s_linear_infinite]"
      />

      {/* Glowing Neural Core */}
      <circle
        cx="50"
        cy="50"
        r="16"
        fill="url(#sutraCoreGlow)"
      />

      {/* Kinetic Neural Node Waves */}
      <path
        d="M 28 50 Q 39 36 50 50 T 72 50"
        stroke="url(#sutraAccentGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 28 50 Q 39 64 50 50 T 72 50"
        stroke="url(#sutraPrimaryGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Neural Antennas & Optical Sensor Nodes */}
      <circle cx="50" cy="18" r="3.5" fill="rgb(var(--color-accent))" />
      <circle cx="80" cy="50" r="3" fill="rgb(var(--color-secondary))" />
      <circle cx="20" cy="50" r="3" fill="rgb(var(--color-secondary))" />
      <circle cx="50" cy="82" r="3.5" fill="rgb(var(--color-primary))" />
    </svg>
  );
}
