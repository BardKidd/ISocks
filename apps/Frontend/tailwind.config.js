// tailwind.config.js
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { 
    extend: {
      colors: {
        // Coffee Shop Theme Colors
        'coffee-dark': '#2d1b0e',
        'coffee-medium': '#4a3429', 
        'coffee-light': '#8b6f47',
        'warm-yellow': '#f4e4bc',
        'muted-orange': '#d4a574',
        'coffee-text': '#c2c0b6',
        'coffee-text-muted': '#9a9690',
      },
    },
  },
  plugins: [],
};
