# API Reference

## tRPC Endpoints

This document describes all available tRPC procedures in the application.

## Base URL

- Development: `http://localhost:3001/trpc`
- Production: Configure in environment variables

## Authentication

Currently, all endpoints are public. Authentication can be added via tRPC context.

## User Endpoints

All user endpoints are available under the `users` namespace.

### `users.list`

Retrieve a paginated list of users.

**Type**: Query  
**Input**:
```typescript
{
  limit?: number;  // 1-100, default: 10
  offset?: number; // >= 0, default: 0
}
```

**Output**:
```typescript
{
  items: User[];
  total: number;
  limit: number;
  offset: number;
}
```

**Example**:
```typescript
const users = await trpc.users.list.query({
  limit: 20,
  offset: 0
});
```

### `users.getById`

Retrieve a single user by ID.

**Type**: Query  
**Input**:
```typescript
{
  id: string; // UUID format
}
```

**Output**:
```typescript
User
```

**Errors**:
- `User not found` - When user with given ID doesn't exist

**Example**:
```typescript
const user = await trpc.users.getById.query({
  id: "123e4567-e89b-12d3-a456-426614174000"
});
```

### `users.create`

Create a new user.

**Type**: Mutation  
**Input**:
```typescript
{
  email: string;    // Valid email format
  name: string;     // Min 1 character
}
```

**Output**:
```typescript
User // Newly created user with generated ID and timestamps
```

**Example**:
```typescript
const newUser = await trpc.users.create.mutate({
  email: "user@example.com",
  name: "John Doe"
});
```

### `users.update`

Update an existing user.

**Type**: Mutation  
**Input**:
```typescript
{
  id: string;       // UUID format
  data: {
    email?: string; // Valid email format
    name?: string;  // Min 1 character
  }
}
```

**Output**:
```typescript
User // Updated user
```

**Errors**:
- `User not found` - When user with given ID doesn't exist

**Example**:
```typescript
const updatedUser = await trpc.users.update.mutate({
  id: "123e4567-e89b-12d3-a456-426614174000",
  data: {
    name: "Jane Doe"
  }
});
```

### `users.delete`

Delete a user by ID.

**Type**: Mutation  
**Input**:
```typescript
{
  id: string; // UUID format
}
```

**Output**:
```typescript
{
  success: boolean;
}
```

**Errors**:
- `User not found` - When user with given ID doesn't exist

**Example**:
```typescript
const result = await trpc.users.delete.mutate({
  id: "123e4567-e89b-12d3-a456-426614174000"
});
```

## Data Types

### User

The main user entity type:

```typescript
interface User {
  id: string;         // UUID
  email: string;      // Email address
  name: string;       // User's name
  createdAt: Date;    // Creation timestamp
  updatedAt: Date;    // Last update timestamp
}
```

### CreateUser

Input type for creating users:

```typescript
interface CreateUser {
  email: string;      // Email address
  name: string;       // User's name
}
```

### UpdateUser

Input type for updating users (all fields optional):

```typescript
interface UpdateUser {
  email?: string;     // Email address
  name?: string;      // User's name
}
```

### PaginatedResponse<T>

Generic pagination wrapper:

```typescript
interface PaginatedResponse<T> {
  items: T[];         // Array of items
  total: number;      // Total count in database
  limit: number;      // Items per page
  offset: number;     // Starting position
}
```

## Error Handling

All errors follow the tRPC error format:

```typescript
{
  message: string;
  code: string;
  cause?: unknown;
}
```

Common error codes:
- `BAD_REQUEST` - Invalid input data
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

## Validation

All inputs are validated using Zod schemas. Validation errors return detailed field-level error messages:

```typescript
{
  message: "Validation error",
  code: "BAD_REQUEST",
  cause: {
    email: ["Invalid email format"],
    name: ["String must contain at least 1 character(s)"]
  }
}
```

## Client Usage Examples

### React Query Integration

```typescript
// In a React component
function UserList() {
  const { data, isLoading, error } = trpc.users.list.useQuery({
    limit: 10,
    offset: 0
  });

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.users.list.invalidate();
    }
  });

  // Component logic...
}
```

### Vanilla Client

```typescript
// Direct client usage
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
    }),
  ],
});

const users = await client.users.list.query({ limit: 10 });
```

## Rate Limiting

Currently not implemented. Can be added using Fastify rate limit plugin.

## CORS

CORS is configured to allow requests from the frontend URL (default: `http://localhost:5173`).

## Health Check

A separate health check endpoint is available:

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```