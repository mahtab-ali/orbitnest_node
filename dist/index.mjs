// src/lib/client.ts
var HttpClient = class {
  constructor(config) {
    this.baseUrl = (config.baseUrl || "https://api.orbitnest.io").replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.projectSlug = config.projectSlug;
    this.timeout = config.timeout || 3e4;
  }
  getProjectSlug() {
    return this.projectSlug;
  }
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);
    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          data: null,
          error: {
            message: data?.message || data?.error || `Request failed with status ${response.status}`,
            code: data?.code || data?.statusCode?.toString(),
            status: response.status
          }
        };
      }
      return { data, error: null };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        return {
          data: null,
          error: { message: "Request timeout", code: "TIMEOUT" }
        };
      }
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Unknown error",
          code: "NETWORK_ERROR"
        }
      };
    }
  }
};

// src/lib/database.ts
var DatabaseClient = class {
  constructor(client) {
    this.client = client;
  }
  get basePath() {
    return `/api/projects/${this.client.getProjectSlug()}/database`;
  }
  /**
   * Execute a raw SQL query
   */
  async query(sql, params) {
    return this.client.request(`${this.basePath}/sql`, {
      method: "POST",
      body: { query: sql, params }
    });
  }
  /**
   * Get all tables in the database
   */
  async listTables() {
    return this.client.request(`${this.basePath}/tables/list`);
  }
  /**
   * Get table metadata including columns
   */
  async getTableMetadata(tableName) {
    return this.client.request(`${this.basePath}/tables?table=${tableName}`);
  }
  /**
   * Get table data with pagination
   */
  async getTableData(tableName, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", options.page.toString());
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.sortBy) params.set("sortBy", options.sortBy);
    if (options.sortOrder) params.set("sortOrder", options.sortOrder);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(
      `${this.basePath}/tables/${tableName}/data${query}`
    );
  }
  /**
   * Insert a row into a table
   */
  async insert(tableName, data) {
    return this.client.request(`${this.basePath}/tables/${tableName}/rows`, {
      method: "POST",
      body: data
    });
  }
  /**
   * Update a row by ID
   */
  async update(tableName, rowId, data) {
    return this.client.request(`${this.basePath}/tables/${tableName}/rows/${rowId}`, {
      method: "PUT",
      body: data
    });
  }
  /**
   * Delete a row by ID
   */
  async delete(tableName, rowId) {
    return this.client.request(
      `${this.basePath}/tables/${tableName}/rows/${rowId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Bulk insert rows
   */
  async bulkInsert(tableName, rows) {
    return this.client.request(`${this.basePath}/tables/${tableName}/bulk-insert`, {
      method: "POST",
      body: { rows }
    });
  }
  /**
   * Bulk update rows
   */
  async bulkUpdate(tableName, updates) {
    return this.client.request(`${this.basePath}/tables/${tableName}/bulk-update`, {
      method: "PUT",
      body: { updates }
    });
  }
  /**
   * Bulk delete rows
   */
  async bulkDelete(tableName, ids) {
    return this.client.request(
      `${this.basePath}/tables/${tableName}/bulk-delete`,
      {
        method: "DELETE",
        body: { ids }
      }
    );
  }
  /**
   * Enable Row Level Security on a table
   */
  async enableRls(tableName) {
    return this.client.request(
      `${this.basePath}/tables/${tableName}/rls/enable`,
      { method: "POST" }
    );
  }
  /**
   * Disable Row Level Security on a table
   */
  async disableRls(tableName) {
    return this.client.request(
      `${this.basePath}/tables/${tableName}/rls/disable`,
      { method: "POST" }
    );
  }
  /**
   * Create an RLS policy
   */
  async createPolicy(tableName, policy) {
    return this.client.request(
      `${this.basePath}/tables/${tableName}/policies`,
      {
        method: "POST",
        body: policy
      }
    );
  }
  /**
   * List RLS policies for a table
   */
  async listPolicies(tableName) {
    return this.client.request(`${this.basePath}/tables/${tableName}/policies`);
  }
  /**
   * Delete an RLS policy
   */
  async deletePolicy(tableName, policyName) {
    return this.client.request(
      `${this.basePath}/tables/${tableName}/policies/${policyName}`,
      { method: "DELETE" }
    );
  }
  /**
   * Create a fluent query builder for a table
   */
  from(tableName) {
    return new TableQueryBuilder(this, tableName);
  }
};
var TableQueryBuilder = class {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
    this._pagination = {};
  }
  page(num) {
    this._pagination.page = num;
    return this;
  }
  limit(num) {
    this._pagination.limit = num;
    return this;
  }
  orderBy(column, order = "ASC") {
    this._pagination.sortBy = column;
    this._pagination.sortOrder = order;
    return this;
  }
  async select() {
    return this.db.getTableData(this.tableName, this._pagination);
  }
  async insert(data) {
    return this.db.insert(this.tableName, data);
  }
  async update(id, data) {
    return this.db.update(this.tableName, id, data);
  }
  async delete(id) {
    return this.db.delete(this.tableName, id);
  }
};

// src/lib/functions.ts
var FunctionsClient = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Invoke an edge function
   */
  async invoke(functionName, options = {}) {
    const path = `/api/projects/${this.client.getProjectSlug()}/functions/v1/${functionName}`;
    const result = await this.client.request(path, {
      method: options.method || "POST",
      body: options.body,
      headers: options.headers
    });
    if (result.error) {
      return result;
    }
    return {
      data: {
        data: result.data,
        status: 200,
        headers: {}
      },
      error: null
    };
  }
};

// src/lib/auth.ts
var AuthClient = class {
  constructor(client) {
    this.client = client;
    this.session = null;
  }
  get basePath() {
    return `/api/projects/${this.client.getProjectSlug()}/auth`;
  }
  /**
   * Get the current session
   */
  getSession() {
    return this.session;
  }
  /**
   * Get the current user
   */
  getUser() {
    return this.session?.user || null;
  }
  /**
   * Sign up with email and password - Step 1: Request OTP
   * This sends an OTP to the user's email for verification
   */
  async signUp(credentials) {
    const result = await this.client.request(`${this.basePath}/signup`, {
      method: "POST",
      body: {
        email: credentials.email,
        password: credentials.password,
        user_metadata: credentials.metadata
      }
    });
    return result;
  }
  /**
   * Verify signup with OTP - Step 2: Complete registration
   * This verifies the OTP and creates the user account
   */
  async verifySignUp(options) {
    const result = await this.client.request(`${this.basePath}/verify-signup`, {
      method: "POST",
      body: {
        email: options.email,
        code: options.code
      }
    });
    if (result.data) {
      this.session = result.data;
    }
    return result;
  }
  /**
   * Sign in with email and password
   */
  async signIn(credentials) {
    const result = await this.client.request(`${this.basePath}/signin`, {
      method: "POST",
      body: {
        email: credentials.email,
        password: credentials.password
      }
    });
    if (result.data) {
      this.session = result.data;
    }
    return result;
  }
  /**
   * Sign out the current user
   */
  async signOut() {
    if (!this.session) {
      return { data: { success: true }, error: null };
    }
    const result = await this.client.request(`${this.basePath}/signout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.session.access_token}`
      }
    });
    this.session = null;
    return result;
  }
  /**
   * Refresh the current session
   */
  async refreshSession() {
    if (!this.session?.refresh_token) {
      return {
        data: null,
        error: { message: "No refresh token available", code: "NO_SESSION" }
      };
    }
    const result = await this.client.request(`${this.basePath}/refresh`, {
      method: "POST",
      body: { refresh_token: this.session.refresh_token }
    });
    if (result.data) {
      this.session = result.data;
    }
    return result;
  }
  /**
   * Send password recovery email
   */
  async resetPasswordForEmail(options) {
    return this.client.request(`${this.basePath}/recover-password`, {
      method: "POST",
      body: { email: options.email }
    });
  }
  /**
   * Reset password with token
   */
  async updatePassword(options) {
    return this.client.request(`${this.basePath}/reset-password`, {
      method: "POST",
      body: {
        token: options.token,
        password: options.password
      }
    });
  }
  /**
   * Get current user profile
   */
  async getProfile() {
    if (!this.session?.access_token) {
      return {
        data: null,
        error: { message: "No active session", code: "NO_SESSION" }
      };
    }
    return this.client.request(`${this.basePath}/user`, {
      headers: {
        Authorization: `Bearer ${this.session.access_token}`
      }
    });
  }
  /**
   * Update user profile
   */
  async updateUser(options) {
    if (!this.session?.access_token) {
      return {
        data: null,
        error: { message: "No active session", code: "NO_SESSION" }
      };
    }
    return this.client.request(`${this.basePath}/user`, {
      method: "PUT",
      body: options,
      headers: {
        Authorization: `Bearer ${this.session.access_token}`
      }
    });
  }
  /**
   * Delete current user account
   */
  async deleteUser() {
    if (!this.session?.access_token) {
      return {
        data: null,
        error: { message: "No active session", code: "NO_SESSION" }
      };
    }
    const result = await this.client.request(`${this.basePath}/user`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.session.access_token}`
      }
    });
    if (result.data) {
      this.session = null;
    }
    return result;
  }
  /**
   * Set session manually (e.g., from stored tokens)
   */
  setSession(session) {
    this.session = session;
  }
};

// src/lib/logging.ts
var LoggingClient = class {
  constructor(client) {
    this.client = client;
  }
  get basePath() {
    return `/api/projects/${this.client.getProjectSlug()}/logs`;
  }
  /**
   * Get all logs
   */
  async getLogs(options = {}) {
    const params = new URLSearchParams();
    if (options.level) params.set("level", options.level);
    if (options.since) params.set("since", options.since.toISOString());
    if (options.until) params.set("until", options.until.toISOString());
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    if (options.source) params.set("source", options.source);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(`${this.basePath}${query}`);
  }
  /**
   * Get database logs
   */
  async getDatabaseLogs(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.since) params.set("since", options.since.toISOString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(`${this.basePath}/database${query}`);
  }
  /**
   * Get slow query logs
   */
  async getSlowQueryLogs(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(`${this.basePath}/database/slow${query}`);
  }
  /**
   * Get auth logs
   */
  async getAuthLogs(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.since) params.set("since", options.since.toISOString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(`${this.basePath}/auth${query}`);
  }
  /**
   * Get auth failure logs
   */
  async getAuthFailures(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(`${this.basePath}/auth/failures${query}`);
  }
  /**
   * Get edge function logs
   */
  async getEdgeFunctionLogs(functionName, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.since) params.set("since", options.since.toISOString());
    const query = params.toString() ? `?${params.toString()}` : "";
    const path = functionName ? `${this.basePath}/edge-functions/${functionName}` : `${this.basePath}/edge-functions`;
    return this.client.request(`${path}${query}`);
  }
};

// src/lib/environment.ts
var EnvironmentClient = class {
  constructor(client) {
    this.client = client;
  }
  get basePath() {
    return `/api/projects/${this.client.getProjectSlug()}/environment-variables`;
  }
  /**
   * List all environment variables
   */
  async list() {
    return this.client.request(this.basePath);
  }
  /**
   * Get a specific environment variable
   */
  async get(name) {
    return this.client.request(`${this.basePath}/${name}`);
  }
  /**
   * Create or update an environment variable
   */
  async set(name, value, options = {}) {
    return this.client.request(`${this.basePath}/${name}`, {
      method: "PUT",
      body: {
        value,
        description: options.description,
        is_secret: options.isSecret
      }
    });
  }
  /**
   * Create a new environment variable
   */
  async create(name, value, options = {}) {
    return this.client.request(this.basePath, {
      method: "POST",
      body: {
        name,
        value,
        description: options.description,
        is_secret: options.isSecret
      }
    });
  }
  /**
   * Bulk create environment variables
   */
  async bulkCreate(variables) {
    return this.client.request(`${this.basePath}/bulk`, {
      method: "POST",
      body: { variables }
    });
  }
  /**
   * Delete an environment variable
   */
  async delete(name) {
    return this.client.request(`${this.basePath}/${name}`, {
      method: "DELETE"
    });
  }
};

// src/lib/storage.ts
var StorageClient = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Get a bucket client for performing operations
   */
  from(bucket) {
    return new StorageBucket(this.client, bucket);
  }
};
var StorageBucket = class {
  constructor(client, bucket) {
    this.client = client;
    this.bucket = bucket;
  }
  get basePath() {
    return `/api/projects/${this.client.getProjectSlug()}/storage/${this.bucket}`;
  }
  /**
   * Upload a file to the bucket
   */
  async upload(path, file, options) {
    const formData = new FormData();
    let blob;
    if (file instanceof Blob) {
      blob = file;
    } else if (file instanceof ArrayBuffer) {
      blob = new Blob([file]);
    } else if (Buffer.isBuffer(file)) {
      blob = new Blob([file]);
    } else {
      blob = new Blob([file]);
    }
    formData.append("file", blob, path.split("/").pop() || "file");
    formData.append("path", path);
    if (options?.upsert) {
      formData.append("upsert", "true");
    }
    const url = `${this.basePath}/upload`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.client.apiKey}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          data: null,
          error: {
            message: data?.message || "Upload failed",
            status: response.status
          }
        };
      }
      return { data: data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Upload failed",
          code: "UPLOAD_ERROR"
        }
      };
    }
  }
  /**
   * Download a file from the bucket
   */
  async download(path) {
    const url = `${this.basePath}/${path}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.client.apiKey}`
        }
      });
      if (!response.ok) {
        return {
          data: null,
          error: {
            message: "Download failed",
            status: response.status
          }
        };
      }
      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Download failed",
          code: "DOWNLOAD_ERROR"
        }
      };
    }
  }
  /**
   * Delete files from the bucket
   */
  async remove(paths) {
    return this.client.request(this.basePath, {
      method: "DELETE",
      body: { paths }
    });
  }
  /**
   * List files in the bucket
   */
  async list(prefix, options) {
    const params = new URLSearchParams();
    if (prefix) params.set("prefix", prefix);
    if (options?.limit) params.set("limit", options.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(`${this.basePath}${query}`);
  }
  /**
   * Get public URL for a file
   */
  getPublicUrl(path) {
    const baseUrl = this.client.baseUrl || "https://api.orbitnest.io";
    const projectSlug = this.client.getProjectSlug();
    const publicUrl = `${baseUrl}/api/projects/${projectSlug}/storage/${this.bucket}/${path}`;
    return {
      data: { publicUrl }
    };
  }
  /**
   * Create the bucket (if it doesn't exist)
   */
  async createBucket() {
    return this.client.request(
      `${this.basePath}/create`,
      { method: "POST" }
    );
  }
};

// src/index.ts
function createClient(config) {
  if (!config.projectSlug) {
    throw new Error("OrbitNest: projectSlug is required");
  }
  if (!config.apiKey) {
    throw new Error("OrbitNest: apiKey is required");
  }
  const httpClient = new HttpClient(config);
  return {
    db: new DatabaseClient(httpClient),
    functions: new FunctionsClient(httpClient),
    auth: new AuthClient(httpClient),
    logs: new LoggingClient(httpClient),
    env: new EnvironmentClient(httpClient),
    storage: new StorageClient(httpClient)
  };
}
export {
  AuthClient,
  DatabaseClient,
  EnvironmentClient,
  FunctionsClient,
  HttpClient,
  LoggingClient,
  StorageBucket,
  StorageClient,
  createClient
};
