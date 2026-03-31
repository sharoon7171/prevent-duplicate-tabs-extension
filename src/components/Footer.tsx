import React from 'react';

import { CHROME_WEB_STORE_REVIEWS_URL } from '@/constants/chromeWebStore';
import { gradientBarClass } from '@/ui-classes/gradient-bar';
import { NEW_ISSUE_URL } from '@/constants/repo';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'popup';
}

const linkClass =
  'text-brand hover:text-brand-dark transition-colors duration-200 font-semibold';

export const Footer: React.FC<FooterProps> = ({
  className = '',
  variant = 'default',
}: FooterProps): React.JSX.Element => {
  const isPopup = variant === 'popup';

  if (isPopup) {
    return (
      <footer
        className={`w-full shrink-0 border-t border-gray-200 mt-auto bg-slate-100/90 ${className}`}
      >
        <div className="px-3 py-2.5 flex flex-col gap-2 text-xs text-gray-600">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            <a
              href={CHROME_WEB_STORE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Rate extension
            </a>
            <span className="text-gray-300 select-none" aria-hidden="true">
              |
            </span>
            <a
              href={`${NEW_ISSUE_URL}?labels=bug`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Report a Bug
            </a>
            <span className="text-gray-300 select-none" aria-hidden="true">
              |
            </span>
            <a
              href={`${NEW_ISSUE_URL}?labels=enhancement`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Request a Feature
            </a>
          </div>
          <p className="text-center leading-snug">
            Developed by{' '}
            <a
              href="https://www.sqtech.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              SQ Tech
            </a>
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`w-full shrink-0 border-t border-gray-200 mt-auto relative overflow-hidden bg-linear-to-br from-slate-50 to-slate-200 ${className}`}
    >
      <div className={gradientBarClass} />
      <div className="max-w-6xl mx-auto px-3 py-2 sm:px-4 flex flex-col items-center gap-2 text-xs sm:text-sm text-gray-500">
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          <a
            href={CHROME_WEB_STORE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Rate extension
          </a>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <a
            href={`${NEW_ISSUE_URL}?labels=bug`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Report a Bug
          </a>
          <span className="text-gray-300">|</span>
          <a
            href={`${NEW_ISSUE_URL}?labels=enhancement`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Request a Feature
          </a>
        </div>
        <span className="text-center">
          Developed by{' '}
          <a
            href="https://www.sqtech.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            SQ Tech
          </a>
        </span>
      </div>
    </footer>
  );
};
