/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'spiritual': ['"Noto Serif", "Georgia", serif'],
        'soft-sans': ['"Inter", "Segoe UI", "Roboto", sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'spiritual-gradient': 'linear-gradient(135deg, #F4B400 0%, #FFF9EC 100%)',
        'spiritual-radial': 'radial-gradient(circle at center, #F4B400 0%, #FFF9EC 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite alternate',
        'spiritual-pulse': 'spiritual-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { opacity: '0.7', textShadow: '0 0 5px rgba(130, 46, 46, 0.3)' },
          '100%': { opacity: '0.9', textShadow: '0 0 20px rgba(130, 46, 46, 0.6), 0 0 30px rgba(130, 46, 46, 0.4)' },
        },
        'spiritual-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(244, 180, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(244, 180, 0, 0)' },
        }
      },
      colors: {
        'saffron': {
          50: '#FFFBF0',
          100: '#FFF6E0',
          200: '#FFECC2',
          300: '#FFE1A3',
          400: '#F4B400', // Primary saffron
          500: '#E6A500',
          600: '#CC9400',
          700: '#B38300',
          800: '#997200',
          900: '#806100',
        },
        'cream': {
          50: '#FFFEF9',
          100: '#FFF9EC', // Primary cream
          200: '#FFF4D9',
          300: '#FFEFC6',
          400: '#FFEAB3',
          500: '#FFE5A0',
          600: '#E6CF90',
          700: '#CCB980',
          800: '#B3A370',
          900: '#998D60',
        },
        'maroon': {
          50: '#FDF2F2',
          100: '#FCE4E4',
          200: '#F9C9C9',
          300: '#F5AEAE',
          400: '#F29393',
          500: '#EF7878',
          600: '#E85D5D',
          700: '#E14242',
          800: '#DA2727',
          900: '#822E2E', // Deep maroon
        }
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      letterSpacing: {
        'spiritual': '0.05em',
        'wide-spiritual': '0.1em',
      },
      lineHeight: {
        'spiritual': '1.2',
        'relaxed-spiritual': '1.5',
      }
    },
  },
  plugins: [],
};