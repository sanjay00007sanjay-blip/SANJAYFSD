/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        industrial: {
          darkest: '#090a0f',
          darker: '#0f111a',
          card: '#161926',
          border: '#262b3d',
          accent: '#06b6d4',
          metal: '#1e2333',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
