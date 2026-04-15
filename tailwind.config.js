/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: '#fafafa',
        card: '#ffffff',
        fg: {
          DEFAULT: '#0a0a0a',
          muted: '#525252',
          subtle: '#a3a3a3',
        },
        line: {
          DEFAULT: '#e7e7e7',
          soft: '#f0f0f0',
        },
        accent: {
          DEFAULT: '#2563eb',
          soft: '#dbeafe',
          ultra: '#eff6ff',
        },
      },
    },
  },
  plugins: [],
}
