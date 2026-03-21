import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/index.js";
import { db } from "../src/config/database.js";
import { DEFAULT_ROLES } from "@ims/shared/constants";
import bcrypt from "bcryptjs";

const testAdminUser = {
  email: "inventory-admin-test@example.com",
  password: "testpassword123",
  firstName: "Inventory",
  lastName: "Admin",
};

let authToken: string;

describe("Inventory API", () => {
  beforeAll(async () => {
    // Clean up any existing test user
    await db.user.deleteMany({
      where: { email: testAdminUser.email },
    });

    // Create admin role if it doesn't exist
    let adminRole = await db.role.findUnique({
      where: { name: DEFAULT_ROLES.ADMIN },
    });

    if (!adminRole) {
      adminRole = await db.role.create({
        data: {
          name: DEFAULT_ROLES.ADMIN,
          description: "Full system access",
        },
      });
    }

    // Create test admin user with admin role
    const passwordHash = await bcrypt.hash(testAdminUser.password, 12);
    const user = await db.user.create({
      data: {
        email: testAdminUser.email,
        passwordHash,
        firstName: testAdminUser.firstName,
        lastName: testAdminUser.lastName,
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    // Login to get token
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: testAdminUser.email,
        password: testAdminUser.password,
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await db.item.deleteMany({
      where: { sku: { startsWith: "TEST-" } },
    });

    await db.category.deleteMany({
      where: { name: { startsWith: "Test" } },
    });

    await db.session.deleteMany({
      where: { user: { email: testAdminUser.email } },
    });

    await db.user.deleteMany({
      where: { email: testAdminUser.email },
    });

    await db.$disconnect();
  });

  describe("Categories", () => {
    let categoryId: string;

    describe("POST /api/inventory/categories", () => {
      it("should create a category", async () => {
        const response = await request(app)
          .post("/api/inventory/categories")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            name: "Test Category",
            description: "Test category for testing",
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Test Category");
        categoryId = response.body.data.id;
      });

      it("should fail without authentication", async () => {
        const response = await request(app)
          .post("/api/inventory/categories")
          .send({ name: "Unauthorized Category" })
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe("GET /api/inventory/categories", () => {
      it("should get all categories", async () => {
        const response = await request(app)
          .get("/api/inventory/categories")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe("PATCH /api/inventory/categories/:id", () => {
      it("should update a category", async () => {
        const response = await request(app)
          .patch(`/api/inventory/categories/${categoryId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            description: "Updated description",
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe("DELETE /api/inventory/categories/:id", () => {
      it("should delete a category", async () => {
        // Create a category to delete
        const createResponse = await request(app)
          .post("/api/inventory/categories")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            name: "Category to Delete",
          });

        const idToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/api/inventory/categories/${idToDelete}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe("Items", () => {
    let itemId: string;
    let categoryId: string;

    beforeAll(async () => {
      // Create a category for items
      const categoryResponse = await request(app)
        .post("/api/inventory/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Items Category",
        });

      categoryId = categoryResponse.body.data.id;
    });

    describe("POST /api/inventory/items", () => {
      it("should create an item", async () => {
        const response = await request(app)
          .post("/api/inventory/items")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            sku: "TEST-001",
            name: "Test Item",
            description: "A test item",
            categoryId,
            quantity: 100,
            minQuantity: 10,
            unit: "piece",
            unitPrice: 29.99,
            location: "Warehouse A",
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.sku).toBe("TEST-001");
        expect(response.body.data.quantity).toBe(100);
        itemId = response.body.data.id;
      });

      it("should fail with duplicate SKU", async () => {
        const response = await request(app)
          .post("/api/inventory/items")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            sku: "TEST-001",
            name: "Duplicate Item",
          })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error?.code).toBe("ALREADY_EXISTS");
      });

      it("should fail without required fields", async () => {
        const response = await request(app)
          .post("/api/inventory/items")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            name: "Missing SKU",
          })
          .expect(422);

        expect(response.body.success).toBe(false);
      });
    });

    describe("GET /api/inventory/items", () => {
      it("should get paginated items", async () => {
        const response = await request(app)
          .get("/api/inventory/items")
          .set("Authorization", `Bearer ${authToken}`)
          .query({ page: 1, pageSize: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toBeDefined();
        expect(response.body.data.total).toBeDefined();
        expect(response.body.data.page).toBe(1);
      });

      it("should search items", async () => {
        const response = await request(app)
          .get("/api/inventory/items")
          .set("Authorization", `Bearer ${authToken}`)
          .query({ search: "Test" })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe("GET /api/inventory/items/:id", () => {
      it("should get a single item", async () => {
        const response = await request(app)
          .get(`/api/inventory/items/${itemId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(itemId);
      });

      it("should fail for non-existent item", async () => {
        const response = await request(app)
          .get("/api/inventory/items/non-existent-id")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe("PATCH /api/inventory/items/:id", () => {
      it("should update an item", async () => {
        const response = await request(app)
          .patch(`/api/inventory/items/${itemId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            name: "Updated Test Item",
            quantity: 150,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Updated Test Item");
        expect(response.body.data.quantity).toBe(150);
      });
    });

    describe("DELETE /api/inventory/items/:id", () => {
      it("should delete an item", async () => {
        // Create an item to delete
        const createResponse = await request(app)
          .post("/api/inventory/items")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            sku: "TEST-DELETE",
            name: "Item to Delete",
            quantity: 10,
          });

        const idToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/api/inventory/items/${idToDelete}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe("Stock Movements", () => {
    let itemId: string;

    beforeAll(async () => {
      // Create an item for stock movements
      const itemResponse = await request(app)
        .post("/api/inventory/items")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          sku: "TEST-STOCK-MOVEMENT",
          name: "Stock Movement Test Item",
          quantity: 50,
          minQuantity: 5,
        });

      itemId = itemResponse.body.data.id;
    });

    describe("POST /api/inventory/stock-movements", () => {
      it("should create a stock IN movement", async () => {
        const response = await request(app)
          .post("/api/inventory/stock-movements")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            itemId,
            quantity: 20,
            type: "IN",
            reason: "Purchase order",
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe("IN");
        expect(response.body.data.quantity).toBe(20);
      });

      it("should create a stock OUT movement", async () => {
        const response = await request(app)
          .post("/api/inventory/stock-movements")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            itemId,
            quantity: 10,
            type: "OUT",
            reason: "Sales order",
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe("OUT");
      });

      it("should fail with insufficient stock", async () => {
        const response = await request(app)
          .post("/api/inventory/stock-movements")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            itemId,
            quantity: 1000,
            type: "OUT",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error?.code).toBe("INSUFFICIENT_STOCK");
      });
    });

    describe("GET /api/inventory/stock-movements", () => {
      it("should get stock movements", async () => {
        const response = await request(app)
          .get("/api/inventory/stock-movements")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });

  describe("Dashboard", () => {
    describe("GET /api/inventory/dashboard", () => {
      it("should get dashboard stats", async () => {
        const response = await request(app)
          .get("/api/inventory/dashboard")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalItems).toBeDefined();
        expect(response.body.data.totalCategories).toBeDefined();
        expect(response.body.data.lowStockItems).toBeDefined();
        expect(response.body.data.outOfStockItems).toBeDefined();
        expect(response.body.data.totalValue).toBeDefined();
        expect(response.body.data.recentMovements).toBeDefined();
      });
    });
  });
});
