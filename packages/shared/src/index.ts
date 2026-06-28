// ===========================
// Enums
// ===========================

export const UserRole = {
  ADMIN: 'ADMIN',
  ENCARGADO: 'ENCARGADO',
  CONSULTA: 'CONSULTA',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const CountStatus = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
} as const;
export type CountStatus = typeof CountStatus[keyof typeof CountStatus];

// ===========================
// Auth Types
// ===========================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: typeof UserRole.ADMIN | typeof UserRole.ENCARGADO;
  branchId?: string;
  invitationCode: string;
}

export interface InvitationCodesDto {
  adminInvitationCode: string;
  encargadoInvitationCode: string;
}

export interface UpdateInvitationCodesRequest extends InvitationCodesDto {}

// ===========================
// User Types
// ===========================

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  branchId?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: UserRole;
  branchId?: string | null;
  isActive?: boolean;
}

// ===========================
// Branch Types
// ===========================

export interface BranchDto {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

// ===========================
// Category Types
// ===========================

export interface CategoryDto {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

export interface CreateCategoryRequest {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ===========================
// Product Store Types
// ===========================

export interface ProductStoreDto {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  productCount?: number;
}

export interface CreateProductStoreRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateProductStoreRequest {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

// ===========================
// Product Types
// ===========================

export interface ProductDto {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  storeId: string | null;
  storeName: string | null;
  unit: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateProductRequest {
  name: string;
  categoryId: string;
  storeId?: string | null;
  unit: string;
  sortOrder?: number;
}

export interface UpdateProductRequest {
  name?: string;
  categoryId?: string;
  storeId?: string | null;
  unit?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProductsByCategory {
  category: CategoryDto;
  products: ProductDto[];
}

export interface ProductsByStore {
  store: ProductStoreDto | null;
  products: ProductDto[];
}

// ===========================
// Inventory Count Types
// ===========================

export interface CountDto {
  id: string;
  branchId: string;
  branchName: string;
  userId: string;
  userName: string;
  countDate: string;
  status: CountStatus;
  startedAt: string;
  finalizedAt: string | null;
  notes: string | null;
  itemCount: number;
}

export interface CountDetailDto extends CountDto {
  items: CountItemDto[];
}

export interface CountItemDto {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  unit: string;
  quantity: number;
}

export interface CreateCountRequest {
  notes?: string;
}

export interface UpdateCountItemsRequest {
  items: CountItemInput[];
}

export interface CountItemInput {
  productId: string;
  quantity: number;
}

// ===========================
// Report Types
// ===========================

export interface CountsSummaryDto {
  totalCounts: number;
  finalizedCounts: number;
  draftCounts: number;
  counts: CountDto[];
}

export interface ProductHistoryDto {
  productId: string;
  productName: string;
  unit: string;
  entries: ProductHistoryEntry[];
}

export interface ProductHistoryEntry {
  countId: string;
  countDate: string;
  branchName: string;
  userName: string;
  quantity: number;
}

// ===========================
// Pagination
// ===========================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ===========================
// API Response Wrapper
// ===========================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: string[];
}
