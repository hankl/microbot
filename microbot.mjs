#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load the built version first
let entryPath = join(__dirname, 'dist', 'index.js');

// If built version doesn't exist, try to load the source directly
import { existsSync } from 'fs';
if (!existsSync(entryPath)) {
  entryPath = join(__dirname, 'src', 'index.ts');
}

// Import and run the entry point
const { main } = await import(entryPath);
main();