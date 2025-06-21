import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dojo: {
          primary: '#1e293b', // dark blue
          secondary: '#fbbf24', // yellow
          accent: '#10b981', // green
          danger: '#ef4444', // red
        },
      },
    },
  },
  plugins: [],
} satisfies Config

