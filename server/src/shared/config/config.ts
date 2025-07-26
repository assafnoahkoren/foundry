import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load .env file from the root directory
const envPath = resolve(process.cwd(), '.env');
dotenvConfig({ path: envPath });

// Simple config object with all environment variables
export const config = {
  // Database
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '13001', 10),
    database: process.env.POSTGRES_DB || 'foundry',
    username: process.env.POSTGRES_USER || 'foundry_user',
    password: process.env.POSTGRES_PASSWORD || 'foundry_password',
  },
  
  // Database URL (for Prisma)
  databaseUrl: process.env.DATABASE_URL || 
    `postgresql://${process.env.POSTGRES_USER || 'foundry_user'}:${process.env.POSTGRES_PASSWORD || 'foundry_password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '13001'}/${process.env.POSTGRES_DB || 'foundry'}`,
  
  // Server
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || process.env.SERVER_PORT || '13002', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  },
  
  // Client
  client: {
    port: parseInt(process.env.CLIENT_PORT || '13003', 10),
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  
  // Application
  app: {
    name: process.env.APP_NAME || 'Foundry',
    url: process.env.APP_URL || 'http://localhost:13002',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:13003',
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '13007', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  // Queue System
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    rateLimitMax: parseInt(process.env.QUEUE_RATE_LIMIT_MAX || '100', 10),
    rateLimitDuration: parseInt(process.env.QUEUE_RATE_LIMIT_DURATION || '60000', 10),
    initializeOnWebServer: process.env.INITIALIZE_QUEUE_SYSTEM === 'true',
  },
  
  // Worker
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
    emailConcurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5', 10),
  },
  
  // Bull Board
  bullBoard: {
    enabled: process.env.ENABLE_BULL_BOARD === 'true',
    username: process.env.BULL_BOARD_USERNAME,
    password: process.env.BULL_BOARD_PASSWORD,
  },
  
  // Mail Service
  mail: {
    from: {
      email: process.env.MAIL_FROM_EMAIL || 'noreply@foundry.local',
      name: process.env.MAIL_FROM_NAME || 'Foundry App',
    },
    host: process.env.MAIL_HOST || 'localhost',
    port: parseInt(process.env.MAIL_PORT || '13004', 10),
    secure: process.env.MAIL_SECURE === 'true',
    auth: process.env.MAIL_USER && process.env.MAIL_PASS ? {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    } : undefined,
  },
  
  // Helper functions
  isProduction: () => config.server.nodeEnv === 'production',
  isDevelopment: () => config.server.nodeEnv === 'development',
  isTest: () => config.server.nodeEnv === 'test',
} as const;

// Export the type for TypeScript autocomplete
export type Config = typeof config;