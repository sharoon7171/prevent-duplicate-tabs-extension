import React from 'react';

import { inputField } from '@/ui-classes/control';
import { textControlLabel } from '@/ui-classes/typography';

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
        <label className={`mb-0.5 block ${textControlLabel}`}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e): void => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputField}
      />
    </div>
  );
};
