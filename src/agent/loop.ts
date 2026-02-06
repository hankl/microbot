import { Logger } from '../utils/logger.js';
import { ContextBuilder } from './context.js';
import { ToolRegistry } from './tools/registry.js';
import { SessionManager } from '../session/manager.js';
import { MemoryStore } from './memory.js';
import { OllamaClient, OllamaMessage } from '../api/ollama.js';

export class AgentLoop {
  private logger: Logger;
  private contextBuilder: ContextBuilder;
  private toolRegistry: ToolRegistry;
  private sessionManager: SessionManager;
  private memoryStore: MemoryStore;
  private ollamaClient: OllamaClient;
  private isRunning: boolean;

  constructor() {
    this.logger = new Logger();
    this.contextBuilder = new ContextBuilder();
    this.toolRegistry = new ToolRegistry();
    this.sessionManager = new SessionManager();
    this.memoryStore = new MemoryStore();
    this.ollamaClient = new OllamaClient();
    this.isRunning = false;
  }

  async start() {
    this.logger.info('Starting AgentLoop...');
    this.isRunning = true;

    try {
      await this.initialize();
      await this.runLoop();
    } catch (error) {
      this.logger.error('Error in AgentLoop:', error);
      this.isRunning = false;
    }
  }

  async stop() {
    this.logger.info('Stopping AgentLoop...');
    this.isRunning = false;
  }

  private async initialize() {
    this.logger.info('Initializing AgentLoop...');
    await this.toolRegistry.initialize();
    await this.sessionManager.initialize();
    await this.memoryStore.initialize();
  }

  private async runLoop() {
    this.logger.info('AgentLoop is running...');

    while (this.isRunning) {
      try {
        // 这里应该从消息总线消费消息
        // 暂时模拟一个简单的消息处理
        await this.processMessage();
        
        // 避免CPU占用过高
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error('Error in runLoop:', error);
      }
    }
  }

  private async processMessage() {
    // 模拟消息处理
    const message = {
      id: Date.now().toString(),
      content: 'Hello, microbot!',
      user: 'test-user',
      channel: 'test-channel',
      timestamp: new Date().toISOString()
    };

    this.logger.info('Processing message:', message.content);

    // 获取或创建会话
    const session = await this.sessionManager.getOrCreateSession(
      message.channel,
      message.user
    );

    // 添加消息到会话
    session.addMessage({
      role: 'user',
      content: message.content,
      timestamp: message.timestamp
    });

    // 构建上下文
    const context = await this.contextBuilder.buildContext(
      session,
      message
    );

    this.logger.debug('Built context:', context);

    // Prepare messages for the Ollama chat API
    const messages: OllamaMessage[] = [];
    let response: string;

    // Add system message if available
    if (context.system) {
      messages.push({
        role: 'system',
        content: context.system
      });
    }

    // Add historical messages
    if (context.history && Array.isArray(context.history)) {
      for (const msg of context.history) {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system'
              ? msg.role
              : 'user',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
          });
        }
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message.content
    });

    try {
      // Check if model exists before calling API
      const requestedModel = this.ollamaClient.getConfig().model || 'qwen3-vl:8b';
      const modelExists = await this.ollamaClient.modelExists(requestedModel);

      if (!modelExists) {
        this.logger.warn(`Model ${requestedModel} not found. Available models need to be pulled first.`);
        response = 'Sorry, the requested model is not available. Please make sure the qwen3-vl:8b model is pulled in Ollama using "ollama pull qwen3-vl:8b".';
        this.logger.info('Generated model not found response:', response);
      } else {
        // Call Ollama API to get response
        const ollamaResponse = await this.ollamaClient.chat({
          model: requestedModel,
          messages: messages,
          options: {
            temperature: 0.7,
            num_predict: 1024
          }
        });

        // Extract the response from Ollama response
        response = ollamaResponse.message?.content || 'Sorry, I could not generate a response.';
        this.logger.info('Generated response from Ollama:', response);
      }
    } catch (error) {
      this.logger.error('Error calling Ollama API:', error);
      response = 'Sorry, I encountered an error processing your request. Please ensure Ollama is running and the model is available.';
      this.logger.info('Generated error response:', response);
    }

    // 添加响应到会话
    session.addMessage({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    // 保存会话
    await this.sessionManager.saveSession(session);

    // 这里应该将响应发布到消息总线
    this.logger.info('Generated response:', response);
  }
}