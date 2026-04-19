const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

// โหลดการตั้งค่าจาก .env
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "kruai-secret-key-123";

async function startServer() {
  const app = express();
  
  // IISNode จะส่ง Port มาให้ หรือใช้ 3000
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // 1. เชื่อมต่อฐานข้อมูล
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "kruai_db",
  };

  let pool;
  try {
    pool = mysql.createPool(dbConfig);
    console.log("Connected to MySQL Database");
  } catch (err) {
    console.error("Database connection error:", err);
  }

  // 2. ตั้งค่า Gemini AI (ตามมาตรฐานล่าสุด)
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // 3. API Routes
  app.post("/api/auth/login", async (req, res) => {
    const { national_id, password } = req.body;
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE national_id = ?", [national_id]);
      const user = rows[0];
      if (!user) return res.status(400).json({ error: "ไม่พบผู้ใช้งาน" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });
      const token = jwt.sign({ id: user.id, national_id: user.national_id }, JWT_SECRET);
      res.json({ token, user: { id: user.id, full_name: user.full_name, needs_password_change: user.needs_password_change } });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/generate-exercise", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // อื่นๆ... (api/exercises ฯลฯ)
  app.get("/api/exercises", async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const [rows] = await pool.execute("SELECT * FROM exercises WHERE user_id = ? ORDER BY created_at DESC", [decoded.id]);
      res.json(rows);
    } catch (e) { res.sendStatus(403); }
  });

  // 4. การจัดการไฟล์หน้าเว็บ (UI Serving) สำหรับ Windows Hosting
  // เราจะลองหาไฟล์จาก 2 ที่: 1. โฟลเดอร์ปัจจุบัน 2. โฟลเดอร์ dist
  const currentPath = __dirname;
  const subDistPath = path.join(__dirname, 'dist');
  
  let webRoot = currentPath;
  if (fs.existsSync(path.join(subDistPath, 'index.html'))) {
    webRoot = subDistPath;
  }

  console.log(`Web Root set to: ${webRoot}`);

  // ให้ Express ช่วยส่งไฟล์ static (CSS, JS, Images)
  app.use(express.static(webRoot));
  app.use('/assets', express.static(path.join(webRoot, 'assets')));

  // หน้าจอสีขาวแก้ได้ด้วยการส่ง index.html ตลอดเวลาถ้าหาไฟล์อื่นไม่เจอ
  app.get('*', (req, res) => {
    const indexPath = path.join(webRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("<h2>ไม่พบไฟล์หน้าเว็บ</h2><p>กรุณาตรวจสอบว่ามีไฟล์ index.html อยู่ใน Root หรือในโฟลเดอร์ dist</p>");
    }
  });

  // รัน Server
  if (typeof PORT === 'string' && PORT.startsWith('\\\\.\\pipe\\')) {
    app.listen(PORT, () => { console.log(`IISNode attached to: ${PORT}`); });
  } else {
    app.listen(Number(PORT), "0.0.0.0", () => { console.log(`Server running on port: ${PORT}`); });
  }
}

startServer();
