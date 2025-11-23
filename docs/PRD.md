# OrbitNest Node.js SDK - Product Requirements Document

## Overview
Node.js SDK for interacting with OrbitNest platform APIs. Provides secure, project-scoped access using API keys.

## Core Requirements

### Authentication
- Support for `anon` and `service_role` API keys
- API key passed via configuration
- All requests authenticated via Bearer token
- Project identified by slug

### Configuration
```typescript
{
  projectSlug: string;    // Required: project identifier
  apiKey: string;         // Required: anon or service_role key
  baseUrl?: string;       // Optional: defaults to https://api.orbitnest.io
}
```

### Features

#### 1. Database Operations
- Execute SQL queries
- CRUD operations on tables
- Bulk operations (insert, update, delete)
- RLS policy management

#### 2. Edge Functions
- Invoke functions (GET, POST, PUT, DELETE)
- Pass headers and body

#### 3. Project Auth (User Management)
- User signup/signin
- Token refresh
- Password recovery
- User profile management

### Security
- API keys stored securely (never logged)
- HTTPS only
- Request timeout configuration
- Error handling without exposing internals

### API Design
```typescript
const client = createClient({
  projectSlug: 'my-project',
  apiKey: 'your-api-key'
});

// Database
await client.db.query('SELECT * FROM users');
await client.db.from('users').select();
await client.db.from('users').insert({ name: 'John' });

// Functions
await client.functions.invoke('my-function', { body: { data: 'test' } });

// Auth
await client.auth.signUp({ email, password });
await client.auth.signIn({ email, password });
```

## Out of Scope
- Admin/management operations (create projects, manage API keys)
- Real-time subscriptions
- File storage

## Success Criteria
- Type-safe API
- Clear error messages
- < 50KB bundle size
- Zero runtime dependencies (except fetch polyfill)
