import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Re-export types for convenience
export type {
  User,
  Session,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Category,
  Item,
  StockMovement,
  AuditLog,
  MovementType,
} from "@prisma/client";