import React from 'react';
import type { ToggleProps } from '@/types/components';

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked = false,
  onChange,
  className = '',
}: ToggleProps): React.JSX.Element => {
  const handleClick = (): void => {
    if (onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <label
        htmlFor={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className="text-sm font-bold text-gray-900 cursor-pointer select-none"
      >
        {label}
      </label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        id={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={handleClick}
        className={`
          relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-all duration-300 ease-in-out focus:outline-none
          shadow-inner
          ${checked ? '' : 'bg-gray-300'}
        `}
        style={checked ? { backgroundColor: '#3182ce' } : undefined}
      >
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0
            transition duration-300 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};
