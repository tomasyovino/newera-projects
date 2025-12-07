/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        muted: "var(--color-muted)",
        text: "var(--color-text)",
        subtle: "var(--color-subtle)",
        danger: "var(--color-danger)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      boxShadow: {
        elevated: "0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
        glow: "0 0 0 1px rgba(195,165,106,.25), 0 8px 30px rgba(115,215,255,.1)",
      },
      animation: {
        'shine': 'shine 2.4s linear infinite',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
