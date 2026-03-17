import React from 'react';
import type { RadioGroupProps } from '@/types/components';

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
        <label className="block text-sm font-bold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="space-y-1.5" role="radiogroup" aria-labelledby={label ? `${groupId}-label` : undefined}>
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
              className={`
                w-full text-left p-2.5 rounded-lg border transition-all duration-300
                focus:outline-none
                ${
                  isSelected
                    ? 'border-gray-300 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-lg'
                }
              `}
              style={
                isSelected
                  ? {
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }
                  : {
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }
              }
            >
              <div className="flex items-start gap-2">
                <div
                  className={`
                  shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200
                  ${
                    isSelected
                      ? 'border-gray-300 bg-white'
                      : 'border-gray-300 bg-white'
                  }
                `}
                  style={
                    isSelected
                      ? {
                          borderColor: '#3182ce',
                          backgroundColor: '#3182ce',
                        }
                      : undefined
                  }
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`
                  text-sm font-medium flex-1
                  ${isSelected ? 'text-gray-900' : 'text-gray-700'}
                `}
                  style={
                    isSelected
                      ? {
                          color: '#111827',
                          fontWeight: 600,
                        }
                      : {
                          color: '#374151',
                          fontWeight: 500,
                        }
                  }
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
