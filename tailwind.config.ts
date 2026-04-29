import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Studio Ideação — paleta laranja
        orange: {
          50:  '#FFF4ED',
          100: '#FFE4D1',
          200: '#FFC9A3',
          300: '#FFAD75',
          400: '#FF8E47',
          500: '#FF6B00',
          600: '#E05F00',
          700: '#B84E00',
          800: '#8F3D00',
          900: '#662C00',
        },
        // Cinzas neutros do sistema (light + dark)
        ink: {
          DEFAULT: '#0F172A',  // texto primário
          muted:   '#64748B',  // texto secundário
        },
        surface: {
          DEFAULT: '#FFFFFF',  // cards (light)
          dark:    '#1E293B',  // cards (dark)
        },
        sidebar: {
          DEFAULT: '#1C2333',
          hover:   '#262E42',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        'orange-glow':    '0 4px 14px rgba(255, 107, 0, 0.25)',
        'orange-glow-lg': '0 10px 25px rgba(255, 107, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
export default config
