import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import newsRoutes from "./newsRoutes.js";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, "news.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(
  cors({
    origin: [
      "https://aemba.vercel.app",  
      "http://localhost:4200",     
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options(/.*/, cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fieldSize: 25 * 1024 * 1024, // 25MB
    fileSize: 10 * 1024 * 1024,  // 10MB
  },
});

function readData() {
  if (!fs.existsSync(FILE)) return [];
  const data = fs.readFileSync(FILE, "utf-8");
  return JSON.parse(data || "[]");
}

function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/", (req, res) => {
  res.send("🚀 API AEMBA está online e funcionando!");
});

app.get("/news", (req, res) => {
  res.json(readData());
});

app.post("/news", upload.single("image"), (req, res) => {
  try {
    const { title, subtitle, paragraphs, useCarousel } = req.body;

    if (!title) {
      return res.status(400).json({ message: "O campo 'title' é obrigatório." });
    }

    const news = readData();

    const newItem = {
      id: Date.now(),
      title,
      subtitle: subtitle || "",
      cover: req.file ? `/uploads/${req.file.filename}` : "",
      paragraphs: paragraphs ? JSON.parse(paragraphs) : [],
      useCarousel: useCarousel === "true",
      date: new Date().toISOString(),
    };

    news.push(newItem);
    saveData(news);

    res.status(201).json({
      message: "Notícia criada com sucesso!",
      news: newItem,
    });
  } catch (err) {
    console.error("Erro ao criar notícia:", err);
    res.status(500).json({ message: "Erro interno ao criar notícia." });
  }
});

app.get("/news/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const news = readData();
  const item = news.find((n) => n.id === id);

  if (!item) {
    return res.status(404).json({ message: "Notícia não encontrada" });
  }

  res.json(item);
});

app.delete("/news/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const news = readData();
  const index = news.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Notícia não encontrada" });
  }

  const [deleted] = news.splice(index, 1);
  saveData(news);

  if (deleted.cover) {
    const imagePath = path.join(__dirname, deleted.cover);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }

  res.json({ message: "Notícia deletada com sucesso!" });
});

app.use("/news-advanced", newsRoutes);

app.listen(PORT, () => {
  console.log(`✅ API AEMBA rodando na porta ${PORT}`);
});
