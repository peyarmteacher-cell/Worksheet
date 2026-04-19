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

    // ตรวจสอบและซ่อมแซมตาราง users ให้มีคอลัมน์ใหม่
    try {
      await pool.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(255) DEFAULT NULL");
      await pool.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255) DEFAULT NULL");
      await pool.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key TEXT DEFAULT NULL");
      console.log("Database System: Schema Updated");
    } catch (e) { console.log("Database Schema: Already up to date or error occurred", e.message); }

    // ตรวจสอบและซ่อมแซมบัญชี admin โดยอัตโนมัติเมื่อเริ่มระบบ
    const [rows] = await pool.execute("SELECT * FROM users WHERE national_id = 'admin'");
    if (rows.length === 0) {
      console.log("Healing System: Re-creating default admin account...");
      const hashedPassword = await bcrypt.hash("123456", 10);
      await pool.execute(
        "INSERT INTO users (national_id, password, full_name, is_approved, needs_password_change) VALUES ('admin', ?, 'ผู้ดูแลระบบ', 1, 0)",
        [hashedPassword]
      );
      console.log("Healing System: Admin created successfully.");
    } else {
      // ตรวจสอบว่ารหัสผ่าน 123456 ตรงกันไหม ถ้าไม่ตรงให้รีเซ็ตให้ใหม่ (เฉพาะกรณี admin เท่านั้น)
      const user = rows[0];
      const isValid = await bcrypt.compare("123456", user.password);
      if (!isValid) {
        console.log("Healing System: Resetting admin password to 123456...");
        const newHash = await bcrypt.hash("123456", 10);
        await pool.execute("UPDATE users SET password = ?, is_approved = 1 WHERE national_id = 'admin'", [newHash]);
        console.log("Healing System: Admin password reset done.");
      }
    }
  } catch (err) {
    console.error("Database connection error:", err);
  }

  // --- Middleware for Auth ---
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log("Auth Middleware: No token provided");
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.log("Auth Middleware: Invalid token");
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  };

  // --- Auth API ---
  app.post("/api/auth/register", async (req, res) => {
    const { national_id, full_name, password, school, position } = req.body;
    try {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      // สมัครแล้วต้องรออนุมัติ (is_approved = 0)
      await pool.execute(
        "INSERT INTO users (national_id, password, full_name, school, position, is_approved, needs_password_change) VALUES (?, ?, ?, ?, ?, 0, 0)",
        [national_id, hashedPassword, full_name, school, position]
      );
      res.json({ message: "สมัครสมาชิกสำเร็จ! โปรดรอผู้ดูแลระบบอนุมัติการเข้าใช้งาน" });
    } catch (error) {
      console.error("Register Error:", error.message);
      res.status(500).json({ error: "สมัครไม่สำเร็จ: อาจมีบัญชีนี้อยู่ในระบบแล้ว" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { national_id, password } = req.body;
    console.log(`Login Attempt: ${national_id}`);
    
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE national_id = ?", [national_id]);
      const user = rows[0];

      if (!user) {
        console.log("Login Status: User not found");
        return res.status(400).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        console.log("Login Status: Password mismatch");
        return res.status(400).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      if (user.is_approved !== 1) {
        console.log("Login Status: Not approved");
        return res.status(403).json({ error: "บัญชีของคุณยังไม่ได้รับการอนุมัติ โปรดติดต่อผู้ดูแลระบบ" });
      }

      const token = jwt.sign({ id: user.id, national_id: user.national_id }, JWT_SECRET);
      console.log("Login Status: Success");
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          full_name: user.full_name, 
          school: user.school,
          position: user.position,
          api_key: user.api_key,
          needs_password_change: user.needs_password_change, 
          national_id: user.national_id 
        } 
      });
    } catch (e) {
      console.error("Login Error:", e.message);
      res.status(500).json({ error: "ระบบขัดข้องในการเชื่อมต่อฐานข้อมูล" });
    }
  });

  app.post("/api/user/profile", authenticateToken, async (req, res) => {
    const { full_name, school, position, api_key } = req.body;
    try {
      await pool.execute(
        "UPDATE users SET full_name = ?, school = ?, position = ?, api_key = ? WHERE id = ?",
        [full_name, school, position, api_key, req.user.id]
      );
      res.json({ message: "อัปเดตโปรไฟล์สำเร็จ" });
    } catch (error) {
      res.status(500).json({ error: "อัปเดตไม่สำเร็จ" });
    }
  });

  // --- Admin API ---
  app.get("/api/admin/pending-users", authenticateToken, async (req, res) => {
    // ตรวจว่าเป็น admin ไหม (ง่ายๆ คือ check national_id)
    if (req.user.national_id !== 'admin') return res.sendStatus(403);
    try {
      const [rows] = await pool.execute("SELECT id, national_id, full_name, school, position, created_at FROM users WHERE is_approved = 0");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/approve-user", authenticateToken, async (req, res) => {
    if (req.user.national_id !== 'admin') return res.sendStatus(403);
    const { userId, approve } = req.body;
    try {
      if (approve) {
        await pool.execute("UPDATE users SET is_approved = 1 WHERE id = ?", [userId]);
      } else {
        await pool.execute("DELETE FROM users WHERE id = ? AND is_approved = 0", [userId]);
      }
      res.json({ message: approve ? "อนุมัติสำเร็จ" : "ปฏิเสธสำเร็จ" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Exercise API ---
  app.get("/api/exercises", authenticateToken, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM exercises WHERE user_id = ? ORDER BY created_at DESC", 
        [req.user.id]
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/exercises", authenticateToken, async (req, res) => {
    const { title, grade, subject, type, difficulty, content, indicator, description } = req.body;
    try {
      const [result] = await pool.execute(
        "INSERT INTO exercises (user_id, title, grade, subject, type, difficulty, content, indicator, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [req.user.id, title, grade, subject, type, difficulty, JSON.stringify(content), indicator, description]
      );
      res.json({ id: result.insertId, message: "บันทึกสำเร็จ" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/exercises/:id", authenticateToken, async (req, res) => {
    try {
      await pool.execute("DELETE FROM exercises WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
      res.json({ message: "ลบสำเร็จ" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- AI API ---
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  app.post("/api/generate-exercise", authenticateToken, async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      
      // ดึง API Key ของผู้ใช้จาก DB
      const [rows] = await pool.execute("SELECT api_key FROM users WHERE id = ?", [req.user.id]);
      const userApiKey = rows[0]?.api_key;
      
      const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKeyToUse) {
        return res.status(400).json({ error: "ไม่พบ API KEY กรุณาตั้งค่า API KEY ส่วนตัวในหน้าโปรไฟล์" });
      }

      const userAi = new GoogleGenAI({ apiKey: apiKeyToUse });
      const response = await userAi.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json" },
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("AI Error:", error.message);
      res.status(500).json({ error: "AI ขัดข้อง: " + error.message });
    }
  });

  // --- UI Static Files & Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = require('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log("Vite Middleware: Enabled (Development)");
  } else {
    const webRoot = fs.existsSync(path.join(__dirname, 'dist')) ? path.join(__dirname, 'dist') : __dirname;
    app.use(express.static(webRoot));
    app.get('*', (req, res) => {
      const idx = path.join(webRoot, 'index.html');
      if (fs.existsSync(idx)) res.sendFile(idx);
      else res.status(404).send("<h2>ระบบขัดข้อง: ไม่พบไฟล์หน้าเว็บ</h2>");
    });
  }

  // Start Server
  if (typeof PORT === 'string' && PORT.startsWith('\\\\.\\pipe\\')) {
    app.listen(PORT, () => { console.log(`Connected to IISNode`); });
  } else {
    app.listen(Number(PORT), "0.0.0.0", () => { console.log(`Server running on port ${PORT}`); });
  }
}

startServer();
