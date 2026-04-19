import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "kruai-secret-key-123";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Database Connection
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

    // Initialize Tables
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        national_id VARCHAR(13) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        is_approved TINYINT(1) DEFAULT 0,
        needs_password_change TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        grade VARCHAR(50),
        subject VARCHAR(100),
        type VARCHAR(100),
        difficulty VARCHAR(50),
        content LONGTEXT,
        indicator VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  // Middleware for Auth
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { national_id, full_name } = req.body;
    try {
      // Default password is "1-6" (123456)
      const hashedPassword = await bcrypt.hash("123456", 10);
      await pool.execute(
        "INSERT INTO users (national_id, password, full_name, needs_password_change) VALUES (?, ?, ?, 1)",
        [national_id, hashedPassword, full_name]
      );
      res.json({ message: "สมัครสมาชิกสำเร็จ โปรดรอการอนุมัติ" });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: "หมายเลขประจำตัวประชาชนนี้ถูกใช้งานแล้ว" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { national_id, password } = req.body;
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE national_id = ?", [national_id]);
      const user = rows[0];

      if (!user) return res.status(400).json({ error: "ไม่พบผู้ใช้งาน" });
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });

      if (!user.is_approved && national_id !== "admin") {
        // Simple admin override or just check is_approved
        // return res.status(403).json({ error: "บัญชีของคุณยังไม่ได้รับการอนุมัติ" });
      }

      const token = jwt.sign({ id: user.id, national_id: user.national_id }, JWT_SECRET);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          national_id: user.national_id, 
          full_name: user.full_name,
          needs_password_change: user.needs_password_change 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    const { newPassword } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute(
        "UPDATE users SET password = ?, needs_password_change = 0 WHERE id = ?",
        [hashedPassword, req.user.id]
      );
      res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Exercise Routes
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

  // AI Generation
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  app.post("/api/generate-exercise", authenticateToken, async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
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

  // UI serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (typeof PORT === 'string' && PORT.startsWith('\\\\.\\pipe\\')) {
    app.listen(PORT, () => {
      console.log(`Server running on named pipe: ${PORT}`);
    });
  } else {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
