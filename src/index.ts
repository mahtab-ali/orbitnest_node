import { HttpClient } from './lib/client';
import { DatabaseClient } from './lib/database';
import { FunctionsClient } from './lib/functions';
import { AuthClient } from './lib/auth';
import type { OrbitNestConfig } from './types';

export * from './types';

export interface OrbitNestClient {
  db: DatabaseClient;
  functions: FunctionsClient;
  auth: AuthClient;
}

/**
 * Create an OrbitNest client instance
 *
 * @example
 * ```typescript
 * import { createClient } from '@orbitnest/node';
 *
 * const client = createClient({
 *   projectSlug: 'my-project',
 *   apiKey: 'your-api-key'
 * });
 *
 * // Database operations
 * const { data, error } = await client.db.query('SELECT * FROM users');
 *
 * // Edge functions
 * await client.functions.invoke('my-function', { body: { key: 'value' } });
 *
 * // Auth
 * await client.auth.signUp({ email: 'user@example.com', password: 'password' });
 * ```
 */
export function createClient(config: OrbitNestConfig): OrbitNestClient {
  if (!config.projectSlug) {
    throw new Error('OrbitNest: projectSlug is required');
  }
  if (!config.apiKey) {
    throw new Error('OrbitNest: apiKey is required');
  }

  const httpClient = new HttpClient(config);

  return {
    db: new DatabaseClient(httpClient),
    functions: new FunctionsClient(httpClient),
    auth: new AuthClient(httpClient),
  };
}

export { HttpClient, DatabaseClient, FunctionsClient, AuthClient };
