
const { build } = require('vite');
const path = require('path');

// สคริปต์สำหรับการ Build บน Windows Server ที่มีข้อจำกัดเรื่อง Permission
async function runBuild() {
  console.log('--- Starting Custom Build for Windows Server ---');
  try {
    await build({
      configFile: path.resolve(__dirname, 'vite.config.js'),
      root: __dirname,
      build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
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
