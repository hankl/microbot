import { Command } from 'commander';
import { AgentLoop } from './agent/loop.js';
import { Logger } from './utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Microbot starting...');
const logger = new Logger();
console.log('Logger initialized');

async function main() {
  console.log('Main function called');
  const program = new Command();
  
  program
    .name('microbot')
    .description('A lightweight AI agent framework')
    .version('1.0.0');

  program
    .command('start')
    .description('Start the microbot agent')
    .action(async () => {
      console.log('Start command called');
      logger.info('Starting microbot agent...');
      const agentLoop = new AgentLoop();
      await agentLoop.start();
    });

  program
    .command('status')
    .description('Check the status of microbot')
    .action(() => {
      console.log('Status command called');
      logger.info('Checking microbot status...');
      logger.info('Microbot is ready to use');
    });

  console.log('Parsing command line arguments:', process.argv);
  await program.parseAsync(process.argv);
  console.log('Command parsing completed');
}

export { main };

// 直接执行main函数，不使用条件判断
console.log('Direct execution detected');
main();