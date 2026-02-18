import { Logger } from '../utils/logger.js';
import { OllamaClient, OllamaRequest, OllamaMessage } from '../api/ollama.js';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  handler: (params: Record<string, any>) => Promise<any>;
}

export interface SkillRegistry {
  [key: string]: SkillDefinition;
}

export class SkillManager {
  private registry: SkillRegistry = {};
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  /**
   * Register a new skill
   */
  registerSkill(skill: SkillDefinition): void {
    this.registry[skill.id] = skill;
    this.logger.info(`Registered skill: ${skill.name} (${skill.id})`);
  }

  /**
   * Execute a skill by ID with given parameters
   */
  async executeSkill(skillId: string, params: Record<string, any>): Promise<any> {
    const skill = this.registry[skillId];
    
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    try {
      this.logger.info(`Executing skill: ${skill.name} with params:`, params);
      const result = await skill.handler(params);
      this.logger.info(`Skill ${skill.name} executed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Error executing skill ${skill.name}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered skills
   */
  getSkills(): SkillDefinition[] {
    return Object.values(this.registry);
  }

  /**
   * Get skill definition by ID
   */
  getSkill(skillId: string): SkillDefinition | undefined {
    return this.registry[skillId];
  }

  /**
   * Format skills for LLM consumption
   */
  formatSkillsForLLM(): string {
    const skills = this.getSkills();
    if (skills.length === 0) {
      return "No skills available.";
    }

    let formatted = "Available skills:\n";
    skills.forEach(skill => {
      formatted += `\nSkill: ${skill.name} (${skill.id})\n`;
      formatted += `Description: ${skill.description}\n`;
      formatted += `Parameters: ${JSON.stringify(skill.parameters, null, 2)}\n`;
    });

    return formatted;
  }

  /**
   * Parse skill execution request from LLM response
   */
  parseSkillRequest(text: string): { skillId: string; params: Record<string, any> } | null {
    // Look for skill execution patterns in the text
    const skillPattern = /SKILL:\s*(\w+)\s*\(([^)]*)\)/i;
    const match = text.match(skillPattern);

    if (match) {
      const skillId = match[1].toLowerCase();
      const paramsStr = match[2].trim();

      try {
        // Attempt to parse parameters as JSON
        const params = paramsStr ? JSON.parse(`{${paramsStr}}`) : {};
        return { skillId, params };
      } catch (e) {
        // If JSON parsing fails, try to parse as key=value pairs
        const params: Record<string, any> = {};
        const pairs = paramsStr.split(',');
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[key.trim()] = value.trim().replace(/['"]/g, '');
          }
        }
        return { skillId, params };
      }
    }

    return null;
  }
}