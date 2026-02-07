import { WebSocketServer, WebSocket } from 'ws';
import { Logger } from '../utils/logger.js';

interface Message {
  id: string;
  content: string;
  user: string;
  channel: string;
  timestamp: string;
  type?: string;
  [key: string]: any;
}

interface WebSocketServerOptions {
  port?: number;
  host?: string;
}

type MessageHandler = (message: Message) => Promise<void>;

export class WebSocketService {
  private wss: WebSocketServer;
  private logger: Logger;
  private messageHandlers: MessageHandler[];
  private clients: Map<string, WebSocket>;

  constructor(options: WebSocketServerOptions = {}) {
    const port = options.port || 8080;
    const host = options.host || '0.0.0.0';

    this.logger = new Logger();
    this.messageHandlers = [];
    this.clients = new Map();

    this.wss = new WebSocketServer({
      port,
      host
    });

    this.setupEventListeners();
    this.logger.info(`WebSocket server started on ${host}:${port}`);
  }

  private setupEventListeners() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      this.logger.info(`New WebSocket connection: ${clientId}`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to MicroBot WebSocket server',
        clientId
      }));

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage({ ...message, clientId });
        } catch (error) {
          this.logger.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.logger.info(`WebSocket connection closed: ${clientId}`);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for ${clientId}:`, error);
      });
    });

    this.wss.on('error', (error) => {
      this.logger.error('WebSocket server error:', error);
    });

    this.wss.on('listening', () => {
      const address = this.wss.address();
      if (address && typeof address === 'object') {
        const host = address.address || 'localhost';
        const port = address.port || 8080;
        this.logger.info(`WebSocket server listening on ${host}:${port}`);
      } else {
        this.logger.info('WebSocket server listening');
      }
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleMessage(message: Message): Promise<void> {
    this.logger.info('Received WebSocket message:', {
      id: message.id,
      user: message.user,
      channel: message.channel,
      content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
    });

    // Notify all message handlers
    for (const handler of this.messageHandlers) {
      try {
        await handler(message);
      } catch (error) {
        this.logger.error('Error in message handler:', error);
      }
    }
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
    this.logger.info('Added new message handler');
  }

  /**
   * Send message to a specific client
   */
  sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
        this.logger.debug(`Sent message to client ${clientId}`);
      } catch (error) {
        this.logger.error(`Error sending message to client ${clientId}:`, error);
      }
    } else {
      this.logger.warn(`Client ${clientId} not found or not connected`);
    }
  }

  /**
   * Send message to all clients in a channel
   */
  broadcastToChannel(channel: string, message: any): void {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify({
            ...message,
            channel
          }));
          sentCount++;
        } catch (error) {
          this.logger.error(`Error broadcasting to client ${clientId}:`, error);
        }
      }
    });
    this.logger.debug(`Broadcast to channel ${channel}: ${sentCount} clients`);
  }

  /**
   * Send message to all connected clients
   */
  broadcast(message: any): void {
    let sentCount = 0;
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          this.logger.error('Error broadcasting message:', error);
        }
      }
    });
    this.logger.info(`Broadcasted message to ${sentCount} clients`);
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Close the WebSocket server
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info('Closing WebSocket server...');
      this.wss.close((error) => {
        if (error) {
          this.logger.error('Error closing WebSocket server:', error);
          reject(error);
        } else {
          this.logger.info('WebSocket server closed');
          resolve();
        }
      });
    });
  }
}
