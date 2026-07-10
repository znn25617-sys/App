import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use relative base so Electron can load the built files from disk
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
