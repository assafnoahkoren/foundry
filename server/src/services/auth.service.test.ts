import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth.service';
import { prisma } from '../lib/prisma';
import { createTestUser, createTestLoginInput } from '../test/utils/auth.utils';
import { hashPassword } from '../lib/auth/password';

// Mock the auth modules
vi.mock('../lib/auth/password');
vi.mock('../lib/auth/token');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const testUser = createTestUser();
      const hashedPassword = 'hashed-password';
      const mockToken = 'mock-jwt-token';
      
      // Mock the password hashing
      vi.mocked(hashPassword).mockResolvedValue(hashedPassword);
      
      // Mock the token generation
      const { generateToken } = await import('../lib/auth/token');
      vi.mocked(generateToken).mockReturnValue(mockToken);

      // Create a mock user for the response
      const createdUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: testUser.email,
        name: testUser.name,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Spy on Prisma methods
      const findUniqueSpy = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      const createSpy = vi.spyOn(prisma.user, 'create').mockResolvedValue(createdUser);

      const result = await authService.register(testUser);

      // Verify the result
      expect(result).toEqual({
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          createdAt: createdUser.createdAt.toISOString(),
          updatedAt: createdUser.updatedAt.toISOString(),
        },
        token: mockToken,
      });

      // Verify the calls
      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: testUser.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(testUser.password);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });
      expect(generateToken).toHaveBeenCalledWith({
        userId: createdUser.id,
        email: createdUser.email,
      });
    });

    it('should throw error if user already exists', async () => {
      const testUser = createTestUser();
      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: testUser.email,
        name: 'Existing User',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma to return existing user
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser);

      await expect(authService.register(testUser)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully with correct credentials', async () => {
      const loginInput = createTestLoginInput();
      const hashedPassword = 'hashed-password';
      const mockToken = 'mock-jwt-token';
      
      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginInput.email,
        name: 'Test User',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma to return user
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser);

      // Mock password verification
      const { verifyPassword } = await import('../lib/auth/password');
      vi.mocked(verifyPassword).mockResolvedValue(true);

      // Mock token generation
      const { generateToken } = await import('../lib/auth/token');
      vi.mocked(generateToken).mockReturnValue(mockToken);

      const result = await authService.login(loginInput);

      expect(result).toEqual({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          createdAt: existingUser.createdAt.toISOString(),
          updatedAt: existingUser.updatedAt.toISOString(),
        },
        token: mockToken,
      });

      expect(verifyPassword).toHaveBeenCalledWith(loginInput.password, hashedPassword);
      expect(generateToken).toHaveBeenCalledWith({
        userId: existingUser.id,
        email: existingUser.email,
      });
    });

    it('should throw error if user not found', async () => {
      const loginInput = createTestLoginInput();

      // Mock Prisma to return null (user not found)
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password is incorrect', async () => {
      const loginInput = createTestLoginInput();
      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginInput.email,
        name: 'Test User',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma to return user
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser);

      // Mock password verification to fail
      const { verifyPassword } = await import('../lib/auth/password');
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getMe', () => {
    it('should return user data for valid userId', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userData = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma to return user - only selected fields
      // @ts-expect-error - Mocking partial user data for testing
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userData);

      const result = await authService.getMe(userId);

      expect(result).toEqual({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        createdAt: userData.createdAt.toISOString(),
        updatedAt: userData.updatedAt.toISOString(),
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw error if user not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock Prisma to return null
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(authService.getMe(userId)).rejects.toThrow('User not found');
    });
  });
});