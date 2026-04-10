import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        moss: {
          50: "#f4f8f3",
          100: "#e5eee2",
          300: "#bbd3b3",
          600: "#4f7b56",
          700: "#3b5f43"
        },
        ink: {
          900: "#1f2a26"
        },
        clay: {
          100: "#f8efe6",
          500: "#c8895d"
        }
      },
      boxShadow: {
        card: "0 10px 35px -18px rgba(31, 42, 38, 0.35)"
      },
      borderRadius: {
        soft: "1.2rem"
      }
    }
  },
  plugins: []
};

export default config;
