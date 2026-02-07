import { ModelClient, ModelConfig } from './model.js';
import { OllamaClient } from './ollama-adapter.js';
import { MinimaxClient } from './minimax.js';

export class ModelFactory {
  static createClient(config: ModelConfig): ModelClient {
    switch (config.type) {
      case 'ollama':
        return new OllamaClient(config);
      case 'minimax':
        return new MinimaxClient(config);
      default:
        throw new Error(`Unsupported model type: ${config.type}`);
    }
  }

  /**
   * Create client from environment variables
   */
  static createClientFromEnv(): ModelClient {
    const modelType = process.env.MODEL_TYPE || 'ollama';
    
    const config: ModelConfig = {
      type: modelType as 'ollama' | 'minimax' | 'openai',
      apiKey: process.env.MODEL_API_KEY,
      model: process.env.MODEL_NAME,
      baseUrl: process.env.MODEL_BASE_URL,
      host: process.env.OLLAMA_HOST,
      port: process.env.OLLAMA_PORT ? parseInt(process.env.OLLAMA_PORT) : undefined,
      protocol: process.env.OLLAMA_PROTOCOL
    };

    return this.createClient(config);
  }
}
