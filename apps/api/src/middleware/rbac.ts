import { Response, NextFunction } from "express";
import { db } from "../config/database.js";
import { createError } from "./errorHandler.js";
import type { AuthRequest } from "./auth.js";
import { RESOURCES, ACTIONS } from "@ims/shared/constants.js";
import type { ApiResponse } from "@ims/types";

export type ResourceType = typeof RESOURCES[keyof typeof RESOURCES];
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS] | "manage";

export function requirePermission(resource: ResourceType, action: ActionType) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;

      if (!userId) {
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

      // Get user's roles with permissions
      const userRoles = await db.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // Check if user has the required permission
      const hasPermission = userRoles.some((ur) =>
        ur.role.permissions.some(
          (rp) =>
            rp.permission.resource.toLowerCase() === resource.toLowerCase() &&
            (rp.permission.action.toLowerCase() === action.toLowerCase() || 
             action.toLowerCase() === "manage" || 
             rp.permission.action.toLowerCase() === "manage")
        )
      );

      if (!hasPermission) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `You don't have permission to ${action} ${resource}`,
          },
        };
        res.status(403).json(response);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...roleNames: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;

      if (!userId) {
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

      // Get user's roles
      const userRoles = await db.userRole.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      const userRoleNames = userRoles.map((ur) => ur.role.name);

      // Check if user has any of the required roles
      const hasRole = roleNames.some((role) => userRoleNames.includes(role));

      if (!hasRole) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `You must have one of these roles: ${roleNames.join(", ")}`,
          },
        };
        res.status(403).json(response);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Convenience middleware for common operations
export const requireAdmin = requireRole("admin");
export const requireManager = requireRole("admin", "manager");
export const requireStaff = requireRole("admin", "manager", "staff");