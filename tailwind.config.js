/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { opacity: '0.7', textShadow: '0 0 5px rgba(127, 29, 29, 0.3)' },
          '100%': { opacity: '0.9', textShadow: '0 0 20px rgba(127, 29, 29, 0.6), 0 0 30px rgba(127, 29, 29, 0.4)' },
        }
      },
      colors: {
        'cream': {
          100: '#FFF9F1',
        }
      }
    },
  },
  plugins: [],
};