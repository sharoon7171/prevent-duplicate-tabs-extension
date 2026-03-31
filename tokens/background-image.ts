import { colors } from './colors';

export const backgroundImage = {
  'gradient-bar': `linear-gradient(90deg, ${colors.brand} 0%, ${colors['accent-green']} 50%, ${colors['accent-red']} 100%)`,
} as const;
