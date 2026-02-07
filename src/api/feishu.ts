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

    // 检查数据结构
    if (!data) {
      this.logger.error('Invalid event data: null or undefined');
      return;
    }

    // 记录原始数据结构（只记录关键部分）
    this.logger.debug('Event data structure:', {
      hasMessage: !!data.message,
      hasEvent: !!data.event,
      hasSender: !!data.sender || !!data.message?.sender || !!data.event?.sender,
      keys: Object.keys(data)
    });

    // 尝试不同的数据结构路径
    let messageData = data.message || data.event || data;

    if (!messageData) {
      this.logger.error('Invalid message data: null or undefined');
      return;
    }

    // 查找发送者信息
    let senderInfo = messageData.sender || data.sender;
    if (!senderInfo) {
      this.logger.error('Invalid message structure: missing sender information');
      return;
    }

    // 查找用户 ID
    let userId = senderInfo.sender_id?.open_id || senderInfo.open_id || senderInfo.user_id;
    if (!userId) {
      this.logger.error('Invalid message structure: missing user ID');
      return;
    }

    // 查找消息内容
    let messageContent = messageData.content || data.content;
    if (!messageContent) {
      this.logger.info(`Message received from user ${userId}: [empty content]`);
    } else {
      this.logger.info(`Message received from user ${userId}: ${typeof messageContent === 'string' ? messageContent.substring(0, 100) : '[non-string content]'}...`);
    }

    // Parse message content (usually JSON string)
    let content;
    try {
      content = typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent;
    } catch {
      content = messageContent;
    }

    // 查找其他必要字段
    let messageId = messageData.message_id || data.message_id;
    let chatId = messageData.chat_id || data.chat_id || messageData.receive_id;
    let createTime = messageData.create_time || data.create_time || messageData.timestamp;

    // Create standardized message
    const standardizedMessage = {
      id: messageId || `msg_${Date.now()}`,
      content: typeof content === 'object' ? content.text || JSON.stringify(content) : content,
      user: userId,
      channel: chatId || `channel_${Date.now()}`,
      timestamp: createTime ? new Date(parseInt(createTime) * 1000).toISOString() : new Date().toISOString(),
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

