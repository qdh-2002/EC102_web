import type { Config } from "tailwindcss";

// UCLA brand palette (https://brand.ucla.edu/fundamentals/color)
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ucla: {
          blue: "#2774AE",
          darkblue: "#005587",
          darkestblue: "#003B5C",
          lightblue: "#8BB8E8",
          lighterblue: "#DAEBFE",
          gold: "#FFD100",
          darkgold: "#FFC72C",
          darkestgold: "#FFB81C",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
