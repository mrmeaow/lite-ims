// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error codes
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",

  // RBAC errors
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// JWT
export const JWT = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  COOKIE_NAME: "ims_access_token",
} as const;

// Inventory units
export const INVENTORY_UNITS = [
  "piece",
  "kg",
  "gram",
  "liter",
  "ml",
  "meter",
  "cm",
  "box",
  "pack",
  "set",
] as const;

// Stock movement types
export const MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT", "TRANSFER"] as const;

// Resources for permissions
export const RESOURCES = {
  USERS: "users",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  ITEMS: "items",
  CATEGORIES: "categories",
  STOCK: "stock",
  REPORTS: "reports",
  DASHBOARD: "dashboard",
  SETTINGS: "settings",
} as const;

// Actions for permissions
export const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
} as const;

// Default role names
export const DEFAULT_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  VIEWER: "viewer",
} as const;