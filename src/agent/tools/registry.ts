import { Logger } from '../../utils/logger.js';

interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: any;

  abstract execute(args: any): Promise<ToolResult>;

  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }
}

export class ToolRegistry {
  private logger: Logger;
  private tools: Map<string, BaseTool>;

  constructor() {
    this.logger = new Logger();
    this.tools = new Map();
  }

  async initialize() {
    this.logger.info('Initializing ToolRegistry...');
    
    // 注册默认工具
    await this.registerDefaultTools();
  }

  private async registerDefaultTools() {
    // 这里应该注册默认工具
    // 暂时注册一些模拟工具
    this.logger.info('Registering default tools...');
  }

  registerTool(tool: BaseTool) {
    this.tools.set(tool.name, tool);
    this.logger.info(`Registered tool: ${tool.name}`);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.getDefinition());
  }

  async execute(name: string, args: any): Promise<ToolResult> {
    this.logger.info(`Executing tool: ${name} with arguments:`, args);

    const tool = this.getTool(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool ${name} not found`
      };
    }

    try {
      const result = await tool.execute(args);
      this.logger.info(`Tool ${name} executed successfully:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Error executing tool ${name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}