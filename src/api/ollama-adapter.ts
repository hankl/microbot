import { Logger } from '../utils/logger.js';
import { ModelClient, ModelRequest, ModelResponse, ModelConfig } from './model.js';
import { OllamaClient as OriginalOllamaClient } from './ollama.js';

export class OllamaClient extends ModelClient {
  private originalClient: OriginalOllamaClient;

  constructor(config: ModelConfig) {
    super(config);
    
    // Create original Ollama client with adapted config
    const ollamaConfig = {
      host: config.host || process.env.OLLAMA_HOST || 'localhost',
      port: config.port || parseInt(process.env.OLLAMA_PORT || '11434'),
      protocol: config.protocol || 'http',
      model: config.model || process.env.OLLAMA_MODEL || 'qwen3-vl'
    };

    this.originalClient = new OriginalOllamaClient(ollamaConfig);
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    this.logger.info(`Sending chat request to Ollama`);

    try {
      const ollamaRequest = {
        model: request.model || this.config.model || 'qwen3-vl',
        messages: request.messages,
        stream: request.stream || false,
        options: request.options
      };

      const ollamaResponse = await this.originalClient.chat(ollamaRequest);

      // Map Ollama response to standard ModelResponse
      const modelResponse: ModelResponse = {
        model: ollamaResponse.model,
        message: ollamaResponse.message || {
          role: 'assistant',
          content: ollamaResponse.response || ''
        },
        created_at: ollamaResponse.created_at,
        done: ollamaResponse.done
      };

      this.logger.info(`Received response from Ollama model: ${ollamaResponse.model}`);

      return modelResponse;
    } catch (error) {
      this.logger.error('Error calling Ollama API:', error);
      throw error;
    }
  }

  getConfig(): ModelConfig {
    return { ...this.config };
  }

  /**
   * Check if a specific model exists (Ollama-specific method)
   */
  async modelExists(modelName: string): Promise<boolean> {
    return this.originalClient.modelExists(modelName);
  }
}
