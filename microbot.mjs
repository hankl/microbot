#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join, normalize } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert Windows path to file:// URL format
function pathToFileURL(path) {
  const normalizedPath = normalize(path).replace(/\\/g, '/');
  if (normalizedPath.startsWith('/')) {
    return `file://${normalizedPath}`;
  } else {
    return `file:///${normalizedPath}`;
  }
}

// Try to load the built version first
let entryPath = join(__dirname, 'dist', 'index.js');

// If built version doesn't exist, try to load the source directly
import { existsSync } from 'fs';
if (!existsSync(entryPath)) {
  entryPath = join(__dirname, 'src', 'index.ts');
}

// Import and run the entry point using file:// URL
const entryURL = pathToFileURL(entryPath);
const { main } = await import(entryURL);
main();