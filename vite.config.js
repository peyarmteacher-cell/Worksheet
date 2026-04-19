import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // บังคับให้ Vite มองเห็นแค่โฟลเดอร์ปัจจุบัน
  root: '.',
  base: './',
  cacheDir: './node_modules/.vite',
  envDir: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    reportCompressedSize: false,
    // จัดการพฤติกรรมของ esbuild ใน Windows Server
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      // ตรวจสอบว่าไม่มีการดึงไฟล์จากนอกโปรเจกต์
      external: [],
    }
  },
});
