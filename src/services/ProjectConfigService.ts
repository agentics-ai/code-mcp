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
      const parsedConfig = toml.parse(configContent) as any;
      
      // Handle nested TOML structure
      const flatConfig: Partial<ProjectConfig> = {
        // General settings
        formatOnSave: parsedConfig.general?.formatOnSave ?? parsedConfig.formatOnSave,
        gitAutoCommit: parsedConfig.general?.gitAutoCommit ?? parsedConfig.gitAutoCommit,
        gitAutoCommitMessage: parsedConfig.general?.gitAutoCommitMessage ?? parsedConfig.gitAutoCommitMessage,
        sessionTracking: parsedConfig.general?.sessionTracking ?? parsedConfig.sessionTracking,
        maxSessionCommits: parsedConfig.general?.maxSessionCommits ?? parsedConfig.maxSessionCommits,
        formatCommand: parsedConfig.general?.formatCommand ?? parsedConfig.formatCommand,
        format: parsedConfig.general?.format ?? parsedConfig.format,
        
        // Security settings
        allowedCommands: parsedConfig.security?.allowedCommands ?? parsedConfig.allowedCommands ?? [],
        
        // Project settings
        projectInstructions: parsedConfig.project?.projectInstructions ?? parsedConfig.projectInstructions,
        projectDescription: parsedConfig.project?.projectDescription ?? parsedConfig.projectDescription,
        
        // Custom tools
        customTools: parsedConfig.customTools ?? parsedConfig.project?.customTools,
        
        // Remote server
        remoteServer: parsedConfig.remoteServer
      };
      
      // Merge with defaults
      const config = this.mergeWithDefaults(flatConfig);
      
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
        maxSessionCommits: 50,
        formatCommand: "prettier --write {{file}}",
        gitAutoCommitMessage: "[AI] {{message}}"
      },
      security: {
        allowedCommands: [
          "npm", "yarn", "pnpm", "bun",
          "git", "docker", "docker-compose",
          "prettier", "eslint", "tsc",
          "pytest", "jest", "vitest", "mocha",
          "ls", "cat", "head", "tail", "grep", "find", "echo"
        ]
      },
      project: {
        projectDescription: "VS Code MCP Server Project",
        projectInstructions: `
This is a VS Code MCP server project. When making changes:
1. Follow TypeScript best practices
2. Update tests when modifying functionality  
3. Keep tools focused and single-purpose
4. Document new tools with clear descriptions
5. Use secure coding practices
        `.trim()
      },
      customTools: [
        {
          name: "format_project",
          command: "prettier --write src/**/*.ts",
          description: "Format all TypeScript files in the project"
        },
        {
          name: "test_all",
          command: "npm test",
          description: "Run all project tests"
        }
      ],
      remoteServer: {
        enabled: false,
        host: "127.0.0.1",
        port: 3000
      },
      advanced: {
        commandTimeout: 30000,
        maxOutputLength: 10000,
        logLevel: "info",
        auditLogging: true,
        sessionTimeout: 60
      }
    };

    return toml.stringify(sampleConfig);
  }

  /**
   * Get history of coding sessions with their commits
   */
  async getSessionCommitHistory(limit?: number): Promise<ToolResult> {
    try {
      const sessions: any[] = []; // In a real implementation, you'd store this persistently
      
      // For now, use the current session if active
      if (this.currentSession) {
        sessions.push({
          ...this.currentSession,
          commitCount: this.currentSession.commitHashes.length
        });
      }

      let historyText = `Session History:\n\n`;
      
      if (sessions.length === 0) {
        historyText += 'No coding sessions found';
      } else {
        sessions.forEach((session, index) => {
          historyText += `${index + 1}. ${session.description}\n`;
          historyText += `   ID: ${session.id}\n`;
          historyText += `   Started: ${new Date(session.startTime).toLocaleString()}\n`;
          historyText += `   Commits: ${session.commitCount}\n`;
          historyText += `   Status: ${session.isActive ? 'Active' : 'Completed'}\n`;
          if (session.branch) {
            historyText += `   Branch: ${session.branch}\n`;
          }
          historyText += `\n`;
        });
      }

      return {
        content: [{
          type: 'text',
          text: historyText
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to get session history: ${error}`
        }]
      };
    }
  }

  /**
   * Validate and secure a command before execution
   */
  async validateSecureCommand(command: string, workspacePath?: string): Promise<{
    allowed: boolean;
    reason?: string;
    sanitizedCommand?: string;
  }> {
    const config = await this.loadProjectConfig(workspacePath);
    const baseCommand = command.split(' ')[0].toLowerCase();
    
    // Check if base command is allowed
    const isBaseAllowed = config.allowedCommands.some(allowed => 
      baseCommand === allowed.toLowerCase() || 
      baseCommand.startsWith(allowed.toLowerCase() + '/') ||
      baseCommand.startsWith(allowed.toLowerCase() + '\\')
    );

    if (!isBaseAllowed) {
      return {
        allowed: false,
        reason: `Command '${baseCommand}' is not in the allowed commands list`
      };
    }

    // Additional security checks
    const dangerousPatterns = [
      /rm\s+.*-rf/i,           // rm -rf
      /sudo\s/i,               // sudo commands
      /su\s/i,                 // su commands
      /chmod\s+777/i,          // dangerous permissions
      />\s*\/dev\/null/i,      // output redirection that might hide errors
      /&\s*$/,                 // background execution
      /;\s*rm/i,               // chained rm commands
      /\|\s*sh/i,              // piped shell execution
      /curl.*\|\s*sh/i,        // curl piped to shell
      /wget.*\|\s*sh/i,        // wget piped to shell
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          allowed: false,
          reason: `Command contains potentially dangerous pattern: ${pattern.source}`
        };
      }
    }

    // Command appears safe
    return {
      allowed: true,
      sanitizedCommand: command.trim()
    };
  }
}
