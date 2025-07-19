import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { Config, configSchema } from './config.schema';

export class ConfigService {
  private static instance: ConfigService;
  private config: Config;

  private constructor() {
    // Load .env file from the root directory
    const envPath = resolve(process.cwd(), '.env');
    dotenvConfig({ path: envPath });

    // Parse and validate configuration
    const rawConfig = {
      postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '13001', 10),
        database: process.env.POSTGRES_DB || 'foundry',
        username: process.env.POSTGRES_USER || 'foundry_user',
        password: process.env.POSTGRES_PASSWORD || 'foundry_password',
      },
      server: {
        port: parseInt(process.env.SERVER_PORT || '13002', 10),
        nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
      },
      client: {
        port: parseInt(process.env.CLIENT_PORT || '13003', 10),
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-change-this',
        jwtExpiration: process.env.JWT_EXPIRATION || '7d',
      },
      app: {
        name: process.env.APP_NAME || 'Foundry',
        url: process.env.APP_URL || 'http://localhost:13002',
        clientUrl: process.env.CLIENT_URL || 'http://localhost:13003',
      },
    };

    // Validate configuration
    const result = configSchema.safeParse(rawConfig);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.config = result.data;
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  public getAll(): Config {
    return this.config;
  }

  // Helper methods for common access patterns
  public getDatabaseUrl(): string {
    const { host, port, database, username, password } = this.config.postgres;
    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }

  public isProduction(): boolean {
    return this.config.server.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.server.nodeEnv === 'development';
  }

  public isTest(): boolean {
    return this.config.server.nodeEnv === 'test';
  }
}