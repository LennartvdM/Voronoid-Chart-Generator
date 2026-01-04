import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Ensure proper MIME types for all files
    headers: {
      'Content-Type': 'application/javascript'
    }
  },
  build: {
    // Ensure correct output for production
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
