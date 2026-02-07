import { Logger } from '../utils/logger.js';
import * as Lark from '@larksuiteoapi/node-sdk';

interface FeishuConfig {
  appId: string;
  appSecret: string;
  port?: number;
  reconnectInterval?: number;
}

interface FeishuMessage {
  message_id: string;
  chat_id: string;
  sender: {
    sender_id: {
      open_id: string;
      user_id?: string;
      email?: string;
    };
    sender_type: string;
  };
  message_type: string;
  content: string;
  create_time: string;
}

interface FeishuEventHandler {
  (event: any): Promise<any>;
}

export class FeishuIntegration {
  private config: FeishuConfig;
  private logger: Logger;
  private eventHandlers: FeishuEventHandler[];
  private wsClient: Lark.WSClient | null;
  private apiClient: Lark.Client;
  private reconnectInterval: NodeJS.Timeout | null;

  constructor(config: FeishuConfig) {
    this.config = {
      appId: config.appId,
      appSecret: config.appSecret,
      port: config.port || 3000,
      reconnectInterval: config.reconnectInterval || 5000
    };

    this.logger = new Logger();
    this.eventHandlers = [];
    this.wsClient = null;
    this.reconnectInterval = null;

    const baseConfig = {
      appId: this.config.appId,
      appSecret: this.config.appSecret
    };

    this.apiClient = new Lark.Client(baseConfig);
  }

  /**
   * Connect to Feishu WebSocket using SDK
   */
  private async connectWebSocket() {
    try {
      this.logger.info('Connecting to Feishu WebSocket using SDK...');

      const baseConfig = {
        appId: this.config.appId,
        appSecret: this.config.appSecret
      };

      this.wsClient = new Lark.WSClient({
        ...baseConfig,
        loggerLevel: Lark.LoggerLevel.info
      });

      const eventDispatcher = new Lark.EventDispatcher({}).register({
        'im.message.receive_v1': async (data: any) => {
          await this.handleEvent(data);
        }
      });

      this.wsClient.start({
        eventDispatcher
      });

      this.logger.info('Feishu WebSocket client started');
    } catch (error) {
      this.logger.error('Error connecting to Feishu WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle Feishu event
   */
  private async handleEvent(data: any) {
    this.logger.info(`Received Feishu event: im.message.receive_v1`);

    const message = data as FeishuMessage;
    this.logger.info(`Message received from user ${message.sender.sender_id.open_id}: ${message.content.substring(0, 100)}...`);

    // Parse message content (usually JSON string)
    let content;
    try {
      content = JSON.parse(message.content);
    } catch {
      content = message.content;
    }

    // Create standardized message
    const standardizedMessage = {
      id: message.message_id,
      content: typeof content === 'object' ? content.text || JSON.stringify(content) : content,
      user: message.sender.sender_id.open_id,
      channel: message.chat_id,
      timestamp: new Date(parseInt(message.create_time) * 1000).toISOString(),
      type: 'feishu',
      raw: data
    };

    // Notify handlers
    for (const handler of this.eventHandlers) {
      try {
        await handler(standardizedMessage);
      } catch (error) {
        this.logger.error('Error in Feishu event handler:', error);
      }
    }
  }

  /**
   * Schedule reconnect
   */
  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(() => {
      this.connectWebSocket();
    }, this.config.reconnectInterval);
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.wsClient) {
      this.wsClient = null;
    }
  }

  /**
   * Register event handler
   */
  onEvent(handler: FeishuEventHandler): void {
    this.eventHandlers.push(handler);
    this.logger.info('Added new Feishu event handler');
  }

  /**
   * Start the Feishu integration
   */
  async start(): Promise<void> {
    try {
      await this.connectWebSocket();
      this.logger.info('Feishu WebSocket integration started');
    } catch (error) {
      this.logger.error('Error starting Feishu integration:', error);
      throw error;
    }
  }

  /**
   * Stop the Feishu integration
   */
  async stop(): Promise<void> {
    this.cleanup();
    this.logger.info('Feishu integration stopped');
  }

  /**
   * Send message to Feishu
   */
  async sendMessage(chatId: string, content: string): Promise<boolean> {
    try {
      const response = await this.apiClient.im.v1.message.create({
        params: {
          receive_id_type: 'chat_id'
        },
        data: {
          receive_id: chatId,
          content: JSON.stringify({ text: content }),
          msg_type: 'text'
        }
      });

      if (response.code !== 0) {
        this.logger.error('Failed to send message to Feishu:', response);
        return false;
      }

      this.logger.info(`Message sent to Feishu chat ${chatId}: ${content.substring(0, 50)}...`);
      return true;
    } catch (error) {
      this.logger.error('Error sending message to Feishu:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    if (!this.wsClient) {
      return 'DISCONNECTED';
    }

    return 'CONNECTED';
  }
}

