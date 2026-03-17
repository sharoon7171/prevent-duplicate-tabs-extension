import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  stats?: { currentTabsCount: number; tabsClosedCount: number };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  stats,
  className = '',
}: HeaderProps): React.JSX.Element => {
  const getIconSrc = (): string => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL('icon-48.png');
    }
    return '/icon-48.png';
  };

  const defaultIcon = (
    <img
      src={getIconSrc()}
      alt="Extension Icon"
      className="w-10 h-10 rounded-lg shadow-md border-2 border-white/20"
    />
  );

  const displayIcon = icon ?? defaultIcon;

  return (
    <header
      className={`w-full text-white shadow-header relative overflow-hidden transition-all duration-300 hover:shadow-xl bg-linear-to-br from-brand to-brand-dark ${className}`}
    >
      <div className="gradient-bar rounded-t-2xl" />
      <div className="max-w-6xl mx-auto px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 text-white">
              {displayIcon}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs font-semibold text-blue-100 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {stats != null && (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded" title="Active tabs">
                  {stats.currentTabsCount.toLocaleString()} tabs
                </span>
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded" title="Duplicates prevented">
                  {stats.tabsClosedCount.toLocaleString()} prevented
                </span>
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
