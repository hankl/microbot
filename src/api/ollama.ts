import { Logger } from '../utils/logger.js';

export interface OllamaConfig {
  host?: string;
  port?: number;
  protocol?: string;
  model?: string;
}

export interface OllamaRequest {
  model: string;
  prompt?: string;
  messages?: OllamaMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
  images?: string[]; // For vision models like qwen3-vl
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // For vision models
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response?: string;
  message?: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  sample_count?: number;
  sample_duration?: number;
  evaluate_count?: number;
  evaluate_duration?: number;
}

export class OllamaClient {
  private config: OllamaConfig;
  private logger: Logger;

  constructor(config?: OllamaConfig) {
    this.config = {
      host: config?.host || process.env.OLLAMA_HOST || 'localhost',
      port: config?.port || parseInt(process.env.OLLAMA_PORT || '11434'),
      protocol: config?.protocol || 'http',
      model: config?.model || process.env.OLLAMA_MODEL || 'qwen3-vl',
    };
    this.logger = new Logger();
  }

  private getBaseUrl(): string {
    return `${this.config.protocol}://${this.config.host}:${this.config.port}`;
  }

  /**
   * Generate a response from the Ollama model
   */
  async generate(request: OllamaRequest): Promise<OllamaResponse> {
    this.logger.info(`Sending request to Ollama: ${this.getBaseUrl()}/api/generate`);

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          stream: false, // We'll handle streaming separately if needed
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      this.logger.info(`Received response from Ollama model: ${request.model}`);

      return data;
    } catch (error) {
      this.logger.error('Error calling Ollama API:', error);
      throw error;
    }
  }

  /**
   * Chat with the Ollama model using message format
   */
  async chat(request: OllamaRequest): Promise<OllamaResponse> {
    this.logger.info(`Sending chat request to Ollama: ${this.getBaseUrl()}/api/chat`);

    if (!request.messages) {
      throw new Error('Chat API requires messages array');
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          stream: false, // We'll handle streaming separately if needed
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama chat request failed: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      this.logger.info(`Received chat response from Ollama model: ${request.model}`);

      return data;
    } catch (error) {
      this.logger.error('Error calling Ollama Chat API:', error);
      throw error;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<{ models: Array<{ name: string; modified_at: string; size: number }> }> {
    this.logger.info(`Listing Ollama models: ${this.getBaseUrl()}/api/tags`);

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ollama list models failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.info(`Found ${data.models?.length || 0} Ollama models`);

      return data;
    } catch (error) {
      this.logger.error('Error listing Ollama models:', error);
      throw error;
    }
  }

  /**
   * Check if a specific model exists
   */
  async modelExists(modelName: string): Promise<boolean> {
    try {
      const { models } = await this.listModels();

      // Normalize model names for comparison
      // Ollama sometimes returns model names with additional tags or prefixes
      const normalizedRequestedModel = modelName.toLowerCase().trim();

      return models.some(model => {
        const normalizedModelName = model.name.toLowerCase().trim();
        // Check if requested model name is contained in the available model name
        // This handles cases like "qwen3-vl:8b" vs "registry.ollama.ai/library/qwen3-vl:8b"
        return normalizedModelName.includes(normalizedRequestedModel) ||
               normalizedRequestedModel.includes(normalizedModelName);
      });
    } catch (error) {
      this.logger.error('Error checking if model exists:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }
}