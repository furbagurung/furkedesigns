import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { imageSize } from "image-size";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Allow your Next.js dev server to call this API
app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.1.66:3000"],
    credentials: true,
  })
);

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Serve uploaded files
app.use("/uploads", express.static(UPLOAD_DIR));

// Basic routes
app.get("/", (_req, res) => {
  res.send("Server is running ✅ Try /health, /api/images, /api/upload");
});
app.get("/health", (_req, res) => res.json({ ok: true }));

// Multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 40);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const url = `${BASE_URL}/uploads/${encodeURIComponent(req.file.filename)}`;

  res.json({
    filename: req.file.filename,
    url,
  });
});

// List uploaded images (WITH width & height ✅)
app.get("/api/images", (_req, res) => {
  try {
    const files = fs
      .readdirSync(UPLOAD_DIR)
      .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
      .sort((a, b) => (a < b ? 1 : -1));

    const images = files.map((file) => {
      const filePath = path.join(UPLOAD_DIR, file);
      const buffer = fs.readFileSync(filePath);
      const dim = imageSize(buffer);

      return {
        filename: file,
        url: `${BASE_URL}/uploads/${encodeURIComponent(file)}`,
        width: dim.width ?? 1200,
        height: dim.height ?? 800,
      };
    });

    res.json({ images });
  } catch {
    res.status(500).json({ error: "Failed to read images" });
  }
});

// Error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: message });
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
