import React, { useState } from 'react';
import { User, Organization } from '../../types/financial';
import { FabLabLogo } from './FabLabLogo';

export interface OrgLogoProps {
  orgId?: string;
  orgCode?: string;
  orgName?: string;
  user?: User | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'horizontal' | 'badge' | 'full';
  theme?: 'dark' | 'light';
  className?: string;
  showSubtitle?: boolean;
}

// Direct CDN and Google Drive image links provided by user
export const ORG_LOGO_URLS = {
  // 250 Startups: https://drive.google.com/file/d/1n1slkE_koiuhkO6iHeAY-C-e0Ok6WMie/view?usp=sharing
  twoFiftyStartups: 'https://lh3.googleusercontent.com/d/1n1slkE_koiuhkO6iHeAY-C-e0Ok6WMie',
  twoFiftyStartupsFallback: 'https://drive.google.com/uc?export=view&id=1n1slkE_koiuhkO6iHeAY-C-e0Ok6WMie',

  // kLab: https://drive.google.com/file/d/1tBVQ20TumcFVxW3ODoSfBL5vh7BbsLxI/view?usp=sharing
  kLab: 'https://lh3.googleusercontent.com/d/1tBVQ20TumcFVxW3ODoSfBL5vh7BbsLxI',
  kLabFallback: 'https://drive.google.com/uc?export=view&id=1tBVQ20TumcFVxW3ODoSfBL5vh7BbsLxI',
};

export const getOrgMeta = (orgIdOrName?: string, user?: User | null) => {
  const searchKey = (orgIdOrName || user?.organizationId || user?.organizationName || user?.name || '').toLowerCase();

  if (searchKey.includes('250') || searchKey.includes('startup') || searchKey === '250s') {
    return {
      type: '250startups' as const,
      id: 'org-250startups',
      name: '250Startups',
      shortName: '250Startups',
      code: '250S',
      tagline: 'Incubator & Startups Hub',
      primaryColor: '#7C3AED', // Purple
      lightBg: 'bg-purple-50',
      borderCol: 'border-purple-200',
      badgeBg: 'bg-purple-100 text-purple-800',
      imageUrl: ORG_LOGO_URLS.twoFiftyStartups,
      fallbackUrl: ORG_LOGO_URLS.twoFiftyStartupsFallback,
    };
  }

  if (searchKey.includes('klab') || searchKey === 'klb') {
    return {
      type: 'klab' as const,
      id: 'org-klab',
      name: 'kLab',
      shortName: 'kLab',
      code: 'KLB',
      tagline: 'Tech Innovation Space',
      primaryColor: '#0284C7', // Sky Blue
      lightBg: 'bg-sky-50',
      borderCol: 'border-sky-200',
      badgeBg: 'bg-sky-100 text-sky-800',
      imageUrl: ORG_LOGO_URLS.kLab,
      fallbackUrl: ORG_LOGO_URLS.kLabFallback,
    };
  }

  if (searchKey.includes('cafe') || searchKey === 'fbc' || searchKey.includes('fabcafe')) {
    return {
      type: 'fabcafe' as const,
      id: 'org-fabcafe',
      name: 'Fab Cafe',
      shortName: 'Fab Cafe',
      code: 'FBC',
      tagline: 'Collaborative Cafeteria',
      primaryColor: '#D97706', // Amber / Coffee
      lightBg: 'bg-amber-50',
      borderCol: 'border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800',
      imageUrl: null, // Shares FabLab logo as specified
      fallbackUrl: null,
    };
  }

  // Default to FabLab Rwanda / Executive SEMS
  return {
    type: 'fablab' as const,
    id: 'org-fablab',
    name: 'Fablab Rwanda',
    shortName: 'FabLab',
    code: 'FAB',
    tagline: 'Digital Fabrication & Prototyping',
    primaryColor: '#009A44', // Green
    lightBg: 'bg-emerald-50',
    borderCol: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    imageUrl: null, // Authentic FabLab SVG
    fallbackUrl: null,
  };
};

export const OrgLogo: React.FC<OrgLogoProps> = ({
  orgId,
  orgCode,
  orgName,
  user,
  size = 'md',
  variant = 'horizontal',
  theme = 'light',
  className = '',
  showSubtitle = true,
}) => {
  const meta = getOrgMeta(orgId || orgCode || orgName, user);
  const [imageError, setImageError] = useState(false);
  const isDark = theme === 'dark';

  // Size specifications
  const sizeConfig = {
    xs: {
      imgSize: 'w-5 h-5',
      boxSize: 'w-6 h-6',
      title: 'text-[11px] font-bold',
      sub: 'text-[9px]',
      fabLabSize: 'sm' as const,
    },
    sm: {
      imgSize: 'w-7 h-7',
      boxSize: 'w-8 h-8',
      title: 'text-xs font-bold',
      sub: 'text-[10px]',
      fabLabSize: 'sm' as const,
    },
    md: {
      imgSize: 'w-9 h-9',
      boxSize: 'w-10 h-10',
      title: 'text-sm font-bold',
      sub: 'text-[11px]',
      fabLabSize: 'md' as const,
    },
    lg: {
      imgSize: 'w-12 h-12',
      boxSize: 'w-14 h-14',
      title: 'text-base font-extrabold',
      sub: 'text-xs',
      fabLabSize: 'lg' as const,
    },
    xl: {
      imgSize: 'w-16 h-16',
      boxSize: 'w-20 h-20',
      title: 'text-xl font-black',
      sub: 'text-xs',
      fabLabSize: 'xl' as const,
    },
  };

  const { imgSize, boxSize, title: titleClass, sub: subClass, fabLabSize } = sizeConfig[size];

  // 1. FabLab Rwanda or Fab Cafe -> Authentic FabLab Logo SVG (since FabLab and FabCafe share the same logo)
  if (meta.type === 'fablab' || meta.type === 'fabcafe') {
    if (variant === 'icon') {
      return (
        <div className={`inline-flex items-center justify-center ${className}`}>
          <FabLabLogo size={fabLabSize} variant="mark" theme={theme} />
        </div>
      );
    }

    if (variant === 'badge') {
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
            meta.type === 'fabcafe'
              ? isDark
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-900'
              : isDark
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          } ${className}`}
        >
          <FabLabLogo size="sm" variant="mark" theme={theme} />
          <span>{meta.name}</span>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <FabLabLogo size={fabLabSize} variant="mark" theme={theme} />
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className={`${titleClass} tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
              {meta.name}
            </span>
            <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold rounded font-mono ${
              meta.type === 'fabcafe'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {meta.code}
            </span>
          </div>
          {showSubtitle && (
            <span className={`${subClass} font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate leading-tight mt-0.5`}>
              {meta.tagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 2. 250Startups or kLab Logo using Drive High-Res Assets
  const renderEmblem = () => {
    if (!imageError && meta.imageUrl) {
      return (
        <div
          className={`${boxSize} rounded-xl bg-white flex items-center justify-center p-1 border ${
            isDark ? 'border-slate-700 bg-white/95 shadow-md' : 'border-slate-200 bg-white shadow-xs'
          } shrink-0 overflow-hidden`}
        >
          <img
            src={meta.imageUrl}
            alt={`${meta.name} Official Logo`}
            referrerPolicy="no-referrer"
            onError={() => {
              // Try fallback or stylized monogram
              if (meta.fallbackUrl && meta.imageUrl !== meta.fallbackUrl) {
                // Try fallback URL
                const img = new Image();
                img.src = meta.fallbackUrl;
                img.onload = () => setImageError(false);
                img.onerror = () => setImageError(true);
              } else {
                setImageError(true);
              }
            }}
            className={`${imgSize} object-contain rounded-lg`}
          />
        </div>
      );
    }

    // High-Fidelity SVG Monogram Fallback if image network fails
    return (
      <div
        className={`${boxSize} rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-xs border ${
          meta.type === '250startups'
            ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-400/40'
            : 'bg-gradient-to-br from-sky-500 to-blue-700 border-sky-400/40'
        }`}
      >
        <span className={size === 'xs' || size === 'sm' ? 'text-[10px]' : 'text-xs'}>
          {meta.code}
        </span>
      </div>
    );
  };

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderEmblem()}</div>;
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-bold ${
          meta.type === '250startups'
            ? isDark
              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
              : 'bg-purple-50 border-purple-200 text-purple-900'
            : isDark
            ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
            : 'bg-sky-50 border-sky-200 text-sky-900'
        } ${className}`}
      >
        <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white">
          <img
            src={meta.imageUrl || ''}
            alt=""
            referrerPolicy="no-referrer"
            className="w-3.5 h-3.5 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <span>{meta.name}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderEmblem()}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className={`${titleClass} tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
            {meta.name}
          </span>
          <span
            className={`px-1.5 py-0.2 text-[9px] uppercase font-bold rounded font-mono ${
              meta.type === '250startups'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
            }`}
          >
            {meta.code}
          </span>
        </div>
        {showSubtitle && (
          <span className={`${subClass} font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate leading-tight mt-0.5`}>
            {meta.tagline}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Co-Branded Partner Showcase Bar
 * Aligns the 3 distinct logos (FabLab Rwanda / Fab Cafe, kLab, and 250Startups) together with expert craftsmanship.
 */
export const AlignedPartnerLogos: React.FC<{
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'grid';
  className?: string;
  showLabels?: boolean;
}> = ({ theme = 'light', size = 'md', layout = 'horizontal', className = '', showLabels = true }) => {
  const isDark = theme === 'dark';
  const [klabError, setKlabError] = useState(false);
  const [twoFiftyError, setTwoFiftyError] = useState(false);

  return (
    <div
      className={`flex ${
        layout === 'grid' 
          ? 'grid grid-cols-3' 
          : 'flex-wrap items-center justify-center'
      } gap-2.5 sm:gap-4 md:gap-6 ${className}`}
    >
      {/* 1. FabLab Rwanda & Fab Cafe */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 ${
          isDark
            ? 'bg-slate-900/85 border border-slate-700/80 shadow-md hover:border-emerald-500/60 hover:bg-slate-900'
            : 'bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-400'
        }`}
      >
        <FabLabLogo size={size === 'sm' ? 'sm' : 'md'} variant="mark" theme={theme} />
        {showLabels && (
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                Fablab Rwanda
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block leading-tight">
              & Fab Cafe
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      {layout === 'horizontal' && (
        <div className={`hidden sm:block w-px h-7 ${isDark ? 'bg-slate-700/80' : 'bg-slate-200'}`} />
      )}

      {/* 2. kLab */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 ${
          isDark
            ? 'bg-slate-900/85 border border-slate-700/80 shadow-md hover:border-sky-500/60 hover:bg-slate-900'
            : 'bg-white border border-slate-200/90 shadow-2xs hover:border-sky-400'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5 border border-slate-200/90 shrink-0 shadow-2xs overflow-hidden">
          {!klabError ? (
            <img
              src={ORG_LOGO_URLS.kLab}
              alt="kLab Logo"
              referrerPolicy="no-referrer"
              onError={() => setKlabError(true)}
              className="w-7 h-7 object-contain rounded"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-black text-[10px]">
              KLB
            </div>
          )}
        </div>
        {showLabels && (
          <div className="text-left">
            <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} block tracking-tight`}>
              kLab
            </span>
            <span className="text-[10px] text-sky-400 font-bold block leading-tight">
              Innovation Space
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      {layout === 'horizontal' && (
        <div className={`hidden sm:block w-px h-7 ${isDark ? 'bg-slate-700/80' : 'bg-slate-200'}`} />
      )}

      {/* 3. 250Startups */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 ${
          isDark
            ? 'bg-slate-900/85 border border-slate-700/80 shadow-md hover:border-purple-500/60 hover:bg-slate-900'
            : 'bg-white border border-slate-200/90 shadow-2xs hover:border-purple-400'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5 border border-slate-200/90 shrink-0 shadow-2xs overflow-hidden">
          {!twoFiftyError ? (
            <img
              src={ORG_LOGO_URLS.twoFiftyStartups}
              alt="250Startups Logo"
              referrerPolicy="no-referrer"
              onError={() => setTwoFiftyError(true)}
              className="w-7 h-7 object-contain rounded"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-[10px]">
              250S
            </div>
          )}
        </div>
        {showLabels && (
          <div className="text-left">
            <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} block tracking-tight`}>
              250Startups
            </span>
            <span className="text-[10px] text-purple-400 font-bold block leading-tight">
              Incubator Hub
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
