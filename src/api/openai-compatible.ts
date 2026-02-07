import { Logger } from '../utils/logger.js';
import { ModelClient, ModelRequest, ModelResponse, ModelConfig } from './model.js';

export class OpenAICompatibleClient extends ModelClient {
  constructor(config: ModelConfig) {
    super(config);
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    this.logger.info(`Sending chat request to OpenAI compatible API: ${this.config.baseUrl}`);

    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }

    try {
      const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
      const model = request.model || this.config.model || 'gpt-4';

      const apiRequest = {
        model,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: request.stream || false,
        temperature: request.options?.temperature || 0.7,
        max_tokens: request.options?.max_tokens || 1024,
        // 设置 reasoning_split=True 将思考内容分离，只保留最终回复
        extra_body: {
          reasoning_split: true
        }
      };

      this.logger.debug('OpenAI compatible API request:', JSON.stringify(apiRequest, null, 2));

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(apiRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
      }

      const data = await response.json();
      this.logger.debug('OpenAI compatible API response:', JSON.stringify(data, null, 2));

      let content = '';
      let role = 'assistant';

      if (data.choices?.[0]?.message) {
        content = data.choices[0].message.content || '';
        role = data.choices[0].message.role || 'assistant';
      } else if (data.choices?.[0]?.delta?.content) {
        content = data.choices[0].delta.content;
        role = data.choices[0].delta.role || 'assistant';
      }

      // 过滤掉思考内容标签
      content = content
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/<thought>[\s\S]*?<\/thought>/g, '')
        .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
        .replace(/\s*<\/?thought[^>]*>\s*/g, '')
        .replace(/\s*<\/?reasoning[^>]*>\s*/g, '')
        .trim();

      const modelResponse: ModelResponse = {
        model: data.model || model,
        message: {
          role: role as 'user' | 'assistant' | 'system',
          content: content
        },
        created_at: data.created ? new Date(data.created * 1000).toISOString() : new Date().toISOString(),
        done: data.choices?.[0]?.finish_reason !== null
      };

      this.logger.info(`Received response from OpenAI compatible API: ${model}`);

      return modelResponse;
    } catch (error) {
      this.logger.error('Error calling OpenAI compatible API:', error);
      throw error;
    }
  }

  getConfig(): ModelConfig {
    return { ...this.config };
  }
}
