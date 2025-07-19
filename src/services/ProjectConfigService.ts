/**
 * Project-specific configuration management service
 * Handles .vscode-mcp.toml configuration files per project
 */
import fs from 'fs/promises';
import path from 'path';
import * as toml from '@iarna/toml';
import { ToolResult } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

export interface ProjectConfig {
  // Command execution
  allowedCommands: string[];
  
  // Auto-formatting
  format?: string;
  formatOnSave: boolean;
  formatCommand?: string;
  
  // Git integration
  gitAutoCommit: boolean;
  gitAutoCommitMessage?: string;
  
  // Project context
  projectInstructions?: string;
  projectDescription?: string;
  
  // Custom tools
  customTools?: Array<{
    name: string;
    command: string;
    description: string;
    args?: Record<string, any>;
  }>;
  
  // Session management
  sessionTracking: boolean;
  maxSessionCommits?: number;
  
  // Remote development
  remoteServer?: {
    enabled: boolean;
    host?: string;
    port?: number;
  };
}

export interface SessionInfo {
  id: string;
  description: string;
  startTime: string;
  branch?: string;
  commitHashes: string[];
  isActive: boolean;
}

export class ProjectConfigService {
  private static readonly CONFIG_FILENAME = '.vscode-mcp.toml';
  private configCache: Map<string, ProjectConfig> = new Map();
  private workspaceService: WorkspaceService;
  private currentSession?: SessionInfo;

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
  }

  /**
   * Load project configuration from .vscode-mcp.toml
   */
  async loadProjectConfig(workspacePath?: string): Promise<ProjectConfig> {
    const resolvedPath = workspacePath || this.workspaceService.workspacePath;
    const configPath = path.join(resolvedPath, ProjectConfigService.CONFIG_FILENAME);
    
    // Check cache first
    if (this.configCache.has(configPath)) {
      return this.configCache.get(configPath)!;
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const parsedConfig = toml.parse(configContent);
      
      // Merge with defaults
      const config = this.mergeWithDefaults(parsedConfig as Partial<ProjectConfig>);
      
      this.configCache.set(configPath, config);
      return config;
    } catch (error) {
      // Return default config if file doesn't exist or can't be parsed
      const defaultConfig = this.getDefaultConfig();
      this.configCache.set(configPath, defaultConfig);
      return defaultConfig;
    }
  }

  /**
   * Save project configuration to .vscode-mcp.toml
   */
  async saveProjectConfig(config: ProjectConfig, workspacePath?: string): Promise<ToolResult> {
    try {
      const resolvedPath = workspacePath || this.workspaceService.workspacePath;
      const configPath = path.join(resolvedPath, ProjectConfigService.CONFIG_FILENAME);
      
      const tomlContent = toml.stringify(config as any);
      await fs.writeFile(configPath, tomlContent, 'utf-8');
      
      // Update cache
      this.configCache.set(configPath, config);
      
      return {
        content: [{
          type: 'text',
          text: `Project configuration saved to ${configPath}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to save project configuration: ${error}`
        }]
      };
    }
  }

  /**
   * Check if a command is allowed to run
   */
  async isCommandAllowed(command: string, workspacePath?: string): Promise<boolean> {
    const config = await this.loadProjectConfig(workspacePath);
    const baseCommand = command.split(' ')[0];
    
    return config.allowedCommands.some(allowed => 
      baseCommand === allowed || 
      baseCommand.startsWith(allowed + '/') ||
      baseCommand.startsWith(allowed + '\\')
    );
  }

  /**
   * Start a new coding session
   */
  async startCodingSession(description: string, branch?: string): Promise<SessionInfo> {
    const sessionId = `session_${Date.now()}`;
    
    this.currentSession = {
      id: sessionId,
      description,
      startTime: new Date().toISOString(),
      branch,
      commitHashes: [],
      isActive: true
    };

    return this.currentSession;
  }

  /**
   * End the current coding session
   */
  async endCodingSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.isActive = false;
      this.currentSession = undefined;
    }
  }

  /**
   * Get current session info
   */
  getCurrentSession(): SessionInfo | undefined {
    return this.currentSession;
  }

  /**
   * Add commit hash to current session
   */
  addCommitToSession(commitHash: string): void {
    if (this.currentSession) {
      this.currentSession.commitHashes.push(commitHash);
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ProjectConfig {
    return {
      allowedCommands: [
        'npm', 'yarn', 'pnpm', 'bun',
        'git', 'docker', 'docker-compose',
        'prettier', 'eslint', 'tsc', 'tslint',
        'pytest', 'jest', 'vitest', 'mocha',
        'cargo', 'rustfmt', 'clippy',
        'go', 'gofmt', 'golint'
      ],
      formatOnSave: true,
      gitAutoCommit: true,
      gitAutoCommitMessage: '[AI] Auto-commit: {{message}}',
      sessionTracking: true,
      maxSessionCommits: 50
    };
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(userConfig: Partial<ProjectConfig>): ProjectConfig {
    const defaults = this.getDefaultConfig();
    
    return {
      ...defaults,
      ...userConfig,
      allowedCommands: [
        ...defaults.allowedCommands,
        ...(userConfig.allowedCommands || [])
      ]
    };
  }

  /**
   * Generate sample configuration file
   */
  generateSampleConfig(): string {
    const sampleConfig = {
      general: {
        formatOnSave: true,
        gitAutoCommit: true,
        sessionTracking: true,
        format: "prettier --write {{file}}"
      },
      commands: {
        allowedCommands: [
          "npm", "yarn", "pnpm", "bun",
          "git", "docker", "docker-compose",
          "prettier", "eslint", "tsc"
        ]
      },
      project: {
        projectInstructions: `
This is a VS Code MCP server project. When making changes:
1. Follow TypeScript best practices
2. Update tests when modifying functionality  
3. Keep tools focused and single-purpose
4. Document new tools with clear descriptions
        `.trim()
      },
      customTools: [
        {
          name: "format_project",
          command: "prettier --write src/**/*.ts",
          description: "Format all TypeScript files in the project"
        }
      ],
      remoteServer: {
        enabled: false,
        host: "0.0.0.0",
        port: 3000
      }
    };

    return toml.stringify(sampleConfig);
  }
}
