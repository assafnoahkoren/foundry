import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

// Load test environment variables - OVERRIDE any existing env vars
const testEnvPath = path.join(__dirname, '../../.env.test');
const result = dotenv.config({ 
  path: testEnvPath,
  override: true
});

if (result.error) {
  throw new Error(`Failed to load .env.test: ${result.error.message}`);
}

const TEST_DATABASE_URL = process.env.DATABASE_URL;
const TEST_DB_NAME = process.env.POSTGRES_DB || 'foundry_test';

console.log('📋 Test environment loaded from:', testEnvPath);
console.log('🗄️  Test database:', TEST_DB_NAME);

if (!TEST_DATABASE_URL) {
  throw new Error('DATABASE_URL not set in .env.test');
}

// Ensure we're not using the production database
if (!TEST_DATABASE_URL.includes('_test')) {
  console.error('❌ Safety check failed!');
  console.error('   DATABASE_URL must contain "_test" to prevent data loss');
  console.error('   Current URL:', TEST_DATABASE_URL);
  throw new Error('Test database URL must contain "_test" to prevent accidental data loss');
}

export async function createTestDatabase() {
  console.log('🔧 Creating test database using Node.js PostgreSQL client...');
  
  // Parse connection details
  const dbUrl = new URL(TEST_DATABASE_URL!);
  const config = {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port),
    user: dbUrl.username,
    password: dbUrl.password,
    database: 'postgres' // Connect to default postgres database
  };
  
  const client = new Client(config);
  
  try {
    await client.connect();
    
    // Drop existing test database if it exists
    console.log(`  Dropping existing ${TEST_DB_NAME} if it exists...`);
    try {
      // First terminate all connections to the test database
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [TEST_DB_NAME]);
      
      await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    } catch {
      console.log('  Note: Database might not exist, continuing...');
    }
    
    // Create fresh test database
    console.log(`  Creating ${TEST_DB_NAME}...`);
    await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    
    console.log('✅ Test database created successfully');
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

export async function migrateTestDatabase() {
  console.log('🔄 Running migrations on test database...');
  
  try {
    // Run Prisma migrations
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL
      }
    });
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
}

export async function dropTestDatabase() {
  console.log('🧹 Dropping test database...');
  
  const dbUrl = new URL(TEST_DATABASE_URL!);
  const config = {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port),
    user: dbUrl.username,
    password: dbUrl.password,
    database: 'postgres'
  };
  
  const client = new Client(config);
  
  try {
    await client.connect();
    
    // Terminate all connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [TEST_DB_NAME]);
    
    // Drop test database
    await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    
    console.log('✅ Test database dropped successfully');
  } catch (error) {
    console.error('Failed to drop test database:', error);
    // Don't throw here as this is cleanup
  } finally {
    await client.end();
  }
}

// Helper functions
export async function setupTestDatabase() {
  await createTestDatabase();
  await migrateTestDatabase();
}

export async function teardownTestDatabase() {
  await dropTestDatabase();
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--setup')) {
    setupTestDatabase()
      .then(() => {
        console.log('✅ Test database setup complete');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Failed to setup test database:', error);
        process.exit(1);
      });
  } else if (args.includes('--teardown')) {
    teardownTestDatabase()
      .then(() => {
        console.log('✅ Test database teardown complete');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Failed to teardown test database:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: tsx setup-test-db-prisma.ts [--setup|--teardown]');
    process.exit(0);
  }
}