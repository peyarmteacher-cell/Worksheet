import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ใช้ base เป็น ./ เพื่อให้ไฟล์อ้างอิงแบบ relative
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // ปิดการรายงานขนาดเพื่อลดการสแกนไฟล์
    reportCompressedSize: false,
    // ป้องกัน esbuild จากการพยายามหาไฟล์นอกขอบเขต
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});
