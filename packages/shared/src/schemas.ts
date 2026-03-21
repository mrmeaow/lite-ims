import { z } from "zod";
import { INVENTORY_UNITS, MOVEMENT_TYPES } from "./constants.js";

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  parentId: z.string().cuid().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Item schemas
export const createItemSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional(),
  categoryId: z.string().cuid().optional(),
  quantity: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  maxQuantity: z.number().int().min(0).optional(),
  unit: z.enum(INVENTORY_UNITS).default("piece"),
  unitPrice: z.number().positive().optional(),
  location: z.string().max(255).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).transform((val) => val || undefined),
});

export const updateItemSchema = createItemSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided
      return Object.keys(data).length > 0;
    },
    { message: "At least one field must be provided" }
  );

// Stock movement schemas
export const createStockMovementSchema = z.object({
  itemId: z.string().cuid("Invalid item ID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  type: z.enum(MOVEMENT_TYPES),
  reason: z.string().max(500).optional(),
  referenceId: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

// Role schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string().cuid()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

// Permission schemas
export const createPermissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  resource: z.string().min(1, "Resource is required").max(100),
  action: z.string().min(1, "Action is required").max(50),
});

// User management schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const assignRoleSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  roleId: z.string().cuid("Invalid role ID"),
});

// Settings schemas
export const settingsSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  siteDescription: z.string().max(500).optional(),
  lowStockThreshold: z.number().int().min(0).max(1000).optional(),
  currency: z.string().length(3).optional(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
  timezone: z.string().optional(),
  itemsPerPage: z.number().int().min(5).max(100).optional(),
  allowNegativeStock: z.boolean().optional(),
  requireReasonForStockMovement: z.boolean().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;