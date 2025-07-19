import { RegisterInput, LoginInput } from '../../shared/schemas/auth.schema';
import { generateToken } from '../../lib/auth/token';

export const createTestUser = (): RegisterInput => ({
  email: 'test@example.com',
  password: 'TestPassword123',
  name: 'Test User',
});

export const createTestLoginInput = (): LoginInput => ({
  email: 'test@example.com',
  password: 'TestPassword123',
});

export const createTestToken = (userId: string, email: string): string => {
  return generateToken({ userId, email });
};

export const createInvalidToken = (): string => {
  return 'invalid.token.here';
};