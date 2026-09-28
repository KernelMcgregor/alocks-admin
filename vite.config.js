import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative, so the same build works at kernelmcgregor.github.io/alocks-admin/ and on a
  // custom domain root. Safe because navigation is hash-based: every page is index.html.
  base: './',
  plugins: [react(), tailwindcss()],
})
