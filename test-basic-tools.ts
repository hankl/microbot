import { ToolRegistry } from './src/agent/tools/registry.js';
import { BashTool, ReadTool, WriteTool, ListDirTool } from './src/agent/tools/basic-tools.js';

async function testBasicTools() {
  console.log('Testing Basic Tools...\n');
  
  const registry = new ToolRegistry();
  await registry.initialize();
  
  // Test bash tool
  console.log('1. Testing Bash Tool:');
  try {
    const bashResult = await registry.execute('bash', { command: 'echo "Hello from bash tool!"' });
    console.log('Bash result:', bashResult);
  } catch (error) {
    console.log('Bash error:', error);
  }
  
  console.log('\n2. Testing Write Tool:');
  try {
    const writeResult = await registry.execute('write', { 
      path: './test-file.txt', 
      content: 'This is a test file created by the write tool.' 
    });
    console.log('Write result:', writeResult);
  } catch (error) {
    console.log('Write error:', error);
  }
  
  console.log('\n3. Testing Read Tool:');
  try {
    const readResult = await registry.execute('read', { path: './test-file.txt' });
    console.log('Read result:', readResult);
  } catch (error) {
    console.log('Read error:', error);
  }
  
  console.log('\n4. Testing List Directory Tool:');
  try {
    const listResult = await registry.execute('list_dir', { path: '.' });
    console.log('List dir result (first 3 items):', listResult.data?.items?.slice(0, 3));
  } catch (error) {
    console.log('List dir error:', error);
  }
  
  // Clean up test file
  console.log('\n5. Cleaning up test file:');
  try {
    const rmResult = await registry.execute('bash', { command: 'rm ./test-file.txt' });
    console.log('Cleanup result:', rmResult);
  } catch (error) {
    console.log('Cleanup error:', error);
  }
  
  console.log('\nTest completed!');
}

// Run the test
testBasicTools().catch(console.error);