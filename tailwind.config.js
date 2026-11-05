/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mtc: {
          blue: "#0A2540",
          yellow: "#FFB800",
          accent: "#2563EB",
          dark: "#0F172A",
          card: "#1E293B",
          border: "#334155"
        },
        crowd: {
          empty: "#10B981",    // Green (0-30%)
          normal: "#F59E0B",   // Yellow (31-70%)
          crowded: "#EF4444"   // Red (71-100%)
        }
      },
    },
  },
  plugins: [],
};
