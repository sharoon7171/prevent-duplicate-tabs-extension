import React from 'react';
import type { FooterProps } from '@/types/components';

/**
 * Footer component with developer attribution
 *
 * @param props - Footer component properties
 * @returns React.JSX.Element
 */
export const Footer: React.FC<FooterProps> = ({
  className = '',
}: FooterProps): React.JSX.Element => {
  return (
    <footer
      className={`w-full text-gray-900 border-t border-gray-300 mt-auto relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontSize: '0.85rem',
      }}
    >
      {/* Colorful accent stripe */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, #3182ce 0%, #38a169 50%, #e53e3e 100%)',
          borderRadius: '0 0 12px 12px',
        }}
      />
      <div className="max-w-6xl mx-auto px-3 py-2.5 sm:px-4 flex justify-center">
        <div className="text-gray-900 text-center text-xs sm:text-sm">
          <span className="text-gray-900">
            Developed by{' '}
            <a
              href="https://www.sqtech.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-bold"
              style={{
                color: '#3182ce',
              }}
            >
              SQ Tech
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};
