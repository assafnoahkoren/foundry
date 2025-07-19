#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

console.log('🔍 Running all checks in parallel...\n');

// Define checks to run
const checks = [
  { name: 'Webapp TypeScript', cwd: 'webapp', command: 'npm', args: ['run', 'typecheck'] },
  { name: 'Webapp ESLint', cwd: 'webapp', command: 'npm', args: ['run', 'lint'] },
  { name: 'Server TypeScript', cwd: 'server', command: 'npm', args: ['run', 'typecheck'] },
  { name: 'Server ESLint', cwd: 'server', command: 'npm', args: ['run', 'lint'] }
];

// Run all checks in parallel
const promises = checks.map(check => {
  return new Promise((resolve) => {
    const output = [];
    const startTime = Date.now();
    
    const proc = spawn(check.command, check.args, {
      cwd: path.join(__dirname, check.cwd),
      shell: true
    });

    proc.stdout.on('data', (data) => {
      output.push(data.toString());
    });

    proc.stderr.on('data', (data) => {
      output.push(data.toString());
    });

    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        name: check.name,
        success: code === 0,
        output: output.join(''),
        duration
      });
    });
  });
});

// Wait for all checks to complete
Promise.all(promises).then(results => {
  console.log('📊 Results:\n');
  
  let allPassed = true;
  
  results.forEach(result => {
    if (result.success) {
      console.log(`${colors.green}✅ ${result.name}${colors.reset} (${result.duration}ms)`);
    } else {
      console.log(`${colors.red}❌ ${result.name}${colors.reset} (${result.duration}ms)`);
      console.log('Output:');
      console.log(result.output);
      console.log('');
      allPassed = false;
    }
  });
  
  console.log('');
  if (allPassed) {
    console.log(`${colors.green}✨ All checks passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}💥 Some checks failed!${colors.reset}`);
    process.exit(1);
  }
}).catch(error => {
  console.error('Error running checks:', error);
  process.exit(1);
});