# OrbitNest Node.js SDK - User Guide

## Installation

```bash
npm install @orbitnest/node
```

## Quick Start

```typescript
import { createClient } from '@orbitnest/node';

const client = createClient({
  projectSlug: 'my-project',
  apiKey: process.env.ORBITNEST_API_KEY!,
});
```

---

## Database Operations

### Raw SQL Queries

```typescript
const { data, error } = await client.db.query(
  'SELECT * FROM users WHERE age > $1',
  [18]
);

if (error) {
  console.error(error.message);
  return;
}

console.log(data.rows);
```

### CRUD Operations

```typescript
// Insert
const { data: newUser } = await client.db.insert('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Update
await client.db.update('users', '123', { name: 'Jane Doe' });

// Delete
await client.db.delete('users', '123');

// Select with pagination
const { data } = await client.db.getTableData('users', {
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'DESC'
});
```

### Fluent Query Builder

```typescript
const { data } = await client.db
  .from('users')
  .limit(10)
  .orderBy('created_at', 'DESC')
  .select();
```

### Bulk Operations

```typescript
// Bulk insert
await client.db.bulkInsert('users', [
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' }
]);

// Bulk delete
await client.db.bulkDelete('users', ['id-1', 'id-2', 'id-3']);
```

### Row Level Security

```typescript
// Enable RLS
await client.db.enableRls('users');

// Create policy
await client.db.createPolicy('users', {
  name: 'users_select_own',
  command: 'SELECT',
  definition: 'auth.uid() = user_id'
});

// List policies
const { data: policies } = await client.db.listPolicies('users');

// Delete policy
await client.db.deletePolicy('users', 'users_select_own');
```

---

## Edge Functions

### Basic Invocation

```typescript
const { data, error } = await client.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Welcome!',
    message: 'Hello World'
  }
});
```

### With Different HTTP Methods

```typescript
// GET request
await client.functions.invoke('get-data', { method: 'GET' });

// PUT request
await client.functions.invoke('update-data', {
  method: 'PUT',
  body: { key: 'value' }
});

// Custom headers
await client.functions.invoke('api-call', {
  method: 'POST',
  body: { data: 'test' },
  headers: { 'X-Custom-Header': 'value' }
});
```

---

## Authentication

### Sign Up / Sign In

```typescript
// Sign up
const { data: session, error } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  metadata: { name: 'John Doe' }
});

// Sign in
const { data: session } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'securePassword123'
});

// Get current session
const session = client.auth.getSession();
const user = client.auth.getUser();
```

### Session Management

```typescript
// Refresh token
await client.auth.refreshSession();

// Sign out
await client.auth.signOut();

// Manually set session (e.g., from stored tokens)
client.auth.setSession(storedSession);
```

### Password Recovery

```typescript
// Request reset email
await client.auth.resetPasswordForEmail({
  email: 'user@example.com'
});

// Reset with token
await client.auth.updatePassword({
  token: 'reset-token-from-email',
  password: 'newSecurePassword'
});
```

### Profile Management

```typescript
// Get profile
const { data: user } = await client.auth.getProfile();

// Update profile
await client.auth.updateUser({
  metadata: { name: 'New Name' }
});

// Delete account
await client.auth.deleteUser();
```

---

## Logging

### Query Logs

```typescript
// Get all logs
const { data: logs } = await client.logs.getLogs({
  level: 'error',
  since: new Date('2024-01-01'),
  limit: 100
});

// Database logs
const { data: dbLogs } = await client.logs.getDatabaseLogs({ limit: 50 });

// Slow queries
const { data: slowQueries } = await client.logs.getSlowQueryLogs();

// Auth logs
const { data: authLogs } = await client.logs.getAuthLogs();

// Edge function logs
const { data: funcLogs } = await client.logs.getEdgeFunctionLogs('my-function');
```

---

## Environment Variables

### Manage Variables

```typescript
// List all
const { data: vars } = await client.env.list();

// Get one
const { data: apiUrl } = await client.env.get('API_URL');

// Create
await client.env.create('NEW_VAR', 'value', {
  description: 'My variable',
  isSecret: true
});

// Update
await client.env.set('EXISTING_VAR', 'new-value');

// Bulk create
await client.env.bulkCreate([
  { name: 'VAR_1', value: 'value1' },
  { name: 'VAR_2', value: 'value2', isSecret: true }
]);

// Delete
await client.env.delete('OLD_VAR');
```

---

## Error Handling

All methods return `{ data, error }`:

```typescript
const { data, error } = await client.db.query('SELECT * FROM users');

if (error) {
  switch (error.code) {
    case 'TIMEOUT':
      console.log('Request timed out');
      break;
    case 'NETWORK_ERROR':
      console.log('Network error');
      break;
    default:
      console.error(`Error ${error.status}: ${error.message}`);
  }
  return;
}

// Safe to use data
console.log(data.rows);
```

---

## Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `projectSlug` | string | Yes | - | Project identifier |
| `apiKey` | string | Yes | - | API key (anon or service_role) |
| `baseUrl` | string | No | `https://api.orbitnest.io` | API base URL |
| `timeout` | number | No | `30000` | Request timeout (ms) |

---

## Best Practices

### 1. Use Environment Variables
```typescript
const client = createClient({
  projectSlug: process.env.ORBITNEST_PROJECT!,
  apiKey: process.env.ORBITNEST_API_KEY!
});
```

### 2. Handle Errors Consistently
```typescript
async function safeQuery<T>(query: string): Promise<T | null> {
  const { data, error } = await client.db.query(query);
  if (error) {
    console.error(`Query failed: ${error.message}`);
    return null;
  }
  return data.rows as T;
}
```

### 3. Use Service Role Key Only Server-Side
```typescript
// Server-side only
const adminClient = createClient({
  projectSlug: 'my-project',
  apiKey: process.env.ORBITNEST_SERVICE_KEY! // Full permissions
});

// Client-side safe
const publicClient = createClient({
  projectSlug: 'my-project',
  apiKey: process.env.ORBITNEST_ANON_KEY! // Limited permissions
});
```

### 4. Leverage RLS for Security
```typescript
// Enable RLS on sensitive tables
await client.db.enableRls('user_data');

// Create restrictive policies
await client.db.createPolicy('user_data', {
  name: 'select_own_data',
  command: 'SELECT',
  definition: 'auth.uid() = user_id'
});
```
