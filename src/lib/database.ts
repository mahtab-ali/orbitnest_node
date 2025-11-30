import type { HttpClient } from './client';
import type {
  QueryResult,
  TableMetadata,
  PaginationOptions,
  RlsPolicy,
  ApiResult,
} from '../types';

export class DatabaseClient {
  constructor(private client: HttpClient) {}

  /**
   * Get the base path for client database operations
   * Uses /api/project/:slug/database/* for client SDK authentication (API keys)
   */
  private get basePath(): string {
    return `/api/project/${this.client.getProjectSlug()}/database`;
  }

  /**
   * Execute a raw SQL query
   */
  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<ApiResult<QueryResult<T>>> {
    const result = await this.client.request<{
      success: boolean;
      data: T[];
      rows_affected: number;
      columns?: Array<{ name: string; type: string }>;
    }>(`${this.basePath}/sql`, {
      method: 'POST',
      body: { sql, params },
    });

    if (result.error) {
      return result as ApiResult<QueryResult<T>>;
    }

    // Transform API response to QueryResult format
    return {
      data: {
        rows: result.data.data || [],
        rowCount: result.data.rows_affected || 0,
        fields: result.data.columns?.map(col => ({ name: col.name, dataType: col.type })),
      },
      error: null,
    };
  }

  /**
   * Get all tables in the database
   */
  async listTables(): Promise<ApiResult<string[]>> {
    return this.client.request<string[]>(`${this.basePath}/tables/list`);
  }

  /**
   * Get table metadata including columns
   */
  async getTableMetadata(tableName: string): Promise<ApiResult<TableMetadata>> {
    return this.client.request<TableMetadata>(`${this.basePath}/tables?table=${tableName}`);
  }

  /**
   * Get table data with pagination
   */
  async getTableData<T = Record<string, unknown>>(
    tableName: string,
    options: PaginationOptions = {}
  ): Promise<ApiResult<{ rows: T[]; total: number }>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.client.request<{ rows: T[]; total: number }>(
      `${this.basePath}/tables/${tableName}/data${query}`
    );
  }

  /**
   * Insert a row into a table
   * Note: Requires service_role_key for authentication
   */
  async insert<T = Record<string, unknown>>(
    tableName: string,
    data: Record<string, unknown>
  ): Promise<ApiResult<T>> {
    return this.client.request<T>(`${this.basePath}/tables/${tableName}/rows`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Update a row by ID
   * Note: Requires service_role_key for authentication
   */
  async update<T = Record<string, unknown>>(
    tableName: string,
    rowId: string | number,
    data: Record<string, unknown>
  ): Promise<ApiResult<T>> {
    return this.client.request<T>(`${this.basePath}/tables/${tableName}/rows/${rowId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * Delete a row by ID
   * Note: Requires service_role_key for authentication
   */
  async delete(tableName: string, rowId: string | number): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/tables/${tableName}/rows/${rowId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Bulk insert rows
   * Note: Requires service_role_key for authentication
   */
  async bulkInsert<T = Record<string, unknown>>(
    tableName: string,
    rows: Record<string, unknown>[]
  ): Promise<ApiResult<T[]>> {
    return this.client.request<T[]>(`${this.basePath}/tables/${tableName}/rows/bulk`, {
      method: 'POST',
      body: rows,
    });
  }

  /**
   * Bulk update rows
   * Note: Requires service_role_key for authentication
   */
  async bulkUpdate<T = Record<string, unknown>>(
    tableName: string,
    updates: Array<{ where: Record<string, unknown>; data: Record<string, unknown> }>
  ): Promise<ApiResult<T[]>> {
    return this.client.request<T[]>(`${this.basePath}/tables/${tableName}/rows/bulk`, {
      method: 'PUT',
      body: updates,
    });
  }

  /**
   * Bulk delete rows
   * Note: Requires service_role_key for authentication
   */
  async bulkDelete(
    tableName: string,
    conditions: Record<string, unknown>[]
  ): Promise<ApiResult<{ deleted: number }>> {
    return this.client.request<{ deleted: number }>(
      `${this.basePath}/tables/${tableName}/rows/bulk`,
      {
        method: 'DELETE',
        body: conditions,
      }
    );
  }

  /**
   * Enable Row Level Security on a table
   */
  async enableRls(tableName: string): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/tables/${tableName}/rls/enable`,
      { method: 'POST' }
    );
  }

  /**
   * Disable Row Level Security on a table
   */
  async disableRls(tableName: string): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/tables/${tableName}/rls/disable`,
      { method: 'POST' }
    );
  }

  /**
   * Create an RLS policy
   */
  async createPolicy(tableName: string, policy: RlsPolicy): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/tables/${tableName}/policies`,
      {
        method: 'POST',
        body: policy,
      }
    );
  }

  /**
   * List RLS policies for a table
   */
  async listPolicies(tableName: string): Promise<ApiResult<RlsPolicy[]>> {
    return this.client.request<RlsPolicy[]>(`${this.basePath}/tables/${tableName}/policies`);
  }

  /**
   * Delete an RLS policy
   */
  async deletePolicy(tableName: string, policyName: string): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/tables/${tableName}/policies/${policyName}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Create a fluent query builder for a table
   */
  from(tableName: string): TableQueryBuilder {
    return new TableQueryBuilder(this, tableName);
  }
}

/**
 * Fluent query builder for table operations
 */
class TableQueryBuilder {
  private _pagination: PaginationOptions = {};

  constructor(
    private db: DatabaseClient,
    private tableName: string
  ) {}

  page(num: number): this {
    this._pagination.page = num;
    return this;
  }

  limit(num: number): this {
    this._pagination.limit = num;
    return this;
  }

  orderBy(column: string, order: 'ASC' | 'DESC' = 'ASC'): this {
    this._pagination.sortBy = column;
    this._pagination.sortOrder = order;
    return this;
  }

  async select<T = Record<string, unknown>>(): Promise<ApiResult<{ rows: T[]; total: number }>> {
    return this.db.getTableData<T>(this.tableName, this._pagination);
  }

  async insert<T = Record<string, unknown>>(data: Record<string, unknown>): Promise<ApiResult<T>> {
    return this.db.insert<T>(this.tableName, data);
  }

  async update<T = Record<string, unknown>>(
    id: string | number,
    data: Record<string, unknown>
  ): Promise<ApiResult<T>> {
    return this.db.update<T>(this.tableName, id, data);
  }

  async delete(id: string | number): Promise<ApiResult<{ success: boolean }>> {
    return this.db.delete(this.tableName, id);
  }
}
