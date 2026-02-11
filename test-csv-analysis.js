#!/usr/bin/env node

import dotenv from 'dotenv';
import { AgentLoop } from './dist/agent/loop.js';

// Load environment variables
dotenv.config();

async function testCSVAnalysis() {
  console.log('Testing CSV file analysis...');

  // Create AgentLoop instance
  const agentLoop = new AgentLoop({ websocketPort: 8083 });

  try {
    // Start the agent loop in the background
    agentLoop.start().catch(error => {
      console.error('Error in AgentLoop:', error);
    });
    console.log('AgentLoop started successfully');

    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test message: "统计分析test-data.csv里有多少个工程师"
    const testMessage = {
      id: 'test-2',
      content: '统计分析test-data.csv里有多少个工程师',
      user: 'test-user',
      channel: 'test-channel',
      timestamp: new Date().toISOString(),
      clientId: 'test-client'
    };

    console.log('Sending test message:', testMessage.content);

    // Process the message
    await agentLoop.processMessage(testMessage);

    console.log('Test message processed successfully!');

    // Wait a bit for the response to be processed
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Stop the agent loop
    await agentLoop.stop();
    console.log('AgentLoop stopped');
  }
}

testCSVAnalysis();
