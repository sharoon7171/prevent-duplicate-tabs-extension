import React from 'react';

import {
  radioCheckIcon,
  radioIndicator,
  radioOptionButton,
} from '@/ui-classes/control';
import { textControlLabel, textRadioOption } from '@/ui-classes/typography';

interface SelectOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label?: string;
  value: string;
  options: readonly SelectOption[];
  onChange?: (value: string) => void;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  value,
  options,
  onChange,
  className = '',
}: RadioGroupProps): React.JSX.Element => {
  const handleChange = (optionValue: string): void => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  const groupId = `radio-group-${label ? label.toLowerCase().replace(/\s+/g, '-') : 'default'}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className={`mb-0.5 block ${textControlLabel}`}>
          {label}
        </label>
      )}
      <div className="space-y-1" role="radiogroup" aria-labelledby={label ? `${groupId}-label` : undefined}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const optionId = `${groupId}-${option.value}`;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              id={optionId}
              onClick={(): void => handleChange(option.value)}
              className={`${radioOptionButton} ${
                isSelected
                  ? 'border-gray-300 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-1.5">
                <div
                  className={`${radioIndicator} ${
                    isSelected ? 'border-brand bg-brand' : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <svg className={radioCheckIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`flex-1 ${textRadioOption} ${
                    isSelected ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
