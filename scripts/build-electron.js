const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process for ERP Soul Electron App...');

try {
  // Step 1: Build the React app
  console.log('Building React app...');
  execSync('cd apps/client && npm run build', { stdio: 'inherit' });
  console.log('React app built successfully.');

  // Step 2: Install server dependencies
  console.log('Installing server dependencies...');
  execSync('cd apps/server && npm install', { stdio: 'inherit' });
  console.log('Server dependencies installed.');

  // Step 3: Install Electron dependencies
  console.log('Installing Electron dependencies...');
  execSync('cd electron && npm install', { stdio: 'inherit' });
  console.log('Electron dependencies installed.');

  // Step 4: Build Electron app
  console.log('Building Electron app...');
  execSync('cd electron && npm run build:electron', { stdio: 'inherit' });
  console.log('Electron app built successfully.');

  console.log('Build process completed successfully!');
  console.log('You can find the executables in the electron/dist folder.');
} catch (error) {
  console.error('Error during build process:', error);
  process.exit(1);
}
