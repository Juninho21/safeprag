/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      colors: {
        // Azul padrão do sistema
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
        },
        // Vermelho para ações destrutivas
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        // Suporte às variantes usadas pelos componentes
        secondary: {
          DEFAULT: '#e5e7eb',
          foreground: '#111827',
        },
        accent: {
          DEFAULT: '#f1f5f9',
          foreground: '#111827',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#6b7280',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#111827',
        },
        // Utilizados por variantes/bases (border-input, ring-ring etc.)
        input: '#d1d5db',
        ring: '#2563eb',
        background: '#ffffff',
        foreground: '#111827',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};