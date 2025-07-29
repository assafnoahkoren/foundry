## Project Configuration
- All the ports of this project should start with 1300X.

## Development Best Practices
- Make sure to create or update tests according to new logics and after any change run tests
- After making changes, run `npm run check` from the root directory to run all TypeScript and ESLint checks in parallel
- Fix any TypeScript or ESLint errors before considering the task complete
- When solving TypeScript or ESLint errors, investigate root causes holistically:
  - Don't just add type assertions (`as`), `@ts-ignore`, or `eslint-disable` comments
  - Maybe database migrations need to be run (`npm run prisma:migrate`)
  - Check if types need to be regenerated (e.g., after Prisma schema changes)
  - Consider if the error indicates a real logic issue that needs proper fixing

## UI Development
- When creating UI layouts, assign meaningful IDs to different sections and components for better accessibility and testing
- Use Lucide React icons (already installed with shadcn/ui) for all icon needs

## User Access Management System

### Overview
The project includes a flexible user access management system that supports feature-based access control with metadata. The system follows the singleton service pattern used throughout the codebase.

### Key Components

1. **Features Configuration** (`/server/src/services/features.config.ts`)
   - Defines available features and sub-features
   - Uses TypeScript conditional types for type-safe feature/sub-feature combinations
   - Supports metadata with validation rules

2. **Database Schema**
   - `UserAccess` table in Prisma schema
   - Tracks user access to specific sub-features with metadata
   - Supports expiration dates and grant tracking (who granted and why)

3. **Service**
   - `userAccessService`: Singleton service for all user access operations
   - Handles both user queries (validation, listing) and admin operations (granting, revoking, bulk operations)
   - Imports prisma directly from `../lib/prisma` following the codebase pattern

4. **Middleware** (`/server/src/middleware/feature-access.middleware.ts`)
   - `requireFeatureAccess()`: tRPC middleware for protecting endpoints
   - Can check for specific sub-feature or general feature access

5. **Router** (`/server/src/trpc/routers/user-access.router.ts`)
   - `getMyFeatures`: Get all features/sub-features for the current user
   - `checkAccess`: Check if user has specific access
   - `getFeaturesConfig`: Get feature structure (for admin UIs)

### Usage Example
```typescript
// Protect an endpoint with feature access requirement
.use(requireFeatureAccess('ace', 'ace-analytics'))
.mutation(async ({ ctx }) => {
  // User has access to ace-analytics
})
```

### Current Features
- **ace**: Advanced capabilities suite
  - `ace-analytics`: Analytics and reporting
  - `ace-api-access`: Advanced API endpoints
- **joni**: Specialized spy tools (Johnny English)
  - `joni-gadgets`: Spy gadgets access
  - `joni-missions`: Secret mission planning