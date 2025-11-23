# @orbitnest/node

Node.js SDK for OrbitNest platform.

## Installation

```bash
npm install @orbitnest/node
```

## Quick Start

```typescript
import { createClient } from '@orbitnest/node';

const client = createClient({
  projectSlug: 'my-project',
  apiKey: 'your-api-key',
  // baseUrl: 'https://api.orbitnest.io' (default)
});
```

## Database Operations

```typescript
// Raw SQL query
const { data, error } = await client.db.query('SELECT * FROM users WHERE id = $1', [1]);

// List tables
const { data: tables } = await client.db.listTables();

// CRUD operations
await client.db.insert('users', { name: 'John', email: 'john@example.com' });
await client.db.update('users', 1, { name: 'John Doe' });
await client.db.delete('users', 1);

// Fluent API
const { data } = await client.db
  .from('users')
  .limit(10)
  .orderBy('created_at', 'DESC')
  .select();

// Bulk operations
await client.db.bulkInsert('users', [{ name: 'A' }, { name: 'B' }]);
await client.db.bulkDelete('users', [1, 2, 3]);

// RLS policies
await client.db.enableRls('users');
await client.db.createPolicy('users', {
  name: 'users_select_own',
  command: 'SELECT',
  definition: 'auth.uid() = user_id'
});
```

## Edge Functions

```typescript
const { data, error } = await client.functions.invoke('process-payment', {
  method: 'POST',
  body: { amount: 100, currency: 'USD' },
  headers: { 'X-Custom': 'value' }
});
```

## Authentication

```typescript
// Sign up
const { data, error } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  metadata: { name: 'John' }
});

// Sign in
await client.auth.signIn({ email: 'user@example.com', password: 'password' });

// Get session/user
const session = client.auth.getSession();
const user = client.auth.getUser();

// Refresh token
await client.auth.refreshSession();

// Password recovery
await client.auth.resetPasswordForEmail({ email: 'user@example.com' });

// Sign out
await client.auth.signOut();
```

## Error Handling

All methods return `{ data, error }`:

```typescript
const { data, error } = await client.db.query('SELECT * FROM users');

if (error) {
  console.error(error.message, error.code, error.status);
  return;
}

console.log(data.rows);
```

## Configuration

| Option | Type | Required | Default |
|--------|------|----------|---------|
| `projectSlug` | string | Yes | - |
| `apiKey` | string | Yes | - |
| `baseUrl` | string | No | `https://api.orbitnest.io` |
| `timeout` | number | No | `30000` |

## API Keys

- **anon key**: Limited permissions (read, insert)
- **service_role key**: Full permissions including admin access and RLS bypass

Use `service_role` only in server-side code. Never expose it client-side.
