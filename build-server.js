
const { build } = require('vite');
const path = require('path');

// สคริปต์สำหรับการ Build บน Windows Server ที่มีข้อจำกัดเรื่อง Permission
async function runBuild() {
  console.log('--- Starting Custom Build for Windows Server ---');
  try {
    await build({
      // ระบุ path ของโฟลเดอร์ปัจจุบันให้ชัดเจนที่สุด
      root: path.resolve(__dirname),
      configFile: path.resolve(__dirname, 'vite.config.js'),
      build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
        reportCompressedSize: false,
      }
    });
    console.log('--- Build Successfully Completed! ---');
  } catch (error) {
    console.error('--- Build Failed ---');
    console.error(error);
    process.exit(1);
  }
}

runBuild();
