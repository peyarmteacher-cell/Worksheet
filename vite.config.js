import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ใช้ ./ เพื่อให้รองรับการนำไปวางในโฟลเดอร์ย่อย เช่น /worksheet/
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    reportCompressedSize: false,
  },
});
