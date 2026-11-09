import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slatebrand: {
          50: "#f7f8fb",
          100: "#eef1f7",
          200: "#dbe2ef",
          300: "#bac8de",
          400: "#93a6c7",
          500: "#7088b1",
          600: "#596e95",
          700: "#485878",
          800: "#3f4b63",
          900: "#373f53"
        },
        success: "#12805c",
        warning: "#b7791f",
        danger: "#b83246"
      },
      boxShadow: {
        panel: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
