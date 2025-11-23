# OrbitNest Node.js SDK - Implementation Guide

## Package Architecture

```
@orbitnest/node/
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── lib/
│   │   ├── client.ts         # HTTP client
│   │   ├── database.ts       # Database operations
│   │   ├── functions.ts      # Edge functions
│   │   ├── auth.ts           # Authentication
│   │   ├── logging.ts        # Log queries
│   │   └── environment.ts    # Env variables
│   └── index.ts              # Main exports
├── docs/
│   ├── 00_api_guide.md
│   ├── 01_package_implementation.md
│   ├── 002_package_guide.md
│   └── migration_plan.md
├── package.json
└── tsconfig.json
```

## Core Components

### 1. HttpClient (`client.ts`)

Base HTTP client with authentication and error handling.

```typescript
class HttpClient {
  constructor(config: OrbitNestConfig)

  getProjectSlug(): string
  request<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>
}
```

**Features:**
- Bearer token authentication
- Configurable timeout
- JSON request/response handling
- Unified error format

### 2. DatabaseClient (`database.ts`)

Full database operations with fluent query builder.

```typescript
class DatabaseClient {
  // Raw SQL
  query(sql: string, params?: unknown[]): Promise<ApiResult<QueryResult>>

  // Table operations
  listTables(): Promise<ApiResult<string[]>>
  getTableMetadata(table: string): Promise<ApiResult<TableMetadata>>
  getTableData(table: string, options?: PaginationOptions): Promise<ApiResult>

  // CRUD
  insert(table: string, data: object): Promise<ApiResult>
  update(table: string, id: string, data: object): Promise<ApiResult>
  delete(table: string, id: string): Promise<ApiResult>

  // Bulk operations
  bulkInsert(table: string, rows: object[]): Promise<ApiResult>
  bulkUpdate(table: string, updates: object[]): Promise<ApiResult>
  bulkDelete(table: string, ids: string[]): Promise<ApiResult>

  // RLS
  enableRls(table: string): Promise<ApiResult>
  disableRls(table: string): Promise<ApiResult>
  createPolicy(table: string, policy: RlsPolicy): Promise<ApiResult>
  listPolicies(table: string): Promise<ApiResult>
  deletePolicy(table: string, name: string): Promise<ApiResult>

  // Fluent API
  from(table: string): TableQueryBuilder
}
```

### 3. FunctionsClient (`functions.ts`)

Edge function invocation.

```typescript
class FunctionsClient {
  invoke<T>(name: string, options?: FunctionInvokeOptions): Promise<ApiResult<FunctionResponse<T>>>
}
```

### 4. AuthClient (`auth.ts`)

User authentication with session management.

```typescript
class AuthClient {
  // Session
  getSession(): AuthSession | null
  getUser(): AuthUser | null
  setSession(session: AuthSession): void

  // Auth methods
  signUp(credentials: SignUpCredentials): Promise<ApiResult<AuthSession>>
  signIn(credentials: SignInCredentials): Promise<ApiResult<AuthSession>>
  signOut(): Promise<ApiResult>
  refreshSession(): Promise<ApiResult<AuthSession>>

  // Profile
  getProfile(): Promise<ApiResult<AuthUser>>
  updateUser(options: UpdateUserOptions): Promise<ApiResult<AuthUser>>
  deleteUser(): Promise<ApiResult>

  // Password
  resetPasswordForEmail(options: PasswordRecoveryOptions): Promise<ApiResult>
  updatePassword(options: PasswordResetOptions): Promise<ApiResult>
}
```

### 5. LoggingClient (`logging.ts`)

Log querying and monitoring.

```typescript
class LoggingClient {
  getLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>
  getDatabaseLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>
  getSlowQueryLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>
  getAuthLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>
  getAuthFailures(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>
  getEdgeFunctionLogs(name?: string, options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>
}
```

### 6. EnvironmentClient (`environment.ts`)

Environment variable management.

```typescript
class EnvironmentClient {
  list(): Promise<ApiResult<EnvironmentVariable[]>>
  get(name: string): Promise<ApiResult<EnvironmentVariable>>
  set(name: string, value: string, options?: object): Promise<ApiResult>
  create(name: string, value: string, options?: object): Promise<ApiResult>
  bulkCreate(variables: object[]): Promise<ApiResult>
  delete(name: string): Promise<ApiResult>
}
```

## Type System

### Configuration
```typescript
interface OrbitNestConfig {
  projectSlug: string;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}
```

### Response Format
```typescript
type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string; status?: number } }
```

### Database Types
```typescript
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  fields?: Array<{ name: string; dataType: string }>;
}

interface RlsPolicy {
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  definition: string;
  check?: string;
  roles?: string[];
}
```

### Auth Types
```typescript
interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, unknown>;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}
```

## Error Handling

All methods return `ApiResult<T>` with unified error format:

```typescript
const { data, error } = await client.db.query('SELECT * FROM users');

if (error) {
  console.error(`Error: ${error.message}`);
  console.error(`Code: ${error.code}`);
  console.error(`Status: ${error.status}`);
  return;
}

// Use data safely
console.log(data.rows);
```

## Security Considerations

1. **API Key Protection**: Never expose `service_role` keys client-side
2. **HTTPS Only**: All connections use TLS
3. **Request Timeout**: Configurable to prevent hanging connections
4. **No Logging of Secrets**: API keys are never logged
5. **Input Validation**: All inputs validated before sending

## Build & Distribution

```bash
# Install dependencies
npm install

# Build package
npm run build

# Output: dist/index.js, dist/index.mjs, dist/index.d.ts
```

Supports both CommonJS and ESM imports.
