import jwt from 'jsonwebtoken';
import { config } from '../../shared/config/config';
import { TokenPayload } from '../../shared/schemas/auth.schema';

/**
 * Generate a JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
}