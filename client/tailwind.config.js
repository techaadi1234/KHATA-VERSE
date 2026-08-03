/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          darkBg: '#0B0F17',
          cardBg: '#161C28',
          cardBorder: '#232D3F',
          neonGreen: '#00F5A0',
          neonCoral: '#FF4757',
          neonCyan: '#00D2FF',
          mutedText: '#8A99AD',
        },
      },
    },
    plugins: [],
  }