import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { db } from "../config/database.js";
import { config } from "../config/index.js";
import { createError } from "../middleware/errorHandler.js";
import { sessionCache } from "./sessionCache.js";
import type { LoginRequest, RegisterRequest, LoginResponse, UserResponse } from "@ims/types";
import { DEFAULT_ROLES } from "@ims/shared/constants.js";

type UserWithRoles = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: string;
    userId: string;
    roleId: string;
    assignedAt: Date;
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
};

export class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await db.user.findUnique({
      where: { email: data.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw createError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw createError("Account is disabled", 403, "ACCOUNT_DISABLED");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw createError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store session
    const expiresAt = new Date(Date.now() + config.cookieMaxAge);
    const session = await db.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        expiresAt,
      },
    });

    // Cache session in Redis
    await sessionCache.set(session);

    return {
      user: this.formatUserResponse(user),
      accessToken,
    };
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError("Email already registered", 409, "USER_ALREADY_EXISTS");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user with default role
    const defaultRole = await db.role.findFirst({
      where: { isDefault: true },
    });

    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: defaultRole
          ? {
              create: {
                roleId: defaultRole.id,
              },
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const expiresAt = new Date(Date.now() + config.cookieMaxAge);

    await db.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        expiresAt,
      },
    });

    return {
      user: this.formatUserResponse(user),
      accessToken,
    };
  }

  async createUser(data: RegisterRequest, adminUserId: string): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError("Email already registered", 409, "USER_ALREADY_EXISTS");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user with default role
    const defaultRole = await db.role.findFirst({
      where: { isDefault: true },
    });

    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        createdBy: adminUserId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Log the creation
    await this.createAuditLog(adminUserId, "CREATE", "user", user.id, {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    });

    return this.formatUserResponse(user);
  }

  private async createAuditLog(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          ...(details && { details: details as any }),
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  async logout(userId: string, token: string): Promise<void> {
    // Delete from database
    await db.session.deleteMany({
      where: {
        userId,
        token,
      },
    });

    // Delete from Redis cache
    await sessionCache.delete(token);
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw createError("User not found", 404, "USER_NOT_FOUND");
    }

    return this.formatUserResponse(user);
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, {
      expiresIn: config.jwtAccessExpiry,
    } as SignOptions);
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: "refresh" }, config.jwtSecret, {
      expiresIn: config.jwtRefreshExpiry,
    } as SignOptions);
  }

  private formatUserResponse(user: UserWithRoles): UserResponse {
    if (!user) throw createError("User not found", 404, "USER_NOT_FOUND");

    return {
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
  }
}

export const authService = new AuthService();