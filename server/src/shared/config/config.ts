import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env file from the root directory
const envPath = resolve(process.cwd(), '../.env');
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
    port: parseInt(process.env.SERVER_PORT || '13002', 10),
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
  
  // Helper functions
  isProduction: () => config.server.nodeEnv === 'production',
  isDevelopment: () => config.server.nodeEnv === 'development',
  isTest: () => config.server.nodeEnv === 'test',
} as const;

// Export the type for TypeScript autocomplete
export type Config = typeof config;