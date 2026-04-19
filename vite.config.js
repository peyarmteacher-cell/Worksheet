import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // เปลี่ยนจาก ./ เป็น / เพื่อความเสถียรสูงสุดบน IIS
  base: '/',
  build: {
    outDir: 'public_html',
    assetsDir: 'assets',
    emptyOutDir: true,
    reportCompressedSize: false,
  },
});
