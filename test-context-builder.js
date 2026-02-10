#!/usr/bin/env node

import dotenv from 'dotenv';
import { ContextBuilder } from './dist/agent/context.js';
import { SessionManager } from './dist/session/manager.js';

// Load environment variables
dotenv.config();

async function testContextBuilder() {
  console.log('Testing ContextBuilder...');

  try {
    // Create ContextBuilder instance
    const contextBuilder = new ContextBuilder();

    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a mock session
    const sessionManager = new SessionManager();
    await sessionManager.initialize();

    const session = await sessionManager.getOrCreateSession('test-channel', 'test-user');

    // Add a test message
    session.addMessage({
      role: 'user',
      content: '统计分析test-data.json里有多少个工程师',
      timestamp: new Date().toISOString()
    });

    // Test message
    const testMessage = {
      id: 'test-1',
      content: '统计分析test-data.json里有多少个工程师',
      user: 'test-user',
      channel: 'test-channel',
      timestamp: new Date().toISOString()
    };

    console.log('Building context...');

    // Build context
    const context = await contextBuilder.buildContext(session, testMessage);

    console.log('Context built successfully!');
    console.log('\n=== Context Details ===');
    console.log('System prompt length:', context.system ? context.system.length : 0);
    console.log('Memory context length:', context.memory ? context.memory.length : 0);
    console.log('Skills summary length:', context.skills ? context.skills.length : 0);
    console.log('History length:', context.history ? context.history.length : 0);
    
    if (context.skills) {
      console.log('\n=== Skills Summary ===');
      console.log(context.skills);
    }

    if (context.system) {
      console.log('\n=== System Prompt Preview ===');
      console.log(context.system.substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    console.log('\nTest completed!');
  }
}

testContextBuilder();