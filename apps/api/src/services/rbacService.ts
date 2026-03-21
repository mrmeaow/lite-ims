import { db } from "../config/database.js";
import { createError } from "../middleware/errorHandler.js";
import type { Prisma } from "@prisma/client";
import type {
  RoleResponse,
  PermissionResponse,
  UserResponse,
} from "@ims/types";
import { DEFAULT_ROLES, ACTIONS, RESOURCES } from "@ims/shared/constants.js";
import bcrypt from "bcryptjs";

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

type RoleWithPermissions = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{
    id: string;
    roleId: string;
    permissionId: string;
    grantedAt: Date;
    permission: {
      id: string;
      name: string;
      description: string | null;
      resource: string;
      action: string;
    };
  }>;
};

type UserRoleWithRole = {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
};

export class RbacService {
  // Roles
  async getRoles(): Promise<RoleResponse[]> {
    const roles = await db.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map(this.formatRoleResponse);
  }

  async getRole(id: string): Promise<RoleResponse> {
    const role = await db.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw createError("Role not found", 404, "NOT_FOUND");
    }

    return this.formatRoleResponse(role);
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<RoleResponse> {
    // Check if role exists
    const existing = await db.role.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw createError("Role already exists", 409, "ALREADY_EXISTS");
    }

    const role = await db.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissionIds
          ? {
              create: data.permissionIds.map((id) => ({
                permissionId: id,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return this.formatRoleResponse(role);
  }

  async updateRole(
    id: string,
    data: { name?: string; description?: string; permissionIds?: string[] }
  ): Promise<RoleResponse> {
    const existing = await db.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createError("Role not found", 404, "NOT_FOUND");
    }

    // Cannot modify admin role
    if (existing.name === DEFAULT_ROLES.ADMIN) {
      throw createError("Cannot modify admin role", 403, "FORBIDDEN");
    }

    const updateData: Record<string, unknown> = {
      name: data.name,
      description: data.description,
    };

    // Update permissions if provided
    if (data.permissionIds !== undefined) {
      await db.rolePermission.deleteMany({
        where: { roleId: id },
      });

      if (data.permissionIds.length > 0) {
        await db.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    const role = await db.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return this.formatRoleResponse(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await db.role.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!role) {
      throw createError("Role not found", 404, "NOT_FOUND");
    }

    // Cannot delete admin role
    if (role.name === DEFAULT_ROLES.ADMIN) {
      throw createError("Cannot delete admin role", 403, "FORBIDDEN");
    }

    // Check if role is assigned to users
    if (role.users.length > 0) {
      throw createError("Cannot delete role assigned to users", 409, "CONFLICT");
    }

    await db.role.delete({
      where: { id },
    });
  }

  // Permissions
  async getPermissions(): Promise<PermissionResponse[]> {
    const permissions = await db.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return permissions.map(this.formatPermissionResponse);
  }

  async createPermission(data: {
    name: string;
    description?: string;
    resource: string;
    action: string;
  }): Promise<PermissionResponse> {
    // Check if permission exists
    const existing = await db.permission.findUnique({
      where: {
        resource_action: {
          resource: data.resource,
          action: data.action,
        },
      },
    });

    if (existing) {
      throw createError("Permission already exists", 409, "ALREADY_EXISTS");
    }

    const permission = await db.permission.create({
      data,
    });

    return this.formatPermissionResponse(permission);
  }

  // User management
  async getUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<{
    items: UserResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (params.search) {
      where["OR"] = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.status) {
      where["isActive"] = params.status === "active";
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return {
      items: users.map((u) => this.formatUserResponse(u)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getUser(id: string): Promise<UserResponse> {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw createError("User not found", 404, "NOT_FOUND");
    }

    return this.formatUserResponse(user);
  }

  async updateUser(
    id: string,
    data: { firstName?: string; lastName?: string; isActive?: boolean }
  ): Promise<UserResponse> {
    const user = await db.user.update({
      where: { id },
      data,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.formatUserResponse(user);
  }

  async assignRole(userId: string, roleId: string): Promise<UserResponse> {
    // Check user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError("User not found", 404, "NOT_FOUND");
    }

    // Check role exists
    const role = await db.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw createError("Role not found", 404, "NOT_FOUND");
    }

    // Check if already assigned
    const existing = await db.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      throw createError("Role already assigned", 409, "ALREADY_EXISTS");
    }

    await db.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    return this.getUser(userId);
  }

  async removeRole(userId: string, roleId: string): Promise<UserResponse> {
    const role = await db.role.findUnique({
      where: { id: roleId },
    });

    if (role?.name === DEFAULT_ROLES.ADMIN) {
      throw createError("Cannot remove admin role", 403, "FORBIDDEN");
    }

    await db.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });

    return this.getUser(userId);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw createError("User not found", 404, "NOT_FOUND");
    }

    // Cannot delete self
    // This check should be done in the route handler if needed

    // Check if user has admin role - prevent deleting last admin
    const hasAdminRole = user.roles.some((ur) => ur.role.name === DEFAULT_ROLES.ADMIN);
    if (hasAdminRole) {
      // Check if there are other admins
      const adminCount = await db.userRole.count({
        where: {
          role: {
            name: DEFAULT_ROLES.ADMIN,
          },
        },
      });

      if (adminCount <= 1) {
        throw createError("Cannot delete the last admin user", 409, "CONFLICT");
      }
    }

    await db.user.delete({
      where: { id },
    });
  }

  // Initialize default roles and permissions
  async seedDefaults(): Promise<void> {
    // Check if already seeded
    const existingRoles = await db.role.count();
    if (existingRoles > 0) return;

    // Create permissions
    const permissionsData: Array<{ name: string; resource: string; action: string; description: string }> = [];
    for (const resource of Object.values(RESOURCES)) {
      for (const action of Object.values(ACTIONS)) {
        permissionsData.push({
          name: `${action}_${resource}`,
          resource: resource as string,
          action: action as string,
          description: `Permission to ${action} ${resource}`,
        });
      }
      // Add manage permission
      permissionsData.push({
        name: `manage_${resource}`,
        resource: resource as string,
        action: "manage" as string,
        description: `Permission to manage ${resource}`,
      });
    }

    await db.permission.createMany({
      data: permissionsData,
      skipDuplicates: true,
    });

    // Get all permissions
    const allPermissions = await db.permission.findMany();

    // Create admin role with all permissions
    await db.role.create({
      data: {
        name: DEFAULT_ROLES.ADMIN,
        description: "Full system access",
        permissions: {
          create: allPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
    });

    // Create manager role
    const managerPermissions = allPermissions.filter(
      (p) =>
        p.resource !== "roles" ||
        (p.action !== "create" && p.action !== "delete")
    );
    await db.role.create({
      data: {
        name: DEFAULT_ROLES.MANAGER,
        description: "Manage inventory and view reports",
        permissions: {
          create: managerPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
    });

    // Create staff role
    const staffPermissions = allPermissions.filter(
      (p) => p.resource === "items" || p.resource === "categories" || p.resource === "stock"
    );
    await db.role.create({
      data: {
        name: DEFAULT_ROLES.STAFF,
        description: "Basic inventory operations",
        permissions: {
          create: staffPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
    });

    // Create viewer role
    const viewerPermissions = allPermissions.filter(
      (p) => p.action === "read"
    );
    await db.role.create({
      data: {
        name: DEFAULT_ROLES.VIEWER,
        description: "View-only access",
        isDefault: true,
        permissions: {
          create: viewerPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
    });

    // Create default admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const adminRole = await db.role.findUnique({
      where: { name: DEFAULT_ROLES.ADMIN },
    });

    await db.user.create({
      data: {
        email: "admin@ims.local",
        passwordHash: adminPassword,
        firstName: "Admin",
        lastName: "User",
        roles: adminRole
          ? {
              create: {
                roleId: adminRole.id,
              },
            }
          : undefined,
      },
    });

    console.log("Default roles, permissions, and admin user created");
  }

  private formatRoleResponse(
    role: RoleWithPermissions
  ): RoleResponse {
    if (!role) throw createError("Role not found", 404, "NOT_FOUND");

    return {
      id: role.id,
      name: role.name,
      description: role.description || undefined,
      permissions: role.permissions?.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description || undefined,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    };
  }

  private formatPermissionResponse(
    permission: Awaited<ReturnType<typeof db.permission.findFirst>>
  ): PermissionResponse {
    if (!permission) throw createError("Permission not found", 404, "NOT_FOUND");

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description || undefined,
      resource: permission.resource,
      action: permission.action,
    };
  }

  private formatUserResponse(
    user: UserWithRoles
  ): UserResponse {
    if (!user) throw createError("User not found", 404, "NOT_FOUND");

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

export const rbacService = new RbacService();