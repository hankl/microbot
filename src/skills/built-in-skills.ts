import { SkillManager, SkillDefinition } from './skill-manager.js';

/**
 * Register built-in skills for the microbot
 */
export function registerBuiltInSkills(skillManager: SkillManager): void {
  // System information skill
  skillManager.registerSkill({
    id: 'sysinfo',
    name: 'System Information',
    description: 'Get system information including CPU, memory, and disk usage',
    parameters: {
      type: 'object',
      properties: {
        detail: {
          type: 'string',
          enum: ['cpu', 'memory', 'disk', 'all'],
          description: 'Detail level for system info'
        }
      },
      required: []
    },
    handler: async (params) => {
      const detail = params.detail || 'all';
      
      // This is a mock implementation - in a real system, you would call actual system commands
      return {
        timestamp: new Date().toISOString(),
        detail: detail,
        info: {
          cpu: detail === 'cpu' || detail === 'all' ? {
            usage: Math.random() * 100,
            cores: 4,
            model: 'Mock CPU'
          } : undefined,
          memory: detail === 'memory' || detail === 'all' ? {
            used: Math.floor(Math.random() * 8000),
            total: 16000,
            percentage: Math.random() * 100
          } : undefined,
          disk: detail === 'disk' || detail === 'all' ? {
            used: Math.floor(Math.random() * 500),
            total: 1000,
            percentage: Math.random() * 100
          } : undefined
        }
      };
    }
  });

  // File operation skill
  skillManager.registerSkill({
    id: 'file_operation',
    name: 'File Operation',
    description: 'Perform file operations like read, write, list',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['read', 'write', 'list', 'create', 'delete'],
          description: 'Type of file operation'
        },
        path: {
          type: 'string',
          description: 'File or directory path'
        },
        content: {
          type: 'string',
          description: 'Content to write (for write operation)'
        }
      },
      required: ['operation', 'path']
    },
    handler: async (params) => {
      // Mock implementation - in a real system, you would perform actual file operations
      return {
        success: true,
        operation: params.operation,
        path: params.path,
        result: `Mock result for ${params.operation} operation on ${params.path}`
      };
    }
  });

  // Web search skill
  skillManager.registerSkill({
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results'
        }
      },
      required: ['query']
    },
    handler: async (params) => {
      // Mock implementation - in a real system, you would call a search API
      return {
        query: params.query,
        results: [
          { title: `Mock result for "${params.query}"`, url: 'https://mock.example.com', snippet: 'This is a mock search result.' }
        ]
      };
    }
  });

  // Calculation skill
  skillManager.registerSkill({
    id: 'calculate',
    name: 'Calculator',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate'
        }
      },
      required: ['expression']
    },
    handler: async (params) => {
      // In a real system, you would use a proper math evaluation library
      // For safety reasons, avoid using eval() in production
      try {
        // Simple mock calculation
        const expr = params.expression;
        // This is just a mock - real implementation would safely evaluate expressions
        return {
          expression: expr,
          result: parseFloat((Math.random() * 100).toFixed(2)) // Mock result
        };
      } catch (error: any) {
        return {
          error: 'Invalid expression',
          message: error.message
        };
      }
    }
  });

  // Weather skill
  skillManager.registerSkill({
    id: 'weather',
    name: 'Weather Information',
    description: 'Get weather information for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City or location name'
        },
        units: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature units'
        }
      },
      required: ['location']
    },
    handler: async (params) => {
      // Mock implementation - in a real system, you would call a weather API
      return {
        location: params.location,
        temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40
        condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)] // Random condition
      };
    }
  });
}