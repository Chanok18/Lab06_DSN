/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#a16207',
          hover: '#8a5308',
          deep: '#713f12',
          bright: '#ca8a04',
          tint: '#fdf9ee',
          border: '#eadfc0'
        },
        ink: '#0c0c0e',
        surface: '#ffffff',
        soft: '#f6f6f7',
        night: '#0b0b0d'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
