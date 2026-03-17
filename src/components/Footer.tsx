import React from 'react';
import { NEW_ISSUE_URL } from '@/constants/repo';

interface FooterProps {
  className?: string;
}

const linkClass =
  'text-brand hover:text-brand-dark transition-colors duration-200 font-semibold';

export const Footer: React.FC<FooterProps> = ({
  className = '',
}: FooterProps): React.JSX.Element => {
  return (
    <footer
      className={`w-full border-t border-gray-200 mt-auto relative overflow-hidden bg-linear-to-br from-slate-50 to-slate-200 ${className}`}
    >
      <div className="gradient-bar" />
      <div className="max-w-6xl mx-auto px-3 py-2 sm:px-4 flex items-center justify-between text-xs sm:text-sm text-gray-500">
        <span>
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
        <div className="flex items-center gap-2.5">
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
      </div>
    </footer>
  );
};
