/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream:      '#f5f0e8',
        ink:        '#1a1a1a',
        terracotta: '#c2643f',
        sand:       '#ede8df',
        border:     '#e8e0d0',
        surface:    '#ffffff',
        // Priority
        'priority-high-bg':   '#fef2f2',
        'priority-high-text': '#b91c1c',
        'priority-mid-bg':    '#fffbeb',
        'priority-mid-text':  '#92400e',
        'priority-low-bg':    '#eff6ff',
        'priority-low-text':  '#1e40af',
        // Status
        'status-todo':        '#6b7280',
        'status-progress':    '#c2643f',
        'status-done':        '#166534',
      },
      fontFamily: {
        serif:  ['"Playfair Display"', 'Georgia', 'serif'],
        sans:   ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:   '8px',
        input:  '6px',
        badge:  '4px',
      },
      boxShadow: {
        card:  '0 1px 4px 0 rgba(26,26,26,0.07)',
        modal: '0 8px 40px 0 rgba(26,26,26,0.14)',
      },
    },
  },
  plugins: [],
};
