// noinspection PointlessArithmeticExpressionJS
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        widescreen: { raw: "(max-height: 75vw)" },
      },
      minHeight: {
        "1l": `${1 * 1.5}em`,
        "2l": `${2 * 1.5}em`,
        "3l": `${3 * 1.5}em`,
        "4l": `${4 * 1.5}em`,
        "5l": `${5 * 1.5}em`,
        "6l": `${6 * 1.5}em`,
      },
      animation: {
        "fly-in": "fly-in 0.5s",
        "fly-1": "fly-in 0.5s 0.1s backwards",
        "fly-2": "fly-in 0.5s 0.2s backwards",
        "fly-3": "fly-in 0.5s 0.3s backwards",
        "fly-4": "fly-in 0.5s 0.4s backwards",
        "fly-5": "fly-in 0.5s 0.5s backwards",
      },
      keyframes: {
        "fly-in": {
          "0%": {
            opacity: 0,
            transform: "translateY(0.5rem)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
      },
    },
  },
  plugins: [],
};
