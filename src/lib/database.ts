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

  private get basePath(): string {
    return `/api/project/${this.client.getProjectSlug()}`;
  }

  /**
   * Execute a raw SQL query
   */
  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<ApiResult<QueryResult<T>>> {
    return this.client.request<QueryResult<T>>(`${this.basePath}/database/sql`, {
      method: 'POST',
      body: { query: sql, params },
    });
  }

  /**
   * Get all tables in the database
   */
  async listTables(): Promise<ApiResult<string[]>> {
    return this.client.request<string[]>(`${this.basePath}/database/tables/list`);
  }

  /**
   * Get table metadata including columns
   */
  async getTableMetadata(tableName: string): Promise<ApiResult<TableMetadata>> {
    return this.client.request<TableMetadata>(`${this.basePath}/database/tables?table=${tableName}`);
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
      `${this.basePath}/database/tables/${tableName}/data${query}`
    );
  }

  /**
   * Insert a row into a table
   */
  async insert<T = Record<string, unknown>>(
    tableName: string,
    data: Record<string, unknown>
  ): Promise<ApiResult<T>> {
    return this.client.request<T>(`${this.basePath}/database/tables/${tableName}/rows`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Update a row by ID
   */
  async update<T = Record<string, unknown>>(
    tableName: string,
    rowId: string | number,
    data: Record<string, unknown>
  ): Promise<ApiResult<T>> {
    return this.client.request<T>(`${this.basePath}/database/tables/${tableName}/rows/${rowId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * Delete a row by ID
   */
  async delete(tableName: string, rowId: string | number): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/database/tables/${tableName}/rows/${rowId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Bulk insert rows
   */
  async bulkInsert<T = Record<string, unknown>>(
    tableName: string,
    rows: Record<string, unknown>[]
  ): Promise<ApiResult<T[]>> {
    return this.client.request<T[]>(`${this.basePath}/database/tables/${tableName}/bulk-insert`, {
      method: 'POST',
      body: { rows },
    });
  }

  /**
   * Bulk update rows
   */
  async bulkUpdate<T = Record<string, unknown>>(
    tableName: string,
    updates: Array<{ id: string | number; data: Record<string, unknown> }>
  ): Promise<ApiResult<T[]>> {
    return this.client.request<T[]>(`${this.basePath}/database/tables/${tableName}/bulk-update`, {
      method: 'PUT',
      body: { updates },
    });
  }

  /**
   * Bulk delete rows
   */
  async bulkDelete(
    tableName: string,
    ids: Array<string | number>
  ): Promise<ApiResult<{ deleted: number }>> {
    return this.client.request<{ deleted: number }>(
      `${this.basePath}/database/tables/${tableName}/bulk-delete`,
      {
        method: 'DELETE',
        body: { ids },
      }
    );
  }

  /**
   * Enable Row Level Security on a table
   */
  async enableRls(tableName: string): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/database/tables/${tableName}/rls/enable`,
      { method: 'POST' }
    );
  }

  /**
   * Disable Row Level Security on a table
   */
  async disableRls(tableName: string): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/database/tables/${tableName}/rls/disable`,
      { method: 'POST' }
    );
  }

  /**
   * Create an RLS policy
   */
  async createPolicy(tableName: string, policy: RlsPolicy): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/database/tables/${tableName}/policies`,
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
    return this.client.request<RlsPolicy[]>(`${this.basePath}/database/tables/${tableName}/policies`);
  }

  /**
   * Delete an RLS policy
   */
  async deletePolicy(tableName: string, policyName: string): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(
      `${this.basePath}/database/tables/${tableName}/policies/${policyName}`,
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
