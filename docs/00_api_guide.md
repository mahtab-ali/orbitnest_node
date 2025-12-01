# API Documentation (Swagger)

The OrbitNest Studio API provides comprehensive OpenAPI/Swagger documentation for all endpoints.

## Access Documentation

### Development
- **Local**: http://localhost:3000/api/docs
- **Network**: http://[your-ip]:3000/api/docs

### Production
- **Live API**: https://api.orbitnest.io/api/docs
- **OpenAPI JSON**: https://api.orbitnest.io/api/docs-json

## Authentication Architecture

OrbitNest Studio uses **two separate authentication systems** for different purposes:

### 1. Admin Authentication (Studio Dashboard)
**Purpose**: Manage projects, configure settings, view logs

**Endpoints**: `/api/auth/*`, `/api/projects/*`, `/api/admin-users/*`

**Flow**:
1. Admin signs in via `/api/auth/signin`
2. Receives Admin JWT token
3. Uses token to create/manage projects
4. Can only access projects they created (enforced by `ProjectOwnershipGuard`)

**Usage in Swagger**:
- Click **"Authorize"** button
- Select **"Admin Authentication"**
- Enter: `Bearer <admin_jwt_token>`

### 2. Project API Keys (Client Applications)
**Purpose**: Client apps (mobile/web) access their project's data

**Endpoints**: `/api/projects/:projectId/auth/*`, `/api/projects/:projectId/database/*`

**Two Key Types**:

| Key Type | Usage | Permissions | RLS | Expose to Client? |
|----------|-------|-------------|-----|-------------------|
| **anon_key** | Mobile/Web apps | Read, Insert only | ✅ Enforced | ✅ Safe |
| **service_role_key** | Backend servers | Full admin access | ❌ Bypassed | ❌ Keep secret |

**Flow**:
1. Admin creates project → receives `anon_key` and `service_role_key`
2. Client SDK initializes with project's API key
3. All requests include: `Authorization: Bearer <anon_key>`
4. API validates key belongs to requested project (enforced by `ProjectJwtAuthGuard`)
5. Cross-project access is prevented with 403 Forbidden

**Usage in Swagger**:
- Click **"Authorize"** button
- Select **"Project API Key"**
- Enter: `Bearer <anon_key or service_role_key>`

**SDK Integration**:
```typescript
// Flutter/Node.js SDK
const client = new OrbitNestClient({
  projectUrl: 'https://api.orbitnest.io/api/projects/your-project-slug',
  anonKey: 'eyJhbGciOiJI...' // Your project's anon_key
});

// All subsequent calls use this key automatically
await client.auth.signUp({ email, password });
await client.from('users').select('*');
```

## API Structure

### Admin Endpoints (Admin JWT Required)

#### 🔐 Authentication (`/api/auth`)
- Admin user registration and login
- JWT token management  
- Password reset functionality
- Refresh token handling

#### 📁 Projects (`/api/projects`)
- Create new projects (returns anon_key & service_role_key)
- List all projects (only shows your projects)
- Update/delete projects (validates ownership)
- Manage project API keys
- View project statistics and health

#### 👨‍💼 Admin Users (`/api/admin-users`)
- Admin user management
- Admin API key generation
- User permissions and roles

### Project Endpoints (Project API Key Required)

#### 👥 Project Authentication (`/api/projects/:projectId/auth`)
**Security**: Validates API key belongs to the requested project

- **Public endpoints** (no auth required):
  
  **`POST /signup`** - Traditional email/password registration (returns session immediately)
  - Request body: `{ "email": "user@example.com", "password": "yourpassword", "user_metadata": { "full_name": "John Doe" } }`
  - Password: Only needs to be non-empty (no complexity requirements)
  - Returns: `{ "access_token": "eyJhbGc...", "refresh_token": "eyJhbGc...", "expires_in": 900, "user": { "id": "...", "email": "user@example.com", ... } }`
  - Note: User account is created immediately and can start using the app
  
  - `POST /signup-with-email` - Start email-first registration (passwordless)
  - `POST /verify-signup` - Complete registration with OTP (creates user account)
  - `POST /signin` - Sign in with email/password
  - `POST /signin-with-email` - Start email-first sign-in (passwordless)
  - `POST /verify-signin` - Complete sign-in with OTP
  - `POST /refresh` - Refresh access token
  - `POST /recover-password` - Request password reset
  - `POST /reset-password` - Reset password with token

- **Authenticated endpoints** (user JWT required):
  - `GET /user` - Get current user profile
  - `PUT /user` - Update user profile
  - `PUT /user/metadata` - Update user metadata
  - `POST /change-password` - Change password
  - `POST /change-email` - Request email change
  - `POST /verify-email-change` - Verify new email
  - `POST /signout` - Sign out current session
  - `POST /signout-all` - Sign out from all devices

- **Admin endpoints** (service_role_key required):
  - `GET /users` - List all users
  - `POST /users` - Create user (bypass verification)
  - `PUT /users/:userId` - Update user
  - `POST /users/:userId/ban` - Ban/unban user
  - `POST /users/:userId/reset-password` - Admin reset password
  - `DELETE /users/:userId` - Delete user
  - `GET /config` - Get auth configuration
  - `PUT /config` - Update auth configuration
  - `GET /stats` - Get auth statistics
  - `GET /sessions` - List active sessions
  - `GET /audit-logs` - View audit logs

#### 🗃️ Database Operations (`/api/projects/:projectId/database`)
**Security**: Admin JWT + validates project ownership

- `POST /sql` - Execute custom SQL queries
- `GET /tables` - Get table metadata
- `GET /tables/list` - List all tables
- `GET /tables/:tableName/data` - Get table data
- `POST /tables/:tableName/rows` - Insert row
- `PUT /tables/:tableName/rows/:rowId` - Update row
- `DELETE /tables/:tableName/rows/:rowId` - Delete row
- `POST /tables/:tableName/bulk-insert` - Bulk insert
- `PUT /tables/:tableName/bulk-update` - Bulk update
- `DELETE /tables/:tableName/bulk-delete` - Bulk delete
- `POST /tables/:tableName/rls/enable` - Enable RLS
- `POST /tables/:tableName/rls/disable` - Disable RLS
- `POST /tables/:tableName/policies` - Create RLS policy
- `GET /tables/:tableName/policies` - List policies
- `DELETE /tables/:tableName/policies/:policyName` - Delete policy

#### ⚡ Edge Functions (`/api/projects/:projectId/functions`)
**Security**: Admin JWT + validates project ownership

- Serverless function creation and management
- Environment variable configuration
- Function execution logs

#### 📊 Logging (`/api/projects/:projectId/logs`)
**Security**: Admin JWT + validates project ownership

- Database operation logs
- Authentication event logs
- Edge function execution logs
- Error tracking and slow query detection
- Log export functionality

## Security Model

### Project Isolation
✅ **Each project has unique JWT secret** - Keys cannot be used across projects  
✅ **API keys scoped to projects** - Token includes `project_slug` for validation  
✅ **Cross-project access prevented** - Guard validates token matches requested project  
✅ **Admin project ownership** - Admins can only access their own projects  
✅ **Encrypted credentials** - Project database credentials encrypted at rest  

### Row Level Security (RLS)
- **Anon Key**: RLS enforced - users see only their own data
- **Service Role Key**: RLS bypassed - full admin access

### Authentication Tables Protection
All `auth_*` tables are automatically protected:
- `auth_users`, `auth_sessions`, `auth_refresh_tokens`
- `auth_email_verification_codes`, `auth_audit_log`
- `auth_identities`, `auth_config`

**Protections**:
- ✅ RLS enabled by default
- ✅ Cannot be deleted via SQL endpoints
- ✅ Cannot disable RLS on these tables
- ✅ Default security policies applied

## Using the Documentation

### Step 1: Authenticate

**For Admin Operations** (creating projects, managing settings):
1. Navigate to Swagger UI: https://api.orbitnest.io/api/docs
2. Use `/api/auth/signin` endpoint to sign in
3. Copy the `access_token` from response
4. Click **"Authorize"** → Select **"Admin Authentication"**
5. Enter: `Bearer <access_token>`

**For Client App Operations** (user signup, database queries):
1. Get your project's API key from project creation response
2. Click **"Authorize"** → Select **"Project API Key"**
3. Enter: `Bearer <anon_key or service_role_key>`
4. All project-specific endpoints will now work

### Step 2: Test Endpoints

1. Expand any endpoint section
2. Click **"Try it out"**
3. Fill in required parameters
4. Click **"Execute"**
5. View response in real-time

## Project Signup Flow

### Traditional Email/Password Signup (Direct)

**Sign Up Request:**
```bash
POST /api/projects/{projectId}/auth/signup
Authorization: Bearer {anon_key}
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword",
  "user_metadata": {
    "full_name": "John Doe",
    "age": 25
  }
}
```

**Response (Session Created Immediately):**
```json
{
  "access_token": "eyJhbGciOiJI...",
  "refresh_token": "eyJhbGciOiJI...",
  "expires_in": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "email_confirmed_at": "2025-11-24T12:00:00Z",
    "user_metadata": {
      "full_name": "John Doe",
      "age": 25
    },
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

### Passwordless Signup with OTP (2-step process)

**Step 1: Request OTP**
```bash
POST /api/projects/{projectId}/auth/signup-with-email
Authorization: Bearer {anon_key}
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to email",
  "email": "user@example.com",
  "expires_in": 600
}
```

**Step 2: Verify OTP and Complete Signup**
```bash
POST /api/projects/{projectId}/auth/verify-signup
Authorization: Bearer {anon_key}
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJI...",
  "refresh_token": "eyJhbGciOiJI...",
  "expires_in": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "email_confirmed_at": "2025-11-24T12:00:00Z",
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

### Important Notes:
- **Traditional Signup (`/signup`)**: Returns session immediately, no OTP required
- **Passwordless Signup (`/signup-with-email`)**: Requires OTP verification via `/verify-signup`
- **Password Requirements**: Only needs to be non-empty (no complexity validation)
- **user_metadata**: Optional field to store custom user data
- **OTP Expiry**: Verification codes expire after 10 minutes (600 seconds)
- **Rate Limiting**: Multiple failed attempts may result in temporary blocking

### Troubleshooting Signup Issues

**Traditional Signup (`/signup`):**
- Returns session immediately upon successful creation
- No OTP verification required

**Passwordless Signup (`/signup-with-email` + `/verify-signup`):**
- Check server logs if OTP emails don't arrive: `[SIGNUP START]`, `[SIGNUP SUCCESS]`, or `[SIGNUP ERROR]`
- Email service delays are common (can take 2-5 seconds)
- OTP codes expire after 10 minutes

**Common Errors:**
- `409 Conflict`: User with this email already exists
- `400 Bad Request`: Invalid request format or missing required fields
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: API key doesn't match the requested project
- `500 Internal Server Error`: Check server logs for detailed error trace

### API Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.orbitnest.io/api`

### OpenAPI Specification

Get the OpenAPI JSON for client generation:
- **Development**: http://localhost:3000/api/docs-json
- **Production**: https://api.orbitnest.io/api/docs-json

**Generate TypeScript client**:
```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://api.orbitnest.io/api/docs-json \
  -g typescript-axios \
  -o ./src/api-client
```

### Response Format

All API responses follow a consistent format:

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message"?: string
}

// Error Response  
{
  "success": false,
  "error": string,
  "details"?: any,
  "statusCode": number
}
```

### Rate Limiting

The API includes rate limiting protection:
- Authentication endpoints: Limited per IP
- General endpoints: Limited per authenticated user
- Check response headers for rate limit status

### CORS Configuration

The API supports CORS for frontend applications:
- Development: `http://localhost:3000`, `http://localhost:3001`
- Production: Configured via `ALLOWED_ORIGINS` environment variable

## Testing the API

You can test all endpoints directly in the Swagger UI:

1. Navigate to the documentation URL
2. Expand any endpoint section
3. Click **"Try it out"**
4. Fill in required parameters
5. Click **"Execute"** to send the request
6. View the response in real-time

## Integration Examples

### Admin Flow: Create Project and Get API Keys

```typescript
// 1. Admin signs in
const authResponse = await fetch('https://api.orbitnest.io/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'admin@example.com', 
    password: 'SecurePassword123' 
  })
});

const { access_token } = await authResponse.json();

// 2. Create a new project
const projectResponse = await fetch('https://api.orbitnest.io/api/projects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Mobile App',
    settings: {
      description: 'Backend for my mobile application'
    }
  })
});

const projectData = await projectResponse.json();
console.log('Project created:', projectData.id);
console.log('Anon Key:', projectData.anon_key); // For mobile/web apps
console.log('Service Role Key:', projectData.service_role_key); // For backend
console.log('Project URL:', projectData.project_url);
```

### Client SDK Integration

```typescript
// Initialize SDK with project credentials
import { OrbitNestClient } from '@orbitnest/client';

const client = new OrbitNestClient({
  projectUrl: 'https://api.orbitnest.io/api/projects/my-mobile-app',
  anonKey: projectData.anon_key // From project creation
});

// User signup - returns session immediately
const { data, error } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'UserPassword123',
  metadata: { name: 'John Doe' }
});

if (error) {
  console.error('Signup failed:', error.message);
  return;
}

const { user, access_token } = data;

// Query data (RLS enforced - user sees only their data)
const { data: todos } = await client
  .from('todos')
  .select('*')
  .eq('user_id', user.id);

// Insert data
const { data: newTodo } = await client
  .from('todos')
  .insert({
    title: 'Buy groceries',
    user_id: user.id
  });
```

### Backend Service with Service Role Key

```typescript
// Backend service with full access
const adminClient = new OrbitNestClient({
  projectUrl: 'https://api.orbitnest.io/api/projects/my-mobile-app',
  serviceRoleKey: projectData.service_role_key // Bypasses RLS
});

// Admin operations - full access to all data
const { data: allUsers } = await adminClient
  .from('users')
  .select('*'); // Returns ALL users, not just current user

// Bulk operations
const { data: updated } = await adminClient
  .from('todos')
  .update({ completed: true })
  .in('id', [1, 2, 3, 4, 5]);
```

### Direct API Calls (without SDK)

```typescript
// Using anon_key directly
const signupResponse = await fetch(
  'https://api.orbitnest.io/api/projects/my-mobile-app/auth/signup',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${projectData.anon_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'UserPassword123',
      user_metadata: { name: 'John Doe' }
    })
  }
);

const { access_token, refresh_token, user } = await signupResponse.json();

// Query data with user JWT
const dataResponse = await fetch(
  'https://api.orbitnest.io/api/projects/my-mobile-app/database/tables/todos/data',
  {
    headers: {
      'Authorization': `Bearer ${access_token}`, // User JWT
      'Content-Type': 'application/json'
    }
  }
);

const todos = await dataResponse.json();
```

### Error Handling

```typescript
try {
  const response = await client.auth.signUp({ email, password });
  console.log('Success:', response);
} catch (error) {
  if (error.statusCode === 403) {
    console.error('Wrong project key or insufficient permissions');
  } else if (error.statusCode === 409) {
    console.error('User already exists');
  } else {
    console.error('Error:', error.message);
  }
}
```

### Common Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `400` | Bad Request | Invalid input, validation error |
| `401` | Unauthorized | Missing token, expired token |
| `403` | Forbidden | Wrong project key, insufficient permissions, trying to access another project |
| `404` | Not Found | Project/resource doesn't exist |
| `409` | Conflict | Duplicate entry (e.g., user already exists) |
| `500` | Server Error | Internal error, check logs |

### Response Format

All API responses follow a consistent format:

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message"?: string
}

// Error Response  
{
  "success": false,
  "error": string,
  "statusCode": number,
  "message": string,
  "details"?: any
}
```

## Testing Security

### Test 1: Project Isolation
```bash
# Try to use project_a's key with project_b's endpoint
curl -X POST https://api.orbitnest.io/api/projects/project_b/auth/signup \
  -H "Authorization: Bearer <project_a_anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'

# Expected: 403 Forbidden
# "API key is not valid for this project. This key belongs to project 'project_a' 
#  but you're trying to access 'project_b'."
```

### Test 2: Admin Project Ownership
```bash
# Admin tries to access another admin's project
curl https://api.orbitnest.io/api/projects/{another_admin_project_id}/database/tables \
  -H "Authorization: Bearer <your_admin_jwt>"

# Expected: 403 Forbidden
# "You do not have access to this project"
```

### Test 3: RLS Enforcement
```bash
# User can only see their own data with anon_key
curl https://api.orbitnest.io/api/projects/my-project/database/tables/users/data \
  -H "Authorization: Bearer <user_jwt_token>"

# Returns: Only data belonging to the authenticated user
# Service role key would return ALL data
```

## Rate Limiting

The API includes rate limiting protection:
- **Authentication endpoints**: 10 requests per 15 minutes per IP
- **General endpoints**: 100 requests per minute per authenticated user
- **Database queries**: 50 requests per minute per project

Check response headers for rate limit status:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

## CORS Configuration

The API supports CORS for frontend applications:
- **Development**: `http://localhost:*` (all ports)
- **Production**: All `*.orbitnest.io` subdomains
- **Custom origins**: Configure via `ALLOWED_ORIGINS` environment variable

Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

## SDK Packages

### Official SDKs

| Platform | Package | Installation |
|----------|---------|--------------|
| JavaScript/TypeScript | `@orbitnest/client` | `npm install @orbitnest/client` |
| Flutter | `orbitnest_flutter` | `flutter pub add orbitnest_flutter` |
| React | `@orbitnest/react` | `npm install @orbitnest/react` |

### SDK Features
- ✅ Automatic token management
- ✅ Built-in retry logic
- ✅ Type-safe queries
- ✅ Real-time subscriptions
- ✅ File upload support
- ✅ Offline support (coming soon)

---

## Complete Frontend Implementation Guide

This comprehensive guide shows you how to build a production-ready frontend application using OrbitNest Studio API.

### Overview: From Project Creation to Production App

```
1. Admin creates project → Gets anon_key & service_role_key
2. Frontend uses anon_key for authentication
3. Users sign up/sign in → Receive user JWT tokens
4. App uses user JWT for data operations
5. RLS policies ensure users only see their own data
```

### Quick Start: 5-Minute Setup

#### Step 1: Get Your Project Credentials

After creating a project in the admin dashboard, you'll receive:

```json
{
  "project_url": "https://api.orbitnest.io/api/projects/my-app",
  "anon_key": "eyJhbGc...",  // ← Use this in your frontend
  "service_role_key": "eyJhbGc...",  // ← Keep this secret (backend only)
  "slug": "my-app"
}
```

#### Step 2: Configure Your Frontend

**React/Next.js:**
```typescript
// lib/orbitnest.config.ts
export const config = {
  projectUrl: process.env.NEXT_PUBLIC_ORBITNEST_URL!,
  anonKey: process.env.NEXT_PUBLIC_ORBITNEST_ANON_KEY!,
  projectSlug: process.env.NEXT_PUBLIC_ORBITNEST_SLUG!
};

// .env.local
NEXT_PUBLIC_ORBITNEST_URL=https://api.orbitnest.io/api/projects/my-app
NEXT_PUBLIC_ORBITNEST_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_ORBITNEST_SLUG=my-app
```

**Flutter:**
```dart
// lib/config/orbitnest.dart
class OrbitNestConfig {
  static const projectUrl = String.fromEnvironment(
    'ORBITNEST_URL',
    defaultValue: 'https://api.orbitnest.io/api/projects/my-app'
  );
  static const anonKey = String.fromEnvironment('ORBITNEST_ANON_KEY');
  static const projectSlug = 'my-app';
}
```

**Vue:**
```javascript
// src/lib/orbitnest.config.js
export default {
  projectUrl: import.meta.env.VITE_ORBITNEST_URL,
  anonKey: import.meta.env.VITE_ORBITNEST_ANON_KEY,
  projectSlug: import.meta.env.VITE_ORBITNEST_SLUG
}
```

#### Step 3: Implement Authentication

**React Hook Example:**
```typescript
// hooks/useAuth.ts
import { useState } from 'react';
import { config } from '../lib/orbitnest.config';

interface AuthState {
  user: any | null;
  session: any | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ user: null, session: null });
  const [loading, setLoading] = useState(false);

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${config.projectUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, user_metadata: metadata })
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      setAuth({ user: data.user, session: data });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${config.projectUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      setAuth({ user: data.user, session: data });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const token = localStorage.getItem('access_token');
    
    await fetch(`${config.projectUrl}/auth/signout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuth({ user: null, session: null });
  };

  const getUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    const res = await fetch(`${config.projectUrl}/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) return null;
    
    const user = await res.json();
    setAuth(prev => ({ ...prev, user }));
    return user;
  };

  return { auth, signUp, signIn, signOut, getUser, loading };
}
```

**Flutter Service:**
```dart
// services/auth_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  final _storage = const FlutterSecureStorage();
  final String projectUrl = OrbitNestConfig.projectUrl;
  final String anonKey = OrbitNestConfig.anonKey;

  Future<Map<String, dynamic>> signUp(String email, String password, {Map<String, dynamic>? metadata}) async {
    final response = await http.post(
      Uri.parse('$projectUrl/auth/signup'),
      headers: {
        'Authorization': 'Bearer $anonKey',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'email': email,
        'password': password,
        if (metadata != null) 'user_metadata': metadata,
      }),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception(json.decode(response.body)['message']);
    }

    final data = json.decode(response.body);
    
    await _storage.write(key: 'access_token', value: data['access_token']);
    await _storage.write(key: 'refresh_token', value: data['refresh_token']);
    
    return data;
  }

  Future<Map<String, dynamic>> signIn(String email, String password) async {
    final response = await http.post(
      Uri.parse('$projectUrl/auth/signin'),
      headers: {
        'Authorization': 'Bearer $anonKey',
        'Content-Type': 'application/json',
      },
      body: json.encode({'email': email, 'password': password}),
    );

    if (response.statusCode != 200) {
      throw Exception(json.decode(response.body)['message']);
    }

    final data = json.decode(response.body);
    
    await _storage.write(key: 'access_token', value: data['access_token']);
    await _storage.write(key: 'refresh_token', value: data['refresh_token']);
    
    return data;
  }

  Future<void> signOut() async {
    final accessToken = await _storage.read(key: 'access_token');
    
    await http.post(
      Uri.parse('$projectUrl/auth/signout'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    await _storage.deleteAll();
  }

  Future<String?> getAccessToken() => _storage.read(key: 'access_token');
}
```

#### Step 4: Create Database Tables (Admin Setup)

Use the admin dashboard or API to create your application tables:

```sql
-- Example: Create a todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own todos
CREATE POLICY "Users view own todos" ON todos
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own todos
CREATE POLICY "Users insert own todos" ON todos
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own todos
CREATE POLICY "Users update own todos" ON todos
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own todos
CREATE POLICY "Users delete own todos" ON todos
  FOR DELETE USING (user_id = auth.uid());
```

#### Step 5: Perform Database Operations

**React Hook for Data Operations:**
```typescript
// hooks/useDatabase.ts
import { useState } from 'react';
import { config } from '../lib/orbitnest.config';

export function useDatabase<T = any>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem('access_token');

  // Fetch all records
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.projectUrl}/database/tables/${tableName}/data`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await res.json();
      setData(result.data || []);
      return result.data;
    } finally {
      setLoading(false);
    }
  };

  // Insert new record
  const insert = async (record: Partial<T>) => {
    const res = await fetch(`${config.projectUrl}/database/tables/${tableName}/rows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    });

    const newRecord = await res.json();
    setData(prev => [...prev, newRecord]);
    return newRecord;
  };

  // Update record
  const update = async (id: string, updates: Partial<T>) => {
    const res = await fetch(`${config.projectUrl}/database/tables/${tableName}/rows/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const updated = await res.json();
    setData(prev => prev.map(item => (item as any).id === id ? updated : item));
    return updated;
  };

  // Delete record
  const remove = async (id: string) => {
    await fetch(`${config.projectUrl}/database/tables/${tableName}/rows/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    setData(prev => prev.filter(item => (item as any).id !== id));
  };

  // Custom SQL query
  // Note: Backend does not support parameterized queries
  // Embed values directly in SQL (sanitize user input!)
  const query = async (sql: string) => {
    const res = await fetch(`${config.projectUrl}/database/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    });

    return await res.json();
  };

  return { data, loading, fetchAll, insert, update, remove, query };
}
```

**Usage in Component:**
```typescript
// components/TodoList.tsx
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  user_id: string;
}

export function TodoList() {
  const { auth } = useAuth();
  const { data: todos, loading, fetchAll, insert, update, remove } = useDatabase<Todo>('todos');

  useEffect(() => {
    if (auth.user) {
      fetchAll();
    }
  }, [auth.user]);

  const addTodo = async (title: string) => {
    await insert({
      title,
      user_id: auth.user.id,
      completed: false
    });
  };

  const toggleTodo = async (todo: Todo) => {
    await update(todo.id, { completed: !todo.completed });
  };

  const deleteTodo = async (id: string) => {
    await remove(id);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Todos</h2>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo)}
            />
            <span>{todo.title}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Complete API Endpoint Reference for Frontend

#### Authentication Endpoints

| Endpoint | Method | Auth | Description | Request Body |
|----------|--------|------|-------------|--------------|
| `/auth/signup` | POST | Anon Key | Register new user | `{ email, password }` |
| `/auth/signin` | POST | Anon Key | Sign in user | `{ email, password }` |
| `/auth/user` | GET | User JWT | Get current user | - |
| `/auth/refresh` | POST | Anon Key | Refresh token | `{ refresh_token }` |
| `/auth/signout` | POST | User JWT | Sign out | - |
| `/auth/recover-password` | POST | Anon Key | Request password reset | `{ email }` |
| `/auth/reset-password` | POST | Anon Key | Reset password | `{ token, password }` |
| `/auth/change-password` | POST | User JWT | Change password | `{ oldPassword, newPassword }` |

#### Database Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/database/tables/list` | GET | User JWT | List all tables |
| `/database/tables/{table}/data` | GET | User JWT | Get all records (RLS applied) |
| `/database/tables/{table}/rows` | POST | User JWT | Insert new record |
| `/database/tables/{table}/rows/{id}` | PUT | User JWT | Update record |
| `/database/tables/{table}/rows/{id}` | DELETE | User JWT | Delete record |
| `/database/sql` | POST | User JWT | Execute custom SQL query |

**Note**: All endpoints are prefixed with your project URL: `https://api.orbitnest.io/api/projects/{your-project-slug}`

### Best Practices

#### 1. Token Management with Auto-Refresh

```typescript
// lib/api.ts
import { config } from './orbitnest.config';

export async function apiRequest(url: string, options: RequestInit = {}) {
  const makeRequest = async (token: string) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  let accessToken = localStorage.getItem('access_token')!;
  let response = await makeRequest(accessToken);
  
  // Auto-refresh on 401
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    const refreshRes = await fetch(`${config.projectUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    const data = await refreshRes.json();
    localStorage.setItem('access_token', data.access_token);
    
    response = await makeRequest(data.access_token);
  }
  
  return response;
}
```

#### 2. Error Handling

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      response.status,
      error.message || 'Request failed',
      error.details
    );
  }
  return response.json();
}
```

#### 3. Type Safety

```typescript
// types/database.ts
export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}
```

---

## Support

For questions about the API documentation or integration:
- **Interactive examples**: Available in Swagger UI
- **Response schemas**: Detailed in OpenAPI specification
- **Test endpoints**: Use "Try it out" in Swagger documentation
- **GitHub Issues**: Report bugs or request features
- **Documentation**: https://docs.orbitnest.io

The documentation is automatically updated with each deployment and reflects the current API version.