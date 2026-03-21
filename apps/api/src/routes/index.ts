import { Router, type Request, type Response } from "express";
import authRoutes from "./auth.js";
import inventoryRoutes from "./inventory.js";
import rbacRoutes from "./rbac.js";
import sseRoutes from "./sse.js";
import settingsRoutes from "./settings.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/rbac", rbacRoutes);
router.use("/sse", sseRoutes);
router.use("/settings", settingsRoutes);

// Health check (also available at /monitoring/health with more details)
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;