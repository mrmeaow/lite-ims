import { Router, type Request, type Response } from "express";
import { authService } from "../services/authService.js";
import { authenticate } from "../middleware/auth.js";
import { loginSchema, registerSchema } from "@ims/shared/schemas.js";
import type { ApiResponse } from "@ims/types";

const router: Router = Router();

// POST /auth/login
router.post("/login", async (req, res: Response, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    // Set HTTP-only cookie
    res.cookie("ims_access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    const response: ApiResponse = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/register
router.post("/register", async (req, res: Response, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);

    // Set HTTP-only cookie
    res.cookie("ims_access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    const response: ApiResponse = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/admin/users
router.post("/admin/users", authenticate, async (req, res: Response, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.createUser(data, req.userId!);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: "User created successfully",
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post("/logout", authenticate, async (req, res: Response, next) => {
  try {
    const token = req.cookies?.["ims_access_token"] || req.headers.authorization?.slice(7);
    if (req.userId && token) {
      await authService.logout(req.userId, token);
    }

    // Clear cookie
    res.clearCookie("ims_access_token");

    const response: ApiResponse = {
      success: true,
      message: "Logged out successfully",
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get("/me", authenticate, async (req, res: Response, next) => {
  try {
    if (!req.userId) {
      throw new Error("User not authenticated");
    }

    const user = await authService.getCurrentUser(req.userId);

    const response: ApiResponse = {
      success: true,
      data: user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;