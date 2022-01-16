module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "fly-in": 'fly-in 0.5s',
      },
      keyframes: {
        "fly-in": {
          '0%': {
            opacity: 0,
            transform: "translateY(0.5rem)",
          },
          '100%': {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
      }
    },
  },
  plugins: [],
}
