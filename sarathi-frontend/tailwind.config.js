/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        saffron: { DEFAULT: '#E8740C', light: '#F9A54A', pale: '#FEF3E7' },
        navy: { DEFAULT: '#0F2240', mid: '#1A3A5C', light: '#2A5280' },
        success: { DEFAULT: '#1A7F4B', light: '#E8F5EE' },
        warning: { DEFAULT: '#C87B00', light: '#FFF3DC' },
        danger: { DEFAULT: '#C0392B', light: '#FDEDEC' },
        info: { DEFAULT: '#1565A8', light: '#E8F0FB' },
        'off-white': '#F8F7F4',
        'gray-100': '#F2F0EC',
        'gray-200': '#E5E2DA',
        'gray-300': '#C8C3B8',
        'gray-500': '#8A8578',
        'gray-700': '#4A4740',
        'gray-900': '#1C1A17',
        enrolled: '#00C851',
        eligible: '#FF8800',
        none: '#E53935',
        unknown: '#78909C',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '20px',
        '2xl': '32px',
      },
      boxShadow: {
        saffron: '0 4px 20px rgba(232, 116, 12, 0.30)',
        card: '0 2px 8px rgba(15, 34, 64, 0.08)',
      },
    },
  },
  plugins: [],
}
