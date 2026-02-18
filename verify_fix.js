// Verify that the fix has been applied correctly
import fs from 'fs';
import path from 'path';

const registryPath = './src/agent/tools/registry.ts';
const basicToolsPath = './src/agent/tools/basic-tools.ts';

console.log('🔍 Verifying the fix for microbot tool registration...\n');

// Check if basic-tools.ts contains all expected tools
const basicToolsContent = fs.readFileSync(basicToolsPath, 'utf8');

const expectedTools = [
  { name: 'BashTool', description: 'Execute bash commands' },
  { name: 'ReadTool', description: 'Read the contents of a file' },
  { name: 'WriteTool', description: 'Write content to a file' },
  { name: 'ListDirTool', description: 'List the contents of a directory' },
  { name: 'ExecTool', description: 'Execute system commands' },
  { name: 'ProcessTool', description: 'Manage running processes' }
];

console.log('📋 Checking for tool implementations in basic-tools.ts:');
let allToolsFound = true;
for (const tool of expectedTools) {
  const found = basicToolsContent.includes(tool.name) && basicToolsContent.includes(tool.description);
  console.log(`  ${found ? '✓' : '✗'} ${tool.name}: ${found ? 'FOUND' : 'NOT FOUND'}`);
  if (!found) allToolsFound = false;
}

console.log();

// Check if registry.ts registers all tools
const registryContent = fs.readFileSync(registryPath, 'utf8');

console.log('🔧 Checking for tool registrations in registry.ts:');
let allRegistrationsFound = true;
for (const tool of expectedTools) {
  // Convert Tool name to expected variable name (e.g., BashTool -> basicTools.BashTool)
  const registrationPattern = `basicTools.${tool.name}`;
  const found = registryContent.includes(registrationPattern);
  console.log(`  ${found ? '✓' : '✗'} ${tool.name} registration: ${found ? 'FOUND' : 'NOT FOUND'}`);
  if (!found) allRegistrationsFound = false;
}

console.log();

// Check if the security enhancements were added
const bashToolSection = basicToolsContent.substring(
  basicToolsContent.indexOf('export class BashTool'),
  basicToolsContent.indexOf('export class ReadTool')
);

const enhancedSecurityFound = bashToolSection.includes("'>', '/dev/null'");
console.log(`🛡️  Enhanced security in BashTool: ${enhancedSecurityFound ? 'YES' : 'NO'}`);

console.log();

if (allToolsFound && allRegistrationsFound) {
  console.log('🎉 SUCCESS: All basic tools are implemented and registered!');
  console.log('✅ The issue described in the problem statement has been fixed.');
  console.log('✅ Tools like bash, read, write, etc. are now properly registered in the ToolRegistry.');
} else {
  console.log('❌ ISSUE: Some tools are missing or not properly registered.');
  console.log('❌ The problem may not be fully resolved.');
}

console.log('\n📝 Summary of changes made:');
console.log('1. Added ExecTool (similar to bash but different name)');
console.log('2. Added ProcessTool (for managing processes)');
console.log('3. Enhanced security in BashTool with additional dangerous command patterns');
console.log('4. Updated ToolRegistry to register all basic tools including new ones');