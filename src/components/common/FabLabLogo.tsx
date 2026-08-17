import React from 'react';

export interface FabLabLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'horizontal';
  theme?: 'dark' | 'light';
  subtitle?: string;
  className?: string;
}

export const FabLabLogo: React.FC<FabLabLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'dark',
  subtitle = 'Financial Management System',
  className = '',
}) => {
  // Dimension definitions
  const sizeMap = {
    sm: { icon: 28, title: 'text-xs', sub: 'text-[9px]' },
    md: { icon: 38, title: 'text-sm font-bold', sub: 'text-[10px]' },
    lg: { icon: 52, title: 'text-lg font-extrabold', sub: 'text-xs' },
    xl: { icon: 68, title: 'text-2xl font-black', sub: 'text-sm' },
  };

  const { icon: iconSize, title: titleClass, sub: subClass } = sizeMap[size];
  const isLight = theme === 'light';

  // Authentic FabLab Mark SVG (Tri-color nodes: Red, Green, Blue connected by technical circuit/gear track)
  const renderIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
      aria-label="FabLab Rwanda Logo Mark"
    >
      {/* Background soft circular glow */}
      <circle cx="50" cy="50" r="48" fill={isLight ? '#FFFFFF' : '#0B192C'} fillOpacity={isLight ? 0.95 : 0.4} />

      {/* Connecting Technical Circuit Lines */}
      <path
        d="M32 34 L68 34"
        stroke={isLight ? '#0B192C' : '#94A3B8'}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M32 34 L50 68"
        stroke={isLight ? '#0B192C' : '#94A3B8'}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M68 34 L50 68"
        stroke={isLight ? '#0B192C' : '#94A3B8'}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Inner Central Micro-Hub */}
      <circle
        cx="50"
        cy="45"
        r="7"
        fill={isLight ? '#0B192C' : '#FFFFFF'}
      />

      {/* Top Left: FabLab Red Node */}
      <circle
        cx="32"
        cy="34"
        r="14"
        fill="#E31B23"
        stroke={isLight ? '#FFFFFF' : '#0B192C'}
        strokeWidth="2.5"
      />
      <circle cx="32" cy="34" r="5" fill="#FFFFFF" />

      {/* Top Right: FabLab Green Node */}
      <circle
        cx="68"
        cy="34"
        r="14"
        fill="#009A44"
        stroke={isLight ? '#FFFFFF' : '#0B192C'}
        strokeWidth="2.5"
      />
      <circle cx="68" cy="34" r="5" fill="#FFFFFF" />

      {/* Bottom Center: FabLab Blue Node */}
      <circle
        cx="50"
        cy="68"
        r="14"
        fill="#0F4C81"
        stroke={isLight ? '#FFFFFF' : '#0B192C'}
        strokeWidth="2.5"
      />
      <circle cx="50" cy="68" r="5" fill="#FFFFFF" />
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {renderIcon()}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-tight flex-wrap">
          <span
            className={`${titleClass} tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            fablab_{' '}
            <span className="text-[#009A44]">Finance_Management System</span>
          </span>
          {size !== 'sm' && (
            <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-[#0F4C81]/15 text-[#0F4C81] border border-[#0F4C81]/30 font-mono">
              FMS
            </span>
          )}
        </div>
        {subtitle && subtitle !== 'fablab_ Finance_Management System' && (
          <span
            className={`${subClass} font-medium tracking-normal ${
              isLight ? 'text-slate-500' : 'text-slate-300'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
