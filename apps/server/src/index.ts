import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { createApiRouter } from "./api/router.js";
import { WhatsAppBridge } from "./whatsapp/bridge.js";
import { initDb } from "./db/index.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

async function main() {
  console.log("🚀 Starting SuperWA server...");

  // Initialize database
  const db = initDb();
  console.log("✅ Database initialized");

  // Initialize WhatsApp bridge
  const bridge = new WhatsAppBridge();

  // Set up Express
  const app = express();
  app.use(cors({ origin: "http://localhost:3000" }));
  app.use(express.json());

  // API routes
  app.use("/api", createApiRouter(db, bridge));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Create HTTP server and WebSocket
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("📡 WebSocket client connected");
    ws.on("close", () => console.log("📡 WebSocket client disconnected"));
  });

  // Broadcast helper — attached to bridge for sync notifications
  bridge.onSync = (data) => {
    const msg = JSON.stringify({ type: "sync", data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(msg);
    });
  };

  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket on ws://localhost:${PORT}/ws`);
  });
}

main().catch(console.error);
