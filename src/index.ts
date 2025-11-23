import { HttpClient } from './lib/client';
import { DatabaseClient } from './lib/database';
import { FunctionsClient } from './lib/functions';
import { AuthClient } from './lib/auth';
import { LoggingClient } from './lib/logging';
import { EnvironmentClient } from './lib/environment';
import type { OrbitNestConfig } from './types';

export * from './types';
export * from './lib/logging';
export * from './lib/environment';

export interface OrbitNestClient {
  db: DatabaseClient;
  functions: FunctionsClient;
  auth: AuthClient;
  logs: LoggingClient;
  env: EnvironmentClient;
}

/**
 * Create an OrbitNest client instance
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
    logs: new LoggingClient(httpClient),
    env: new EnvironmentClient(httpClient),
  };
}

export { HttpClient, DatabaseClient, FunctionsClient, AuthClient, LoggingClient, EnvironmentClient };
