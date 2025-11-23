# OrbitNest Node.js SDK - API Guide

## API Endpoint Reference

### Base URL
```
https://api.orbitnest.io
```

### Authentication
All requests require a Bearer token (API key):
```
Authorization: Bearer <api-key>
```

---

## Authentication Endpoints

Base path: `/api/project/:slug/auth/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Email/password registration |
| POST | `/signin` | Email/password sign in |
| POST | `/signout` | Sign out user |
| POST | `/refresh` | Refresh access token |
| GET | `/user` | Get current user profile |
| PUT | `/user` | Update user profile |
| DELETE | `/user` | Delete user account |
| POST | `/recover` | Request password reset |
| POST | `/reset-password` | Reset password with token |

---

## Database Endpoints

Base path: `/api/project/:slug/database/`

### Query Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sql` | Execute raw SQL query |
| GET | `/tables/list` | List all tables |
| GET | `/tables` | Get table metadata |

### CRUD Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tables/:table/data` | Get table data (with pagination) |
| POST | `/tables/:table/rows` | Insert row |
| PUT | `/tables/:table/rows/:id` | Update row |
| DELETE | `/tables/:table/rows/:id` | Delete row |

### Bulk Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tables/:table/bulk-insert` | Bulk insert |
| PUT | `/tables/:table/bulk-update` | Bulk update |
| DELETE | `/tables/:table/bulk-delete` | Bulk delete |

### RLS (Row Level Security)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tables/:table/rls/enable` | Enable RLS |
| POST | `/tables/:table/rls/disable` | Disable RLS |
| POST | `/tables/:table/policies` | Create policy |
| GET | `/tables/:table/policies` | List policies |
| DELETE | `/tables/:table/policies/:name` | Delete policy |

---

## Edge Functions Endpoints

### Invocation (Public)
Base path: `/api/projects/:slug/functions/v1/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST/GET/PUT/DELETE | `/:functionName` | Invoke function |

### Management (Admin)
Base path: `/api/projects/:projectId/functions/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create function |
| GET | `/` | List functions |
| GET | `/:name` | Get function details |
| PUT | `/:name` | Update function |
| DELETE | `/:name` | Delete function |
| GET | `/:name/logs` | Get function logs |

---

## Environment Variables Endpoints

Base path: `/api/projects/:projectId/environment-variables/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create variable |
| POST | `/bulk` | Bulk create |
| GET | `/` | List variables |
| GET | `/:name` | Get variable |
| PUT | `/:name` | Update variable |
| DELETE | `/:name` | Delete variable |

---

## Logging Endpoints

Base path: `/api/project/:slug/logs/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all logs |
| GET | `/database` | Database logs |
| GET | `/database/slow` | Slow query logs |
| GET | `/auth` | Auth logs |
| GET | `/auth/failures` | Auth failure logs |
| GET | `/edge-functions` | Edge function logs |
| GET | `/edge-functions/:name` | Specific function logs |

---

## API Key Types

### Anonymous Key (`anon`)
- Limited permissions: read, insert
- Safe for client-side use
- Respects RLS policies

### Service Role Key (`service_role`)
- Full permissions: read, insert, update, delete, admin
- Bypasses RLS policies
- **Server-side only** - never expose to clients

---

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Rate Limiting

- Default: 100 requests/minute per API key
- Configurable per project
