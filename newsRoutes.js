import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "../uploads/news");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

let noticias = [];

router.post(
  "/create",
  upload.fields([{ name: "capa" }, { name: "corpo" }]),
  (req, res) => {
    const { titulo, subtitulo, conteudo } = req.body;

    const novaNoticia = {
      id: Date.now(),
      titulo,
      subtitulo,
      conteudo,
      capa: req.files?.capa?.[0]
        ? `/uploads/news/${req.files.capa[0].filename}`
        : "",
      corpoImg: req.files?.corpo?.[0]
        ? `/uploads/news/${req.files.corpo[0].filename}`
        : "",
      data: new Date(),
    };

    noticias.unshift(novaNoticia);
    res.json({ message: "Notícia criada!", noticia: novaNoticia });
  }
);

router.get("/", (req, res) => res.json(noticias));

router.get("/:id", (req, res) => {
  const noticia = noticias.find((n) => n.id == req.params.id);
  noticia
    ? res.json(noticia)
    : res.status(404).json({ message: "Notícia não encontrada" });
});

export default router;
