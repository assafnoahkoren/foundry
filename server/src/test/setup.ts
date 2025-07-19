import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRATION = '1h';

beforeAll(async () => {
  // Ensure test database is connected
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up database before each test
  const deleteUser = prisma.user.deleteMany();
  
  // Execute the transaction
  await prisma.$transaction([deleteUser]);
});

afterAll(async () => {
  await prisma.$disconnect();
});