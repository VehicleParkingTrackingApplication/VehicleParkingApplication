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
        gold: "#E8D767",
        blue: "#193ED8",
        textLight: "#F5F5F7",
        textMuted: "rgba(245, 245, 247, 0.6)",
    },
  },
},
  plugins: [],
}

export default config
