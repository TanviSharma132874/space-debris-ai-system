/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-black': '#00040A',
        'space-navy': '#030712',
        'space-dark': 'rgba(8,13,25,0.88)',
        'electric-blue': '#2563EB',
        'neon-cyan': '#1D4ED8',
        'neon-purple': '#FF8A00',
        'mission-green': '#22C55E',
        'mission-amber': '#F59E0B',
        'mission-red': '#EF4444',
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(37, 99, 235, 0.15)',
        'glow-cyan': '0 0 15px rgba(6, 182, 210, 0.15)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.15)',
      }
    },
  },
  plugins: [],
}
