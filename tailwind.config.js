/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-container-low": "#1b1b1d",
        "secondary-fixed": "#e2dfff",
        "on-background": "#e4e2e4",
        "primary-fixed": "#d6e3ff",
        "surface-dim": "#131315",
        "inverse-on-surface": "#303032",
        "surface-tint": "#aac7ff",
        "surface-bright": "#39393b",
        "background": "#131315",
        "on-tertiary-container": "#3f2300",
        "surface-container-high": "#2a2a2c",
        "error": "#ffb4ab",
        "on-tertiary-fixed-variant": "#673d00",
        "on-primary-container": "#002957",
        "secondary-container": "#3630bf",
        "inverse-primary": "#005db8",
        "tertiary-fixed": "#ffddbb",
        "on-error": "#690005",
        "on-secondary-fixed": "#0c006b",
        "tertiary-container": "#ce7f00",
        "on-secondary": "#1800a7",
        "on-secondary-fixed-variant": "#332dbc",
        "primary-container": "#3e90ff",
        "outline-variant": "#414754",
        "surface-container-lowest": "#0e0e10",
        "primary-fixed-dim": "#aac7ff",
        "primary": "#aac7ff",
        "on-tertiary": "#482900",
        "inverse-surface": "#e4e2e4",
        "on-error-container": "#ffdad6",
        "on-tertiary-fixed": "#2b1700",
        "surface-variant": "#353437",
        "secondary": "#c2c1ff",
        "surface": "#131315",
        "surface-container-highest": "#353437",
        "on-surface-variant": "#c0c6d6",
        "on-primary-fixed-variant": "#00468d",
        "outline": "#8b91a0",
        "on-surface": "#e4e2e4",
        "tertiary-fixed-dim": "#ffb868",
        "error-container": "#93000a",
        "secondary-fixed-dim": "#c2c1ff",
        "on-primary-fixed": "#001b3e",
        "surface-container": "#1f1f21",
        "on-secondary-container": "#b1b1ff",
        "on-primary": "#003064",
        "tertiary": "#ffb868"
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, #353437 1px, transparent 1px)'
      }
    },
  },
  plugins: [],
}