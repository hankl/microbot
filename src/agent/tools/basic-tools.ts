import { BaseTool, ToolResult } from './registry.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { Logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

export class BashTool extends BaseTool {
  name = 'bash';
  description = 'Execute bash commands in the shell';
  parameters = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The bash command to execute'
      }
    },
    required: ['command']
  };

  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { command } = args;
      this.logger.info(`Executing bash command: ${command}`);

      // Security: Basic validation to prevent dangerous commands
      const dangerousCommands = ['rm -rf /', 'mkfs.', 'dd if=', ':(){:|:&};', '>', '/dev/null', 'nohup', '&'];
      for (const dangerous of dangerousCommands) {
        if (command.toLowerCase().includes(dangerous.toLowerCase())) {
          throw new Error(`Dangerous command blocked: ${command}`);
        }
      }

      const result = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      this.logger.info(`Bash command executed successfully`);
      return {
        success: true,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: 0
        }
      };
    } catch (error: any) {
      this.logger.error(`Error executing bash command:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while executing bash command'
      };
    }
  }
}

export class ReadTool extends BaseTool {
  name = 'read';
  description = 'Read the contents of a file';
  parameters = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to read'
      }
    },
    required: ['path']
  };

  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { path } = args;
      this.logger.info(`Reading file: ${path}`);

      // Security: Resolve path to prevent directory traversal
      const resolvedPath = resolve(path);
      const baseDir = process.cwd();
      
      if (!resolvedPath.startsWith(baseDir)) {
        throw new Error(`Access denied: Path ${path} is outside allowed directory`);
      }

      const content = await readFile(resolvedPath, 'utf8');
      
      this.logger.info(`File read successfully`);
      return {
        success: true,
        data: {
          path: resolvedPath,
          content: content,
          size: content.length
        }
      };
    } catch (error: any) {
      this.logger.error(`Error reading file:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while reading file'
      };
    }
  }
}

export class WriteTool extends BaseTool {
  name = 'write';
  description = 'Write content to a file';
  parameters = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to write'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      }
    },
    required: ['path', 'content']
  };

  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { path, content } = args;
      this.logger.info(`Writing to file: ${path}`);

      // Security: Resolve path to prevent directory traversal
      const resolvedPath = resolve(path);
      const baseDir = process.cwd();
      
      if (!resolvedPath.startsWith(baseDir)) {
        throw new Error(`Access denied: Path ${path} is outside allowed directory`);
      }

      // Ensure directory exists
      const dirPath = dirname(resolvedPath);
      await execAsync(`mkdir -p "${dirPath}"`);

      await writeFile(resolvedPath, content, 'utf8');
      
      this.logger.info(`File written successfully`);
      return {
        success: true,
        data: {
          path: resolvedPath,
          size: content.length
        }
      };
    } catch (error: any) {
      this.logger.error(`Error writing file:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while writing file'
      };
    }
  }
}

export class ListDirTool extends BaseTool {
  name = 'list_dir';
  description = 'List the contents of a directory';
  parameters = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the directory to list (default: current directory)'
      }
    },
    required: []
  };

  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { path = '.' } = args;
      this.logger.info(`Listing directory: ${path}`);

      // Security: Resolve path to prevent directory traversal
      const resolvedPath = resolve(path);
      const baseDir = process.cwd();
      
      if (!resolvedPath.startsWith(baseDir)) {
        throw new Error(`Access denied: Path ${path} is outside allowed directory`);
      }

      const items = await readdir(resolvedPath, { withFileTypes: true });
      const fileList = [];

      for (const item of items) {
        const itemPath = join(resolvedPath, item.name);
        const stats = await stat(itemPath);
        
        fileList.push({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          path: itemPath
        });
      }

      this.logger.info(`Directory listed successfully`);
      return {
        success: true,
        data: {
          path: resolvedPath,
          items: fileList
        }
      };
    } catch (error: any) {
      this.logger.error(`Error listing directory:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while listing directory'
      };
    }
  }
}

export class ExecTool extends BaseTool {
  name = 'exec';
  description = 'Execute system commands (alternative to bash)';
  parameters = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The system command to execute'
      }
    },
    required: ['command']
  };

  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { command } = args;
      this.logger.info(`Executing system command: ${command}`);

      // Security: Basic validation to prevent dangerous commands
      const dangerousCommands = ['rm -rf /', 'mkfs.', 'dd if=', ':(){:|:&};', '>', '/dev/null', 'nohup', '&'];
      for (const dangerous of dangerousCommands) {
        if (command.toLowerCase().includes(dangerous.toLowerCase())) {
          throw new Error(`Dangerous command blocked: ${command}`);
        }
      }

      const result = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      this.logger.info(`System command executed successfully`);
      return {
        success: true,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: 0
        }
      };
    } catch (error: any) {
      this.logger.error(`Error executing system command:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while executing system command'
      };
    }
  }
}

export class ProcessTool extends BaseTool {
  name = 'process';
  description = 'Manage running processes: list, poll, log, write, send-keys, submit, paste, kill';
  parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (list, poll, log, write, kill, etc.)'
      },
      sessionId: {
        type: 'string',
        description: 'Session ID for actions other than list'
      },
      data: {
        type: 'string',
        description: 'Data to write for write action'
      },
      limit: {
        type: 'number',
        description: 'Log length limit'
      },
      offset: {
        type: 'number',
        description: 'Log offset'
      }
    },
    required: ['action']
  };

  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { action, sessionId, data, limit, offset } = args;
      this.logger.info(`Executing process action: ${action}`);

      switch (action) {
        case 'list':
          // 使用 ps 命令列出进程
          const psResult = await execAsync('ps aux | head -20');
          return {
            success: true,
            data: {
              processes: psResult.stdout
            }
          };

        case 'log':
          if (!sessionId) {
            throw new Error('sessionId is required for log action');
          }
          
          let cmd = `tail -n ${limit || 100}`;
          if (offset) {
            cmd = `tail -n +${offset} | head -n ${limit || 100}`;
          }
          // 实际环境中可能需要查找特定的日志文件
          const logResult = await execAsync(`${cmd} /tmp/session_${sessionId}.log 2>/dev/null || echo "Log file not found for session: ${sessionId}"`);
          return {
            success: true,
            data: {
              logs: logResult.stdout
            }
          };

        case 'kill':
          if (!sessionId) {
            throw new Error('sessionId is required for kill action');
          }
          // 根据 sessionId 查找并杀死相关进程
          const killResult = await execAsync(`pkill -f "session_${sessionId}" 2>/dev/null || echo "No process found for session: ${sessionId}"`);
          return {
            success: true,
            data: {
              killed: killResult.stdout
            }
          };

        default:
          return {
            success: false,
            error: `Unsupported action: ${action}`
          };
      }
    } catch (error: any) {
      this.logger.error(`Error executing process command:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while executing process command'
      };
    }
  }
}