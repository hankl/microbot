import { Logger } from '../utils/logger.js';

export interface ModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
}

export interface ModelRequest {
  model: string;
  messages: ModelMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
  images?: string[];
}

export interface ModelResponse {
  model: string;
  message: ModelMessage;
  created_at?: string;
  done: boolean;
}

export interface ModelConfig {
  type: 'ollama' | 'minimax' | 'openai';
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  // Ollama specific
  host?: string;
  port?: number;
  protocol?: string;
  // Minimax specific
  groupId?: string;
}

export abstract class ModelClient {
  protected config: ModelConfig;
  protected logger: Logger;

  constructor(config: ModelConfig) {
    this.config = config;
    this.logger = new Logger();
  }

  abstract chat(request: ModelRequest): Promise<ModelResponse>;
  abstract getConfig(): ModelConfig;
}
