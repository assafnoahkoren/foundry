import { z } from 'zod';

// Registration schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Token payload schema
export const tokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
});

// Auth response schema
export const authResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  token: z.string(),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;