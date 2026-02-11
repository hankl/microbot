import { Logger } from '../utils/logger.js';
import { ContextBuilder } from './context.js';
import { ToolRegistry } from './tools/registry.js';
import { SessionManager } from '../session/manager.js';
import { MemoryStore } from './memory.js';
import { ModelFactory } from '../api/model-factory.js';
import { ModelClient, ModelRequest, ModelResponse } from '../api/model.js';
import { WebSocketService } from '../api/websocket.js';
import { FeishuIntegration } from '../api/feishu.js';
import { SkillsLoader } from './skills.js';
import { promises as fs } from 'fs';
import { join } from 'path';

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
  private skillsLoader: SkillsLoader;
  private isRunning: boolean;

  constructor(options?: AgentLoopOptions) {
    this.logger = new Logger();
    this.contextBuilder = new ContextBuilder();
    this.toolRegistry = new ToolRegistry();
    this.sessionManager = new SessionManager();
    this.memoryStore = new MemoryStore();
    this.modelClient = ModelFactory.createClientFromEnv();
    this.skillsLoader = new SkillsLoader();
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
    await this.skillsLoader.initialize();
    
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
   * Parse tool calls from AI response
   * Supports multiple formats:
   * 1. XML-like: <skill-name><param>value</param>...</skill-name>
   * 2. Template-like: ${skill-name.method} followed by JSON content
   */
  private parseToolCalls(content: string): Array<{ name: string; params: Record<string, string> }> | null {
    const toolCalls: Array<{ name: string; params: Record<string, string> }> = [];
    
    // Try format 1: XML-like tags
    const toolCallRegex = /<([a-zA-Z0-9-]+)>([\s\S]*?)<\/\1>/g;
    let match;
    
    while ((match = toolCallRegex.exec(content)) !== null) {
      const skillName = match[1];
      const innerContent = match[2];
      
      // Parse parameters like <param>value</param>
      const params: Record<string, string> = {};
      const paramRegex = /<([a-zA-Z0-9-]+)>([\s\S]*?)<\/\1>/g;
      let paramMatch;
      
      while ((paramMatch = paramRegex.exec(innerContent)) !== null) {
        params[paramMatch[1]] = paramMatch[2].trim();
      }
      
      // If no structured params found, use entire content as 'query' parameter
      if (Object.keys(params).length === 0) {
        params.query = innerContent.trim();
      }
      
      toolCalls.push({ name: skillName, params });
    }
    
    if (toolCalls.length > 0) {
      return toolCalls;
    }
    
    // Try format 2: Template-like ${skill-name.method} or ${skill-name:method} followed by JSON
    const templateRegex = /\$\{([a-zA-Z0-9-]+)(?:[.:]([a-zA-Z0-9-]+))?\}[\s\S]*?```json\s*([\s\S]*?)\s*```/g;
    
    while ((match = templateRegex.exec(content)) !== null) {
      const skillName = match[1];
      const method = match[2] || 'query';
      const jsonContent = match[3];
      
      try {
        const parsedJson = JSON.parse(jsonContent);
        
        // Convert JSON to params
        const params: Record<string, string> = {};
        
        // Build query from JSON parameters
        if (parsedJson.sql) {
          params.query = parsedJson.sql;
        }
        
        // Add other JSON fields as params
        for (const [key, value] of Object.entries(parsedJson)) {
          if (key !== 'sql') {
            params[key] = String(value);
          }
        }
        
        toolCalls.push({ name: skillName, params });
      } catch (error) {
        this.logger.warn(`Failed to parse JSON for tool call ${skillName}:`, error);
      }
    }
    
    return toolCalls.length > 0 ? toolCalls : null;
  }

  /**
   * Execute a skill/tool call
   */
  private async executeSkill(skillName: string, params: Record<string, string>): Promise<string> {
    this.logger.info(`Executing skill: ${skillName} with params:`, params);
    
    try {
      // Load skill metadata using SkillsLoader
      const skill = this.skillsLoader.getSkill(skillName);
      
      if (!skill) {
        this.logger.error(`Skill ${skillName} not found`);
        return `Error: Skill ${skillName} not found`;
      }
      
      this.logger.info(`Loaded skill metadata: ${skill.name} - ${skill.description}`);
      
      // Special handling for data-analyzer skill
      if (skillName === 'data-analyzer') {
        return await this.executeDataAnalyzer(params);
      }
      
      // Generic skill execution placeholder
      return `Skill ${skillName} executed with params: ${JSON.stringify(params)}`;
    } catch (error) {
      this.logger.error(`Error executing skill ${skillName}:`, error);
      return `Error executing skill ${skillName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute data-analyzer skill
   */
  private async executeDataAnalyzer(params: Record<string, string>): Promise<string> {
    this.logger.info(`Executing data-analyzer with params:`, params);
    
    try {
      // Extract SQL from params
      let sql = params.query || '';
      
      // If query is empty, try to build from other params
      if (!sql && params.sql) {
        sql = params.sql;
      }
      
      // Extract file path from params
      let path = params.filePath || params.path || '';
      
      // If no path specified, use default
      if (!path) {
        path = 'test-data.json';
      }
      
      this.logger.info(`Parsed data-analyzer params - path: ${path}, sql: ${sql}`);
      
      // Execute using sqltools CLI tool
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        // Generate table name from file path (replace special characters with underscores)
        const fileName = path.split('/').pop() || path.split('\\').pop() || path;
        const tableName = fileName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/\.[^.]+$/, '');
        
        // Replace table name in SQL query if it contains file extension or dashes
        // This handles cases where user writes "FROM test-data.csv" or "FROM test-data" in their query
        let processedSql = sql;
        if (sql.includes('FROM')) {
          // Replace any table name with file extension or dashes with the generated table name
          processedSql = sql.replace(/FROM\s+([\w-]+(?:\.[\w]+)?)/i, `FROM ${tableName}`);
        }
        
        // Escape single quotes in SQL query
        const escapedSql = processedSql.replace(/'/g, "'\\''");
        
        // Build sqltools command with custom table name
        // For Windows PowerShell, we need to handle quotes differently
        const cmd = `sqltools "${path}" --table "${tableName}" --query "${processedSql}"`;
        
        this.logger.info(`Running command: ${cmd}`);
        const { stdout, stderr } = await execAsync(cmd, {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        
        if (stderr) {
          this.logger.warn(`sqltools stderr:`, stderr);
        }
        
        const result = stdout.trim();
        if (!result) {
          return 'No results returned';
        }
        
        // Try to parse JSON output for better formatting
        try {
          const jsonResult = JSON.parse(result);
          if (Array.isArray(jsonResult) && jsonResult.length > 0) {
            // Format array results
            if (typeof jsonResult[0] === 'object') {
              // Object array
              return JSON.stringify(jsonResult, null, 2);
            } else {
              // Primitive array
              return JSON.stringify(jsonResult);
            }
          } else if (typeof jsonResult === 'object' && jsonResult !== null) {
            // Single object result
            return JSON.stringify(jsonResult, null, 2);
          } else {
            // Other result types
            return result;
          }
        } catch (parseError) {
          // Not valid JSON, return as is
          return result;
        }
      } catch (cliError) {
        this.logger.error(`Error executing sqltools:`, cliError);
        return `Error executing sqltools: ${cliError instanceof Error ? cliError.message : 'Unknown error'}`;
      }
    } catch (error) {
      this.logger.error(`Error executing data-analyzer:`, error);
      return `Error executing data-analyzer: ${error instanceof Error ? error.message : 'Unknown error'}`;
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

      // Generate response with tool call loop
      let response: string = '';
      let maxIterations = 10;
      let iteration = 0;
      
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
            return;
          }
        }

        // Tool call loop
        while (iteration < maxIterations) {
          iteration++;
          this.logger.info(`Tool call loop iteration ${iteration}/${maxIterations}`);

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

          // Check if response contains tool calls
          const toolCalls = this.parseToolCalls(response);
          
          if (!toolCalls) {
            // No tool calls, this is the final response
            this.logger.info('No tool calls found, this is the final response');
            break;
          }

          this.logger.info(`Found ${toolCalls.length} tool call(s)`);

          // Execute all tool calls
          for (const toolCall of toolCalls) {
            this.logger.info(`Executing tool: ${toolCall.name}`);
            
            const toolResult = await this.executeSkill(toolCall.name, toolCall.params);
            
            this.logger.info(`Tool result: ${toolResult.substring(0, 200)}${toolResult.length > 200 ? '...' : ''}`);

            // Add assistant message with tool call
            session.addMessage({
              role: 'assistant',
              content: response,
              timestamp: new Date().toISOString()
            });

            // Add tool result as a system message
            messages.push({
              role: 'assistant',
              content: response
            });

            // Add tool result as a user message (MiniMax doesn't support system role)
            messages.push({
              role: 'user',
              content: `Tool ${toolCall.name} result:\n${toolResult}`
            });
          }

          // Continue loop to get next response
        }

        if (iteration >= maxIterations) {
          this.logger.warn('Reached maximum tool call iterations, stopping');
        }

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
