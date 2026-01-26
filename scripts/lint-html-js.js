#!/usr/bin/env node

/**
 * Check JavaScript syntax inside HTML files
 * Extracts <script> tags and validates syntax
 */

import fs from 'fs';
import path from 'path';

const htmlFilePath = path.join(process.cwd(), 'public/index.html');

try {
  const html = fs.readFileSync(htmlFilePath, 'utf8');
  
  // Find content between <script> tags
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  
  if (!scriptMatch) {
    console.error('❌ No <script> tag found in HTML file');
    process.exit(1);
  }
  
  const jsCode = scriptMatch[1];
  
  // Try to parse JavaScript
  try {
    // Create a Function to check syntax (faster than eval)
    new Function(jsCode);
    console.log('✅ JavaScript syntax in HTML is valid');
    process.exit(0);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('❌ JavaScript syntax error in HTML:');
      console.error(error.message);
      
      // Try to show problematic line
      const match = error.message.match(/(\d+):(\d+)/);
      if (match) {
        const line = parseInt(match[1]);
        const lines = jsCode.split('\n');
        if (lines[line - 1]) {
          console.error(`\nLine ${line}:`);
          console.error(lines[line - 1]);
        }
      }
      
      process.exit(1);
    }
    throw error;
  }
} catch (error) {
  console.error('❌ Error checking HTML JavaScript syntax:');
  console.error(error.message);
  process.exit(1);
}
