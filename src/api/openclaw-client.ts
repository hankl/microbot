import { Logger } from '../utils/logger.js';
import { OllamaRequest, OllamaResponse, OllamaMessage } from './ollama.js';

export interface OpenClawConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export class OpenClawClient {
  private config: OpenClawConfig;
  private logger: Logger;

  constructor(config?: OpenClawConfig) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.OPENCLAW_BASE_URL || 'http://localhost:18789',
      apiKey: config?.apiKey || process.env.OPENCLAW_API_KEY,
      model: config?.model || process.env.OPENCLAW_MODEL || 'qwen-portal/coder-model',
    };
    this.logger = new Logger();
  }

  /**
   * Call OpenClaw model API
   */
  async callModel(request: OllamaRequest): Promise<OllamaResponse> {
    this.logger.info(`Sending request to OpenClaw: ${this.config.baseUrl}/api/v1/chat`);

    try {
      // Transform Ollama request to OpenClaw-compatible format
      const openclawRequest = {
        model: request.model || this.config.model,
        messages: request.messages || [{ role: 'user', content: request.prompt || '' }],
        stream: false,
        temperature: request.options?.temperature || 0.7,
        max_tokens: request.options?.num_predict || 1024,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      // Try the correct OpenClaw endpoint
      const response = await fetch(`${this.config.baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(openclawRequest),
      });

      if (!response.ok) {
        // If the specific endpoint fails, try the standard OpenAI-compatible endpoint
        this.logger.info(`Standard endpoint failed, trying OpenAI-compatible endpoint...`);
        const openaiResponse = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(openclawRequest),
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenClaw API request failed on both endpoints: ${response.status} ${response.statusText} and ${openaiResponse.status} ${openaiResponse.statusText}`);
        }

        const openaiData = await openaiResponse.json();
        
        // Transform OpenAI response to Ollama format
        const result: OllamaResponse = {
          model: openaiData.model || request.model || this.config.model!,
          created_at: new Date().toISOString(),
          message: {
            role: 'assistant',
            content: openaiData.choices?.[0]?.message?.content || 'No response generated',
          },
          response: openaiData.choices?.[0]?.message?.content,
          done: true,
          total_duration: 0,
          load_duration: 0,
          sample_count: 0,
          sample_duration: 0,
          evaluate_count: 0,
          evaluate_duration: 0,
        };

        this.logger.info(`Received response from OpenClaw model via OpenAI-compatible endpoint: ${request.model || this.config.model}`);
        return result;
      }

      const data = await response.json();
      
      // Transform OpenClaw response to Ollama format
      const result: OllamaResponse = {
        model: data.model || request.model || this.config.model!,
        created_at: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: data.response || data.result || data.choices?.[0]?.message?.content || 'No response generated',
        },
        response: data.response || data.result || data.choices?.[0]?.message?.content,
        done: true,
        total_duration: 0,
        load_duration: 0,
        sample_count: 0,
        sample_duration: 0,
        evaluate_count: 0,
        evaluate_duration: 0,
      };

      this.logger.info(`Received response from OpenClaw model: ${request.model || this.config.model}`);

      return result;
    } catch (error) {
      this.logger.error('Error calling OpenClaw API:', error);
      throw error;
    }
  }

  /**
   * Check if model exists in OpenClaw
   */
  async modelExists(modelName: string): Promise<boolean> {
    try {
      // For OpenClaw, we assume the model exists if it follows the provider/id pattern
      // In a real implementation, we would query the OpenClaw API for available models
      return modelName.includes('/') && modelName.length > 0;
    } catch (error) {
      this.logger.error('Error checking if OpenClaw model exists:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenClawConfig {
    return { ...this.config };
  }
}