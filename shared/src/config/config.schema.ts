import { z } from 'zod';

export const configSchema = z.object({
  // Database
  postgres: z.object({
    host: z.string(),
    port: z.number(),
    database: z.string(),
    username: z.string(),
    password: z.string(),
  }),
  
  // Server
  server: z.object({
    port: z.number(),
    nodeEnv: z.enum(['development', 'production', 'test']),
  }),
  
  // Client
  client: z.object({
    port: z.number(),
  }),
  
  // Security
  security: z.object({
    jwtSecret: z.string(),
    jwtExpiration: z.string(),
  }),
  
  // Application
  app: z.object({
    name: z.string(),
    url: z.string(),
    clientUrl: z.string(),
  }),
});

export type Config = z.infer<typeof configSchema>;