# KruAI Studio - ระบบสร้างแบบฝึกหัดอัจฉริยะ

ระบบช่วยคุณครูสร้างแบบฝึกหัดด้วย AI (Google Gemini) พร้อมระบบบันทึกข้อมูลลงฐานข้อมูล MySQL และพิมพ์ออกมาเป็นขนาด A4

## เริ่มต้นใช้งานในเครื่องคอมพิวเตอร์ของคุณ (Local Setup)

### 1. ติดตั้งสิ่งที่จำเป็น
*   **Node.js:** ดาวน์โหลดและติดตั้งเวอร์ชันล่าสุด (LTS) จาก [nodejs.org](https://nodejs.org/)
*   **Git:** ติดตั้งจาก [git-scm.com](https://git-scm.com/) (หรือใช้โปรแกรม GitHub Desktop)

### 2. นำโค้ดลงเครื่อง (จาก GitHub)
1.  เปิดโปรแกรม Terminal หรือ Command Prompt
2.  ใช้คำสั่ง Clone (เปลี่ยน URL เป็นลิงก์ GitHub ของคุณ):
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    ```
3.  เข้าไปในโฟลเดอร์:
    ```bash
    cd your-repo-name
    ```

### 3. ติดตั้งแพคเกจ
```bash
npm install
```

### 4. ตั้งค่า Environment Variables (.env)
สร้างไฟล์ชื่อ `.env` ไว้ที่โฟลเดอร์หลัก และใส่ข้อมูลดังนี้:
```env
GEMINI_API_KEY=รหัส_API_KEY_ของคุณ
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kruai_db
JWT_SECRET=ใส่รหัสสุ่มอะไรก็ได้
```

### 5. การรันระบบ
*   **สำหรับรันเพื่อพัฒนา/แก้ไข (Development):**
    ```bash
    npm run dev
    ```
*   **สำหรับสร้างไฟล์เพื่ออัปโหลดขึ้น Server (Build):**
    ```bash
    npm run build
    ```
    *หลังจากใช้คำสั่งนี้ คุณจะได้โฟลเดอร์ `dist` ซึ่งสามารถนำไปอัปโหลดขึ้นเซิร์ฟเวอร์ Plesk ได้ทันที*

---

## โครงสร้างโปรเจกต์
*   `app.js` - ไฟล์หลักฝั่ง Server (Node.js/Express)
*   `src/` - ไฟล์ฝั่งหน้าเว็บ (React/TypeScript)
*   `dist/` - ไฟล์ที่พร้อมใช้งานจริง (จะปรากฏหลังจากสั่ง build)
