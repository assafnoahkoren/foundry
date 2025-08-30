import { initializeQueueSystem } from './features/jobs';
import { createRedisConnection } from './features/jobs/redis.config';
import { registerAllBackgroundJobsQueues } from './features/jobs/register-all-background-jobs-queues';
import { prisma } from './lib/prisma';
import { config } from './shared/config/config';
import { retry } from './shared/utils/retry.utils';

/**
 * Check database connection
 */
async function checkDatabaseConnection(): Promise<void> {
  console.log('\t🔄 Checking Postgres connection...');
  await prisma.$connect();
  // Run a simple query to verify connection
  await prisma.$queryRaw`SELECT 1`;
  console.log('\t✅ Database connection established');
}

/**
 * Check Redis connection
 */
async function checkRedisConnection(): Promise<void> {
  console.log('\t🔄 Checking Redis connection...');
  const redis = createRedisConnection();
  await redis.ping();
  await redis.quit();
  console.log('\t✅ Redis connection established');
}

/**
 * Initialize core application systems
 * Used by both web server and worker processes
 */
export async function checkingCoreSystems(): Promise<void> {
  console.log('🔧 Checking core systems...');

  // Check database connection with retry
  await retry(
    checkDatabaseConnection,
    {
      maxAttempts: 100,
      delayMs: 3000,
      onRetry: (error, attempt) => {
        console.error(`\t⚠️  Database connection attempt ${attempt}/100 failed:`, error.message);
        console.log(`\t🔄 Retrying in 3 seconds...`);
      }
    }
  ).catch(error => {
    console.error('\t❌ Database connection failed after 100 attempts:', error);
    throw new Error('Failed to connect to database after 100 retries');
  });

  // Check Redis connection with retry
  await retry(
    checkRedisConnection,
    {
      maxAttempts: 100,
      delayMs: 3000,
      onRetry: (error, attempt) => {
        console.error(`\t⚠️  Redis connection attempt ${attempt}/100 failed:`, error.message);
        console.log(`\t🔄 Retrying in 3 seconds...`);
      }
    }
  ).catch(error => {
    console.error('\t❌ Redis connection failed after 100 attempts:', error);
    throw new Error('Failed to connect to Redis after 100 retries');
  });

  console.log('✅ Core systems checking complete');
}

/**
 * Initialize web server specific systems
 */
export async function bootstrapWebServer(): Promise<void> {
  console.log('🌐 Bootstrapping web server...');

  // Register job queues so Bull Board can find them
  await registerAllBackgroundJobsQueues();

  // Check core systems
  await checkingCoreSystems();

  // Initialize queue system if enabled
  if (config.queue.initializeOnWebServer) {
    console.log('📋 Initializing queue system (INITIALIZE_QUEUE_SYSTEM=true)...');
    await initializeQueueSystem();
  } else {
    console.log('⏭️  Skipping queue system initialization (INITIALIZE_QUEUE_SYSTEM=false)');
  }

  // Web server specific initializations:
  // - Session store
  // - Rate limiting
  // - etc.

  console.log('✅ Web server bootstrap complete');
}

/**
 * Gracefully shutdown all systems
 */
export async function shutdown(): Promise<void> {
  console.log('🛑 Shutting down application...');

  try {
    // Close database connection
    console.log('📊 Closing database connection...');
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('⚠️  Error disconnecting database:', error);
  }

  // Note: Redis connections are managed by the queue system
  // and will be closed by shutdownQueueSystem() in the worker

  // SMTP transporter doesn't need explicit closing

  console.log('✅ Shutdown complete');
}