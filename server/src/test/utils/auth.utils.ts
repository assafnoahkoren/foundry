import { RegisterInput, LoginInput } from '../../shared/schemas/auth.schema';
import { generateToken } from '../../lib/auth/token';

let userCounter = 0;

export const createTestUser = (): RegisterInput => {
  userCounter++;
  return {
    email: `test${userCounter}@example.com`,
    password: 'TestPassword123',
    name: `Test User ${userCounter}`,
  };
};

export const createTestLoginInput = (): LoginInput => ({
  email: `test${userCounter}@example.com`,
  password: 'TestPassword123',
});

export const createTestToken = (userId: string, email: string): string => {
  return generateToken({ userId, email });
};

export const createInvalidToken = (): string => {
  return 'invalid.token.here';
};