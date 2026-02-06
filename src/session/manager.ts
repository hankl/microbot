import { Logger } from '../utils/logger.js';
import { promises as fs } from 'fs';
import { join } from 'path';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCallId?: string;
  toolResult?: any;
}

export class Session {
  private channel: string;
  private user: string;
  private messages: Message[];
  private createdAt: string;
  private updatedAt: string;

  constructor(channel: string, user: string) {
    this.channel = channel;
    this.user = user;
    this.messages = [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
  }

  addMessage(message: Message) {
    this.messages.push(message);
    this.updatedAt = new Date().toISOString();
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getChannel(): string {
    return this.channel;
  }

  getUser(): string {
    return this.user;
  }

  getCreatedAt(): string {
    return this.createdAt;
  }

  getUpdatedAt(): string {
    return this.updatedAt;
  }

  toJSON(): any {
    return {
      channel: this.channel,
      user: this.user,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data: any): Session {
    const session = new Session(data.channel, data.user);
    session.messages = data.messages || [];
    session.createdAt = data.createdAt || new Date().toISOString();
    session.updatedAt = data.updatedAt || session.createdAt;
    return session;
  }
}

export class SessionManager {
  private logger: Logger;
  private sessionsDir: string;
  private sessions: Map<string, Session>;

  constructor() {
    this.logger = new Logger();
    this.sessionsDir = join(process.cwd(), 'sessions');
    this.sessions = new Map();
  }

  async initialize() {
    this.logger.info('Initializing SessionManager...');
    
    // 创建会话目录
    await this.ensureSessionsDirExists();
    
    // 加载现有会话
    await this.loadExistingSessions();
  }

  private async ensureSessionsDirExists() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
      this.logger.info(`Created sessions directory: ${this.sessionsDir}`);
    } catch (error) {
      this.logger.error('Error creating sessions directory:', error);
    }
  }

  private async loadExistingSessions() {
    try {
      const files = await fs.readdir(this.sessionsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = join(this.sessionsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const sessionData = JSON.parse(content);
          const session = Session.fromJSON(sessionData);
          const sessionKey = this.getSessionKey(session.getChannel(), session.getUser());
          this.sessions.set(sessionKey, session);
        }
      }

      this.logger.info(`Loaded ${this.sessions.size} existing sessions`);
    } catch (error) {
      this.logger.error('Error loading existing sessions:', error);
    }
  }

  private getSessionKey(channel: string, user: string): string {
    return `${channel}:${user}`;
  }

  async getOrCreateSession(channel: string, user: string): Promise<Session> {
    const sessionKey = this.getSessionKey(channel, user);
    
    // 检查会话是否已存在
    if (this.sessions.has(sessionKey)) {
      this.logger.info(`Found existing session: ${sessionKey}`);
      return this.sessions.get(sessionKey)!;
    }

    // 创建新会话
    this.logger.info(`Creating new session: ${sessionKey}`);
    const session = new Session(channel, user);
    this.sessions.set(sessionKey, session);
    
    // 保存会话
    await this.saveSession(session);
    
    return session;
  }

  async saveSession(session: Session) {
    this.logger.info(`Saving session: ${this.getSessionKey(session.getChannel(), session.getUser())}`);

    try {
      const sessionKey = this.getSessionKey(session.getChannel(), session.getUser());
      const filePath = join(this.sessionsDir, `${sessionKey}.json`);
      
      const sessionData = session.toJSON();
      await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2), 'utf8');
      
      this.logger.info(`Session saved successfully: ${sessionKey}`);
    } catch (error) {
      this.logger.error('Error saving session:', error);
    }
  }

  async deleteSession(channel: string, user: string): Promise<void> {
    const sessionKey = this.getSessionKey(channel, user);
    
    if (this.sessions.has(sessionKey)) {
      this.sessions.delete(sessionKey);
      
      // 删除会话文件
      try {
        const filePath = join(this.sessionsDir, `${sessionKey}.json`);
        await fs.unlink(filePath);
        this.logger.info(`Session deleted: ${sessionKey}`);
      } catch (error) {
        this.logger.error('Error deleting session file:', error);
      }
    }
  }

  listSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}