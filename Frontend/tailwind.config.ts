import { type Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        black: "#121212",
        gold: "#6B63B5",
        blue: "#c7c7c7ff",
        textLight: "#F5F5F7",
        textMuted: "rgba(23, 23, 29, 0.6)",
    },
  },
},
  plugins: [],
}

export default config
