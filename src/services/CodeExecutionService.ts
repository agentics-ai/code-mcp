/**
 * Code execution service for Python, JavaScript, and shell commands
 * FIXED VERSION: Better timeout handling and long-running command support
 */
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { StringUtils, ValidationUtils } from '../utils.js';
import { SUPPORTED_LANGUAGES } from '../constants.js';
import { ToolResult, ProcessResult, ProcessOptions } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

export interface PythonExecutionArgs {
  code?: string;
  script_path?: string;
  args?: string[];
  venv?: string;
}

export interface JavaScriptExecutionArgs {
  code?: string;
  script_path?: string;
  args?: string[];
}

export interface CommandExecutionArgs {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number; // Allow custom timeout
  stream?: boolean; // Stream output for long-running commands
}

export interface TestExecutionArgs {
  language: string;
  framework?: string;
  path?: string;
  pattern?: string;
}

export interface PackageInstallArgs {
  packages?: string[];
  requirements_file?: string;
  venv?: string;
}

export interface NpmCommandArgs {
  command: string;
  args?: string[];
  cwd?: string;
}

export class CodeExecutionService {
  private workspaceService: WorkspaceService;
  private defaultTimeout: number = 30000; // 30 seconds default
  private installTimeout: number = 300000; // 5 minutes for installations

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
  }

  /**
   * Get current workspace path
   */
  private getCurrentWorkspace(): string {
    return this.workspaceService.getCurrentWorkspace();
  }

  /**
   * Quote path if it contains spaces
   */
  private quotePath(filePath: string): string {
    return filePath.includes(' ') ? `"${filePath}"` : filePath;
  }

  /**
   * Execute command with streaming support for long-running processes
   */
  private async executeWithStreaming(
    command: string, 
    options: any, 
    timeout: number = this.defaultTimeout
  ): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], {
        shell: true,
        cwd: options.cwd || this.getCurrentWorkspace(),
        env: options.env || process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout if not streaming
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            child.kill('SIGTERM');
            // Force kill after grace period
            setTimeout(() => {
              if (!child.killed) {
                child.kill('SIGKILL');
              }
            }, 5000);
            reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
          }
        }, timeout);
      }

      // Capture output
      child.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        // Limit output size to prevent memory issues
        if (stdout.length > 1024 * 1024) { // 1MB limit
          stdout = stdout.slice(-512 * 1024) + '\n...[output truncated]...';
        }
      });

      child.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        // Limit error output size
        if (stderr.length > 512 * 1024) { // 512KB limit
          stderr = stderr.slice(-256 * 1024) + '\n...[error output truncated]...';
        }
      });

      child.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error(`Failed to execute command: ${error.message}`));
        }
      });

      child.on('exit', (code, signal) => {
        if (!isResolved) {
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          
          if (code === 0 || (code === null && signal === 'SIGTERM')) {
            resolve({
              content: [{
                type: 'text',
                text: `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
              }],
            });
          } else {
            const errorMsg = stderr || stdout || `Process exited with code ${code}`;
            reject(new Error(`Command failed: ${command}\n${errorMsg}`));
          }
        }
      });
    });
  }

  /**
   * Execute Python code or script
   */
  async runPython(args: PythonExecutionArgs): Promise<ToolResult> {
    const { code, script_path, args: scriptArgs = [], venv } = args;
    
    if (!code && !script_path) {
      throw new Error('Either code or script_path must be provided');
    }
    
    let command: string = '';
    
    if (code) {
      // Check for Python availability
      const pythonCmd = venv ? `${venv}/bin/python3` : await this.getPythonCommand();
      const escapedCode = code.replace(/"/g, '\\"').replace(/\$/g, '\\$');
      command = `${pythonCmd} -c "${escapedCode}"`;
      if (scriptArgs.length > 0) {
        command += ` ${scriptArgs.join(' ')}`;
      }
    } else if (script_path) {
      const pythonCmd = venv ? `${venv}/bin/python3` : await this.getPythonCommand();
      const fullPath = this.workspaceService.resolvePath(script_path);
      command = `${pythonCmd} ${this.quotePath(fullPath)} ${scriptArgs.join(' ')}`;
    }
    
    return this.executeWithStreaming(command, { cwd: this.getCurrentWorkspace() });
  }

  /**
   * Execute JavaScript code or script
   */
  async runJavaScript(args: JavaScriptExecutionArgs): Promise<ToolResult> {
    const { code, script_path, args: scriptArgs = [] } = args;
    
    if (!code && !script_path) {
      throw new Error('Either code or script_path must be provided');
    }
    
    let command: string = '';
    
    if (code) {
      const escapedCode = code.replace(/"/g, '\\"').replace(/\$/g, '\\$');
      command = `node -e "${escapedCode}"`;
      if (scriptArgs.length > 0) {
        command += ` ${scriptArgs.join(' ')}`;
      }
    } else if (script_path) {
      const fullPath = this.workspaceService.resolvePath(script_path);
      command = `node ${this.quotePath(fullPath)} ${scriptArgs.join(' ')}`;
    }
    
    return this.executeWithStreaming(command, { cwd: this.getCurrentWorkspace() });
  }

  /**
   * Execute shell command with improved timeout handling
   */
  async runCommand(args: CommandExecutionArgs): Promise<ToolResult> {
    const { command, cwd, env, timeout, stream = false } = args;
    ValidationUtils.validateRequired({ command }, ['command']);
    
    const workingDir = cwd ? this.workspaceService.resolvePath(cwd) : this.getCurrentWorkspace();
    const execOptions = { 
      cwd: workingDir,
      env: env ? { ...process.env, ...env } : process.env
    };
    
    // Use custom timeout or default based on command type
    const commandTimeout = timeout || this.getTimeoutForCommand(command);
    
    return this.executeWithStreaming(command, execOptions, commandTimeout);
  }

  /**
   * Install Python packages using pip with extended timeout
   */
  async pipInstall(args: PackageInstallArgs): Promise<ToolResult> {
    const { packages, requirements_file, venv } = args;
    
    if (!packages && !requirements_file) {
      throw new Error('Either packages or requirements_file must be provided');
    }
    
    let command: string = '';
    const pipCmd = venv ? `${venv}/bin/pip` : await this.getPipCommand();
    
    if (packages) {
      // Add --no-cache-dir to avoid permission issues
      command = `${pipCmd} install --no-cache-dir ${packages.join(' ')}`;
    } else if (requirements_file) {
      const fullPath = this.workspaceService.resolvePath(requirements_file);
      command = `${pipCmd} install --no-cache-dir -r ${this.quotePath(fullPath)}`;
    }
    
    try {
      return await this.executeWithStreaming(
        command, 
        { cwd: this.getCurrentWorkspace() }, 
        this.installTimeout
      );
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.message.includes('Could not find a version') || 
          error.message.includes('No matching distribution found')) {
        throw new Error(`Package not found. Try checking the package name or using 'pip search' to find the correct name.`);
      } else if (error.message.includes('Permission denied')) {
        throw new Error(`Permission denied. Try using pip with --user flag or in a virtual environment.`);
      } else if (error.message.includes('timed out')) {
        throw new Error(`Installation timed out. This might be due to slow network or large packages. Try installing packages individually.`);
      }
      throw error;
    }
  }

  /**
   * Run npm commands with extended timeout
   */
  async npmCommand(args: NpmCommandArgs): Promise<ToolResult> {
    const { command, args: cmdArgs = [], cwd } = args;
    ValidationUtils.validateRequired({ command }, ['command']);
    
    const workingDir = cwd ? this.workspaceService.resolvePath(cwd) : this.getCurrentWorkspace();
    const fullCommand = `npm ${command} ${cmdArgs.join(' ')}`;
    
    // Use longer timeout for install commands
    const timeout = command.includes('install') ? this.installTimeout : 60000;
    
    return this.executeWithStreaming(fullCommand, { cwd: workingDir }, timeout);
  }

  /**
   * Run tests using various frameworks
   */
  async runTests(args: TestExecutionArgs): Promise<ToolResult> {
    const { language, framework, path: testPath, pattern } = args;
    ValidationUtils.validateRequired({ language }, ['language']);
    
    let command: string = '';
    const workingDir = testPath ? this.workspaceService.resolvePath(testPath) : this.getCurrentWorkspace();
    
    switch (language.toLowerCase()) {
      case 'python':
        command = await this._buildPythonTestCommand(framework, testPath, pattern);
        break;
        
      case 'javascript':
        command = this._buildJavaScriptTestCommand(framework, testPath, pattern);
        break;
        
      default:
        throw new Error(`Unsupported test language: ${language}`);
    }
    
    // Tests can take longer
    return this.executeWithStreaming(command, { cwd: workingDir }, 120000);
  }

  /**
   * Get Python command (python3, python, or py)
   */
  private async getPythonCommand(): Promise<string> {
    const commands = ['python3', 'python', 'py'];
    for (const cmd of commands) {
      try {
        await this.executeWithStreaming(`${cmd} --version`, {}, 5000);
        return cmd;
      } catch {
        // Try next command
      }
    }
    throw new Error('Python not found. Please install Python 3.x');
  }

  /**
   * Get pip command
   */
  private async getPipCommand(): Promise<string> {
    const commands = ['pip3', 'pip', 'python3 -m pip', 'python -m pip'];
    for (const cmd of commands) {
      try {
        await this.executeWithStreaming(`${cmd} --version`, {}, 5000);
        return cmd;
      } catch {
        // Try next command
      }
    }
    throw new Error('pip not found. Please install pip');
  }

  /**
   * Get appropriate timeout for command type
   */
  private getTimeoutForCommand(command: string): number {
    const lowerCommand = command.toLowerCase();
    
    // Installation commands need more time
    if (lowerCommand.includes('install') || 
        lowerCommand.includes('update') ||
        lowerCommand.includes('upgrade')) {
      return this.installTimeout;
    }
    
    // Build commands need more time
    if (lowerCommand.includes('build') || 
        lowerCommand.includes('compile') ||
        lowerCommand.includes('webpack')) {
      return 120000; // 2 minutes
    }
    
    // Test commands need more time
    if (lowerCommand.includes('test') || 
        lowerCommand.includes('jest') ||
        lowerCommand.includes('pytest')) {
      return 120000; // 2 minutes
    }
    
    // Default timeout
    return this.defaultTimeout;
  }

  /**
   * Build Python test command
   */
  private async _buildPythonTestCommand(framework?: string, testPath?: string, pattern?: string): Promise<string> {
    const testFramework = framework || 'pytest';
    const pythonCmd = await this.getPythonCommand();
    
    switch (testFramework) {
      case 'pytest':
        let command = `${pythonCmd} -m pytest`;
        if (testPath) command += ` ${this.quotePath(testPath)}`;
        else command += ' .';
        if (pattern) command += ` -k "${pattern}"`;
        command += ' -v';
        return command;
      
      case 'unittest':
        let unittestCmd = `${pythonCmd} -m unittest`;
        if (testPath) {
          unittestCmd += ` ${this.quotePath(testPath)}`;
        } else {
          unittestCmd += ' discover . -v';
        }
        return unittestCmd;
      
      default:
        throw new Error(`Unsupported Python test framework: ${testFramework}`);
    }
  }

  /**
   * Build JavaScript test command
   */
  private _buildJavaScriptTestCommand(framework?: string, testPath?: string, pattern?: string): string {
    const testFramework = framework || 'jest';
    
    switch (testFramework) {
      case 'jest':
        let command = 'npx jest';
        if (testPath) command += ` ${this.quotePath(testPath)}`;
        else command += ' .';
        if (pattern) command += ` --testNamePattern="${pattern}"`;
        command += ' --verbose';
        return command;
      
      case 'mocha':
        let mochaCmd = 'npx mocha';
        if (testPath) {
          mochaCmd += ` ${this.quotePath(testPath)}`;
        } else {
          mochaCmd += ' "test/**/*.js"';
        }
        if (pattern) mochaCmd += ` --grep "${pattern}"`;
        return mochaCmd;
      
      default:
        throw new Error(`Unsupported JavaScript test framework: ${testFramework}`);
    }
  }
}
