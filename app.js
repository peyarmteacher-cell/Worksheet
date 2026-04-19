const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "kruai-secret-key-123";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  app.use(express.json());

  // --- Database ---
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "kruai_db",
  };

  let pool;
  try {
    pool = mysql.createPool(dbConfig);
    console.log("Database System: Initialized");
  } catch (err) {
    console.error("Database connection error:", err);
  }

  // --- Auth API ---
  app.post("/api/auth/register", async (req, res) => {
    const { national_id, full_name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash("123456", 10);
      // สมัครแล้วให้ใช้งานได้เลย (is_approved = 1) เพื่อความสะดวกของคุณครู
      await pool.execute(
        "INSERT INTO users (national_id, password, full_name, is_approved, needs_password_change) VALUES (?, ?, ?, 1, 1)",
        [national_id, hashedPassword, full_name]
      );
      res.json({ message: "สมัครสมาชิกสำเร็จ! ใช้รหัสผ่าน 123456 เพื่อเข้าสู่ระบบ" });
    } catch (error) {
      res.status(500).json({ error: "สมัครไม่สำเร็จ: อาจมีเลขบัตรนี้ในระบบแล้ว" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { national_id, password } = req.body;
    console.log(`Login Attempt: ${national_id}`);
    
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE national_id = ?", [national_id]);
      const user = rows[0];

      if (!user) {
        console.log("Login Status: User not found in database");
        return res.status(400).json({ error: "ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        console.log("Login Status: Password mismatch");
        return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });
      }

      const token = jwt.sign({ id: user.id, national_id: user.national_id }, JWT_SECRET);
      console.log("Login Status: Success");
      res.json({ 
        token, 
        user: { id: user.id, full_name: user.full_name, needs_password_change: user.needs_password_change } 
      });
    } catch (e) {
      console.error("Login Error:", e.message);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
    }
  });

  // --- AI API ---
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  app.post("/api/generate-exercise", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json" },
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- UI Static Files (แก้หน้าจอขาว) ---
  const webRoot = fs.existsSync(path.join(__dirname, 'dist')) ? path.join(__dirname, 'dist') : __dirname;
  app.use(express.static(webRoot));
  app.use('/assets', express.static(path.join(webRoot, 'assets')));

  app.get('*', (req, res) => {
    const idx = path.join(webRoot, 'index.html');
    if (fs.existsSync(idx)) res.sendFile(idx);
    else res.status(404).send("<h2>ระบบขัดข้อง: ไม่พบไฟล์หน้าเว็บ</h2>");
  });

  // Start Server
  if (typeof PORT === 'string' && PORT.startsWith('\\\\.\\pipe\\')) {
    app.listen(PORT, () => { console.log(`Connected to IISNode`); });
  } else {
    app.listen(Number(PORT), "0.0.0.0", () => { console.log(`Server running on port ${PORT}`); });
  }
}

startServer();
