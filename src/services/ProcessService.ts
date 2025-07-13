/**
 * Process management service for development servers and background tasks
 * Optimized version that addresses hanging/timeout issues
 */
import { spawn, ChildProcess } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ProcessUtils, ValidationUtils, ProcessInfo } from '../utils.js';
import { DEFAULT_LIMITS } from '../constants.js';
import { ToolResult } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

const execAsync = promisify(exec);

export interface StartServerArgs {
  command: string;
  port?: number;
  name: string;
  cwd?: string;
}

export interface StopServerArgs {
  name: string;
}

export interface InstallDependenciesArgs {
  path?: string;
}

export class ProcessService {
  private workspaceService: WorkspaceService;
  private activeProcesses: Map<string, ProcessInfo>;
  private startupDelay: number;
  private processTimeout: number;

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
    this.activeProcesses = new Map();
    // Use shorter delays in test environment to prevent hanging
    this.startupDelay = process.env.NODE_ENV === 'test' ? 50 : DEFAULT_LIMITS.serverStartupDelay;
    this.processTimeout = 30000; // 30 second timeout for process operations
  }

  // Getter methods for testing private properties
  public get activeProcessesMap(): Map<string, ProcessInfo> {
    return this.activeProcesses;
  }

  public get workspaceServiceInstance(): WorkspaceService {
    return this.workspaceService;
  }

  public get startupDelayMs(): number {
    return this.startupDelay;
  }

  public get processTimeoutMs(): number {
    return this.processTimeout;
  }

  /**
   * Run operation with timeout
   */
  public async _runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Start a development server with improved error handling and timeouts
   */
  async startServer(args: StartServerArgs): Promise<ToolResult> {
    const { command, port, name, cwd } = args;
    ValidationUtils.validateRequired({ command, name }, ['command', 'name']);
    
    return new Promise((resolve, reject) => {
      const workDir = cwd ? this.workspaceService.resolvePath(cwd) : this.workspaceService.getCurrentWorkspace();
      
      try {
        const proc = spawn(command, [], {
          shell: true,
          cwd: workDir,
          env: { ...process.env, PORT: port?.toString() },
          detached: false,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const processInfo = ProcessUtils.createProcessInfo(proc, command, port, workDir);
        this.activeProcesses.set(name, processInfo);
        
        let output = '';
        let hasResolved = false;
        
        // Set up timeout for process startup
        const startupTimeout = setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              content: [{
                type: 'text',
                text: `Server "${name}" started\nCommand: ${command}\nPort: ${port || 'default'}\nWorkspace: ${workDir}\nPID: ${proc.pid}\n\nInitial output:\n${output}`,
              }],
            });
          }
        }, this.startupDelay);
        
        proc.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        proc.stderr?.on('data', (data) => {
          output += data.toString();
        });
        
        proc.on('error', (error) => {
          clearTimeout(startupTimeout);
          this.activeProcesses.delete(name);
          if (!hasResolved) {
            hasResolved = true;
            reject(new Error(`Failed to start server "${name}": ${error.message}`));
          }
        });
        
        proc.on('exit', (code) => {
          clearTimeout(startupTimeout);
          this.activeProcesses.delete(name);
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              content: [{
                type: 'text',
                text: `Server "${name}" exited with code ${code}\nOutput:\n${output}`,
              }],
            });
          }
        });
        
      } catch (error) {
        reject(new Error(`Failed to spawn process: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Stop a running server
   */
  async stopServer(args: StopServerArgs): Promise<ToolResult> {
    const { name } = args;
    ValidationUtils.validateRequired({ name }, ['name']);
    
    const processInfo = this.activeProcesses.get(name);
    if (!processInfo) {
      return {
        content: [{
          type: 'text',
          text: `No process found with name: ${name}`,
        }],
      };
    }
    
    try {
      processInfo.process.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force kill if still running
      if (!processInfo.process.killed) {
        processInfo.process.kill('SIGKILL');
      }
      
      this.activeProcesses.delete(name);
      
      return {
        content: [{
          type: 'text',
          text: `Server "${name}" stopped successfully`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error stopping server "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }

  /**
   * List all running processes
   */
  async listProcesses(): Promise<ToolResult> {
    const processText = ProcessUtils.formatProcessList(this.activeProcesses);
    
    return {
      content: [{
        type: 'text',
        text: processText,
      }],
    };
  }

  /**
   * Install dependencies for the current project
   */
  async installDependencies(args: InstallDependenciesArgs = {}): Promise<ToolResult> {
    const { path: projectPath } = args;
    const workDir = projectPath ? this.workspaceService.resolvePath(projectPath) : this.workspaceService.getCurrentWorkspace();
    
    try {
      // Check for package.json (Node.js project)
      const packageJsonPath = this.workspaceService.resolvePath('package.json');
      try {
        await import('fs/promises').then(fs => fs.access(packageJsonPath));
        const { stdout, stderr } = await execAsync('npm install', { cwd: workDir });
        return {
          content: [{
            type: 'text',
            text: `Dependencies installed successfully:\n${stdout}${stderr ? `\nWarnings:\n${stderr}` : ''}`,
          }],
        };
      } catch (error) {
        // Not a Node.js project, continue checking
      }
      
      // Check for requirements.txt (Python project)
      const requirementsPath = this.workspaceService.resolvePath('requirements.txt');
      try {
        await import('fs/promises').then(fs => fs.access(requirementsPath));
        const { stdout, stderr } = await execAsync('pip install -r requirements.txt', { cwd: workDir });
        return {
          content: [{
            type: 'text',
            text: `Python dependencies installed successfully:\n${stdout}${stderr ? `\nWarnings:\n${stderr}` : ''}`,
          }],
        };
      } catch (error) {
        // Not a Python project, continue checking
      }
      
      // Check for other project types
      return {
        content: [{
          type: 'text',
          text: 'No recognized dependency files found (package.json, requirements.txt, etc.)',
        }],
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error installing dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }

  /**
   * Stop all running processes
   */
  async stopAllProcesses(): Promise<void> {
    const promises = Array.from(this.activeProcesses.keys()).map(name => 
      this.stopServer({ name }).catch(() => {
        // Ignore errors during cleanup
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Check if a process is still running
   */
  isProcessRunning(name: string): boolean {
    const processInfo = this.activeProcesses.get(name);
    return processInfo ? !processInfo.process.killed : false;
  }

  /**
   * Get process information
   */
  getProcessInfo(name: string): ProcessInfo | undefined {
    return this.activeProcesses.get(name);
  }

  /**
   * Kill a process by port (emergency stop)
   */
  async killProcessByPort(port: number): Promise<ToolResult> {
    try {
      // Try to find and kill process using the port
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No process found running on port ${port}`,
          }],
        };
      }
      
      // Kill all processes on that port
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
        } catch (error) {
          // Process might already be dead
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: `Killed ${pids.length} process(es) running on port ${port}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error killing process on port ${port}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }

  /**
   * Kill all processes (alias for stopAllProcesses for backward compatibility)
   */
  public killAllProcesses(): string[] {
    const processNames = Array.from(this.activeProcesses.keys());
    
    // Kill all processes synchronously for tests
    for (const [name, processInfo] of this.activeProcesses) {
      try {
        processInfo.process.kill('SIGKILL');
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    this.activeProcesses.clear();
    return processNames;
  }

  /**
   * Get process details
   */
  public async getProcessDetails(args: { name: string }): Promise<ToolResult> {
    const { name } = args;
    ValidationUtils.validateRequired({ name }, ['name']);

    const processInfo = this.activeProcesses.get(name);
    if (!processInfo) {
      return {
        content: [{
          type: 'text',
          text: `No process found with name: ${name}`,
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Process Details for "${name}":
Command: ${processInfo.command}
PID: ${processInfo.process.pid}
Port: ${processInfo.port || 'N/A'}
Working Directory: ${processInfo.workspace}
Started: ${processInfo.startTime}
Status: ${processInfo.process.killed ? 'Stopped' : 'Running'}`,
      }],
    };
  }

  /**
   * Health check for all running processes
   */
  public async healthCheck(): Promise<ToolResult> {
    const processCount = this.activeProcesses.size;
    const runningProcesses = Array.from(this.activeProcesses.entries())
      .filter(([_, info]) => !info.process.killed);

    return {
      content: [{
        type: 'text',
        text: `ProcessService Health Check:
Total processes: ${processCount}
Running processes: ${runningProcesses.length}
Stopped processes: ${processCount - runningProcesses.length}
Service status: Healthy`,
      }],
    };
  }
}
