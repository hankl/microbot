#!/usr/bin/env node

import dotenv from 'dotenv';
import { AgentLoop } from './dist/agent/loop.js';

// Load environment variables
dotenv.config();

async function testDataAnalyzer() {
  console.log('Testing data-analyzer directly...');

  // Create AgentLoop instance
  const agentLoop = new AgentLoop({ websocketPort: 8083 });

  try {
    // Test 1: CSV file with dashes in name
    console.log('\n=== Test 1: CSV file with dashes ===');
    const result1 = await agentLoop['executeDataAnalyzer']({
      filePath: 'test-data.csv',
      query: 'SELECT COUNT(*) FROM test-data.csv'
    });
    console.log('Result 1:', result1);

    // Test 2: JSON file
    console.log('\n=== Test 2: JSON file ===');
    const result2 = await agentLoop['executeDataAnalyzer']({
      filePath: 'test-data.json',
      query: 'SELECT COUNT(*) FROM test-data.json'
    });
    console.log('Result 2:', result2);

    // Test 3: Complex query
    console.log('\n=== Test 3: Complex query ===');
    const result3 = await agentLoop['executeDataAnalyzer']({
      filePath: 'test-data.csv',
      query: 'SELECT department, COUNT(*) as count FROM test-data.csv GROUP BY department'
    });
    console.log('Result 3:', result3);

    console.log('\nAll tests completed!');

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Stop the agent loop
    await agentLoop.stop();
    console.log('AgentLoop stopped');
  }
}

testDataAnalyzer();
