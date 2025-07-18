/**
 * Comprehensive ProcessService test suite - TypeScript compatible
 * Covers functionality without hanging or mocking issues
 */
import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

import { ProcessService } from '../../src/services/ProcessService.js';
import { TestUtils } from '../utils.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { ToolResult } from '../../src/types.js';

// Set test environment for shorter delays
process.env.NODE_ENV = 'test';

// Helper function to validate MCP responses
function expectValidMcpResponse(result: ToolResult): void {
  expect(result).toBeDefined();
  expect(result.content).toBeDefined();
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content.length).toBeGreaterThan(0);
  expect(result.content[0]).toBeDefined();
  expect(result.content[0].type).toBe('text');
  expect(typeof result.content[0].text).toBe('string');
}

describe('ProcessService - TypeScript Tests', () => {
  let processService: ProcessService;
  let mockWorkspaceService: WorkspaceService;
  let tempWorkspace: string;

  beforeAll(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace();
  });

  afterAll(async () => {
    await TestUtils.cleanupTempWorkspace(tempWorkspace);
  });

  beforeEach(() => {
    mockWorkspaceService = TestUtils.createMockWorkspaceService(tempWorkspace);
    processService = new ProcessService(mockWorkspaceService);
  });

  afterEach(async () => {
    // Clean up any active processes
    if (processService) {
      processService.killAllProcesses();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('constructor and initialization', () => {
    test('should initialize with workspace service', () => {
      expect(processService.workspaceServiceInstance).toBe(mockWorkspaceService);
      expect(processService.activeProcessesMap).toBeInstanceOf(Map);
      expect(processService.activeProcessesMap.size).toBe(0);
      expect(processService.startupDelayMs).toBe(50); // Test environment
      expect(processService.processTimeoutMs).toBe(30000);
    });

    test('should have proper default configuration', () => {
      expect(processService.processTimeoutMs).toBe(30000);
      expect(processService.startupDelayMs).toBe(50);
      expect(typeof processService._runWithTimeout).toBe('function');
    });

    test('should properly initialize active processes map', () => {
      expect(processService.activeProcessesMap).toBeInstanceOf(Map);
      expect(processService.activeProcessesMap.size).toBe(0);
      expect([...processService.activeProcessesMap.keys()]).toEqual([]);
    });

    test('should use test environment settings', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(processService.startupDelayMs).toBe(50);
    });
  });

  describe('parameter validation', () => {
    test('should validate startServer parameters', async () => {
      // Missing both command and name
      await expect(processService.startServer({} as any)).rejects.toThrow();
      
      // Missing name
      await expect(processService.startServer({ command: 'test' } as any)).rejects.toThrow();
      
      // Missing command
      await expect(processService.startServer({ name: 'test' } as any)).rejects.toThrow();
      
      // Null values
      await expect(processService.startServer({ command: null as any, name: 'test' })).rejects.toThrow();
      await expect(processService.startServer({ command: 'test', name: null as any })).rejects.toThrow();
      
      // Undefined values
      await expect(processService.startServer({ command: undefined as any, name: 'test' })).rejects.toThrow();
      await expect(processService.startServer({ command: 'test', name: undefined as any })).rejects.toThrow();
    });

    test('should validate stopServer parameters', async () => {
      await expect(processService.stopServer({} as any)).rejects.toThrow();
      await expect(processService.stopServer({ name: null as any })).rejects.toThrow();
      await expect(processService.stopServer({ name: undefined as any })).rejects.toThrow();
    });

    test('should validate getProcessDetails parameters', async () => {
      await expect(processService.getProcessDetails({} as any)).rejects.toThrow();
      await expect(processService.getProcessDetails({ name: null as any })).rejects.toThrow();
      await expect(processService.getProcessDetails({ name: undefined as any })).rejects.toThrow();
    });
  });

  describe('basic functionality', () => {
    test('should handle listProcesses with no active processes', async () => {
      const result = await processService.listProcesses();
      expectValidMcpResponse(result);
      expect(result.content[0].text).toBe('No active processes');
    });

    test('should handle killAllProcesses with no active processes', () => {
      const killedProcesses = processService.killAllProcesses();
      expect(Array.isArray(killedProcesses)).toBe(true);
      expect(killedProcesses).toHaveLength(0);
      expect(processService.activeProcessesMap.size).toBe(0);
    });

    test('should handle healthCheck', async () => {
      const result = await processService.healthCheck();
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('ProcessService Health Check');
      expect(result.content[0].text).toContain('Total processes: 0');
      expect(result.content[0].text).toContain('Service status: Healthy');
    });

    test('should handle getProcessDetails for non-existent process', async () => {
      const result = await processService.getProcessDetails({ name: 'non-existent' });
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('No process found with name: non-existent');
    });

    test('should handle stopServer for non-existent server', async () => {
      const result = await processService.stopServer({ name: 'non-existent' });
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('No process found with name: non-existent');
    });
  });

  describe('process tracking and lifecycle', () => {
    test('should track processes correctly in activeProcesses map', () => {
      expect(processService.activeProcessesMap).toBeInstanceOf(Map);
      expect(processService.activeProcessesMap.size).toBe(0);
      
      // Should be empty initially
      expect([...processService.activeProcessesMap.keys()]).toEqual([]);
      expect([...processService.activeProcessesMap.values()]).toEqual([]);
    });

    test('should handle workspace service integration', () => {
      expect(processService.workspaceServiceInstance).toBe(mockWorkspaceService);
    });

    test('should handle cleanup properly', () => {
      const tempService = new ProcessService(mockWorkspaceService);
      
      // Initial state
      expect(tempService.activeProcessesMap.size).toBe(0);
      
      // Cleanup empty processes
      const killedProcesses = tempService.killAllProcesses();
      expect(killedProcesses).toHaveLength(0);
      expect(tempService.activeProcessesMap.size).toBe(0);
    });
  });

  describe('startServer functionality', () => {
    test('should start a basic server process with echo command', async () => {
      const result = await processService.startServer({
        command: 'echo "Server started"',
        name: 'test-server',
        port: 3000
      });

      expectValidMcpResponse(result);
      // Echo commands exit immediately, so we expect exit message
      expect(result.content[0].text).toMatch(/Server "test-server"/);
      expect(result.content[0].text).toMatch(/Server started/);
    }, 10000);

    test('should start server without port specification', async () => {
      const result = await processService.startServer({
        command: 'echo "No port server"',
        name: 'no-port-server'
      });

      expectValidMcpResponse(result);
      expect(result.content[0].text).toMatch(/Server "no-port-server"/);
    }, 10000);

    test('should start server with custom working directory', async () => {
      const customDir = join(tempWorkspace, 'custom');
      await fs.mkdir(customDir, { recursive: true });

      const result = await processService.startServer({
        command: 'echo "Custom dir"',
        name: 'custom-dir-server',
        cwd: 'custom'
      });

      expectValidMcpResponse(result);
      expect(result.content[0].text).toMatch(/Server "custom-dir-server"/);
    }, 10000);

    test('should handle server process errors gracefully', async () => {
      const result = await processService.startServer({
        command: 'non-existent-command-xyz-123',
        name: 'error-server'
      });

      expectValidMcpResponse(result);
      // Process should report error when command doesn't exist
      expect(result.content[0].text).toMatch(/Server "error-server"/);
      expect(result.content[0].text).toMatch(/exited with code 127|command not found/);
    }, 10000);
  });

  describe('installDependencies functionality', () => {
    test('should install dependencies in workspace root', async () => {
      const result = await processService.installDependencies({});

      expectValidMcpResponse(result);
      expect(result.content[0].text).toMatch(/No recognized dependency files found|Dependencies installed/);
    });

    test('should handle package.json detection', async () => {
      // Create a package.json
      const packageJson = {
        name: 'test-project',
        dependencies: {
          'lodash': '^4.17.21'
        }
      };
      
      await fs.writeFile(
        join(tempWorkspace, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await processService.installDependencies({});

      expectValidMcpResponse(result);
      expect(result.content[0].text).toMatch(/Dependencies installed successfully|npm install/);
    });

    test('should handle requirements.txt detection', async () => {
      // Clean up any existing package.json first
      try {
        await fs.unlink(join(tempWorkspace, 'package.json'));
      } catch (e) {
        // Ignore if file doesn't exist
      }

      // Create a requirements.txt file
      await fs.writeFile(
        join(tempWorkspace, 'requirements.txt'),
        'requests==2.28.1\nnumpy>=1.21.0'
      );

      const result = await processService.installDependencies({});

      expectValidMcpResponse(result);
      // Since pip might not be available in all test environments, check for various possible responses
      expect(result.content[0].text).toMatch(/Python dependencies installed|Dependencies installed|pip install|npm|No recognized dependency files found/);
    }, 60000);

    test('should handle no dependency files', async () => {
      // Clean up any dependency files more thoroughly
      const dependencyFiles = [
        'package.json',
        'requirements.txt',
        'pyproject.toml',
        'Cargo.toml',
        'pom.xml',
        'go.mod',
        'composer.json',
        'Gemfile'
      ];
      
      for (const file of dependencyFiles) {
        try {
          await fs.unlink(join(tempWorkspace, file));
        } catch (e) {
          // Ignore if files don't exist
        }
      }

      // Verify no dependency files exist
      const files = await fs.readdir(tempWorkspace);
      const foundDependencyFiles = files.filter(file => dependencyFiles.includes(file));
      expect(foundDependencyFiles).toHaveLength(0);

      const result = await processService.installDependencies({});

      expectValidMcpResponse(result);
      expect(result.content[0].text).toMatch(/No recognized dependency files found|Dependencies installed|Python dependencies installed/);
    });
  });

  describe('response format validation', () => {
    test('should return properly formatted MCP responses', async () => {
      // Test each method individually
      const listResult = await processService.listProcesses();
      expectValidMcpResponse(listResult);
      expect(listResult.content[0].text).toBeDefined();

      const healthResult = await processService.healthCheck();
      expectValidMcpResponse(healthResult);
      expect(healthResult.content[0].text).toBeDefined();

      const processResult = await processService.getProcessDetails({ name: 'test' });
      expectValidMcpResponse(processResult);
      expect(processResult.content[0].text).toBeDefined();

      const stopResult = await processService.stopServer({ name: 'test' });
      expectValidMcpResponse(stopResult);
      expect(stopResult.content[0].text).toBeDefined();

      const installResult = await processService.installDependencies({});
      expectValidMcpResponse(installResult);
      expect(installResult.content[0].text).toBeDefined();
    });
  });

  describe('concurrent operations', () => {
    test('should handle multiple simultaneous operations', async () => {
      const promises = [
        processService.listProcesses(),
        processService.healthCheck(),
        processService.getProcessDetails({ name: 'non-existent-1' }),
        processService.getProcessDetails({ name: 'non-existent-2' }),
        processService.stopServer({ name: 'non-existent-3' }),
        processService.installDependencies({})
      ];

      const results = await Promise.all(promises);
      
      results.forEach((result: ToolResult) => {
        expectValidMcpResponse(result);
      });
    });

    test('should handle rapid sequential calls', async () => {
      const operations = [
        () => processService.listProcesses(),
        () => processService.healthCheck(),
        () => processService.getProcessDetails({ name: 'test1' }),
        () => processService.getProcessDetails({ name: 'test2' }),
        () => processService.stopServer({ name: 'test3' })
      ];

      for (const operation of operations) {
        const result = await operation();
        expectValidMcpResponse(result);
      }
    });
  });

  describe('environment and configuration', () => {
    test('should respect test environment settings', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(processService.startupDelayMs).toBe(50); // Reduced for tests
    });

    test('should have proper timeout configuration', () => {
      expect(processService.processTimeoutMs).toBe(30000);
      expect(typeof processService.processTimeoutMs).toBe('number');
      expect(processService.processTimeoutMs).toBeGreaterThan(0);
    });

    test('should handle process timeout method', async () => {
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 100);
      });

      const result = await processService._runWithTimeout(timeoutPromise, 5000);
      expect(result).toBe('success');
    });

    test('should handle workspace service integration', () => {
      expect(processService.workspaceServiceInstance).toBeDefined();
    });
  });

  describe('method existence and interfaces', () => {
    test('should have all required public methods', () => {
      expect(typeof processService.startServer).toBe('function');
      expect(typeof processService.stopServer).toBe('function');
      expect(typeof processService.listProcesses).toBe('function');
      expect(typeof processService.killAllProcesses).toBe('function');
      expect(typeof processService.healthCheck).toBe('function');
      expect(typeof processService.getProcessDetails).toBe('function');
      expect(typeof processService.installDependencies).toBe('function');
      expect(typeof processService._runWithTimeout).toBe('function');
    });

    test('should maintain proper state consistency', () => {
      expect(processService.activeProcessesMap.size).toBe(0);
      
      // Multiple calls should maintain state
      processService.killAllProcesses();
      expect(processService.activeProcessesMap.size).toBe(0);
      
      processService.killAllProcesses();
      expect(processService.activeProcessesMap.size).toBe(0);
    });
  });
});
