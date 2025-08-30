import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Safety check: Ensure we're using test database
const DATABASE_URL = process.env.DATABASE_URL || '';
if (!DATABASE_URL.includes('_test')) {
  throw new Error(
    'SAFETY CHECK FAILED: Test setup requires a test database. ' +
    'DATABASE_URL must contain "_test" to prevent data loss. ' +
    'Current DATABASE_URL: ' + DATABASE_URL
  );
}

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

beforeAll(async () => {
  console.log('🧪 Connecting to test database...');
  // Ensure test database is connected
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up database before each test
  // Clear data in correct order to respect foreign key constraints
  await prisma.$transaction([
    // Joni-related tables
    prisma.joniScenarioStepResponse.deleteMany(),
    prisma.joniScenarioResponse.deleteMany(),
    prisma.joniScenarioPractice.deleteMany(),
    prisma.joniScenarioStep.deleteMany(),
    prisma.joniScenario.deleteMany(),
    prisma.joniScenarioGroup.deleteMany(),
    prisma.joniScenarioSubject.deleteMany(),
    
    // User access
    prisma.userAccess.deleteMany(),
    
    // User table
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});