# System Architecture Documentation

## Overview

This project implements a modern full-stack TypeScript application using a monorepo architecture with end-to-end type safety through tRPC. The system follows a clean, functional architecture pattern that prioritizes developer experience and type safety.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Monorepo Root                          │
│                    (NPM Workspaces Manager)                     │
├─────────────────────┬─────────────────────┬───────────────────┤
│                     │                     │                   │
│    Shared Package   │   Server Package   │  WebApp Package   │
│   (@workspace/shared)│      (server)      │     (webapp)      │
│                     │                     │                   │
│  ┌───────────────┐  │  ┌──────────────┐  │  ┌─────────────┐ │
│  │ Zod Schemas   │  │  │   Fastify    │  │  │    React    │ │
│  ├───────────────┤  │  ├──────────────┤  │  ├─────────────┤ │
│  │ TypeScript    │  │  │    tRPC      │  │  │ tRPC Client │ │
│  │    Types      │  │  │   Router     │  │  ├─────────────┤ │
│  └───────────────┘  │  ├──────────────┤  │  │ React Query │ │
│         ▲           │  │  Services    │  │  ├─────────────┤ │
│         │           │  └──────────────┘  │  │    Vite     │ │
│         │           │         ▲          │  └─────────────┘ │
│         └───────────┼─────────┘          │         ▲         │
│                     │                     │         │         │
│                     └─────────────────────┼─────────┘         │
│                                           │                   │
└───────────────────────────────────────────┴───────────────────┘
                                            │
                                     Type Safety Flow
```

## Core Components

### 1. Shared Package (`@workspace/shared`)

**Purpose**: Centralized type definitions and validation schemas shared across the entire application.

**Structure**:
```
shared/
├── src/
│   ├── schemas/          # Zod validation schemas
│   │   └── user.schema.ts
│   ├── types/            # TypeScript interfaces
│   │   └── index.ts
│   └── index.ts          # Main export
└── package.json
```

**Key Features**:
- Zod schemas that serve dual purpose: runtime validation + TypeScript types
- Single source of truth for data structures
- Automatic type inference from schemas
- Version controlled and shared across packages

### 2. Server Package (`server`)

**Purpose**: Backend API server using Fastify with tRPC for type-safe endpoints.

**Structure**:
```
server/
├── src/
│   ├── trpc/
│   │   ├── context.ts       # Request context creation
│   │   ├── trpc.ts          # tRPC initialization
│   │   └── routers/
│   │       ├── app.router.ts    # Main router aggregator
│   │       └── user.router.ts   # User endpoints
│   ├── services/
│   │   └── user.service.ts  # Business logic layer
│   ├── server.ts            # Fastify server setup
│   └── index.ts             # Entry point
└── package.json
```

**Technology Stack**:
- **Fastify**: High-performance HTTP server
- **tRPC**: End-to-end typesafe APIs
- **Zod**: Runtime validation
- **TypeScript**: Type safety

**Key Design Decisions**:
- Functional approach over decorators (unlike NestJS)
- Service layer for business logic separation
- Context-based authentication/authorization ready
- Modular router structure for scalability

### 3. WebApp Package (`webapp`)

**Purpose**: React-based frontend application with Vite for fast development.

**Structure**:
```
webapp/
├── src/
│   ├── utils/
│   │   └── trpc.ts         # tRPC client configuration
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point with providers
│   └── index.css           # Styles
├── index.html
└── package.json
```

**Technology Stack**:
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **tRPC Client**: Type-safe API client
- **React Query**: Server state management
- **TypeScript**: Type safety

## Data Flow Architecture

### 1. Type Definition Flow
```
Zod Schema (shared) → TypeScript Types → Server Implementation → Client Usage
```

### 2. Request/Response Flow
```
React Component → tRPC Hook → HTTP Request → Fastify → tRPC Router → Service → Response
```

### 3. Development Workflow
```
1. Define schema in shared/schemas
2. Implement service logic in server/services
3. Create tRPC router in server/trpc/routers
4. Use in React with full type inference
```

## Key Architectural Patterns

### 1. **Monorepo with Workspaces**
- Simplified dependency management
- Code sharing without publishing
- Synchronized versioning
- Single install command

### 2. **End-to-End Type Safety**
- Types flow from backend to frontend automatically
- No code generation required
- Compile-time error catching
- Refactoring safety

### 3. **Functional Architecture**
- Pure functions over classes where possible
- Immutable data patterns
- Composition over inheritance
- Simple mental model

### 4. **Separation of Concerns**
```
Routers (HTTP layer) → Services (Business logic) → Data Layer
```

## Security Architecture

### Current Implementation
- CORS configuration for cross-origin requests
- Input validation with Zod schemas
- Error handling with sanitized responses

### Ready for Extension
- Context-based authentication
- JWT token validation
- Role-based access control
- Rate limiting with Fastify plugins

## Performance Considerations

### Backend Performance
- **Fastify**: ~35,000 req/s (2x faster than Express)
- **JSON Schema validation**: Compiled validators
- **Async/await**: Non-blocking I/O
- **HTTP/2 ready**: Modern protocol support

### Frontend Performance
- **Vite**: Instant HMR in development
- **React Query**: Intelligent caching
- **Code splitting**: Automatic with Vite
- **Tree shaking**: Removes unused code

## Scalability Patterns

### Horizontal Scaling
- Stateless server design
- Ready for containerization
- Load balancer compatible
- Microservices ready

### Vertical Scaling
- Modular router structure
- Service layer abstraction
- Database ready (just add ORM)
- Queue ready architecture

## Development Experience

### Type Safety Benefits
1. **Auto-completion**: IDE knows all endpoints and their types
2. **Refactoring**: Change backend, frontend updates automatically
3. **Error Prevention**: Catch type errors at compile time
4. **Documentation**: Types serve as living documentation

### Developer Workflow
1. **Hot Reloading**: Both frontend and backend
2. **Single Command**: `npm install` at root
3. **Parallel Development**: Frontend/backend teams can work independently
4. **Testing Ready**: Service layer easily testable

## Deployment Architecture

### Development
```bash
npm run dev:server  # Backend on :3001
npm run dev:webapp  # Frontend on :5173
```

### Production Build
```bash
npm run build       # Builds all packages
```

### Deployment Options
1. **Traditional**: Deploy server and static frontend separately
2. **Containerized**: Docker with multi-stage builds
3. **Serverless**: Deploy tRPC on Vercel/Netlify functions
4. **Edge**: Deploy on Cloudflare Workers (with Hono adapter)

## Future Architecture Considerations

### Database Integration
- Add Prisma/Drizzle ORM in server
- Update services to use database
- Types still flow automatically

### Authentication
- Add auth context in tRPC
- Implement protected procedures
- JWT or session-based

### Real-time Features
- WebSocket support with tRPC subscriptions
- Server-sent events
- Live queries with React Query

### Microservices Migration
- Split routers into separate services
- Maintain type safety with shared package
- API gateway pattern

## Architecture Decision Records (ADRs)

### ADR-001: Fastify over Express
- **Decision**: Use Fastify instead of Express
- **Rationale**: 2x performance, better TypeScript support, modern architecture
- **Consequences**: Smaller ecosystem, but growing rapidly

### ADR-002: tRPC over REST/GraphQL
- **Decision**: Use tRPC for API layer
- **Rationale**: Perfect TypeScript integration, no code generation, simpler than GraphQL
- **Consequences**: TypeScript-only, less standardized than REST

### ADR-003: Functional over OOP (No NestJS)
- **Decision**: Functional architecture instead of decorator-based
- **Rationale**: Simpler mental model, better tree shaking, natural tRPC fit
- **Consequences**: Less "enterprise" patterns, more flexibility

### ADR-004: Monorepo Structure
- **Decision**: Use NPM workspaces for monorepo
- **Rationale**: Simplified development, easy code sharing, single install
- **Consequences**: All code in one repository, need good CI/CD practices

## Conclusion

This architecture provides a solid foundation for building type-safe, performant, and scalable full-stack applications. The focus on developer experience and type safety reduces bugs and increases development velocity while maintaining flexibility for future growth.