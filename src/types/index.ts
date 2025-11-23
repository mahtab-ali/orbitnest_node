// Configuration
export interface OrbitNestConfig {
  projectSlug: string;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// HTTP
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    status?: number;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Database
export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
  fields?: Array<{ name: string; dataType: string }>;
}

export interface TableMetadata {
  name: string;
  schema: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
  }>;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface RlsPolicy {
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  definition: string;
  check?: string;
  roles?: string[];
}

// Edge Functions
export interface FunctionInvokeOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export interface FunctionResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

// Auth
export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface PasswordRecoveryOptions {
  email: string;
}

export interface PasswordResetOptions {
  token: string;
  password: string;
}

export interface UpdateUserOptions {
  email?: string;
  password?: string;
  metadata?: Record<string, unknown>;
}
