import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EAF0F8',
          100: '#C5D5EC',
          200: '#9FBAE0',
          300: '#7A9FD4',
          400: '#5484C8',
          500: '#2F69BC',
          600: '#2C5282',
          700: '#1E3A5F',
          800: '#152A46',
          900: '#0C1A2C',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
