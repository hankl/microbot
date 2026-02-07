import { Logger } from '../utils/logger.js';
import { ModelClient, ModelRequest, ModelResponse, ModelConfig } from './model.js';

export class MinimaxClient extends ModelClient {
  constructor(config: ModelConfig) {
    super(config);
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    this.logger.info(`Sending chat request to Minimax`);

    if (!this.config.apiKey) {
      throw new Error('Minimax API key is required');
    }

    try {
      const baseUrl = this.config.baseUrl || 'https://api.minimax.chat/v1/text/chatcompletion';
      const model = request.model || this.config.model || 'abab6.5-chat';

      const minimaxRequest = {
        model,
        messages: request.messages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content
        })),
        stream: request.stream || false,
        temperature: request.options?.temperature || 0.7,
        max_tokens: request.options?.max_tokens || 1024
      };

      this.logger.debug('Minimax request:', JSON.stringify(minimaxRequest, null, 2));

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(minimaxRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Minimax request failed: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      const data = await response.json();
      this.logger.debug('Minimax response:', JSON.stringify(data, null, 2));

      // Map Minimax response to standard ModelResponse
      // Minimax API response format: { base_resp: { status_code: 0, status_msg: "Success" }, reply: "..." }
      // Or: { choices: [{ message: { content: "..." } }] }
      let content = '';
      if (data.reply) {
        content = data.reply;
      } else if (data.choices?.[0]?.message?.content) {
        content = data.choices[0].message.content;
      } else if (data.resp_data?.choices?.[0]?.message?.content) {
        content = data.resp_data.choices[0].message.content;
      } else if (data.message) {
        content = data.message;
      }

      this.logger.info(`Extracted content from Minimax: ${content.substring(0, 100)}...`);

      const modelResponse: ModelResponse = {
        model: data.model || model,
        message: {
          role: 'assistant',
          content: content
        },
        created_at: data.created_at || new Date().toISOString(),
        done: true
      };

      this.logger.info(`Received response from Minimax model: ${model}`);

      return modelResponse;
    } catch (error) {
      this.logger.error('Error calling Minimax API:', error);
      throw error;
    }
  }

  getConfig(): ModelConfig {
    return { ...this.config };
  }
}
