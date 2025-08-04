#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Load test environment
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

async function runTests() {
  console.log('🚀 Starting test suite with test database...\n');

  // First, setup the test database
  console.log('📦 Setting up test database...');
  const setupProcess = spawn('tsx', ['src/test/setup-test-db-prisma.ts', '--setup'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  await new Promise((resolve, reject) => {
    setupProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Database setup failed with code ${code}`));
      }
    });
  });

  // Run the actual tests
  console.log('\n🧪 Running tests...\n');
  const testProcess = spawn('npx', ['vitest', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  testProcess.on('exit', (code) => {
    console.log('\n✨ Test run completed');
    process.exit(code);
  });
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test run failed:', error);
  process.exit(1);
});