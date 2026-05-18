import React from 'react';

import {
  buttonDashed,
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  buttonText,
} from '@/ui-classes/control';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dashed';
type ButtonColor = 'brand' | 'danger' | 'success' | 'muted';

interface ButtonProps {
  variant?: ButtonVariant;
  color?: ButtonColor;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: buttonPrimary,
  secondary: buttonSecondary,
  ghost: buttonGhost,
  dashed: buttonDashed,
};

const ghostColorClasses: Record<ButtonColor, string> = {
  brand: 'text-brand hover:text-brand-dark hover:bg-blue-50',
  danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
  success: 'text-green-600 hover:text-green-700 hover:bg-green-50',
  muted: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  color = 'brand',
  children,
  onClick,
  className = '',
  title,
  type = 'button',
}: ButtonProps): React.JSX.Element => {
  const base = variantClasses[variant];
  const colorClass = variant === 'ghost' ? ghostColorClasses[color] : '';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${buttonText} ${base} ${colorClass} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
};
