#!/usr/bin/env node

import dotenv from 'dotenv';
import { AgentLoop } from './dist/agent/loop.js';

// Load environment variables
dotenv.config();

async function testSkillUsage() {
  console.log('Testing microbot skill usage...');

  // Create AgentLoop instance
  const agentLoop = new AgentLoop({ websocketPort: 8082 });

  try {
    // Start the agent loop
    await agentLoop.start();
    console.log('AgentLoop started successfully');

    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test message: "统计分析test-data.json里有多少个工程师"
    const testMessage = {
      id: 'test-1',
      content: '统计分析test-data.json里有多少个工程师',
      user: 'test-user',
      channel: 'test-channel',
      timestamp: new Date().toISOString(),
      clientId: 'test-client'
    };

    console.log('Sending test message:', testMessage.content);

    // Process the message
    await agentLoop.processMessage(testMessage);

    console.log('Test message processed successfully!');

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Stop the agent loop
    await agentLoop.stop();
    console.log('AgentLoop stopped');
  }
}

testSkillUsage();