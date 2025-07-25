# Development Guide

This guide covers common development tasks and best practices for working with the Fastify + tRPC + React monorepo.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Adding New Features](#adding-new-features)
4. [Type Safety Best Practices](#type-safety-best-practices)
5. [Background Jobs](#background-jobs)
6. [Email Service](#email-service)
7. [API Documentation](#api-documentation)
8. [Testing](#testing)
9. [Debugging](#debugging)
10. [Performance Optimization](#performance-optimization)
11. [Common Patterns](#common-patterns)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+
- PostgreSQL 14+ (or Docker)
- Redis 6+ (or Docker)
- TypeScript knowledge
- React knowledge

### Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd my-workspace

# Install all dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# Run database migrations
cd server && npm run prisma:migrate

# Start development servers
npm run dev         # Runs both server and webapp concurrently
# Or run separately:
npm run dev:server  # Terminal 1 - Web server
npm run dev:worker  # Terminal 2 - Background job worker (optional)
npm run dev:webapp  # Terminal 3 - React app
```

### IDE Setup

**Recommended: VS Code** with these extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets

**Settings** (.vscode/settings.json):
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Project Structure

```
foundry/
├── .env                    # Environment variables
├── docker-compose.yml      # Local services (DB, Redis, Mail)
├── package.json           # Root package scripts
├── server/                # Backend application
│   ├── src/
│   │   ├── index.ts      # Main entry point
│   │   ├── worker.ts     # Background job worker
│   │   ├── server.ts     # Fastify server setup
│   │   ├── bootstrap.ts  # Application initialization
│   │   ├── features/     # Feature modules (auto-discovered)
│   │   │   └── jobs/     # Background job system
│   │   ├── lib/          # Shared utilities
│   │   ├── services/     # Business logic
│   │   │   └── mail/     # Email service with templates
│   │   ├── trpc/         # tRPC setup and routers
│   │   └── shared/       # Shared types and schemas
│   └── prisma/
│       └── schema.prisma # Database schema
├── webapp/                # React frontend
│   ├── src/
│   │   ├── main.tsx      # Entry point
│   │   ├── App.tsx       # Root component
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities and tRPC client
│   └── vite.config.ts    # Vite configuration
└── docs/                  # Documentation

## Development Workflow

### 1. Feature Development Flow

```mermaid
graph LR
    A[Define Schema] --> B[Create Service]
    B --> C[Add Router]
    C --> D[Use in React]
    D --> E[Test]
```

### 2. Making Changes

#### Backend Changes
1. **Schema First**: Define or update Zod schemas in `shared/src/schemas/`
2. **Service Layer**: Implement business logic in `server/src/services/`
3. **Router**: Expose via tRPC in `server/src/trpc/routers/`
4. **Test**: Verify with API calls

#### Frontend Changes
1. **Use Hooks**: Leverage tRPC hooks in components
2. **Handle States**: Loading, error, and success states
3. **Optimize**: Use React Query features for caching

### 3. Hot Reloading

Both frontend and backend support hot reloading:
- **Frontend**: Vite provides instant HMR
- **Backend**: tsx watch mode restarts on changes

## Adding New Features

### Example: Adding a Post Feature

#### 1. Create Schema (shared/src/schemas/post.schema.ts)
```typescript
import { z } from 'zod';

export const postSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  authorId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPostSchema = postSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
```

#### 2. Create Service (server/src/services/post.service.ts)
```typescript
import { Post, CreatePost } from '@workspace/shared';
import crypto from 'crypto';

class PostService {
  private posts = new Map<string, Post>();

  async create(data: CreatePost): Promise<Post> {
    const post: Post = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.posts.set(post.id, post);
    return post;
  }

  async findAll() {
    return Array.from(this.posts.values());
  }
}

export const postService = new PostService();
```

#### 3. Create Router (server/src/trpc/routers/post.router.ts)
```typescript
import { router, publicProcedure } from '../trpc.js';
import { createPostSchema } from '@workspace/shared';
import { postService } from '../../services/post.service.js';

export const postRouter = router({
  create: publicProcedure
    .input(createPostSchema)
    .mutation(async ({ input }) => {
      return postService.create(input);
    }),
    
  list: publicProcedure
    .query(async () => {
      return postService.findAll();
    }),
});
```

#### 4. Add to App Router
```typescript
// server/src/trpc/routers/app.router.ts
export const appRouter = router({
  users: userRouter,
  posts: postRouter, // Add this line
});
```

#### 5. Use in React
```typescript
function PostList() {
  const { data: posts } = trpc.posts.list.useQuery();
  const createPost = trpc.posts.create.useMutation();

  return (
    <div>
      {posts?.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

## Type Safety Best Practices

### 1. Always Use Zod Schemas
```typescript
// ✅ Good - Single source of truth
const userSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

// ❌ Bad - Duplicate type definition
interface User {
  email: string;
  name: string;
}
```

### 2. Leverage Type Inference
```typescript
// ✅ Good - Let TypeScript infer
export type User = z.infer<typeof userSchema>;

// ❌ Bad - Manual type definition
export type User = {
  email: string;
  name: string;
};
```

### 3. Use Proper Error Handling
```typescript
// ✅ Good - Type-safe error handling
const { data, error } = trpc.users.list.useQuery();
if (error) {
  if (error.data?.code === 'NOT_FOUND') {
    // Handle specific error
  }
}

// ❌ Bad - Generic error handling
try {
  // ...
} catch (e) {
  console.error(e);
}
```

## Background Jobs

The application uses BullMQ for background job processing with Redis as the queue backend.

### Creating a New Job

1. **Create a job file** (`server/src/features/jobs/my-feature.job.ts`):
```typescript
import { Job } from 'bullmq';
import { queueRegistry } from '../../features/jobs/queue.registry';
import type { QueueDefinition } from '../../features/jobs/queue.registry';
import { QueuePriority } from '../../features/jobs';
import type { BaseJobData } from '../../features/jobs';

// Define your job data structure
export interface MyJobData extends BaseJobData {
  // Your specific fields
  itemId: string;
  action: string;
}

// Queue name (private unless needed elsewhere)
const MY_QUEUE = 'my-feature';

// Processor function
async function myProcessor(job: Job<MyJobData>): Promise<unknown> {
  const { itemId, action } = job.data;
  
  console.log(`Processing job ${job.id}: ${action} for item ${itemId}`);
  
  // Your job logic here
  
  return { success: true };
}

// Queue definition
const myQueueDefinition: QueueDefinition<MyJobData> = {
  name: MY_QUEUE,
  processor: myProcessor,
  workerOptions: {
    concurrency: 5, // Number of concurrent jobs
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Service class for type-safe job creation
export class MyJobService {
  async createJob(data: Omit<MyJobData, 'userId'>): Promise<Job<MyJobData>> {
    return queueService.addJob(MY_QUEUE, data, {
      priority: QueuePriority.NORMAL,
    });
  }
}

export const myJobService = new MyJobService();

// Register function for auto-discovery
export function registerMyJob(): void {
  queueRegistry.register(myQueueDefinition);
}

export default registerMyJob;
```

2. **Use the job service**:
```typescript
// In your service or router
await myJobService.createJob({
  itemId: '123',
  action: 'process',
});
```

### Worker Process

Background jobs run in a separate worker process for better scalability:

```bash
# Development
npm run dev:worker

# Production
npm run start:worker
```

### Monitoring Jobs

Access Bull Board UI at `http://localhost:13002/admin/queues` (when `ENABLE_BULL_BOARD=true`).

## Email Service

The email service provides a clean abstraction over email sending with job queue integration for reliability.

### Sending Emails

```typescript
import { mailService } from './services/mail/mail.service';

// Send a welcome email (queued)
const status = await mailService.sendWelcomeEmail(user, {
  appName: 'MyApp',
  loginUrl: 'https://app.example.com/login',
});

// Send a password reset email (queued)
const status = await mailService.sendPasswordResetEmail(
  user,
  resetToken,
  resetUrl
);

// Send a custom templated email (direct)
const status = await mailService.sendTemplatedEmail({
  to: { email: 'user@example.com', name: 'User Name' },
  template: 'welcome', // or 'reset-password'
  variables: { name: 'John', appName: 'MyApp' },
});
```

### Creating Email Templates

1. **Create a React Email template** (`server/src/services/mail/templates/my-template.tsx`):
```typescript
import { Html, Head, Preview, Body, Container, Heading, Text, Button } from '@react-email/components';

interface MyEmailProps {
  name: string;
  actionUrl: string;
}

export function MyEmail({ name, actionUrl }: MyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your preview text here</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hello {name}!</Heading>
          <Text style={text}>Your email content here.</Text>
          <Button href={actionUrl} style={button}>
            Take Action
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

// Styles...
```

2. **Register the template** in `template.service.ts`:
```typescript
const templateMap = {
  'welcome': { /* ... */ },
  'reset-password': { /* ... */ },
  'my-template': {
    component: MyEmail,
    getSubject: (props: MyEmailProps) => `Action required, ${props.name}!`,
  },
} as const;
```

3. **Preview emails** during development:
```bash
npm run email:preview
# Visit http://localhost:3002
```

### Email Configuration

Configure SMTP settings in `.env`:
```env
MAIL_HOST=localhost
MAIL_PORT=13004
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM_EMAIL=noreply@example.com
MAIL_FROM_NAME=My App
```

For local development, use MailHog (included in docker-compose).

## API Documentation

The project uses tRPC with OpenAPI integration for API documentation.

### Accessing Documentation

In development mode or with `ENABLE_API_DOCS=true`:
- **OpenAPI Spec**: `http://localhost:13000/openapi.json`
- **Swagger UI**: `http://localhost:13000/api-docs`

### Adding Documentation to Procedures

Add OpenAPI metadata to your tRPC procedures:

```typescript
const createProcedure = publicProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/items/create',
      tags: ['items'],
      summary: 'Create a new item',
      description: 'Creates a new item in the system',
    },
  })
  .input(createItemSchema)
  .output(itemSchema)
  .mutation(async ({ input }) => {
    return itemService.create(input);
  });
```

### Type-Safe Client Usage

The main benefit of tRPC is automatic type safety:

```typescript
// In your React component
import { trpc } from './lib/trpc';

const { data, error, isLoading } = trpc.items.list.useQuery();
const createItem = trpc.items.create.useMutation();

// Full type safety and autocomplete
await createItem.mutateAsync({
  name: 'New Item', // TypeScript knows the exact shape
});
```

## Testing

### Unit Testing Services
```typescript
// server/src/services/__tests__/user.service.test.ts
import { userService } from '../user.service';

describe('UserService', () => {
  it('should create a user', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

### Integration Testing tRPC
```typescript
// server/src/trpc/routers/__tests__/user.router.test.ts
import { createCaller } from '../app.router';

const caller = createCaller({});

describe('User Router', () => {
  it('should list users', async () => {
    const result = await caller.users.list({ limit: 10 });
    expect(result.items).toBeInstanceOf(Array);
  });
});
```

### E2E Testing with Playwright
```typescript
// e2e/users.spec.ts
test('should create a user', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.fill('[placeholder="Name"]', 'John Doe');
  await page.fill('[placeholder="Email"]', 'john@example.com');
  await page.click('button:has-text("Create User")');
  
  await expect(page.locator('text=John Doe')).toBeVisible();
});
```

## Available Scripts

### Root Level Scripts
```bash
npm run dev          # Run all services concurrently
npm run check        # Run TypeScript and ESLint checks for all packages
npm run format       # Format code with Prettier
npm run test         # Run all tests
```

### Server Scripts
```bash
cd server
npm run dev          # Start development server with hot reload
npm run dev:worker   # Start background job worker
npm run build        # Build for production
npm run start        # Start production server
npm run start:worker # Start production worker
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint
npm run test         # Run tests

# Database scripts
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:push      # Push schema changes (dev only)
npm run prisma:reset     # Reset database (dev only)

# Email development
npm run email:preview    # Preview email templates
```

### Webapp Scripts
```bash
cd webapp
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/foundry_dev

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=13000
NODE_ENV=development
LOG_LEVEL=debug

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Email
MAIL_HOST=localhost
MAIL_PORT=13004
MAIL_SECURE=false
MAIL_FROM_EMAIL=noreply@foundry.local
MAIL_FROM_NAME=Foundry App

# Bull Board
ENABLE_BULL_BOARD=true
BULL_BOARD_PORT=13002

# API Documentation
ENABLE_API_DOCS=true

# Client
CLIENT_URL=http://localhost:5173
```

### Docker Services

For local development, use Docker Compose:

```bash
docker-compose up -d

# Services included:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - MailHog (SMTP: 13004, Web UI: 8025)
```

## Debugging

### Backend Debugging

1. **Console Logging**:
```typescript
// Add to procedures for debugging
.query(async ({ input, ctx }) => {
  console.log('Query input:', input);
  console.log('Context:', ctx);
  // ... rest of logic
});
```

2. **VS Code Debugging**:
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/src/index.ts",
  "runtimeExecutable": "tsx",
  "console": "integratedTerminal"
}
```

### Frontend Debugging

1. **React DevTools**: Install browser extension
2. **React Query DevTools**:
```typescript
// Add to main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your app
<ReactQueryDevtools initialIsOpen={false} />
```

## Performance Optimization

### Backend Optimization

1. **Database Connection Pooling** (when you add a database):
```typescript
// Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
});
```

2. **Caching**:
```typescript
// Add caching to services
const cache = new Map();

async findById(id: string) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  const user = await db.user.findById(id);
  cache.set(id, user);
  return user;
}
```

### Frontend Optimization

1. **Query Optimization**:
```typescript
// Configure stale time
const { data } = trpc.users.list.useQuery(
  { limit: 10 },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);
```

2. **Optimistic Updates**:
```typescript
const utils = trpc.useContext();
const createUser = trpc.users.create.useMutation({
  onMutate: async (newUser) => {
    await utils.users.list.cancel();
    const previousUsers = utils.users.list.getData();
    
    utils.users.list.setData(old => ({
      ...old,
      items: [...old.items, newUser],
    }));
    
    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    utils.users.list.setData(context.previousUsers);
  },
});
```

## Common Patterns

### Authentication Context
```typescript
// server/src/trpc/context.ts
export async function createContext({ req }: CreateFastifyContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token ? await validateToken(token) : null;
  
  return { user };
}

// Protected procedure
export const protectedProcedure = publicProcedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({ ctx: { user: ctx.user } });
  })
);
```

### File Uploads
```typescript
// Use multipart form data with Fastify
import multipart from '@fastify/multipart';

server.register(multipart);

// In a regular Fastify route (not tRPC)
server.post('/upload', async (request) => {
  const data = await request.file();
  // Process file
});
```

### Real-time Updates
```typescript
// Add WebSocket support
import { createWSClient, wsLink } from '@trpc/client/links/wsLink';

// In tRPC client setup
const wsClient = createWSClient({
  url: 'ws://localhost:3001',
});

const trpcClient = createTRPCClient({
  links: [
    wsLink({ client: wsClient }),
  ],
});
```

### Error Monitoring
```typescript
// Add error tracking
import * as Sentry from '@sentry/node';

// In tRPC error handler
onError({ error, type, path }) {
  if (error.code === 'INTERNAL_SERVER_ERROR') {
    Sentry.captureException(error);
  }
}
```

## Tips and Tricks

1. **Use Path Aliases**:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. **Environment Variables**:
```typescript
// Use dotenv for local development
import dotenv from 'dotenv';
dotenv.config();

// Type-safe env vars
const env = z.object({
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string(),
}).parse(process.env);
```

3. **Git Hooks**:
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run typecheck"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Type errors after schema changes**:
   - Restart TypeScript server in VS Code
   - Run `npm run typecheck` to see all errors
   - Run `npm run prisma:generate` if database schema changed

2. **CORS errors**:
   - Check server CORS configuration
   - Ensure frontend URL is whitelisted in `.env` (`CLIENT_URL`)

3. **Module not found errors**:
   - Run `npm install` at root
   - Check if using correct import paths (.js extensions in server)

4. **React Query not updating**:
   - Check if mutations are invalidating queries
   - Verify staleTime and cacheTime settings

5. **Database connection errors**:
   - Ensure PostgreSQL is running (`docker-compose up -d`)
   - Check `DATABASE_URL` in `.env`
   - Run migrations: `cd server && npm run prisma:migrate`

6. **Redis connection errors**:
   - Ensure Redis is running (`docker-compose up -d`)
   - Check `REDIS_URL` in `.env`
   - Verify port 6379 is not in use

7. **Email not sending**:
   - Check MailHog UI at `http://localhost:8025`
   - Verify SMTP settings in `.env`
   - Ensure worker process is running (`npm run dev:worker`)

8. **Background jobs not processing**:
   - Start worker process: `npm run dev:worker`
   - Check Bull Board UI at `http://localhost:13002/admin/queues`
   - Verify Redis connection

9. **Port already in use**:
   - Kill existing processes: `pkill -f node`
   - Or change ports in `.env`

10. **TypeScript TS1484 errors**:
    - Update imports to use `import type` for type-only imports
    - Enable `verbatimModuleSyntax` in tsconfig.json

## Quick Reference

### Port Mapping
- **13000**: Main server (tRPC API)
- **13002**: Bull Board UI (job monitoring)
- **13004**: MailHog SMTP (email)
- **5173**: React app (Vite)
- **5432**: PostgreSQL
- **6379**: Redis
- **8025**: MailHog Web UI

### Useful URLs (Development)
- React App: http://localhost:5173
- API Health: http://localhost:13000/health
- API Docs: http://localhost:13000/api-docs
- OpenAPI Spec: http://localhost:13000/openapi.json
- Bull Board: http://localhost:13002/admin/queues
- MailHog: http://localhost:8025
- Prisma Studio: `npm run prisma:studio`

### Key Commands
```bash
# Development
npm run dev                 # Start everything
npm run check              # Run all checks

# Database
cd server && npm run prisma:migrate  # Run migrations
cd server && npm run prisma:studio   # Database GUI

# Testing
npm run test               # Run all tests
npm run test:coverage      # With coverage

# Production Build
npm run build              # Build all packages
```

### Adding Features Checklist
- [ ] Define Zod schema in `server/src/shared/schemas/`
- [ ] Create service in `server/src/services/`
- [ ] Add tRPC router in `server/src/trpc/routers/`
- [ ] Register router in `app.router.ts`
- [ ] Add OpenAPI metadata for documentation
- [ ] Create React components/pages
- [ ] Add tests
- [ ] Update types if needed
- [ ] Run `npm run check` before committing