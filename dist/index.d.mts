interface OrbitNestConfig {
    projectSlug: string;
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
}
interface ApiResponse<T = unknown> {
    data: T;
    error: null;
}
interface ApiError {
    data: null;
    error: {
        message: string;
        code?: string;
        status?: number;
    };
}
type ApiResult<T> = ApiResponse<T> | ApiError;
interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number;
    fields?: Array<{
        name: string;
        dataType: string;
    }>;
}
interface TableMetadata {
    name: string;
    schema: string;
    columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        defaultValue: string | null;
    }>;
}
interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
interface RlsPolicy {
    name: string;
    command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    definition: string;
    check?: string;
    roles?: string[];
}
interface FunctionInvokeOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
}
interface FunctionResponse<T = unknown> {
    data: T;
    status: number;
    headers: Record<string, string>;
}
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
interface SignUpCredentials {
    email: string;
    password: string;
    metadata?: Record<string, unknown>;
}
interface SignInCredentials {
    email: string;
    password: string;
}
interface PasswordRecoveryOptions {
    email: string;
}
interface PasswordResetOptions {
    token: string;
    password: string;
}
interface UpdateUserOptions {
    email?: string;
    password?: string;
    metadata?: Record<string, unknown>;
}

declare class HttpClient {
    private baseUrl;
    private apiKey;
    private projectSlug;
    private timeout;
    constructor(config: OrbitNestConfig);
    getProjectSlug(): string;
    request<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>;
}

declare class DatabaseClient {
    private client;
    constructor(client: HttpClient);
    /**
     * Get the base path for client database operations
     * Uses /api/project/:slug/database/* for client SDK authentication (API keys)
     */
    private get basePath();
    /**
     * Execute a raw SQL query
     * Note: Backend does not support parameterized queries - params are ignored
     */
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<ApiResult<QueryResult<T>>>;
    /**
     * Get all tables in the database
     */
    listTables(): Promise<ApiResult<string[]>>;
    /**
     * Get table metadata including columns
     */
    getTableMetadata(tableName: string): Promise<ApiResult<TableMetadata>>;
    /**
     * Get table data with pagination
     */
    getTableData<T = Record<string, unknown>>(tableName: string, options?: PaginationOptions): Promise<ApiResult<{
        rows: T[];
        total: number;
    }>>;
    /**
     * Insert a row into a table
     * Returns the inserted row data
     */
    insert<T = Record<string, unknown>>(tableName: string, data: Record<string, unknown>): Promise<ApiResult<T>>;
    /**
     * Update a row by ID
     * Note: Requires service_role_key for authentication
     */
    update<T = Record<string, unknown>>(tableName: string, rowId: string | number, data: Record<string, unknown>): Promise<ApiResult<T>>;
    /**
     * Delete a row by ID
     * Note: Requires service_role_key for authentication
     */
    delete(tableName: string, rowId: string | number): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Bulk insert rows
     * Note: Requires service_role_key for authentication
     */
    bulkInsert<T = Record<string, unknown>>(tableName: string, rows: Record<string, unknown>[]): Promise<ApiResult<T[]>>;
    /**
     * Bulk update rows
     * Note: Requires service_role_key for authentication
     */
    bulkUpdate<T = Record<string, unknown>>(tableName: string, updates: Array<{
        where: Record<string, unknown>;
        data: Record<string, unknown>;
    }>): Promise<ApiResult<T[]>>;
    /**
     * Bulk delete rows
     * Note: Requires service_role_key for authentication
     */
    bulkDelete(tableName: string, conditions: Record<string, unknown>[]): Promise<ApiResult<{
        deleted: number;
    }>>;
    /**
     * Enable Row Level Security on a table
     */
    enableRls(tableName: string): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Disable Row Level Security on a table
     */
    disableRls(tableName: string): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Create an RLS policy
     */
    createPolicy(tableName: string, policy: RlsPolicy): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * List RLS policies for a table
     */
    listPolicies(tableName: string): Promise<ApiResult<RlsPolicy[]>>;
    /**
     * Delete an RLS policy
     */
    deletePolicy(tableName: string, policyName: string): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Create a fluent query builder for a table
     */
    from(tableName: string): TableQueryBuilder;
}
/**
 * Fluent query builder for table operations
 */
declare class TableQueryBuilder {
    private db;
    private tableName;
    private _pagination;
    constructor(db: DatabaseClient, tableName: string);
    page(num: number): this;
    limit(num: number): this;
    orderBy(column: string, order?: 'ASC' | 'DESC'): this;
    select<T = Record<string, unknown>>(): Promise<ApiResult<{
        rows: T[];
        total: number;
    }>>;
    insert<T = Record<string, unknown>>(data: Record<string, unknown>): Promise<ApiResult<T>>;
    update<T = Record<string, unknown>>(id: string | number, data: Record<string, unknown>): Promise<ApiResult<T>>;
    delete(id: string | number): Promise<ApiResult<{
        success: boolean;
    }>>;
}

declare class FunctionsClient {
    private client;
    constructor(client: HttpClient);
    /**
     * Invoke an edge function
     */
    invoke<T = unknown>(functionName: string, options?: FunctionInvokeOptions): Promise<ApiResult<FunctionResponse<T>>>;
}

declare class AuthClient {
    private client;
    private session;
    constructor(client: HttpClient);
    private get basePath();
    /**
     * Get the current session
     */
    getSession(): AuthSession | null;
    /**
     * Get the current user
     */
    getUser(): AuthUser | null;
    /**
     * Sign up with email and password - Step 1: Request OTP
     * This sends an OTP to the user's email for verification
     */
    signUp(credentials: SignUpCredentials): Promise<ApiResult<{
        success: boolean;
        message: string;
        email: string;
        expires_in: number;
    }>>;
    /**
     * Verify signup with OTP - Step 2: Complete registration
     * This verifies the OTP and creates the user account
     */
    verifySignUp(options: {
        email: string;
        code: string;
    }): Promise<ApiResult<AuthSession>>;
    /**
     * Sign in with email and password
     */
    signIn(credentials: SignInCredentials): Promise<ApiResult<AuthSession>>;
    /**
     * Sign out the current user
     */
    signOut(): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Refresh the current session
     */
    refreshSession(): Promise<ApiResult<AuthSession>>;
    /**
     * Send password recovery email
     */
    resetPasswordForEmail(options: PasswordRecoveryOptions): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Reset password with token
     */
    updatePassword(options: PasswordResetOptions): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Get current user profile
     */
    getProfile(): Promise<ApiResult<AuthUser>>;
    /**
     * Update user profile
     */
    updateUser(options: UpdateUserOptions): Promise<ApiResult<AuthUser>>;
    /**
     * Delete current user account
     */
    deleteUser(): Promise<ApiResult<{
        success: boolean;
    }>>;
    /**
     * Set session manually (e.g., from stored tokens)
     */
    setSession(session: AuthSession): void;
}

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    metadata?: Record<string, unknown>;
    source?: string;
}
interface LogQueryOptions {
    level?: 'debug' | 'info' | 'warn' | 'error';
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
    source?: string;
}
declare class LoggingClient {
    private client;
    constructor(client: HttpClient);
    private get basePath();
    /**
     * Get all logs
     */
    getLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>;
    /**
     * Get database logs
     */
    getDatabaseLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>;
    /**
     * Get slow query logs
     */
    getSlowQueryLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>;
    /**
     * Get auth logs
     */
    getAuthLogs(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>;
    /**
     * Get auth failure logs
     */
    getAuthFailures(options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>;
    /**
     * Get edge function logs
     */
    getEdgeFunctionLogs(functionName?: string, options?: LogQueryOptions): Promise<ApiResult<LogEntry[]>>;
}

interface EnvironmentVariable {
    name: string;
    value: string;
    description?: string;
    isSecret?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
declare class EnvironmentClient {
    private client;
    constructor(client: HttpClient);
    private get basePath();
    /**
     * List all environment variables
     */
    list(): Promise<ApiResult<EnvironmentVariable[]>>;
    /**
     * Get a specific environment variable
     */
    get(name: string): Promise<ApiResult<EnvironmentVariable>>;
    /**
     * Create or update an environment variable
     */
    set(name: string, value: string, options?: {
        description?: string;
        isSecret?: boolean;
    }): Promise<ApiResult<EnvironmentVariable>>;
    /**
     * Create a new environment variable
     */
    create(name: string, value: string, options?: {
        description?: string;
        isSecret?: boolean;
    }): Promise<ApiResult<EnvironmentVariable>>;
    /**
     * Bulk create environment variables
     */
    bulkCreate(variables: Array<{
        name: string;
        value: string;
        description?: string;
        isSecret?: boolean;
    }>): Promise<ApiResult<EnvironmentVariable[]>>;
    /**
     * Delete an environment variable
     */
    delete(name: string): Promise<ApiResult<{
        success: boolean;
    }>>;
}

interface StorageFile {
    id: string;
    bucket: string;
    path: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: string;
}
interface StorageListItem {
    name: string;
    size: number;
    createdAt: string;
}
interface UploadOptions {
    cacheControl?: string;
    upsert?: boolean;
}
declare class StorageClient {
    private client;
    constructor(client: HttpClient);
    /**
     * Get a bucket client for performing operations
     */
    from(bucket: string): StorageBucket;
}
declare class StorageBucket {
    private client;
    private bucket;
    constructor(client: HttpClient, bucket: string);
    private get basePath();
    /**
     * Upload a file to the bucket
     */
    upload(path: string, file: Blob | Buffer | ArrayBuffer, options?: UploadOptions): Promise<ApiResult<StorageFile>>;
    /**
     * Download a file from the bucket
     */
    download(path: string): Promise<ApiResult<Blob>>;
    /**
     * Delete files from the bucket
     */
    remove(paths: string[]): Promise<ApiResult<{
        deleted: string[];
        errors: string[];
    }>>;
    /**
     * List files in the bucket
     */
    list(prefix?: string, options?: {
        limit?: number;
    }): Promise<ApiResult<StorageListItem[]>>;
    /**
     * Get public URL for a file
     */
    getPublicUrl(path: string): {
        data: {
            publicUrl: string;
        };
    };
    /**
     * Create the bucket (if it doesn't exist)
     */
    createBucket(): Promise<ApiResult<{
        bucket: string;
        created: boolean;
    }>>;
}

interface OrbitNestClient {
    db: DatabaseClient;
    functions: FunctionsClient;
    auth: AuthClient;
    logs: LoggingClient;
    env: EnvironmentClient;
    storage: StorageClient;
}
/**
 * Create an OrbitNest client instance
 */
declare function createClient(config: OrbitNestConfig): OrbitNestClient;

export { type ApiError, type ApiResponse, type ApiResult, AuthClient, type AuthSession, type AuthUser, DatabaseClient, EnvironmentClient, type EnvironmentVariable, type FunctionInvokeOptions, type FunctionResponse, FunctionsClient, HttpClient, type LogEntry, type LogQueryOptions, LoggingClient, type OrbitNestClient, type OrbitNestConfig, type PaginationOptions, type PasswordRecoveryOptions, type PasswordResetOptions, type QueryResult, type RequestOptions, type RlsPolicy, type SignInCredentials, type SignUpCredentials, StorageBucket, StorageClient, type StorageFile, type StorageListItem, type TableMetadata, type UpdateUserOptions, type UploadOptions, createClient };
