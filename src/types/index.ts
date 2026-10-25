export type Role = "ADMIN" | "IT_SUPPORT" | "USER";

export interface SessionUser {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  role: Role;
  departmentId: string;
  departmentName?: string;
  title: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
