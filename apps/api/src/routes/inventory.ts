import { Router, type Request, type Response, type NextFunction } from "express";
import { inventoryService } from "../services/inventoryService.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import {
  createItemSchema,
  updateItemSchema,
  createCategorySchema,
  updateCategorySchema,
  createStockMovementSchema,
  paginationSchema,
} from "@ims/shared/schemas.js";
import type { ApiResponse } from "@ims/types";
import { RESOURCES, ACTIONS } from "@ims/shared/constants.js";
import { getQueryParam, getQueryParams, getParam } from "../utils/helpers.js";

const router: Router = Router();

// Items routes
router.get(
  "/items",
  authenticate,
  requirePermission(RESOURCES.ITEMS, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const queryParams = getQueryParams(req);
      const params = paginationSchema.parse(queryParams);

      const result = await inventoryService.getItems({
        page: params.page,
        pageSize: params.pageSize,
        search: getQueryParam(req, "search"),
        categoryId: getQueryParam(req, "categoryId"),
        stockFilter: getQueryParam(req, "stockFilter"),
        sortBy: getQueryParam(req, "sortBy"),
        sortOrder: getQueryParam(req, "sortOrder") as "asc" | "desc",
      });

      const response: ApiResponse = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/items/:id",
  authenticate,
  requirePermission(RESOURCES.ITEMS, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const item = await inventoryService.getItem(getParam(req, "id"));

      const response: ApiResponse = {
        success: true,
        data: item,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/items",
  authenticate,
  requirePermission(RESOURCES.ITEMS, ACTIONS.CREATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const data = createItemSchema.parse(req.body);
      const item = await inventoryService.createItem(data, req.userId!);

      const response: ApiResponse = {
        success: true,
        data: item,
        message: "Item created successfully",
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/items/:id",
  authenticate,
  requirePermission(RESOURCES.ITEMS, ACTIONS.UPDATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const data = updateItemSchema.parse(req.body);
      const item = await inventoryService.updateItem(getParam(req, "id"), data, req.userId!);

      const response: ApiResponse = {
        success: true,
        data: item,
        message: "Item updated successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/items/:id",
  authenticate,
  requirePermission(RESOURCES.ITEMS, ACTIONS.DELETE),
  async (req, res: Response, next: NextFunction) => {
    try {
      await inventoryService.deleteItem(getParam(req, "id"), req.userId!);

      const response: ApiResponse = {
        success: true,
        message: "Item deleted successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Categories routes
router.get(
  "/categories",
  authenticate,
  requirePermission(RESOURCES.CATEGORIES, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const categories = await inventoryService.getCategories();

      const response: ApiResponse = {
        success: true,
        data: categories,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/categories/:id",
  authenticate,
  requirePermission(RESOURCES.CATEGORIES, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const category = await inventoryService.getCategory(getParam(req, "id"));

      const response: ApiResponse = {
        success: true,
        data: category,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/categories",
  authenticate,
  requirePermission(RESOURCES.CATEGORIES, ACTIONS.CREATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await inventoryService.createCategory(data);

      const response: ApiResponse = {
        success: true,
        data: category,
        message: "Category created successfully",
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/categories/:id",
  authenticate,
  requirePermission(RESOURCES.CATEGORIES, ACTIONS.UPDATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const data = updateCategorySchema.parse(req.body);
      const category = await inventoryService.updateCategory(getParam(req, "id"), data);

      const response: ApiResponse = {
        success: true,
        data: category,
        message: "Category updated successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/categories/:id",
  authenticate,
  requirePermission(RESOURCES.CATEGORIES, ACTIONS.DELETE),
  async (req, res: Response, next: NextFunction) => {
    try {
      await inventoryService.deleteCategory(getParam(req, "id"));

      const response: ApiResponse = {
        success: true,
        message: "Category deleted successfully",
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Stock movements routes
router.get(
  "/stock-movements",
  authenticate,
  requirePermission(RESOURCES.STOCK, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const queryParams = getQueryParams(req);
      const params = paginationSchema.parse(queryParams);
      
      const movements = await inventoryService.getStockMovements({
        page: params.page,
        pageSize: params.pageSize,
        search: getQueryParam(req, "search"),
        type: getQueryParam(req, "type"),
        itemId: getQueryParam(req, "itemId"),
        sortBy: getQueryParam(req, "sortBy"),
        sortOrder: getQueryParam(req, "sortOrder") as "asc" | "desc",
      });

      const response: ApiResponse = {
        success: true,
        data: movements,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/stock-movements",
  authenticate,
  requirePermission(RESOURCES.STOCK, ACTIONS.CREATE),
  async (req, res: Response, next: NextFunction) => {
    try {
      const data = createStockMovementSchema.parse(req.body);
      const movement = await inventoryService.createStockMovement(data, req.userId!);

      const response: ApiResponse = {
        success: true,
        data: movement,
        message: "Stock movement recorded",
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Dashboard
router.get(
  "/dashboard",
  authenticate,
  requirePermission(RESOURCES.DASHBOARD, ACTIONS.READ),
  async (req, res: Response, next: NextFunction) => {
    try {
      const stats = await inventoryService.getDashboardStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;