# OrbitNest Node.js SDK - Migration Guide

## Migrating from Supabase

This guide helps you migrate from `@supabase/supabase-js` to `@orbitnest/node`.

---

## 1. Installation

**Remove Supabase:**
```bash
npm uninstall @supabase/supabase-js
```

**Install OrbitNest:**
```bash
npm install @orbitnest/node
```

---

## 2. Client Initialization

### Before (Supabase)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xxx.supabase.co',
  'your-anon-key'
);
```

### After (OrbitNest)
```typescript
import { createClient } from '@orbitnest/node';

const orbitnest = createClient({
  projectSlug: 'my-project',
  apiKey: process.env.ORBITNEST_API_KEY!
});
```

---

## 3. Database Operations

### Select Query

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('status', 'active');
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.db
  .from('users')
  .limit(100)
  .select();

// Or with raw SQL for filtering
const { data, error } = await orbitnest.db.query(
  "SELECT * FROM users WHERE status = $1",
  ['active']
);
```

### Insert

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' });
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.db.insert('users', {
  name: 'John',
  email: 'john@example.com'
});
```

### Update

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Jane' })
  .eq('id', 123);
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.db.update('users', '123', {
  name: 'Jane'
});
```

### Delete

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 123);
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.db.delete('users', '123');
```

### RPC / Raw SQL

**Supabase:**
```typescript
const { data, error } = await supabase.rpc('my_function', { arg: 'value' });
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.db.query(
  'SELECT * FROM my_function($1)',
  ['value']
);
```

---

## 4. Authentication

### Sign Up

**Supabase:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign In

**Supabase:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.auth.signIn({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out

**Supabase:**
```typescript
await supabase.auth.signOut();
```

**OrbitNest:**
```typescript
await orbitnest.auth.signOut();
```

### Get User

**Supabase:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**OrbitNest:**
```typescript
const user = orbitnest.auth.getUser();
// Or fetch from API
const { data: user } = await orbitnest.auth.getProfile();
```

---

## 5. Edge Functions

**Supabase:**
```typescript
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { key: 'value' }
});
```

**OrbitNest:**
```typescript
const { data, error } = await orbitnest.functions.invoke('my-function', {
  body: { key: 'value' }
});
```

---

## 6. Key Differences

| Feature | Supabase | OrbitNest |
|---------|----------|-----------|
| Client Config | URL + Key | Slug + Key |
| Query Filters | Chainable `.eq()` etc | SQL or fluent builder |
| Response Format | `{ data, error }` | `{ data, error }` (same) |
| Auth Methods | `.signInWithPassword()` | `.signIn()` |
| RPC Calls | `.rpc()` | `.db.query()` |

---

## 7. Migration Checklist

- [ ] Update `package.json` dependencies
- [ ] Update import statements
- [ ] Replace client initialization
- [ ] Update database queries
- [ ] Update authentication calls
- [ ] Update edge function calls
- [ ] Update environment variables
- [ ] Test all functionality

---

## 8. Environment Variables

**Before:**
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

**After:**
```env
ORBITNEST_PROJECT_SLUG=my-project
ORBITNEST_ANON_KEY=your-anon-key
ORBITNEST_SERVICE_KEY=your-service-key
ORBITNEST_BASE_URL=https://api.orbitnest.io
```

---

## 9. Benefits of Migration

1. **Better Node.js Support**: Native TypeScript, modern APIs
2. **Unified SDK**: Consistent patterns across platforms
3. **Enhanced Features**: Logging, environment variables built-in
4. **Simpler Auth**: Streamlined authentication methods
5. **Better Error Handling**: Consistent error format across all operations

---

## Support

For migration assistance:
- [API Guide](./00_api_guide.md)
- [Implementation Guide](./01_package_implementation.md)
- [Package Guide](./002_package_guide.md)
