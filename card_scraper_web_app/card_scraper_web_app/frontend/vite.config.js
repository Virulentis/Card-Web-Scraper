import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // Added import

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { // Added resolve section
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
