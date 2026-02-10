import { Logger } from '../utils/logger.js';
import { ContextBuilder } from './context.js';
import { ToolRegistry } from './tools/registry.js';
import { SessionManager } from '../session/manager.js';
import { MemoryStore } from './memory.js';
import { ModelFactory } from '../api/model-factory.js';
import { ModelClient, ModelRequest, ModelResponse } from '../api/model.js';
import { WebSocketService } from '../api/websocket.js';
import { FeishuIntegration } from '../api/feishu.js';

interface Message {
  id: string;
  content: string;
  user: string;
  channel: string;
  timestamp: string;
  type?: string;
  [key: string]: any;
}

interface AgentLoopOptions {
  websocketPort?: number;
  feishuConfig?: {
    appId: string;
    appSecret: string;
    verificationToken: string;
  };
}

export class AgentLoop {
  private logger: Logger;
  private contextBuilder: ContextBuilder;
  private toolRegistry: ToolRegistry;
  private sessionManager: SessionManager;
  private memoryStore: MemoryStore;
  private modelClient: ModelClient;
  private webSocketService?: WebSocketService;
  private feishuIntegration?: FeishuIntegration;
  private isRunning: boolean;

  constructor(options?: AgentLoopOptions) {
    this.logger = new Logger();
    this.contextBuilder = new ContextBuilder();
    this.toolRegistry = new ToolRegistry();
    this.sessionManager = new SessionManager();
    this.memoryStore = new MemoryStore();
    this.modelClient = ModelFactory.createClientFromEnv();
    this.isRunning = false;

    // Initialize WebSocket service
    const wsPort = options?.websocketPort || parseInt(process.env.WEBSOCKET_PORT || '8080');
    this.webSocketService = new WebSocketService({ port: wsPort });

    // Initialize Feishu integration if config provided
    const feishuConfig = options?.feishuConfig || {
      appId: process.env.FEISHU_APP_ID || '',
      appSecret: process.env.FEISHU_APP_SECRET || '',
      reconnectInterval: process.env.FEISHU_RECONNECT_INTERVAL ? parseInt(process.env.FEISHU_RECONNECT_INTERVAL) : undefined
    };

    if (feishuConfig.appId && feishuConfig.appSecret) {
      this.feishuIntegration = new FeishuIntegration(feishuConfig);
    }
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

    if (this.webSocketService) {
      await this.webSocketService.close();
    }
  }

  private async initialize() {
    this.logger.info('Initializing AgentLoop...');
    
    await this.toolRegistry.initialize();
    await this.sessionManager.initialize();
    await this.memoryStore.initialize();
    
    // Setup WebSocket message handler
    if (this.webSocketService) {
      this.webSocketService.onMessage(this.processMessage.bind(this));
    }

    // Setup Feishu event handler
    if (this.feishuIntegration) {
      this.feishuIntegration.onEvent(this.processMessage.bind(this));
      await this.feishuIntegration.start();
    }

    // Verify model connection
    try {
      const model = this.modelClient.getConfig().model || 'qwen3-vl';
      const modelType = this.modelClient.getConfig().type || 'ollama';
      
      // For Ollama, check if model exists
      if (modelType === 'ollama') {
        // @ts-ignore - Only Ollama has modelExists method
        const modelExists = await this.modelClient.modelExists?.(model);
        if (modelExists) {
          this.logger.info(`Ollama model ${model} is available`);
        } else {
          this.logger.warn(`Ollama model ${model} not found. Please run 'ollama pull ${model}'`);
        }
      } else {
        // For other model types, just log the configuration
        this.logger.info(`${modelType} model configured: ${model}`);
      }
    } catch (error) {
      this.logger.warn('Could not connect to model service:', error);
    }
  }

  private async runLoop() {
    this.logger.info('AgentLoop is running...');
    this.logger.info('WebSocket server ready for connections');
    
    if (this.feishuIntegration) {
      this.logger.info('Feishu integration ready for events');
    }

    // Keep the process running
    while (this.isRunning) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Process a message from any source (WebSocket, Feishu, etc.)
   */
  async processMessage(message: Message): Promise<void> {
    try {
      this.logger.info(`Processing message from ${message.user} in ${message.channel}`);
      
      // Validate message
      if (!message.content || !message.user || !message.channel) {
        this.logger.warn('Invalid message format:', message);
        return;
      }

      // Get or create session
      const session = await this.sessionManager.getOrCreateSession(
        message.channel,
        message.user
      );

      // Add message to session
      session.addMessage({
        role: 'user',
        content: message.content,
        timestamp: message.timestamp
      });

      // Build context
      const context = await this.contextBuilder.buildContext(
        session,
        message
      );

      // Prepare messages for Ollama
      const messages = [];

      // Add system message with skills information
      if (context.system) {
        let systemContent = context.system;
        
        // Add skills information to system prompt
        if (context.skills) {
          systemContent += `\n\n## Available Skills\n${context.skills}`;
        }
        
        messages.push({
          role: 'system',
          content: systemContent
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

      // Generate response
      let response: string;
      try {
        const modelConfig = this.modelClient.getConfig();
        const model = modelConfig.model || 'qwen3-vl';
        const modelType = modelConfig.type || 'ollama';

        // For Ollama, check if model exists
        if (modelType === 'ollama') {
          // @ts-ignore - Only Ollama has modelExists method
          const modelExists = await this.modelClient.modelExists?.(model);
          if (!modelExists) {
            response = `Sorry, the model ${model} is not available. Please make sure to pull it with 'ollama pull ${model}'.`;
            this.logger.warn(`Model ${model} not found`);
            return;
          }
        }

        const modelResponse = await this.modelClient.chat({
          model,
          messages,
          options: {
            temperature: 0.7,
            max_tokens: 1024
          }
        });

        response = modelResponse.message.content || 'Sorry, I could not generate a response.';
        this.logger.info(`Generated response: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`);
      } catch (error) {
        this.logger.error('Error calling model service:', error);
        response = 'Sorry, I encountered an error while processing your request. Please check the model service configuration.';
      }

      // Add response to session
      session.addMessage({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

      // Save session
      await this.sessionManager.saveSession(session);

      // Send response back through WebSocket if clientId provided
      if (message.clientId && this.webSocketService) {
        this.webSocketService.sendToClient(message.clientId, {
          type: 'response',
          message: response,
          sessionId: `${session.getChannel()}:${session.getUser()}`,
          timestamp: new Date().toISOString()
        });
      }

      // Send response to Feishu if it's a Feishu message
      if (message.type === 'feishu' && this.feishuIntegration) {
        await this.feishuIntegration.sendMessage(message.channel, response);
      }

    } catch (error) {
      this.logger.error('Error processing message:', error);
      
      // Send error response if clientId provided
      if (message.clientId && this.webSocketService) {
        this.webSocketService.sendToClient(message.clientId, {
          type: 'error',
          message: 'Error processing message',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Get WebSocket service instance
   */
  getWebSocketService(): WebSocketService | undefined {
    return this.webSocketService;
  }

  /**
   * Get Feishu integration instance
   */
  getFeishuIntegration(): FeishuIntegration | undefined {
    return this.feishuIntegration;
  }

  /**
   * Get model client instance
   */
  getModelClient(): ModelClient {
    return this.modelClient;
  }

  /**
   * Get Ollama client instance (for backward compatibility)
   */
  getOllamaClient(): any {
    return this.modelClient;
  }
}
