/**
 * Code execution service for Python, JavaScript, and shell commands
 */
import { exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { StringUtils, ValidationUtils } from '../utils.js';
import { SUPPORTED_LANGUAGES } from '../constants.js';
import { ToolResult, ProcessResult, ProcessOptions } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

const execAsync = promisify(exec);

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
   * Execute Python code or script
   */
  async runPython(args: PythonExecutionArgs): Promise<ToolResult> {
    const { code, script_path, args: scriptArgs = [], venv } = args;
    
    if (!code && !script_path) {
      throw new Error('Either code or script_path must be provided');
    }
    
    let command: string = '';
    
    if (code) {
      const pythonCmd = venv ? `${venv}/bin/python3` : 'python3';
      const escapedCode = code.replace(/"/g, '\\"');
      command = `${pythonCmd} -c "${escapedCode}"`;
      if (scriptArgs.length > 0) {
        command += ` ${scriptArgs.join(' ')}`;
      }
    } else if (script_path) {
      const pythonCmd = venv ? `${venv}/bin/python3` : 'python3';
      const fullPath = this.workspaceService.resolvePath(script_path);
      command = `${pythonCmd} ${this.quotePath(fullPath)} ${scriptArgs.join(' ')}`;
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.getCurrentWorkspace(),
        timeout: 30000 // 30 second timeout
      });
      
      return {
        content: [{
          type: 'text',
          text: `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
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
      const escapedCode = code.replace(/"/g, '\\"');
      command = `node -e "${escapedCode}"`;
      if (scriptArgs.length > 0) {
        command += ` ${scriptArgs.join(' ')}`;
      }
    } else if (script_path) {
      const fullPath = this.workspaceService.resolvePath(script_path);
      command = `node ${this.quotePath(fullPath)} ${scriptArgs.join(' ')}`;
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.getCurrentWorkspace(),
        timeout: 30000
      });
      
      return {
        content: [{
          type: 'text',
          text: `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  /**
   * Execute shell command
   */
  async runCommand(args: CommandExecutionArgs): Promise<ToolResult> {
    const { command, cwd, env } = args;
    ValidationUtils.validateRequired({ command }, ['command']);
    
    const workingDir = cwd ? this.workspaceService.resolvePath(cwd) : this.getCurrentWorkspace();
    const execOptions = { 
      cwd: workingDir,
      env: env ? { ...process.env, ...env } : process.env,
      timeout: 30000
    };
    
    try {
      const { stdout, stderr } = await execAsync(command, execOptions);
      
      return {
        content: [{
          type: 'text',
          text: `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  /**
   * Install Python packages using pip
   */
  async pipInstall(args: PackageInstallArgs): Promise<ToolResult> {
    const { packages, requirements_file, venv } = args;
    
    if (!packages && !requirements_file) {
      throw new Error('Either packages or requirements_file must be provided');
    }
    
    let command: string = '';
    const pipCmd = venv ? `${venv}/bin/pip` : 'pip3';
    
    if (packages) {
      command = `${pipCmd} install ${packages.join(' ')}`;
    } else if (requirements_file) {
      const fullPath = this.workspaceService.resolvePath(requirements_file);
      command = `${pipCmd} install -r ${this.quotePath(fullPath)}`;
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.getCurrentWorkspace(),
        timeout: 60000 // Longer timeout for installations
      });
      
      return {
        content: [{
          type: 'text',
          text: `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        }],
      };
    } catch (error: any) {
      // Check if it's a package not found error
      if (error.message.includes('Could not find a version') || 
          error.message.includes('No matching distribution found')) {
        throw new Error(`Package not found: ${error.message}`);
      }
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  /**
   * Run npm commands
   */
  async npmCommand(args: NpmCommandArgs): Promise<ToolResult> {
    const { command, args: cmdArgs = [], cwd } = args;
    ValidationUtils.validateRequired({ command }, ['command']);
    
    const workingDir = cwd ? this.workspaceService.resolvePath(cwd) : this.getCurrentWorkspace();
    const fullCommand = `npm ${command} ${cmdArgs.join(' ')}`;
    
    try {
      const { stdout, stderr } = await execAsync(fullCommand, { 
        cwd: workingDir,
        timeout: 60000 // Longer timeout for npm operations
      });
      
      return {
        content: [{
          type: 'text',
          text: `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Command failed: ${fullCommand}\n${error.message}`);
    }
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
        command = this._buildPythonTestCommand(framework, testPath, pattern);
        break;
        
      case 'javascript':
        command = this._buildJavaScriptTestCommand(framework, testPath, pattern);
        break;
        
      default:
        throw new Error(`Unsupported test language: ${language}`);
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: workingDir,
        timeout: 60000 // Longer timeout for test runs
      });
      
      return {
        content: [{
          type: 'text',
          text: `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  /**
   * Build Python test command
   */
  private _buildPythonTestCommand(framework?: string, testPath?: string, pattern?: string): string {
    const testFramework = framework || 'pytest';
    
    switch (testFramework) {
      case 'pytest':
        let command = 'python3 -m pytest';
        if (testPath) command += ` ${this.quotePath(testPath)}`;
        else command += ' .';
        if (pattern) command += ` -k "${pattern}"`;
        command += ' -v';
        return command;
      
      case 'unittest':
        let unittestCmd = 'python3 -m unittest';
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
