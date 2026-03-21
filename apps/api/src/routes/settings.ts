import { Router, type Request, type Response, type NextFunction } from "express";
import { settingsService } from "../services/settingsService.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { settingsSchema } from "@ims/shared/schemas.js";
import type { ApiResponse } from "@ims/types";

const router: Router = Router();

// GET /settings
router.get(
  "/",
  authenticate,
  async (req, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.getSettings();

      const response: ApiResponse = {
        success: true,
        data: settings,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /settings
router.put(
  "/",
  authenticate,
  requireRole("admin", "manager"),
  async (req, res: Response, next: NextFunction) => {
    try {
      const data = settingsSchema.parse(req.body);
      const settings = await settingsService.updateSettings(data);

      const response: ApiResponse = {
        success: true,
        data: settings,
        message: "Settings updated successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /settings/reset
router.post(
  "/reset",
  authenticate,
  requireRole("admin"),
  async (req, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.resetToDefaults();

      const response: ApiResponse = {
        success: true,
        data: settings,
        message: "Settings reset to defaults",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /settings/onboarding
router.patch(
  "/onboarding",
  authenticate,
  async (req, res: Response, next: NextFunction) => {
    try {
      const { onboardingData } = req.body;
      const settings = await settingsService.updateOnboardingData(onboardingData);

      const response: ApiResponse = {
        success: true,
        data: {
          onboardingCompleted: settings.onboardingCompleted,
          onboardingData: settings.onboardingData,
        },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /settings/onboarding/complete
router.post(
  "/onboarding/complete",
  authenticate,
  async (req, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.completeOnboarding();

      const response: ApiResponse = {
        success: true,
        data: {
          onboardingCompleted: settings.onboardingCompleted,
          onboardingData: settings.onboardingData,
        },
        message: "Onboarding completed successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
