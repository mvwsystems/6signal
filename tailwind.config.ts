import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#060606",
        "bg-2": "#0a0a0a",
        line: "rgba(255, 255, 255, 0.07)",
        "line-2": "rgba(255, 255, 255, 0.14)",
        ink: "#f5f5f3",
        "ink-2": "#b8b8b5",
        "ink-3": "#7a7a78",
        "ink-4": "#555553",
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Times New Roman"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
