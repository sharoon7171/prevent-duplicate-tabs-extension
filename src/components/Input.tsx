import React from 'react';
import type { InputProps } from '@/types/components';

/**
 * Professional reusable input component
 *
 * @param props - Input component properties
 * @returns React.JSX.Element
 */
export const Input: React.FC<InputProps> = ({
  label,
  placeholder = '',
  value,
  onChange,
  className = '',
  type = 'text',
  onKeyDown,
}: InputProps): React.JSX.Element => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-gray-900 mb-1.5">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e): void => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 text-sm font-medium text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
      />
    </div>
  );
};
