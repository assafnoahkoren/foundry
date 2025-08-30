# Testing Guide

## Overview

This project uses Vitest for testing with a separate PostgreSQL test database to ensure production data safety.

## Test Database Setup

### Safety Features

1. **Separate Test Database**: Tests use `foundry_test` database instead of the production `foundry` database
2. **Safety Checks**: Test setup will fail if DATABASE_URL doesn't contain "_test"
3. **Environment Isolation**: Test configuration is stored in `.env.test`

### Quick Start

```bash
# First time setup - create test database
npm run test:db:setup

# Run tests safely with test database
npm run test:safe

# Run tests with UI
npm run test:safe:ui

# Teardown test database when done
npm run test:db:teardown
```

### Manual Test Database Setup

If you prefer to set up the test database manually:

```bash
# Create test database
createdb -h localhost -p 13001 -U foundry_user foundry_test

# Run migrations on test database
DATABASE_URL=postgresql://foundry_user:foundry_password@localhost:13001/foundry_test npx prisma migrate deploy
```

## Configuration

### .env.test

The test environment uses `.env.test` which configures:
- `DATABASE_URL`: Points to `foundry_test` database
- `NODE_ENV`: Set to "test"
- Different ports for test services (13102 for server, 13103 for client)

### Test Scripts

- `npm test` - Run tests (⚠️ WARNING: Only use if you've verified test database is configured)
- `npm run test:safe` - Run tests with automatic test database verification
- `npm run test:safe:ui` - Run tests with Vitest UI
- `npm run test:db:setup` - Create and migrate test database
- `npm run test:db:teardown` - Remove test database

## Writing Tests

### Example Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';

describe('User Service', () => {
  beforeEach(async () => {
    // Database is automatically cleared before each test
    // You can seed test data here if needed
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User'
      }
    });
  });

  it('should find user by email', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    expect(user).toBeDefined();
    expect(user?.name).toBe('Test User');
  });
});
```

## Important Notes

1. **Never run tests on production database** - Always use the test database
2. **Data is cleared before each test** - Don't rely on data persisting between tests
3. **Use transactions for complex setups** - This ensures data consistency

## Troubleshooting

### "SAFETY CHECK FAILED" Error

This means the test setup detected you're trying to run tests against a non-test database. Check:
1. `.env.test` exists and has correct DATABASE_URL
2. DATABASE_URL contains "_test" in the database name
3. You're not accidentally loading production environment variables

### Database Connection Errors

1. Ensure PostgreSQL is running on port 13001
2. Check that `foundry_test` database exists
3. Verify credentials in `.env.test`

### Permission Errors

If you get permission errors creating the test database:
```bash
# Connect as postgres superuser
psql -U postgres -c "CREATE DATABASE foundry_test OWNER foundry_user;"
```

## CI/CD Integration

For CI environments, you can:

1. Create test database in CI pipeline:
```yaml
- name: Setup test database
  run: |
    psql -c "CREATE DATABASE foundry_test;" -U postgres
    npm run prisma:deploy
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/foundry_test
```

2. Use Docker for isolated testing:
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: foundry_test
```