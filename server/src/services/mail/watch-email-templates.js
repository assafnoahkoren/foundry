const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const config = require('./email.config');

const templatesDir = path.join(__dirname, config.templatesDir);
const emailsDir = path.join(__dirname, config.emailsDir);

// Function to sync templates
function syncTemplates() {
  if (!fs.existsSync(emailsDir)) {
    fs.mkdirSync(emailsDir);
  }

  const files = fs.readdirSync(templatesDir);
  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      const sourcePath = path.join(templatesDir, file);
      const destPath = path.join(emailsDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`[${new Date().toLocaleTimeString()}] Synced ${file}`);
    }
  });
}

// Initial sync
console.log('Setting up email template preview...');
syncTemplates();

// Watch for changes
console.log(`Watching for changes in ${templatesDir}...`);
fs.watch(templatesDir, (eventType, filename) => {
  if (filename && filename.endsWith('.tsx')) {
    console.log(`[${new Date().toLocaleTimeString()}] Change detected in ${filename}`);
    syncTemplates();
  }
});

// Start React Email dev server
console.log(`Starting React Email preview server on http://localhost:${config.previewPort}...`);
const reactEmail = spawn('npx', ['react-email', 'dev', '--port', config.previewPort.toString(), '--dir', emailsDir], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  reactEmail.kill();
  process.exit();
});

process.on('exit', () => {
  reactEmail.kill();
});