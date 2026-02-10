import { Logger } from '../utils/logger.js';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

interface SkillMetadata {
  name?: string;
  description?: string;
  'argument-hint'?: string;
  'disable-model-invocation'?: boolean;
  'user-invocable'?: boolean;
}

interface Skill {
  name: string;
  available: boolean;
  execRequires: string[];
  description: string;
  metadata: SkillMetadata;
  instructions: string;
  examples: string[];
  guidelines: string[];
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
    
    await this.ensureSkillsDirExists();
    await this.loadSkills();
    
    this.logger.info(`SkillsLoader initialized with ${this.skills.size} skills`);
  }

  private async ensureSkillsDirExists() {
    try {
      await fs.mkdir(this.skillsDir, { recursive: true });
      this.logger.info(`Skills directory: ${this.skillsDir}`);
    } catch (error) {
      this.logger.error('Error creating skills directory:', error);
    }
  }

  async loadSkills() {
    this.logger.info('Loading skills...');

    try {
      const skillDirs = await this.getSkillDirs();
      
      for (const skillDir of skillDirs) {
        const skillFile = join(skillDir, 'SKILL.md');
        
        try {
          await fs.access(skillFile);
          const skill = await this.parseSkillFile(skillFile, skillDir);
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

  private parseFrontMatter(content: string): { metadata: SkillMetadata; body: string } {
    // Support both Windows (\r\n) and Unix (\n) line endings
    const frontMatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (match) {
      const yamlContent = match[1];
      const body = match[2].trim();
      
      const metadata = this.parseYaml(yamlContent);
      
      return { metadata, body };
    }

    return { metadata: {}, body: content };
  }

  private parseYaml(yaml: string): SkillMetadata {
    const result: SkillMetadata = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        
        if (value === 'true') value = 'true';
        else if (value === 'false') value = 'false';
        else if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        (result as any)[key] = value;
      }
    }

    return result;
  }

  private async parseSkillFile(skillFile: string, skillDir: string): Promise<Skill> {
    const content = await fs.readFile(skillFile, 'utf8');
    const { metadata, body } = this.parseFrontMatter(content);
    
    const skillName = metadata.name || skillDir.split(/[/\\]/).pop() || 'unknown';
    const sections = this.parseSections(body);

    return {
      name: skillName,
      available: true,
      execRequires: [],
      description: metadata.description || '',
      metadata,
      instructions: sections.instructions || '',
      examples: sections.examples || [],
      guidelines: sections.guidelines || []
    };
  }

  private parseSections(body: string): { instructions?: string; examples?: string[]; guidelines?: string[] } {
    const sections: { instructions?: string; examples?: string[]; guidelines?: string[] } = {};
    
    const sectionsRegex = /## (Instructions|Examples|Guidelines)\n([\s\S]*?)(?=## |\n*$)/g;
    let match;
    
    while ((match = sectionsRegex.exec(body)) !== null) {
      const sectionName = match[1];
      const sectionContent = match[2].trim();
      
      if (sectionName === 'Instructions') {
        sections.instructions = sectionContent;
      } else if (sectionName === 'Examples') {
        sections.examples = sectionContent.split('\n')
          .filter(line => line.trim().startsWith('- '))
          .map(line => line.trim().slice(2));
      } else if (sectionName === 'Guidelines') {
        sections.guidelines = sectionContent.split('\n')
          .filter(line => line.trim().startsWith('- '))
          .map(line => line.trim().slice(2));
      }
    }

    return sections;
  }

  async buildSkillsSummary(): Promise<string> {
    this.logger.info('Building skills summary...');

    try {
      if (this.skills.size === 0) {
        await this.loadSkills();
      }

      let summary = '# Available Skills\n\n';
      
      for (const skill of this.skills.values()) {
        if (skill.available) {
          summary += `## ${skill.name}\n`;
          summary += `${skill.metadata.description || skill.description}\n\n`;
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
      if (this.skills.size === 0) {
        await this.loadSkills();
      }

      let context = '# Loaded Skills\n\n';
      
      for (const skillName of skillNames) {
        const skill = this.skills.get(skillName);
        if (skill) {
          context += `## ${skill.name}\n`;
          context += `${skill.description}\n\n`;
          
          if (skill.instructions) {
            context += `### Instructions\n${skill.instructions}\n\n`;
          }
          
          if (skill.examples.length > 0) {
            context += `### Examples\n`;
            for (const example of skill.examples) {
              context += `- ${example}\n`;
            }
            context += '\n';
          }
        }
      }

      return context.trim();
    } catch (error) {
      this.logger.error('Error loading skills for context:', error);
      return '';
    }
  }

  async findRelevantSkills(query: string): Promise<string[]> {
    const relevantSkills: string[] = [];
    const queryLower = query.toLowerCase();

    for (const [name, skill] of this.skills) {
      const searchText = `${name} ${skill.description} ${skill.metadata.description || ''}`.toLowerCase();
      
      if (searchText.includes(queryLower) || 
          skill.examples.some(ex => ex.toLowerCase().includes(queryLower)) ||
          skill.guidelines.some(g => g.toLowerCase().includes(queryLower))) {
        relevantSkills.push(name);
      }
    }

    return relevantSkills;
  }

  getSkills(): Map<string, Skill> {
    return this.skills;
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  async reloadSkills() {
    this.skills.clear();
    await this.loadSkills();
  }
}