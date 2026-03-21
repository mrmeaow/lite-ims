import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { SSEService } from "../services/sseService.js";

const router: Router = Router();

// SSE endpoint for stock updates
router.get("/stock-updates", authenticate, (req: Request, res: Response) => {
  const clientId = req.userId || `anon-${Date.now()}`;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", message: "Connected to stock updates" })}\n\n`);

  // Add client to SSE service
  SSEService.addClient(clientId, res);

  // Handle client disconnect
  req.on("close", () => {
    SSEService.removeClient(clientId);
  });

  req.on("error", () => {
    SSEService.removeClient(clientId);
  });
});

export default router;
