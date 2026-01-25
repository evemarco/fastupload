#!/usr/bin/env node

/**
 * Generate Access Key Script
 *
 * Generates a secure random access key and updates the .env file
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Configuration
const KEY_LENGTH = 32; // Number of hex characters (32 = 16 bytes)
const ENV_FILE = path.join(process.cwd(), '.env');

/**
 * Generate a random hex string
 */
function generateKey(length = 32) {
  // Generate random bytes
  const bytes = crypto.randomBytes(Math.ceil(length / 2));

  // Convert to hex string
  const hex = bytes.toString('hex');

  // Truncate to desired length
  return hex.substring(0, length);
}

/**
 * Update .env file with new ACCESS_KEY
 */
function updateEnvFile(newKey) {
  let content = '';

  // Read existing .env file
  if (fs.existsSync(ENV_FILE)) {
    content = fs.readFileSync(ENV_FILE, 'utf8');
  }

  // Check if ACCESS_KEY already exists
  const accessKeyRegex = /^ACCESS_KEY=(.*)$/m;
  const match = content.match(accessKeyRegex);

  let updatedContent;

  if (match) {
    // Update existing ACCESS_KEY
    const oldValue = match[1] || '(empty)';
    console.log('🔄 Updating existing ACCESS_KEY:');
    console.log(`   Old: ${oldValue}`);
    console.log(`   New: ${newKey}`);

    updatedContent = content.replace(accessKeyRegex, `ACCESS_KEY=${newKey}`);
  } else {
    // Add new ACCESS_KEY
    console.log('➕ Adding new ACCESS_KEY:');
    console.log(`   New: ${newKey}`);

    if (content && !content.endsWith('\n')) {
      content += '\n';
    }

    updatedContent = content + `ACCESS_KEY=${newKey}\n`;
  }

  // Write back to .env file
  fs.writeFileSync(ENV_FILE, updatedContent, 'utf8');

  console.log(`✅ Updated ${ENV_FILE}`);
}

/**
 * Main function
 */
function main() {
  console.log('\n🔐 FastUpload Access Key Generator\n');
  console.log('=====================================\n');

  // Generate new key
  const newKey = generateKey(KEY_LENGTH);

  console.log(`Generated key (${KEY_LENGTH} characters):`);
  console.log(`   ${newKey}\n`);

  // Update .env file
  updateEnvFile(newKey);

  console.log('\n⚠️  Security Notes:');
  console.log('   • This key is generated using crypto.randomBytes()');
  console.log('   • It is cryptographically secure');
  console.log('   • Do not commit .env file to version control');
  console.log('   • Restart the server to apply the new key');
  console.log('   • Share this key only with authorized users\n');

  console.log('✅ Done! Restart the server with: pnpm start\n');
}

// Run main function
main();
