import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#050509', 900: '#08080F', 850: '#0A0B14', 800: '#0E0F1A', 700: '#151725', 600: '#1D2030' },
        pink: { DEFAULT: '#FF008F', 400: '#FF3DAA', 500: '#FF008F', 600: '#E0007C', 700: '#B80066', 900: '#4A0029' },
        mist: { 100: '#F5F5F8', 300: '#C9CAD6', 400: '#A2A3B4', 500: '#7C7E92' },
      },
      fontFamily: {
        display: ['Rajdhani', 'Arial Narrow', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,0,143,.28), 0 12px 50px -12px rgba(255,0,143,.45)',
        card: '0 20px 60px -30px rgba(0,0,0,.9)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(22px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        'pulse-glow': { '0%,100%': { opacity: '.45' }, '50%': { opacity: '.85' } },
        'scan': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        'marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'spin-slow': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fade-in .8s ease both',
        'float': 'float 7s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 5s ease-in-out infinite',
        'scan': 'scan 9s linear infinite',
        'marquee': 'marquee 28s linear infinite',
        'spin-slow': 'spin-slow 32s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
