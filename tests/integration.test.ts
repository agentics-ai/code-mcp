/**
 * Integration Tests for VS Code Agent MCP Server
 * 
 * Comprehensive tests that validate the MCP server's communication with Claude Desktop
 * and test all major functionality including command execution, file operations, and git operations.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: any;
}

interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
    _meta?: any;
  }>;
}

/**
 * MCP Test Client - simulates Claude Desktop's communication pattern
 */
class MCPIntegrationClient {
  private process: ChildProcessWithoutNullStreams | null = null;
  private messageId = 1;
  private responseBuffer = '';
  private responses: MCPResponse[] = [];
  private isReady = false;

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '..', 'dist', 'src', 'index.js');
      
      this.process = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, NODE_ENV: 'test' }
      });

      if (!this.process.stdout || !this.process.stderr || !this.process.stdin) {
        reject(new Error('Failed to create process stdio streams'));
        return;
      }

      this.process.stdout.on('data', (data) => {
        this.responseBuffer += data.toString();
        this.processResponses();
      });

      this.process.stderr.on('data', (data) => {
        console.error('MCP Server Error:', data.toString());
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      // Give the server time to start
      setTimeout(() => {
        this.isReady = true;
        resolve();
      }, 1000);
    });
  }

  private processResponses(): void {
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line) as MCPResponse;
          this.responses.push(response);
        } catch (e) {
          // Ignore non-JSON output
        }
      }
    }
  }

  async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    if (!this.process?.stdin || !this.isReady) {
      throw new Error('MCP client not ready');
    }

    const request: MCPRequest = {
      jsonrpc: "2.0",
      id: this.messageId++,
      method,
      params: params || {}
    };

    this.process.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, 15000);

      const checkForResponse = () => {
        const response = this.responses.find(r => r.id === request.id);
        if (response) {
          clearTimeout(timeout);
          resolve(response);
        } else {
          setTimeout(checkForResponse, 100);
        }
      };

      checkForResponse();
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.isReady = false;
  }

  getResponses(): MCPResponse[] {
    return [...this.responses];
  }

  clearResponses(): void {
    this.responses = [];
  }
}

describe('MCP Server Integration Tests', () => {
  let client: MCPIntegrationClient;
  const testWorkspacePath = path.join(__dirname, '..', 'test-workspace');

  beforeAll(async () => {
    // Ensure the dist directory exists
    const distPath = path.join(__dirname, '..', 'dist');
    try {
      await fs.access(distPath);
    } catch {
      throw new Error('Please run "npm run build" before running integration tests');
    }

    // Create test workspace if it doesn't exist
    try {
      await fs.mkdir(testWorkspacePath, { recursive: true });
    } catch {
      // Directory might already exist
    }
  });

  beforeEach(async () => {
    client = new MCPIntegrationClient();
    await client.start();
  });

  afterEach(async () => {
    await client.stop();
  });

  describe('MCP Protocol Compliance', () => {
    test('should initialize correctly', async () => {
      const response = await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.protocolVersion).toBe("2024-11-05");
      expect(response.result.serverInfo).toBeDefined();
      expect(response.result.serverInfo.name).toBe("code-mcp");
    });

    test('should list all available tools', async () => {
      // Initialize first
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const response = await client.sendRequest('tools/list');

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeDefined();
      expect(Array.isArray(response.result.tools)).toBe(true);
      expect(response.result.tools.length).toBeGreaterThan(20);

      // Verify essential tools are present
      const toolNames = response.result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('run_command');
      expect(toolNames).toContain('run_python');
      expect(toolNames).toContain('run_javascript');
      expect(toolNames).toContain('read_file');
      expect(toolNames).toContain('write_file');
      expect(toolNames).toContain('get_workspace');
      expect(toolNames).toContain('git_status');
    });
  });

  describe('Workspace Management', () => {
    test('should get current workspace', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const response = await client.sendRequest('tools/call', {
        name: 'get_workspace',
        arguments: {}
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.content).toBeDefined();
      expect(Array.isArray(response.result.content)).toBe(true);
      expect(response.result.content[0].type).toBe('text');
      expect(response.result.content[0].text).toContain('Current workspace:');
    });

    test('should set workspace', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const response = await client.sendRequest('tools/call', {
        name: 'set_workspace',
        arguments: { path: testWorkspacePath }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('Workspace set to:');
    });
  });

  describe('File Operations', () => {
    test('should list directory contents', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const projectRoot = path.join(__dirname, '..');
      const response = await client.sendRequest('tools/call', {
        name: 'list_directory',
        arguments: { path: projectRoot, recursive: false }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('package.json');
    });

    test('should read and write files', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const testFilePath = path.join(testWorkspacePath, 'integration-test.txt');
      const testContent = 'Integration test content\nLine 2\nTimestamp: ' + new Date().toISOString();

      // Write file
      const writeResponse = await client.sendRequest('tools/call', {
        name: 'write_file',
        arguments: { path: testFilePath, content: testContent }
      });

      expect(writeResponse.error).toBeUndefined();
      expect(writeResponse.result.content[0].text).toContain('File successfully written');

      // Read file
      const readResponse = await client.sendRequest('tools/call', {
        name: 'read_file',
        arguments: { path: testFilePath }
      });

      expect(readResponse.error).toBeUndefined();
      expect(readResponse.result.content[0].text).toBe(testContent);

      // Clean up
      try {
        await fs.unlink(testFilePath);
      } catch {
        // File might not exist
      }
    });
  });

  describe('Code Execution', () => {
    test('should execute shell commands', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const response = await client.sendRequest('tools/call', {
        name: 'run_command',
        arguments: { 
          command: 'echo "Integration test command execution"',
          cwd: path.join(__dirname, '..')
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('Integration test command execution');
    });

    test('should execute JavaScript code', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const jsCode = `
        console.log('JavaScript execution test');
        console.log('Current time:', new Date().toISOString());
        console.log('Node version:', process.version);
      `;

      const response = await client.sendRequest('tools/call', {
        name: 'run_javascript',
        arguments: { code: jsCode }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('JavaScript execution test');
      expect(response.result.content[0].text).toContain('Node version:');
    });

    test('should execute Python code', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const pythonCode = `
import sys
import platform
print('Python execution test')
print(f'Python version: {sys.version}')
print(f'Platform: {platform.system()}')
      `;

      const response = await client.sendRequest('tools/call', {
        name: 'run_python',
        arguments: { code: pythonCode }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('Python execution test');
      expect(response.result.content[0].text).toContain('Python version:');
    });
  });

  describe('Git Operations', () => {
    test('should get git status', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const response = await client.sendRequest('tools/call', {
        name: 'git_status',
        arguments: { cwd: path.join(__dirname, '..') }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      // Git status should return some information (even if repo is clean)
      expect(response.result.content[0].text).toBeDefined();
    });

    test('should get git log', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const response = await client.sendRequest('tools/call', {
        name: 'git_log',
        arguments: { 
          cwd: path.join(__dirname, '..'),
          limit: 5,
          oneline: true
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toBeDefined();
    });
  });

  describe('NPM Operations', () => {
    test('should run npm commands', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      const response = await client.sendRequest('tools/call', {
        name: 'npm_command',
        arguments: { 
          command: 'list',
          args: ['--depth=0'],
          cwd: path.join(__dirname, '..')
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      // Should show project dependencies
      expect(response.result.content[0].text).toContain('code-mcp@');
    });
  });

  describe('Complex Integration Scenarios', () => {
    test('should handle multiple sequential operations', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      // 1. Set workspace
      const workspaceResponse = await client.sendRequest('tools/call', {
        name: 'set_workspace',
        arguments: { path: testWorkspacePath }
      });
      expect(workspaceResponse.error).toBeUndefined();

      // 2. Create a test file
      const testFile = path.join(testWorkspacePath, 'multi-test.js');
      const writeResponse = await client.sendRequest('tools/call', {
        name: 'write_file',
        arguments: { 
          path: testFile,
          content: 'console.log("Multi-operation test");'
        }
      });
      expect(writeResponse.error).toBeUndefined();

      // 3. Execute the file
      const execResponse = await client.sendRequest('tools/call', {
        name: 'run_javascript',
        arguments: { script_path: testFile }
      });
      expect(execResponse.error).toBeUndefined();
      expect(execResponse.result.content[0].text).toContain('Multi-operation test');

      // 4. Clean up
      try {
        await fs.unlink(testFile);
      } catch {
        // File might not exist
      }
    });

    test('should handle error scenarios gracefully', async () => {
      await client.sendRequest('initialize', {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "Claude Desktop", version: "1.0.0" }
      });

      // Try to read a non-existent file
      const response = await client.sendRequest('tools/call', {
        name: 'read_file',
        arguments: { path: '/non/existent/file.txt' }
      });

      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('ENOENT');
    });
  });
});
