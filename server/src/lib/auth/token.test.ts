import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, extractTokenFromHeader } from './token';
import { TokenPayload } from '../../shared/schemas/auth.schema';

describe('Token utilities', () => {
  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include payload data in token', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should set correct expiration time', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      const expirationTime = decoded.exp! - decoded.iat!;
      
      // JWT expiration is set to 7d = 604800 seconds in config
      expect(expirationTime).toBe(604800);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toEqual(mockPayload);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET || 'test-secret', {
        expiresIn: '0s',
      });

      // Wait a bit to ensure token is expired
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      expect(() => verifyToken(expiredToken)).toThrow('Invalid or expired token');

      vi.useRealTimers();
    });

    it('should throw error for token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(mockPayload, 'wrong-secret', {
        expiresIn: '1h',
      });

      expect(() => verifyToken(tokenWithWrongSecret)).toThrow('Invalid or expired token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const authHeader = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      
      const extracted = extractTokenFromHeader(token);
      expect(extracted).toBeNull();
    });

    it('should return null for header with wrong prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const authHeader = `Basic ${token}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });

    it('should handle header with just "Bearer" and no token', () => {
      const authHeader = 'Bearer ';

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe('');
    });
  });
});