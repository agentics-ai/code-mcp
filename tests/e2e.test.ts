/**
 * End-to-End Tests for VS Code Agent MCP Server
 * 
 * This file contains all E2E tests that validate the complete MCP server functionality
 * by simulating real MCP protocol interactions and testing full system integration.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP Client for testing - simulates a real MCP client
 */
class MCPTestClient {
  private process: ChildProcessWithoutNullStreams | null = null;
  private messageId = 1;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
  private buffer = '';

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Start the MCP server process
      this.process = spawn('node', ['dist/src/index.js'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
        reject(new Error('Failed to create process stdio streams'));
        return;
      }

      // Handle server output
      this.process.stdout.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        this.processMessages();
      });

      // Handle server errors
      this.process.stderr.on('data', (data: Buffer) => {
        const message = data.toString();
        if (message.includes('VS Code Agent MCP Server running on stdio')) {
          resolve();
        }
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      this.process.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      // Set a timeout for startup
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);
    });
  }

  private processMessages(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          if (message.id && this.pendingRequests.has(message.id)) {
            const request = this.pendingRequests.get(message.id)!;
            clearTimeout(request.timeout);
            this.pendingRequests.delete(message.id);
            
            if (message.error) {
              request.reject(new Error(message.error.message || 'Unknown error'));
            } else {
              request.resolve(message.result);
            }
          }
        } catch (error) {
          // Ignore parsing errors for non-JSON output
        }
      }
    }
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Process not started');
    }

    const id = this.messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for method: ${method}`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      
      this.process!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  async initialize(): Promise<any> {
    return this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
  }

  async listTools(): Promise<any> {
    return this.sendRequest('tools/list');
  }

  async callTool(name: string, args?: any): Promise<any> {
    return this.sendRequest('tools/call', {
      name,
      arguments: args || {}
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      // Clear all pending requests
      for (const [id, request] of this.pendingRequests) {
        clearTimeout(request.timeout);
        request.reject(new Error('Client stopped'));
      }
      this.pendingRequests.clear();

      // Kill the process
      this.process.kill('SIGTERM');
      
      return new Promise((resolve) => {
        this.process!.on('exit', () => {
          resolve();
        });
        
        // Force kill after timeout
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
    }
  }
}

describe('VS Code Agent MCP Server - End-to-End Tests', () => {
  let client: MCPTestClient;
  let testWorkspace: string;

  beforeEach(async () => {
    // Create a temporary test workspace
    testWorkspace = path.join(os.tmpdir(), `mcp-test-${Date.now()}`);
    await fs.mkdir(testWorkspace, { recursive: true });

    // Start the MCP client
    client = new MCPTestClient();
  });

  afterEach(async () => {
    // Stop the client
    if (client) {
      await client.stop();
    }

    // Clean up test workspace
    if (testWorkspace) {
      try {
        await fs.rm(testWorkspace, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to clean up test workspace:', error);
      }
    }
  });

  describe('Basic Server Operations', () => {
    test('should be able to start and stop the MCP server', async () => {
      const serverProcess = spawn('node', ['dist/src/index.js'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverStarted = false;

      // Wait for server to start
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 10000);

        serverProcess.stderr?.on('data', (data: Buffer) => {
          const message = data.toString();
          if (message.includes('VS Code Agent MCP Server running on stdio')) {
            serverStarted = true;
            clearTimeout(timeout);
            resolve();
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      expect(serverStarted).toBe(true);

      // Stop the server
      serverProcess.kill('SIGTERM');

      // Wait for clean shutdown
      await new Promise<void>((resolve) => {
        serverProcess.on('exit', () => {
          resolve();
        });

        setTimeout(() => {
          if (!serverProcess.killed) {
            serverProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
    });
  });

  describe('MCP Protocol Compliance', () => {
    test('should start server and handle basic communication', async () => {
      await client.start();
      
      // Server should be running after start
      expect(client).toBeDefined();
    });

    test('should list all available tools', async () => {
      await client.start();
      
      const toolsResult = await client.listTools();
      
      expect(toolsResult).toHaveProperty('tools');
      expect(Array.isArray(toolsResult.tools)).toBe(true);
      expect(toolsResult.tools.length).toBeGreaterThan(0);

      // Check for expected core tools
      const toolNames = toolsResult.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('get_workspace');
      expect(toolNames).toContain('read_file');
      expect(toolNames).toContain('write_file');
      expect(toolNames).toContain('run_command');
    });

    test('should handle invalid tool calls with proper error responses', async () => {
      await client.start();
      
      await expect(client.callTool('invalid_tool')).rejects.toThrow();
    });
  });

  describe('Workspace Management Integration', () => {
    test('should manage workspace operations end-to-end', async () => {
      await client.start();

      // Set workspace
      const setResult = await client.callTool('set_workspace', { path: testWorkspace });
      expect(setResult.content[0].text).toContain('Workspace set to');

      // Get current workspace
      const getResult = await client.callTool('get_workspace');
      expect(getResult.content[0].text).toContain(testWorkspace);
    });
  });

  describe('File Operations Integration', () => {
    test('should perform complete file lifecycle operations', async () => {
      await client.start();

      // Set workspace
      await client.callTool('set_workspace', { path: testWorkspace });

      // Create a test file
      const testContent = 'Hello, MCP Server!\nThis is a test file.';
      const testFile = path.join(testWorkspace, 'test.txt');
      
      const writeResult = await client.callTool('write_file', {
        path: testFile,
        content: testContent
      });
      expect(writeResult.content[0].text).toContain('successfully');

      // Read the file back
      const readResult = await client.callTool('read_file', { path: testFile });
      expect(readResult.content[0].text).toContain(testContent);

      // List directory to confirm file exists
      const listResult = await client.callTool('list_directory', { path: testWorkspace });
      expect(listResult.content[0].text).toContain('test.txt');

      // Delete the file
      const deleteResult = await client.callTool('delete_file', { path: testFile });
      expect(deleteResult.content[0].text).toContain('deleted');
    });
  });

  describe('Code Execution Integration', () => {
    test('should execute system commands end-to-end', async () => {
      await client.start();

      await client.callTool('set_workspace', { path: testWorkspace });

      const result = await client.callTool('run_command', { 
        command: 'echo "System command test"' 
      });
      expect(result.content[0].text).toContain('System command test');
    });

    test('should execute Python code end-to-end', async () => {
      await client.start();

      await client.callTool('set_workspace', { path: testWorkspace });

      const pythonCode = `print("Hello from Python!")
result = 2 + 2
print(f"2 + 2 = {result}")`;

      const result = await client.callTool('run_python', { code: pythonCode });
      expect(result.content[0].text).toContain('Hello from Python!');
      expect(result.content[0].text).toContain('2 + 2 = 4');
    });

    test('should execute JavaScript code end-to-end', async () => {
      await client.start();

      await client.callTool('set_workspace', { path: testWorkspace });

      const jsCode = `console.log("Hello from JavaScript!");
const result = 3 * 4;
console.log("3 * 4 = " + result);`;

      const result = await client.callTool('run_javascript', { code: jsCode });
      expect(result.content[0].text).toContain('Hello from JavaScript!');
      expect(result.content[0].text).toContain('3 * 4 = 12');
    });
  });

  describe('Git Operations Integration', () => {
    test('should perform basic Git operations', async () => {
      await client.start();

      await client.callTool('set_workspace', { path: testWorkspace });

      // Initialize a Git repository
      await client.callTool('run_command', { command: 'git init' });
      await client.callTool('run_command', { 
        command: 'git config user.email "test@example.com"' 
      });
      await client.callTool('run_command', { 
        command: 'git config user.name "Test User"' 
      });

      // Create a test file
      await client.callTool('write_file', {
        path: path.join(testWorkspace, 'README.md'),
        content: '# Test Repository\n\nThis is a test.'
      });

      // Check Git status
      const statusResult = await client.callTool('git_status');
      expect(statusResult.content[0].text).toContain('README.md');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle file operation errors gracefully', async () => {
      await client.start();

      await client.callTool('set_workspace', { path: testWorkspace });

      // Try to read a non-existent file
      const readResult = await client.callTool('read_file', { 
        path: '/nonexistent/file.txt' 
      });
      expect(readResult.isError).toBe(true);
    });

    test('should handle command execution errors gracefully', async () => {
      await client.start();

      await client.callTool('set_workspace', { path: testWorkspace });

      // Try to run an invalid command - this should throw an MCP error
      await expect(client.callTool('run_command', { 
        command: 'invalidcommandthatdoesnotexist' 
      })).rejects.toThrow();
    });
  });

  describe('Performance Testing', () => {
    test('should handle multiple rapid file operations', async () => {
      await client.start();

      await client.callTool('set_workspace', { path: testWorkspace });

      // Execute multiple file operations rapidly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          client.callTool('write_file', {
            path: path.join(testWorkspace, `file${i}.txt`),
            content: `Content for file ${i}`
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.content[0].text).toContain('successfully');
      });
    });
  });
});
