import type { Config } from 'tailwindcss';

import { backgroundImage } from './tokens/background-image';
import { colors } from './tokens/colors';
import { boxShadow } from './tokens/shadows';
import { fontFamily, fontWeight } from './tokens/typography';

export default {
  content: ['./public/**/*.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage,
      boxShadow,
      colors,
      fontFamily,
      fontWeight,
    },
  },
  plugins: [],
} satisfies Config;
