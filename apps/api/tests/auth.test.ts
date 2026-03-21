import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/index.js";
import { db } from "../src/config/database.js";
import { DEFAULT_ROLES } from "@ims/shared/constants.js";

const testUser = {
  email: "test@example.com",
  password: "testpassword123",
  firstName: "Test",
  lastName: "User",
};

describe("Auth API", () => {
  let authToken: string;

  beforeAll(async () => {
    // Clean up any existing test user
    await db.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    // Clean up test user and sessions
    await db.session.deleteMany({
      where: { user: { email: testUser.email } },
    });
    
    await db.user.deleteMany({
      where: { email: testUser.email },
    });

    // Close database connection
    await db.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.firstName).toBe(testUser.firstName);
      expect(response.body.data.user.lastName).toBe(testUser.lastName);
      expect(response.body.data.accessToken).toBeDefined();

      authToken = response.body.data.accessToken;
    });

    it("should fail with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "invalid-email",
          password: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it("should fail with short password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "another@example.com",
          password: "short",
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it("should fail with duplicate email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error?.code).toBe("USER_ALREADY_EXISTS");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeAll(async () => {
      // Clean up any existing sessions for this user
      const user = await db.user.findUnique({
        where: { email: testUser.email },
        include: { sessions: true },
      });
      
      if (user) {
        await db.session.deleteMany({
          where: { userId: user.id },
        });
      }
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      
      authToken = response.body.data.accessToken;
    });

    it("should fail with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error?.code).toBe("INVALID_CREDENTIALS");
    });

    it("should fail with non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it("should fail without token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      // First login to get a fresh token
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
