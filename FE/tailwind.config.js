/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // New palette for refreshed landing
        primary: '#0df259',
        'primary-hover': '#0be052',
        'background-light': '#f5f8f6',
        'background-dark': '#102216',
        'surface-light': '#ffffff',
        'surface-dark': '#1a2c20',
        'text-main': '#111813',
        'text-secondary': '#608a6e',
        // Legacy aliases (kept for existing screens)
        'primary-2': '#0ec4a3',
        accent: '#f8b319',
        text: '#0f1f2e',
        muted: '#5b6470',
        bg: '#f3f7f6',
        surface: '#ffffff',
        success: '#16a34a',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#0284c7'
      },
      boxShadow: {
        sm: '0 8px 20px rgba(15, 23, 42, 0.08)',
        md: '0 12px 32px rgba(15, 23, 42, 0.12)',
        lg: '0 18px 48px rgba(15, 23, 42, 0.16)'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        pill: '999px'
      },
      spacing: {
        4.5: '18px'
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'Be Vietnam Pro', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
