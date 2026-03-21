import { db } from "../config/database.js";
import { createError } from "../middleware/errorHandler.js";
import { SSEService } from "./sseService.js";
import { SettingsService } from "./settingsService.js";
import type { Prisma } from "@prisma/client";
import type {
  ItemResponse,
  CreateItemRequest,
  UpdateItemRequest,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  StockMovementResponse,
  CreateStockMovementRequest,
  PaginatedResponse,
  DashboardStats,
} from "@ims/types";
import { PAGINATION } from "@ims/shared/constants.js";

type ItemWithCategory = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  quantity: number;
  minQuantity: number;
  maxQuantity: number | null;
  unit: string;
  unitPrice: unknown;
  location: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    children?: CategoryWithChildren[];
  } | null;
};

type CategoryWithChildren = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: CategoryWithChildren[];
  parent: CategoryWithChildren | null;
};

type StockMovementWithRelations = {
  id: string;
  itemId: string;
  quantity: number;
  type: string;
  reason: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date;
  createdById: string | null;
  item: ItemWithCategory | null;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: Date;
  } | null;
};

export class InventoryService {
  // Items
  async getItems(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    stockFilter?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<PaginatedResponse<ItemResponse>> {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const pageSize = params.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (params.search) {
      where["OR"] = [
        { name: { contains: params.search, mode: "insensitive" } },
        { sku: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.categoryId) {
      where["categoryId"] = params.categoryId;
    }

    if (params.stockFilter) {
      if (params.stockFilter === "out_of_stock") {
        where["quantity"] = 0;
      } else if (params.stockFilter === "low_stock") {
        where["quantity"] = { gt: 0 };
        // Will need to compare with minQuantity in a second step
      } else if (params.stockFilter === "in_stock") {
        where["quantity"] = { gt: 0 };
      }
    }

    const orderBy: Record<string, unknown> = {};
    const sortField = params.sortBy || "createdAt";
    orderBy[sortField] = params.sortOrder || "desc";

    const [items, total] = await Promise.all([
      db.item.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: true,
        },
      }),
      db.item.count({ where }),
    ]);

    // Filter low_stock items in memory (quantity > 0 AND quantity <= minQuantity)
    let filteredItems = items;
    if (params.stockFilter === "low_stock") {
      filteredItems = items.filter((item) => item.quantity > 0 && item.quantity <= item.minQuantity);
    }

    return {
      items: filteredItems.map((item) => this.formatItemResponse(item)),
      total: params.stockFilter === "low_stock" ? filteredItems.length : total,
      page,
      pageSize,
      totalPages: Math.ceil((params.stockFilter === "low_stock" ? filteredItems.length : total) / pageSize),
    };
  }

  async getItem(id: string): Promise<ItemResponse> {
    const item = await db.item.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw createError("Item not found", 404, "NOT_FOUND");
    }

    return this.formatItemResponse(item);
  }

  async createItem(data: CreateItemRequest, userId: string): Promise<ItemResponse> {
    // Check SKU uniqueness
    const existing = await db.item.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      throw createError("SKU already exists", 409, "ALREADY_EXISTS");
    }

    const item = await db.item.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        quantity: data.quantity || 0,
        minQuantity: data.minQuantity || 0,
        maxQuantity: data.maxQuantity,
        unit: data.unit || "piece",
        unitPrice: data.unitPrice,
        location: data.location,
        imageUrl: data.imageUrl,
      },
      include: {
        category: true,
      },
    });

    // Log audit
    await this.createAuditLog(userId, "CREATE", "item", item.id, { item: data });

    return this.formatItemResponse(item);
  }

  async updateItem(id: string, data: UpdateItemRequest, userId: string): Promise<ItemResponse> {
    const existing = await db.item.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createError("Item not found", 404, "NOT_FOUND");
    }

    // Check SKU uniqueness if changing
    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await db.item.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        throw createError("SKU already exists", 409, "ALREADY_EXISTS");
      }
    }

    const item = await db.item.update({
      where: { id },
      data: {
        ...data,
        unitPrice: data.unitPrice !== undefined ? data.unitPrice : undefined,
      },
      include: {
        category: true,
      },
    });

    // Log audit
    await this.createAuditLog(userId, "UPDATE", "item", item.id, {
      before: existing,
      after: data,
    });

    return this.formatItemResponse(item);
  }

  async deleteItem(id: string, userId: string): Promise<void> {
    const existing = await db.item.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createError("Item not found", 404, "NOT_FOUND");
    }

    await db.item.delete({
      where: { id },
    });

    // Log audit
    await this.createAuditLog(userId, "DELETE", "item", id, { item: existing });
  }

  // Categories
  async getCategories(): Promise<CategoryResponse[]> {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        children: true,
      },
    });

    // Return only root categories (those without parent)
    const rootCategories = categories.filter((c) => !c.parentId);
    return rootCategories.map((c) => {
      return this.formatCategoryResponse(c as unknown as CategoryWithChildren);
    });
  }

  async getCategory(id: string): Promise<CategoryResponse> {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw createError("Category not found", 404, "NOT_FOUND");
    }

    return this.formatCategoryResponse(category as unknown as CategoryWithChildren);
  }

  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await db.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw createError("Parent category not found", 404, "NOT_FOUND");
      }
    }

    const category = await db.category.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
      },
      include: {
        children: true,
      },
    });

    return this.formatCategoryResponse(category as unknown as CategoryWithChildren);
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    const existing = await db.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createError("Category not found", 404, "NOT_FOUND");
    }

    const category = await db.category.update({
      where: { id },
      data,
      include: {
        children: true,
      },
    });

    return this.formatCategoryResponse(category as unknown as CategoryWithChildren);
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if category has items
    const itemCount = await db.item.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      throw createError("Cannot delete category with items", 409, "CONFLICT");
    }

    // Check if category has children
    const childCount = await db.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw createError("Cannot delete category with subcategories", 409, "CONFLICT");
    }

    await db.category.delete({
      where: { id },
    });
  }

  // Stock Movements
  async getStockMovements(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    itemId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<PaginatedResponse<StockMovementResponse>> {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const pageSize = params.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (params.itemId) {
      where['itemId'] = params.itemId;
    }

    if (params.type) {
      where['type'] = params.type;
    }

    if (params.search) {
      where["OR"] = [
        { reason: { contains: params.search, mode: "insensitive" } },
        { notes: { contains: params.search, mode: "insensitive" } },
        { item: { name: { contains: params.search, mode: "insensitive" } } },
        { item: { sku: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Record<string, unknown> = {};
    const sortField = params.sortBy || "createdAt";
    orderBy[sortField] = params.sortOrder || "desc";

    const [movements, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          item: {
            include: {
              category: true,
            },
          },
          createdBy: true,
        },
      }),
      db.stockMovement.count({ where }),
    ]);

    return {
      items: movements.map((m) => this.formatStockMovementResponse(m as unknown as StockMovementWithRelations)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createStockMovement(
    data: CreateStockMovementRequest,
    userId: string
  ): Promise<StockMovementResponse> {
    const item = await db.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw createError("Item not found", 404, "NOT_FOUND");
    }

    // Calculate new quantity
    let newQuantity = item.quantity;
    switch (data.type) {
      case "IN":
      case "ADJUSTMENT":
        newQuantity = item.quantity + data.quantity;
        break;
      case "OUT":
        newQuantity = item.quantity - data.quantity;
        if (newQuantity < 0) {
          throw createError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
        }
        break;
    }

    const previousQuantity = item.quantity;

    // Create movement and update item in transaction
    const [movement] = await db.$transaction([
      db.stockMovement.create({
        data: {
          itemId: data.itemId,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason,
          referenceId: data.referenceId,
          notes: data.notes,
          createdById: userId,
        },
        include: {
          item: {
            include: {
              category: true,
            },
          },
          createdBy: true,
        },
      }),
      db.item.update({
        where: { id: data.itemId },
        data: { quantity: newQuantity },
      }),
    ]);

    // Broadcast stock update via SSE
    SSEService.broadcastStockUpdate({
      itemId: item.id,
      itemName: item.name,
      previousQuantity,
      newQuantity,
      change: data.quantity * (data.type === "OUT" ? -1 : 1),
      type: data.type,
      timestamp: new Date().toISOString(),
      userId,
    });

    return this.formatStockMovementResponse(movement as unknown as StockMovementWithRelations);
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalItems,
      totalCategories,
      lowStockItems,
      outOfStockItems,
      totalValueResult,
      recentMovements,
      settings,
    ] = await Promise.all([
      db.item.count(),
      db.category.count(),
      db.item.count({
        where: {
          quantity: { lte: db.item.fields.minQuantity },
          isActive: true,
        },
      }),
      db.item.count({
        where: {
          quantity: 0,
          isActive: true,
        },
      }),
      // Calculate total inventory value: SUM(unitPrice * quantity)
      db.item.aggregate({
        _sum: {
          unitPrice: true,
        },
        where: {
          isActive: true,
        },
      }),
      db.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          item: {
            include: {
              category: true,
            },
          },
          createdBy: true,
        },
      }),
      db.settings.findFirst(),
    ]);

    // Calculate total value as SUM(unitPrice * quantity) for all active items
    const allItems = await db.item.findMany({
      where: { isActive: true },
      select: { unitPrice: true, quantity: true },
    });

    const calculatedTotalValue = allItems.reduce((sum, item) => {
      const price = (item.unitPrice as { toNumber: () => number })?.toNumber?.() || 0;
      return sum + (price * item.quantity);
    }, 0);

    return {
      totalItems,
      totalCategories,
      lowStockItems,
      outOfStockItems,
      totalValue: calculatedTotalValue,
      currency: settings?.currency || "BDT",
      recentMovements: recentMovements.map((m) => this.formatStockMovementResponse(m as unknown as StockMovementWithRelations)),
    };
  }

  private formatItemResponse(item: ItemWithCategory): ItemResponse {
    if (!item) throw createError("Item not found", 404, "NOT_FOUND");

    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      description: item.description || undefined,
      categoryId: item.categoryId || undefined,
      category: item.category ? this.formatCategoryResponse(item.category as unknown as CategoryWithChildren) : undefined,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity || undefined,
      unit: item.unit,
      unitPrice: (item.unitPrice as { toNumber: () => number })?.toNumber?.() || undefined,
      location: item.location || undefined,
      imageUrl: item.imageUrl || undefined,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private formatCategoryResponse(
    category: CategoryWithChildren
  ): CategoryResponse {
    if (!category) throw createError("Category not found", 404, "NOT_FOUND");

    return {
      id: category.id,
      name: category.name,
      description: category.description || undefined,
      parentId: category.parentId || undefined,
      children: category.children?.map((c: CategoryWithChildren) => this.formatCategoryResponse(c)),
    };
  }

  private formatStockMovementResponse(
    movement: StockMovementWithRelations
  ): StockMovementResponse {
    if (!movement) throw createError("Movement not found", 404, "NOT_FOUND");

    return {
      id: movement.id,
      itemId: movement.itemId,
      item: movement.item ? this.formatItemResponse(movement.item) : undefined,
      quantity: movement.quantity,
      type: movement.type as "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER",
      reason: movement.reason || undefined,
      referenceId: movement.referenceId || undefined,
      notes: movement.notes || undefined,
      createdAt: movement.createdAt.toISOString(),
      createdById: movement.createdById || undefined,
      createdBy: movement.createdBy
        ? {
            id: movement.createdBy.id,
            email: movement.createdBy.email,
            firstName: movement.createdBy.firstName,
            lastName: movement.createdBy.lastName,
            isActive: movement.createdBy.isActive,
            createdAt: movement.createdBy.createdAt.toISOString(),
            roles: [],
          }
        : undefined,
    };
  }

  private async createAuditLog(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: unknown
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        changes: changes as object,
      },
    });
  }
}

export const inventoryService = new InventoryService();