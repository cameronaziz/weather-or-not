module.exports = {
  theme: {
    extend: {
      animation: {
        'bounce-in':
          'bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.27) both',
        wave: 'wave 2s ease-in-out infinite',
        'wave-once': 'wave 1s ease-in-out',
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(15deg)' },
          '50%': { transform: 'rotate(-10deg)' },
          '75%': { transform: 'rotate(15deg)' },
        },
      },
    },
  },
  plugins: [],
};
