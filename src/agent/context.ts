import { Logger } from '../utils/logger.js';
import { Session } from '../session/manager.js';
import { MemoryStore } from './memory.js';
import { SkillsLoader } from './skills.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ContextBuilder {
  private logger: Logger;
  private memoryStore: MemoryStore;
  private skillsLoader: SkillsLoader;
  private soulContent: string;

  constructor() {
    this.logger = new Logger();
    this.memoryStore = new MemoryStore();
    this.skillsLoader = new SkillsLoader();
    this.soulContent = '';
    
    this.initialize();
  }

  private async initialize() {
    try {
      await this.skillsLoader.initialize();
      await this.loadSoul();
    } catch (error) {
      this.logger.error('Error initializing ContextBuilder:', error);
    }
  }

  private async loadSoul() {
    try {
      const soulPath = join(__dirname, '..', '..', 'soul.md');
      const content = await fs.readFile(soulPath, 'utf8');
      this.soulContent = content;
      this.logger.info('Soul content loaded successfully');
    } catch (error) {
      this.logger.warn('Could not load soul.md, using default system prompt:', error);
      this.soulContent = '';
    }
  }

  async buildContext(session: Session, message: any): Promise<any> {
    this.logger.info('Building context...');

    // 构建系统提示
    const systemPrompt = await this.buildSystemPrompt();

    // 获取记忆内容
    const memoryContext = await this.memoryStore.getMemoryContext();

    // 构建技能汇总
    const skillsSummary = await this.skillsLoader.buildSkillsSummary();

    // 获取会话历史
    const sessionHistory = session.getMessages();

    // 构建完整上下文
    const context = {
      system: systemPrompt,
      memory: memoryContext,
      skills: skillsSummary,
      history: sessionHistory,
      currentMessage: message
    };

    return context;
  }

  private async buildSystemPrompt(): Promise<string> {
    if (this.soulContent) {
      return this.soulContent;
    }
    
    // 如果没有soul.md，返回默认的系统提示
    return `You are Microbot, a lightweight AI agent framework.

Your core instructions:
1. Be helpful and friendly
2. Follow user instructions carefully
3. Use tools when necessary
4. Keep responses concise and clear
5. Remember past conversations

Your capabilities:
- Read and write files
- Execute shell commands
- Search the web
- Send messages
- Use skills
- Manage memory`;
  }
}