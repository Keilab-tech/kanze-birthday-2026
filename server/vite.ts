import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

export async function setupVite(app: Express, _server: Server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve("dist");
  if (!fs.existsSync(distPath)) {
    throw new Error("dist folder not found — run npm run build first");
  }
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
