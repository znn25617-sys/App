import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // إذا كنا نقوم بالبناء لمنصة Vercel (ويب) نستخدم '/'، وإذا كان لتطبيق الـ Electron نستخدم './'
  const isVercel = process.env.VERCEL === '1' || mode === 'production';

  return {
    plugins: [react()],
    base: isVercel ? '/' : './',
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
