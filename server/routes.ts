import type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertMediaFileSchema } from "../shared/schema";

const VIDEO_EXTS = ["mp4", "webm", "mov"];

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const folder = req.params.folder;
      const dir = path.resolve("uploads", folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});

export function registerRoutes(app: Express) {
  app.get("/api/media/:folder", async (req, res) => {
    try {
      const files = await storage.getMediaByFolder(req.params.folder);
      res.json(files);
    } catch (err) {
      res.status(500).json({ error: "Failed to load media" });
    }
  });

  app.post("/api/media/:folder", upload.single("file"), async (req, res) => {
    try {
      const { folder } = req.params;
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
      const isVideo = VIDEO_EXTS.includes(ext);
      const url = `/uploads/${folder}/${file.originalname}`;

      const validated = insertMediaFileSchema.parse({ name: file.originalname, folder, url, isVideo });
      const mediaFile = await storage.addMedia(validated);
      res.json(mediaFile);
    } catch (err) {
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      await storage.deleteMedia(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Delete failed" });
    }
  });
}
