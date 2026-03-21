import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { db } from "../config/database.js";
import { sessionCache } from "../services/sessionCache.js";
import type { ApiResponse, UserResponse } from "@ims/types";

declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
      userId?: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: UserResponse;
  userId?: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = getTokenFromCookie(req) || getTokenFromHeader(req);

  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
    res.status(401).json(response);
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    // Check if session exists and is valid (with Redis caching)
    const session = await sessionCache.get(token);

    if (!session) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "TOKEN_INVALID",
          message: "Session expired or invalid",
        },
      };
      res.status(401).json(response);
      return;
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found or inactive",
        },
      };
      res.status(401).json(response);
      return;
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description || undefined,
      })),
    };

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "TOKEN_INVALID",
        message: "Invalid or expired token",
      },
    };
    res.status(401).json(response);
  }
}

function getTokenFromCookie(req: Request): string | undefined {
  return req.cookies?.[config.cookieName];
}

function getTokenFromHeader(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return undefined;
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getTokenFromCookie(req) || getTokenFromHeader(req);

  if (!token) {
    next();
    return;
  }

  // Try to authenticate but don't fail if token is invalid
  authenticate(req, res, next);
}