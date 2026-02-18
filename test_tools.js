// Simple test script to verify basic tools functionality
import { ToolRegistry } from './src/agent/tools/registry.js';

async function testTools() {
  console.log('Testing Tool Registry...\n');
  
  const registry = new ToolRegistry();
  await registry.initialize();
  
  console.log('Available tools:');
  const definitions = registry.getDefinitions();
  definitions.forEach(def => {
    console.log(`- ${def.name}: ${def.description}`);
  });
  
  console.log('\nTesting individual tools...');
  
  // Test bash tool if available
  if (registry.getTool('bash')) {
    console.log('\n✓ Bash tool is registered');
  } else {
    console.log('\n✗ Bash tool is NOT registered');
  }
  
  // Test read tool if available
  if (registry.getTool('read')) {
    console.log('✓ Read tool is registered');
  } else {
    console.log('✗ Read tool is NOT registered');
  }
  
  // Test write tool if available
  if (registry.getTool('write')) {
    console.log('✓ Write tool is registered');
  } else {
    console.log('✗ Write tool is NOT registered');
  }
  
  // Test list_dir tool if available
  if (registry.getTool('list_dir')) {
    console.log('✓ ListDir tool is registered');
  } else {
    console.log('✗ ListDir tool is NOT registered');
  }
  
  // Test exec tool if available
  if (registry.getTool('exec')) {
    console.log('✓ Exec tool is registered');
  } else {
    console.log('✗ Exec tool is NOT registered');
  }
  
  // Test process tool if available
  if (registry.getTool('process')) {
    console.log('✓ Process tool is registered');
  } else {
    console.log('✗ Process tool is NOT registered');
  }
  
  console.log('\nTool registry test completed!');
}

testTools().catch(console.error);