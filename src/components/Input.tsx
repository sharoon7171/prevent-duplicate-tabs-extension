import React from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

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
        <label className="mb-1 block text-sm font-extrabold text-gray-900 sm:text-base">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e): void => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 placeholder-gray-500 hover:border-gray-400 focus:border-brand focus:outline-none sm:text-base"
      />
    </div>
  );
};
