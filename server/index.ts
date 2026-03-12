import express from "express";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();
app.use(express.json());

app.use("/uploads", express.static(path.resolve("uploads")));

const server = createServer(app);

registerRoutes(app);

if (process.env.NODE_ENV !== "production") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://localhost:5000");
});
