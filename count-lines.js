#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join, extname } from 'path';

async function countLinesInFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return 0;
  }
}

async function traverseDirectory(dirPath, fileExtensions = []) {
  let totalLines = 0;
  const extensionStats = {};

  async function traverse(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (fileExtensions.length === 0 || fileExtensions.includes(ext)) {
          const lines = await countLinesInFile(fullPath);
          totalLines += lines;
          
          if (extensionStats[ext]) {
            extensionStats[ext] += lines;
          } else {
            extensionStats[ext] = lines;
          }
        }
      }
    }
  }

  await traverse(dirPath);
  return { totalLines, extensionStats };
}

async function main() {
  const srcDir = join(process.cwd(), 'src');
  
  try {
    // Check if src directory exists
    await fs.access(srcDir);
    
    console.log('Counting lines in src directory...');
    
    // Count all files
    const result = await traverseDirectory(srcDir);
    
    console.log('\n===== Code Line Count =====');
    console.log(`Total lines: ${result.totalLines}`);
    console.log('\nLines by file extension:');
    
    Object.entries(result.extensionStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([ext, lines]) => {
        console.log(`${ext || 'no extension'}: ${lines} lines`);
      });
    
    console.log('==========================');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
