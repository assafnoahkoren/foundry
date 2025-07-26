import { describe, it, expect, beforeEach } from 'vitest';
import { createCaller, createAuthenticatedContext } from '../../test/utils/trpc.utils';
import { createTestUser, createTestLoginInput } from '../../test/utils/auth.utils';
import { prisma } from '../../lib/prisma';

describe('Auth Router', () => {
  let caller: Awaited<ReturnType<typeof createCaller>>;

  beforeEach(async () => {
    caller = await createCaller();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const testUser = createTestUser();

      const result = await caller.auth.register(testUser);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.name).toBe(testUser.name);
      expect(result.user.id).toBeDefined();
      expect(result.token).toBeDefined();

      // Verify user was created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser?.email).toBe(testUser.email);
    });

    it('should throw error when registering with existing email', async () => {
      const testUser = createTestUser();

      // First registration should succeed
      await caller.auth.register(testUser);

      // Second registration with same email should fail
      await expect(caller.auth.register(testUser)).rejects.toThrow('User with this email already exists');
    });

    it('should validate registration input', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '', // Empty password
        name: 'T', // Too short
      };

      await expect(caller.auth.register(invalidUser)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const testUser = createTestUser();
      
      // Register user first
      await caller.auth.register(testUser);

      // Login with correct credentials
      const loginInput = {
        email: testUser.email,
        password: testUser.password,
      };
      const result = await caller.auth.login(loginInput);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginInput.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error with incorrect password', async () => {
      const testUser = createTestUser();
      
      // Register user first
      await caller.auth.register(testUser);

      // Login with wrong password
      const loginInput = {
        email: testUser.email,
        password: 'WrongPassword123',
      };

      await expect(caller.auth.login(loginInput)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for non-existent user', async () => {
      const loginInput = createTestLoginInput();

      await expect(caller.auth.login(loginInput)).rejects.toThrow('Invalid email or password');
    });

    it('should validate login input', async () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: '',
      };

      await expect(caller.auth.login(invalidLogin)).rejects.toThrow();
    });
  });

  describe('me', () => {
    it('should return current user data when authenticated', async () => {
      const testUser = createTestUser();
      
      // Register user and get token
      const { user, token } = await caller.auth.register(testUser);

      // Create authenticated caller
      const authContext = await createAuthenticatedContext(token);
      const authCaller = await createCaller(authContext);

      // Get current user
      const result = await authCaller.auth.me();

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.name).toBe(user.name);
    });

    it('should throw error when not authenticated', async () => {
      await expect(caller.auth.me()).rejects.toThrow('Unauthorized: You must be logged in to perform this action');
    });

    it('should throw error with invalid token', async () => {
      const invalidToken = 'invalid.token.here';
      
      // Create context with invalid token
      const authContext = await createAuthenticatedContext(invalidToken);
      const authCaller = await createCaller(authContext);

      await expect(authCaller.auth.me()).rejects.toThrow('Unauthorized: You must be logged in to perform this action');
    });

    it('should throw error when user no longer exists', async () => {
      const testUser = createTestUser();
      
      // Register user and get token
      const { user, token } = await caller.auth.register(testUser);

      // Delete user from database
      await prisma.user.delete({ where: { id: user.id } });

      // Create authenticated caller
      const authContext = await createAuthenticatedContext(token);
      const authCaller = await createCaller(authContext);

      // Try to get current user
      await expect(authCaller.auth.me()).rejects.toThrow('User not found');
    });
  });
});