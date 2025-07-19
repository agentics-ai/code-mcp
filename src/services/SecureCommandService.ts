/**
 * Secure Command Service with command restrictions
 * Only allows pre-approved commands to run for enhanced security
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { ProjectConfigService } from './ProjectConfigService.js';
import { GitService } from './GitService.js';
import { ToolResult } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';
import path from 'path';

const execAsync = promisify(exec);

export interface SecureCommandOptions {
  cwd?: string;
  timeout?: number;
  env?: NodeJS.ProcessEnv;
  skipAllowedCheck?: boolean;
  commitResult?: boolean;
  commitMessage?: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  executionTime: number;
}

export class SecureCommandService {
  private configService: ProjectConfigService;
  private gitService: GitService;
  private workspaceService: WorkspaceService;

  constructor(
    configService: ProjectConfigService,
    gitService: GitService,
    workspaceService: WorkspaceService
  ) {
    this.configService = configService;
    this.gitService = gitService;
    this.workspaceService = workspaceService;
  }

  /**
   * Execute a command with security restrictions
   */
  async runCommand(command: string, options: SecureCommandOptions = {}): Promise<ToolResult> {
    try {
      const startTime = Date.now();
      const {
        cwd,
        timeout = 30000,
        env,
        skipAllowedCheck = false,
        commitResult = false,
        commitMessage
      } = options;

      const workingDir = cwd || this.workspaceService.workspacePath;

      // Check if command is allowed (unless explicitly skipped)
      if (!skipAllowedCheck) {
        const isAllowed = await this.configService.isCommandAllowed(command, workingDir);
        if (!isAllowed) {
          const config = await this.configService.loadProjectConfig();
          return {
            isError: true,
            content: [{
              type: 'text',
              text: `Command '${command.split(' ')[0]}' not allowed.\n` +
                    `Add it to allowedCommands in .vscode-mcp.toml first.\n` +
                    `Currently allowed: ${config.allowedCommands.join(', ')}`
            }]
          };
        }
      }

      // Execute the command
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        timeout,
        env: { ...process.env, ...env }
      });

      const executionTime = Date.now() - startTime;
      let resultText = `Command executed successfully in ${executionTime}ms\n\n`;
      
      if (stdout) {
        resultText += `STDOUT:\n${stdout}\n\n`;
      }
      
      if (stderr) {
        resultText += `STDERR:\n${stderr}\n`;
      }

      // Auto-commit if requested
      if (commitResult) {
        const config = await this.configService.loadProjectConfig();
        if (config.gitAutoCommit) {
          const message = commitMessage || `Executed command: ${command}`;
          await this.gitService.autoCommitChanges({
            message,
            skipIfNoChanges: true
          });
        }
      }

      return {
        content: [{
          type: 'text',
          text: resultText.trim(),
          _meta: {
            command,
            executionTime,
            exitCode: 0
          }
        }]
      };

    } catch (error: any) {
      const executionTime = Date.now() - Date.now();
      
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Command failed: ${command}\n` +
                `Error: ${error.message}\n` +
                `Exit code: ${error.code || 'unknown'}`,
          _meta: {
            command,
            executionTime,
            exitCode: error.code || -1
          }
        }]
      };
    }
  }

  /**
   * Run multiple commands in sequence
   */
  async runCommandSequence(commands: string[], options: SecureCommandOptions = {}): Promise<ToolResult> {
    try {
      const results: string[] = [];
      let hasErrors = false;

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        const result = await this.runCommand(command, {
          ...options,
          commitResult: false // Don't commit individual commands
        });

        if (result.isError) {
          hasErrors = true;
          results.push(`❌ Command ${i + 1}: ${command}`);
          results.push(`   Error: ${result.content[0].text}`);
          
          // Stop execution on first error unless configured otherwise
          break;
        } else {
          results.push(`✅ Command ${i + 1}: ${command}`);
          results.push(`   ${result.content[0].text}`);
        }
      }

      // Auto-commit sequence results if requested
      if (options.commitResult && !hasErrors) {
        const config = await this.configService.loadProjectConfig();
        if (config.gitAutoCommit) {
          const message = options.commitMessage || `Executed command sequence (${commands.length} commands)`;
          await this.gitService.autoCommitChanges({
            message,
            skipIfNoChanges: true
          });
        }
      }

      return {
        isError: hasErrors,
        content: [{
          type: 'text',
          text: results.join('\n')
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Command sequence failed: ${error}`
        }]
      };
    }
  }

  /**
   * Get list of allowed commands
   */
  async getAllowedCommands(): Promise<ToolResult> {
    try {
      const config = await this.configService.loadProjectConfig();
      
      let commandText = 'Allowed Commands:\n';
      commandText += config.allowedCommands.map(cmd => `• ${cmd}`).join('\n');
      
      if (config.customTools && config.customTools.length > 0) {
        commandText += '\n\nCustom Tools:\n';
        commandText += config.customTools.map(tool => 
          `• ${tool.name}: ${tool.description}`
        ).join('\n');
      }

      return {
        content: [{
          type: 'text',
          text: commandText
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to get allowed commands: ${error}`
        }]
      };
    }
  }

  /**
   * Add a command to the allowed list
   */
  async addAllowedCommand(command: string): Promise<ToolResult> {
    try {
      const config = await this.configService.loadProjectConfig();
      
      if (config.allowedCommands.includes(command)) {
        return {
          content: [{
            type: 'text',
            text: `Command '${command}' is already allowed`
          }]
        };
      }

      config.allowedCommands.push(command);
      await this.configService.saveProjectConfig(config);

      return {
        content: [{
          type: 'text',
          text: `Command '${command}' added to allowed list`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to add allowed command: ${error}`
        }]
      };
    }
  }

  /**
   * Remove a command from the allowed list
   */
  async removeAllowedCommand(command: string): Promise<ToolResult> {
    try {
      const config = await this.configService.loadProjectConfig();
      
      const index = config.allowedCommands.indexOf(command);
      if (index === -1) {
        return {
          content: [{
            type: 'text',
            text: `Command '${command}' is not in the allowed list`
          }]
        };
      }

      config.allowedCommands.splice(index, 1);
      await this.configService.saveProjectConfig(config);

      return {
        content: [{
          type: 'text',
          text: `Command '${command}' removed from allowed list`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to remove allowed command: ${error}`
        }]
      };
    }
  }

  /**
   * Execute a custom tool defined in project config
   */
  async runCustomTool(toolName: string, args?: Record<string, any>): Promise<ToolResult> {
    try {
      const config = await this.configService.loadProjectConfig();
      
      const customTool = config.customTools?.find(tool => tool.name === toolName);
      if (!customTool) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Custom tool '${toolName}' not found in project configuration`
          }]
        };
      }

      // Replace placeholders in command if args provided
      let command = customTool.command;
      if (args) {
        for (const [key, value] of Object.entries(args)) {
          command = command.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
        }
      }

      return this.runCommand(command, {
        skipAllowedCheck: true, // Custom tools are pre-approved
        commitMessage: `Executed custom tool: ${toolName}`
      });

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to execute custom tool: ${error}`
        }]
      };
    }
  }
}
