import { Router, type Request, type Response, type NextFunction } from "express";
import { rbacService } from "../services/rbacService.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission, requireRole } from "../middleware/rbac.js";
import { paginationSchema } from "@ims/shared/schemas.js";
import type { ApiResponse } from "@ims/types";
import { RESOURCES, ACTIONS } from "@ims/shared/constants.js";
import { getQueryParam, getQueryParams, getParam } from "../utils/helpers.js";

const router: Router = Router();

// Roles routes
router.get(
  "/roles",
  authenticate,
  requirePermission(RESOURCES.ROLES, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const roles = await rbacService.getRoles();

      const response: ApiResponse = {
        success: true,
        data: roles,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/roles/:id",
  authenticate,
  requirePermission(RESOURCES.ROLES, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const role = await rbacService.getRole(getParam(req, "id"));

      const response: ApiResponse = {
        success: true,
        data: role,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/roles",
  authenticate,
  requireRole("admin"),
  async (req, res: Response, next: NextFunction) => {
    try {
      const { name, description, permissionIds } = req.body;
      const role = await rbacService.createRole({ name, description, permissionIds });

      const response: ApiResponse = {
        success: true,
        data: role,
        message: "Role created successfully",
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/roles/:id",
  authenticate,
  requireRole("admin"),
  async (req, res: Response, next: NextFunction) => {
    try {
      const { name, description, permissionIds } = req.body;
      const role = await rbacService.updateRole(getParam(req, "id"), {
        name,
        description,
        permissionIds,
      });

      const response: ApiResponse = {
        success: true,
        data: role,
        message: "Role updated successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/roles/:id",
  authenticate,
  requireRole("admin"),
  async (req, res: Response, next: NextFunction) => {
    try {
      await rbacService.deleteRole(getParam(req, "id"));

      const response: ApiResponse = {
        success: true,
        message: "Role deleted successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Permissions routes
router.get(
  "/permissions",
  authenticate,
  requirePermission(RESOURCES.PERMISSIONS, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const permissions = await rbacService.getPermissions();

      const response: ApiResponse = {
        success: true,
        data: permissions,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/permissions",
  authenticate,
  requireRole("admin"),
  async (req, res: Response, next: NextFunction) => {
    try {
      const { name, description, resource, action } = req.body;
      const permission = await rbacService.createPermission({
        name,
        description,
        resource,
        action,
      });

      const response: ApiResponse = {
        success: true,
        data: permission,
        message: "Permission created successfully",
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Users routes
router.get(
  "/users",
  authenticate,
  requirePermission(RESOURCES.USERS, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const queryParams = getQueryParams(req);
      const params = paginationSchema.parse(queryParams);
      const users = await rbacService.getUsers({
        page: params.page,
        pageSize: params.pageSize,
        search: getQueryParam(req, "search"),
        status: getQueryParam(req, "status"),
      });

      const response: ApiResponse = {
        success: true,
        data: users,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/users/:id",
  authenticate,
  requirePermission(RESOURCES.USERS, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const user = await rbacService.getUser(getParam(req, "id"));

      const response: ApiResponse = {
        success: true,
        data: user,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/users/:id",
  authenticate,
  requirePermission(RESOURCES.USERS, ACTIONS.UPDATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const { firstName, lastName, isActive } = req.body;
      const user = await rbacService.updateUser(getParam(req, "id"), {
        firstName,
        lastName,
        isActive,
      });

      const response: ApiResponse = {
        success: true,
        data: user,
        message: "User updated successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/users/:id/roles",
  authenticate,
  requirePermission(RESOURCES.USERS, ACTIONS.UPDATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const { roleId } = req.body;
      const user = await rbacService.assignRole(getParam(req, "id"), roleId);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: "Role assigned successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/users/:id/roles/:roleId",
  authenticate,
  requirePermission(RESOURCES.USERS, ACTIONS.UPDATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const user = await rbacService.removeRole(getParam(req, "id"), getParam(req, "roleId"));

      const response: ApiResponse = {
        success: true,
        data: user,
        message: "Role removed successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/users/:id",
  authenticate,
  requireRole("admin"),
  async (req, res: Response, next: NextFunction) => {
    try {
      await rbacService.deleteUser(getParam(req, "id"));

      const response: ApiResponse = {
        success: true,
        message: "User deleted successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;