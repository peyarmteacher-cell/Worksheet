import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // กำหนด root ให้ชัดเจนเพื่อป้องกัน esbuild สแกนออกไปนอกโฟลเดอร์ใน Windows Server
  root: process.cwd(),
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // ปิดการสแกนหาไฟล์นอกรูท
    reportCompressedSize: false,
  },
  server: {
    hmr: false
  }
});
