module.exports = {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
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
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      margin: {
        'safe': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.touch-manipulation': {
          'touch-action': 'manipulation'
        },
        '.pt-safe': {
          'padding-top': 'env(safe-area-inset-top)'
        },
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom)'
        },
        '.mb-safe': {
          'margin-bottom': 'env(safe-area-inset-bottom)'
        }
      }
      addUtilities(newUtilities)
    }
  ],
};
