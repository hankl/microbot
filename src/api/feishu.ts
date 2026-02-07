import express from 'express';
import crypto from 'crypto';
import { Logger } from '../utils/logger.js';

interface FeishuConfig {
  appId: string;
  appSecret: string;
  verificationToken: string;
  encryptKey?: string;
  port?: number;
  path?: string;
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
  private app: express.Application;
  private eventHandlers: FeishuEventHandler[];

  constructor(config: FeishuConfig) {
    this.config = {
      appId: config.appId,
      appSecret: config.appSecret,
      verificationToken: config.verificationToken,
      encryptKey: config.encryptKey,
      port: config.port || 3000,
      path: config.path || '/feishu/webhook'
    };

    this.logger = new Logger();
    this.eventHandlers = [];
    this.app = express();

    this.setupExpress();
  }

  private setupExpress() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Feishu webhook endpoint
    const path = this.config.path || '/feishu/webhook';
    this.app.post(path, async (req, res) => {
      try {
        // Verify Feishu signature
        if (!this.verifySignature(req)) {
          this.logger.warn('Invalid Feishu signature');
          return res.status(401).json({ code: 401, message: 'Invalid signature' });
        }

        // Handle challenge for verification
        if (req.body.challenge) {
          this.logger.info('Feishu verification challenge received');
          return res.json({ challenge: req.body.challenge });
        }

        // Handle event
        const event = req.body.event;
        if (event) {
          await this.handleEvent(event);
        }

        res.json({ code: 0, message: 'success' });
      } catch (error) {
        this.logger.error('Error handling Feishu webhook:', error);
        res.status(500).json({ code: 500, message: 'Internal server error' });
      }
    });
  }

  private verifySignature(req: express.Request): boolean {
    const timestamp = req.headers['x-tt-env'] || req.headers['x-lark-request-timestamp'];
    const signature = req.headers['x-tt-signature'] || req.headers['x-lark-signature'];
    const verificationToken = this.config.verificationToken;

    if (!timestamp || !signature) {
      this.logger.warn('Missing signature headers');
      return false;
    }

    // Generate expected signature
    const expected = crypto
      .createHmac('sha256', verificationToken)
      .update(`${timestamp}${JSON.stringify(req.body)}`)
      .digest('base64');

    return expected === signature;
  }

  private async handleEvent(event: any) {
    this.logger.info(`Received Feishu event: ${event.type}`);

    // Handle message event specifically
    if (event.type === 'im.message.receive_v1') {
      const message = event.message as FeishuMessage;
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
        raw: event
      };

      // Notify handlers
      for (const handler of this.eventHandlers) {
        try {
          await handler(standardizedMessage);
        } catch (error) {
          this.logger.error('Error in Feishu event handler:', error);
        }
      }
    } else {
      this.logger.debug(`Unhandled Feishu event type: ${event.type}`);
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
   * Start the Feishu integration server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.config.port, () => {
          this.logger.info(`Feishu integration server started on port ${this.config.port}`);
          this.logger.info(`Webhook endpoint: http://localhost:${this.config.port}${this.config.path}`);
          this.logger.info(`Health check: http://localhost:${this.config.port}/health`);
          resolve();
        });

        server.on('error', (error) => {
          this.logger.error('Error starting Feishu integration server:', error);
          reject(error);
        });
      } catch (error) {
        this.logger.error('Error starting Feishu integration:', error);
        reject(error);
      }
    });
  }

  /**
   * Send message to Feishu
   * Note: This requires authentication and is more complex
   * For simplicity, this method is stubbed - you would need to implement the actual API call
   */
  async sendMessage(chatId: string, content: string): Promise<boolean> {
    this.logger.info(`Sending message to Feishu chat ${chatId}: ${content.substring(0, 50)}...`);
    
    // TODO: Implement actual Feishu message sending
    // This requires:
    // 1. Getting access token using appId and appSecret
    // 2. Calling Feishu API to send message
    // Example: POST https://open.feishu.cn/open-apis/im/v1/messages
    
    return true;
  }

  /**
   * Get Feishu access token
   */
  private async getAccessToken(): Promise<string> {
    // TODO: Implement access token retrieval
    // This is needed for sending messages to Feishu
    return '';
  }
}
