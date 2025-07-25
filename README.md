# Fastify + tRPC + React Workspace

[![CI](https://github.com/YOUR_USERNAME/foundry/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/foundry/actions/workflows/ci.yml)

A modern full-stack TypeScript monorepo with end-to-end type safety using tRPC.

## Tech Stack

- **Backend**: Fastify + tRPC + Prisma
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL
- **Queue**: BullMQ + Redis
- **Email**: Nodemailer + React Email
- **Shared**: Zod schemas and TypeScript types
- **Package Manager**: npm workspaces

## 🐳 Docker Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 13001 | Database |
| Server (API) | 13002 | Fastify + tRPC backend |
| Webapp | 13003 | React frontend |
| Mailhog SMTP | 13004 | Email SMTP server |
| Mailhog UI | 13005 | Email web interface |
| Redis | 13007 | Queue/Cache storage (password: foundry_redis_password) |
| Redis Commander | 13008 | Redis web UI |

## Project Structure

```
my-workspace/
├── shared/          # Shared types and schemas
│   └── src/
│       ├── schemas/ # Zod validation schemas
│       └── types/   # TypeScript interfaces
├── server/          # Fastify + tRPC backend
│   └── src/
│       ├── trpc/    # tRPC routers and context
│       └── services/ # Business logic
└── webapp/          # React frontend
    └── src/
        └── utils/   # tRPC client setup
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start Docker services:
```bash
docker-compose up -d
```

3. Start the development servers:

In one terminal, start the backend:
```bash
npm run dev:server
```

In another terminal, start the frontend:
```bash
npm run dev:webapp
```

4. Open your browser:
- Frontend: http://localhost:13003
- Backend API: http://localhost:13002/trpc
- Mailhog UI: http://localhost:13005
- Redis Commander: http://localhost:13008

## Features

- 🔥 **End-to-End Type Safety**: Types flow seamlessly from backend to frontend
- ⚡ **Fast Development**: Hot reloading on both frontend and backend
- 🛡️ **Type Validation**: Zod schemas ensure runtime type safety
- 📦 **Monorepo Structure**: Shared code between projects
- 🚀 **Modern Stack**: Latest versions of all dependencies

## Available Scripts

From the root directory:

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run dev:server` - Start only the backend server
- `npm run dev:webapp` - Start only the frontend
- `npm run build:server` - Build the backend
- `npm run build:webapp` - Build the frontend

## API Example

The demo includes a simple user management API:

```typescript
// Backend definition (automatic type inference)
export const userRouter = router({
  list: publicProcedure.query(/* ... */),
  create: publicProcedure.mutation(/* ... */),
  update: publicProcedure.mutation(/* ... */),
  delete: publicProcedure.mutation(/* ... */),
});

// Frontend usage (fully typed!)
const users = trpc.users.list.useQuery({ limit: 10 });
const createUser = trpc.users.create.useMutation();
```

## Adding New Features

1. **Define schemas** in `shared/src/schemas/`
2. **Create services** in `server/src/services/`
3. **Add tRPC routes** in `server/src/trpc/routers/`
4. **Use in React** with the tRPC hooks in `webapp/`

## Development Tips

- The shared package provides type safety across the stack
- Zod schemas serve as both runtime validation and TypeScript types
- tRPC procedures are just functions - test them like any other code
- Use React Query's powerful caching and synchronization features

## Documentation

- [Background Jobs Guide](./docs/BACKGROUND_JOBS.md) - Complete guide to the queue system
- [Background Jobs Quick Reference](./docs/BACKGROUND_JOBS_QUICK_REFERENCE.md) - Quick reference and examples
- [Queue Architecture](./docs/QUEUE_ARCHITECTURE.md) - Detailed architecture documentation

## License

MIT