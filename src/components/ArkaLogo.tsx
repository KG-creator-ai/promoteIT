import React from 'react';

interface ArkaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'symbol-only' | 'horizontal';
  showLineage?: boolean;
}

export const ArkaLogo: React.FC<ArkaLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  showLineage = true,
}) => {
  const sizeMap = {
    sm: { height: 28, symbolSize: 26, titleSize: 'text-sm', subSize: 'text-[9px]' },
    md: { height: 38, symbolSize: 34, titleSize: 'text-lg', subSize: 'text-[10px]' },
    lg: { height: 50, symbolSize: 44, titleSize: 'text-2xl', subSize: 'text-xs' },
    xl: { height: 68, symbolSize: 60, titleSize: 'text-3xl', subSize: 'text-sm' },
  };

  const { symbolSize, titleSize, subSize } = sizeMap[size];

  // The Arka Emblem: Dual upward dynamic chevrons / sunburst wings
  // Wing 1 in Brand Copper (#C37C5B), Wing 2 in Brand Teal (#19988B)
  const renderSymbol = () => (
    <svg
      width={symbolSize}
      height={symbolSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        {/* Copper Gradient */}
        <linearGradient id="arkaCopperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E1966E" />
          <stop offset="60%" stopColor="#C37C5B" />
          <stop offset="100%" stopColor="#915438" />
        </linearGradient>

        {/* Teal Gradient */}
        <linearGradient id="arkaTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#25C5B5" />
          <stop offset="60%" stopColor="#19988B" />
          <stop offset="100%" stopColor="#0E5851" />
        </linearGradient>

        {/* Dark Teal Accent */}
        <linearGradient id="arkaDarkTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B424B" />
          <stop offset="100%" stopColor="#062A30" />
        </linearGradient>

        <filter id="arkaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C37C5B" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Dark Teal circular base with subtle copper border */}
      <circle cx="50" cy="50" r="46" fill="url(#arkaDarkTealGrad)" stroke="#C37C5B" strokeWidth="2.5" />

      {/* Left Wing / Chevron - Brand Copper (#C37C5B) */}
      <path
        d="M26 68L48 24C49 22 51 22 52 24L58 36L38 68C36 71 31 71 28 68Z"
        fill="url(#arkaCopperGrad)"
        filter="url(#arkaGlow)"
      />

      {/* Right Wing / Chevron - Brand Primary Teal (#19988B) */}
      <path
        d="M48 42L64 70C66 73 72 73 74 69L76 64C77 61 76 58 74 55L56 24C55 22 53 22 52 24L48 42Z"
        fill="url(#arkaTealGrad)"
      />

      {/* Center Rising Core Accent - Pure White / Warm Amber Spark */}
      <circle cx="50" cy="38" r="4.5" fill="#FFFFFF" opacity="0.95" />
      <circle cx="50" cy="38" r="7" stroke="#E1966E" strokeWidth="1.5" opacity="0.75" />
    </svg>
  );

  if (variant === 'symbol-only') {
    return <div className={`inline-flex items-center ${className}`}>{renderSymbol()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {renderSymbol()}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`font-black tracking-[0.14em] text-white ${titleSize} font-sans uppercase drop-shadow-sm`}
          >
            ARKA
          </span>
          <span
            className={`font-bold tracking-[0.18em] text-[#C37C5B] ${titleSize} font-sans uppercase`}
          >
            FINCAP
          </span>
        </div>
        {showLineage && (
          <div className="flex items-center gap-1.5 mt-1 leading-none">
            <span
              className={`font-semibold tracking-[0.15em] text-slate-300 uppercase ${subSize}`}
            >
              A KIRLOSKAR ENTERPRISE
            </span>
            <span className="w-1 h-1 rounded-full bg-[#19988B]" />
            <span className={`font-mono text-[#19988B] font-bold ${subSize}`}>
              AAA
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
