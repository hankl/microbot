import { Logger } from '../utils/logger.js';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

interface Skill {
  name: string;
  available: boolean;
  execRequires: string[];
  description: string;
}

export class SkillsLoader {
  private logger: Logger;
  private skillsDir: string;
  private skills: Map<string, Skill>;

  constructor() {
    this.logger = new Logger();
    this.skillsDir = join(process.cwd(), 'skills');
    this.skills = new Map();
  }

  async initialize() {
    this.logger.info('Initializing SkillsLoader...');
    
    // 创建技能目录
    await this.ensureSkillsDirExists();
    
    // 加载技能
    await this.loadSkills();
  }

  private async ensureSkillsDirExists() {
    try {
      await fs.mkdir(this.skillsDir, { recursive: true });
      this.logger.info(`Created skills directory: ${this.skillsDir}`);
    } catch (error) {
      this.logger.error('Error creating skills directory:', error);
    }
  }

  private async loadSkills() {
    this.logger.info('Loading skills...');

    try {
      // 递归扫描skills目录
      const skillDirs = await this.getSkillDirs();
      
      for (const skillDir of skillDirs) {
        const skillFile = join(skillDir, 'SKILL.md');
        
        // 检查SKILL.md文件是否存在
        try {
          await fs.access(skillFile);
          const skill = await this.parseSkillFile(skillFile);
          this.skills.set(skill.name, skill);
          this.logger.info(`Loaded skill: ${skill.name}`);
        } catch (error) {
          this.logger.warn(`SKILL.md not found in: ${skillDir}`);
        }
      }

      this.logger.info(`Loaded ${this.skills.size} skills`);
    } catch (error) {
      this.logger.error('Error loading skills:', error);
    }
  }

  private async getSkillDirs(): Promise<string[]> {
    const skillDirs: string[] = [];

    try {
      const files = await fs.readdir(this.skillsDir, { withFileTypes: true });
      
      for (const file of files) {
        if (file.isDirectory()) {
          skillDirs.push(join(this.skillsDir, file.name));
        }
      }
    } catch (error) {
      this.logger.error('Error reading skills directory:', error);
    }

    return skillDirs;
  }

  private async parseSkillFile(skillFile: string): Promise<Skill> {
    const content = await fs.readFile(skillFile, 'utf8');
    
    // 简单解析SKILL.md文件
    // 这里应该使用更复杂的解析逻辑
    const skillName = join(skillFile).split('\\').pop()?.replace('SKILL.md', '') || 'unknown';
    
    return {
      name: skillName,
      available: true,
      execRequires: [],
      description: content
    };
  }

  async buildSkillsSummary(): Promise<string> {
    this.logger.info('Building skills summary...');

    try {
      // 确保技能已加载
      if (this.skills.size === 0) {
        await this.loadSkills();
      }

      // 构建技能汇总
      let summary = '# Available Skills\n\n';
      
      for (const skill of this.skills.values()) {
        if (skill.available) {
          summary += `## ${skill.name}\n`;
          summary += `${skill.description}\n\n`;
        }
      }

      return summary.trim();
    } catch (error) {
      this.logger.error('Error building skills summary:', error);
      return '';
    }
  }

  async loadSkillsForContext(skillNames: string[]): Promise<string> {
    this.logger.info('Loading skills for context:', skillNames);

    try {
      // 确保技能已加载
      if (this.skills.size === 0) {
        await this.loadSkills();
      }

      // 构建技能上下文
      let context = '# Loaded Skills\n\n';
      
      for (const skillName of skillNames) {
        const skill = this.skills.get(skillName);
        if (skill) {
          context += `## ${skill.name}\n`;
          context += `${skill.description}\n\n`;
        }
      }

      return context.trim();
    } catch (error) {
      this.logger.error('Error loading skills for context:', error);
      return '';
    }
  }

  getSkills(): Map<string, Skill> {
    return this.skills;
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }
}