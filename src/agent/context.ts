import { Logger } from '../utils/logger.js';
import { Session } from '../session/manager.js';
import { MemoryStore } from './memory.js';
import { SkillsLoader } from './skills.js';

export class ContextBuilder {
  private logger: Logger;
  private memoryStore: MemoryStore;
  private skillsLoader: SkillsLoader;

  constructor() {
    this.logger = new Logger();
    this.memoryStore = new MemoryStore();
    this.skillsLoader = new SkillsLoader();
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
    // 从bootstrap文件构建系统提示
    // 暂时返回一个默认的系统提示
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