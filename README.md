# @orbitnest/node

Official Node.js SDK for OrbitNest platform.

See [docs/README.md](docs/README.md) for full documentation.

## Quick Start

```bash
npm install @orbitnest/node
```

```typescript
import { createClient } from '@orbitnest/node';

const client = createClient({
  projectSlug: 'my-project',
  apiKey: process.env.ORBITNEST_API_KEY!
});

// Database
const { data } = await client.db.query('SELECT * FROM users');

// Functions
await client.functions.invoke('my-function', { body: { data: 'test' } });

// Auth
await client.auth.signUp({ email: 'user@example.com', password: 'password' });
```

## License

MIT
