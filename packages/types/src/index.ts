// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// User types
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  roles: RoleResponse[];
}

// RBAC types
export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  permissions?: PermissionResponse[];
}

export interface PermissionResponse {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

// Item types
export interface ItemResponse {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: CategoryResponse;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  unit: string;
  unitPrice?: number;
  location?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  unit?: string;
  unitPrice?: number;
  location?: string;
  imageUrl?: string;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  isActive?: boolean;
}

// Category types
export interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: CategoryResponse[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// Stock movement types
export interface StockMovementResponse {
  id: string;
  itemId: string;
  item?: ItemResponse;
  quantity: number;
  type: "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER";
  reason?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  createdById?: string;
  createdBy?: UserResponse;
}

export interface CreateStockMovementRequest {
  itemId: string;
  quantity: number;
  type: "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER";
  reason?: string;
  referenceId?: string;
  notes?: string;
}

// Dashboard types
export interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  currency: string;
  recentMovements: StockMovementResponse[];
}

// Settings types
export interface SettingsResponse {
  siteName: string;
  siteDescription: string;
  lowStockThreshold: number;
  currency: string;
  dateFormat: string;
  timezone: string;
  itemsPerPage: number;
  allowNegativeStock: boolean;
  requireReasonForStockMovement: boolean;
  onboardingCompleted: boolean;
  onboardingData: unknown;
}

export interface OnboardingStepStatus {
  stepId: string;
  completed: boolean;
  completedAt?: string;
}

export interface OnboardingData {
  currentStep: number;
  steps: OnboardingStepStatus[];
  completedAt?: string;
}

export interface UpdateSettingsRequest {
  siteName?: string;
  siteDescription?: string;
  lowStockThreshold?: number;
  currency?: string;
  dateFormat?: string;
  timezone?: string;
  itemsPerPage?: number;
  allowNegativeStock?: boolean;
  requireReasonForStockMovement?: boolean;
}
