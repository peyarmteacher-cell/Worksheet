import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  // API Route for Exercise Generation
  app.post("/api/generate-exercise", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;

      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
      }

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
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // iisnode on Windows uses named pipes (strings) instead of port numbers
  // We should not specify "0.0.0.0" when the port is a named pipe
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
