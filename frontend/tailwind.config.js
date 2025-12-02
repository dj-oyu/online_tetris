/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/app/**/*.{js,ts,jsx,tsx}',
      './src/components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          tetris: {
            bg: '#1A1A2E',
            grid: '#16213E',
            border: '#0F3460',
            piece: {
              i: '#00f0f0',
              j: '#0000f0',
              l: '#f0a000',
              o: '#f0f000',
              s: '#00f000',
              t: '#a000f0',
              z: '#f00000',
              ghost: '#4D4D4D',
              penalty: '#808080'
            }
          }
        }
      },
    },
    plugins: [],
  }
