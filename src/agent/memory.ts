import { Logger } from '../utils/logger.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export class MemoryStore {
  private logger: Logger;
  private memoryDir: string;
  private mainMemoryFile: string;

  constructor() {
    this.logger = new Logger();
    this.memoryDir = join(process.cwd(), 'memory');
    this.mainMemoryFile = join(this.memoryDir, 'MEMORY.md');
  }

  async initialize() {
    this.logger.info('Initializing MemoryStore...');
    
    // 创建内存目录
    await this.ensureMemoryDirExists();
  }

  private async ensureMemoryDirExists() {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
      this.logger.info(`Created memory directory: ${this.memoryDir}`);
    } catch (error) {
      this.logger.error('Error creating memory directory:', error);
    }
  }

  async getMemoryContext(): Promise<string> {
    this.logger.info('Getting memory context...');

    try {
      // 读取主记忆文件
      const mainMemory = await this.readMainMemory();
      
      // 读取最近的历史记录
      const recentHistory = await this.readRecentHistory();

      // 构建记忆上下文
      const memoryContext = `
# Main Memory
${mainMemory}

# Recent History
${recentHistory}
      `.trim();

      return memoryContext;
    } catch (error) {
      this.logger.error('Error getting memory context:', error);
      return '';
    }
  }

  private async readMainMemory(): Promise<string> {
    try {
      const content = await fs.readFile(this.mainMemoryFile, 'utf8');
      return content;
    } catch (error) {
      // 如果文件不存在，返回空字符串
      if ((error as any).code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  private async readRecentHistory(): Promise<string> {
    try {
      // 获取今天的日期文件
      const today = new Date().toISOString().split('T')[0];
      const todayFile = join(this.memoryDir, `${today}.md`);
      
      const content = await fs.readFile(todayFile, 'utf8');
      return content;
    } catch (error) {
      // 如果文件不存在，返回空字符串
      if ((error as any).code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  async writeMemory(content: string): Promise<void> {
    this.logger.info('Writing memory...');

    try {
      // 写入主记忆文件
      await fs.writeFile(this.mainMemoryFile, content, 'utf8');
      
      // 写入今天的历史记录
      const today = new Date().toISOString().split('T')[0];
      const todayFile = join(this.memoryDir, `${today}.md`);
      
      // 追加到今天的文件
      await fs.appendFile(todayFile, `\n${new Date().toISOString()}: ${content}`, 'utf8');
      
      this.logger.info('Memory written successfully');
    } catch (error) {
      this.logger.error('Error writing memory:', error);
    }
  }
}