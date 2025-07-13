/**
 * Comprehensive tests for CodeExecutionService - TypeScript Version
 */

import '../setup.js';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TestUtils } from '../utils.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { CodeExecutionService } from '../../src/services/CodeExecutionService.js';
import type { CommandExecutionArgs, NpmCommandArgs, TestExecutionArgs, PythonExecutionArgs, JavaScriptExecutionArgs, PackageInstallArgs } from '../../src/services/CodeExecutionService.js';
import type { ToolResult } from '../../src/types.js';
import fs from 'fs/promises';
import path from 'path';

// Helper function to validate MCP responses
function expectValidMcpResponse(result: ToolResult) {
  expect(result).toBeDefined();
  expect(result.content).toBeDefined();
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content.length).toBeGreaterThan(0);
  expect(result.content[0]).toBeDefined();
  expect(result.content[0].type).toBe('text');
  expect(typeof result.content[0].text).toBe('string');
}

describe('CodeExecutionService (TypeScript)', () => {
  let codeExecutionService: CodeExecutionService;
  let mockWorkspaceService: WorkspaceService;
  let tempWorkspace: string;

  beforeEach(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('code-execution-test');
    mockWorkspaceService = TestUtils.createMockWorkspaceService(tempWorkspace);
    codeExecutionService = new CodeExecutionService(mockWorkspaceService);
  });

  afterEach(async () => {
    if (tempWorkspace) {
      await TestUtils.cleanupTempWorkspace(tempWorkspace);
    }
  });

  describe('constructor', () => {
    test('should initialize with workspace service dependency', () => {
      expect(codeExecutionService).toBeDefined();
      expect(codeExecutionService).toBeInstanceOf(CodeExecutionService);
    });
  });

  describe('runPython', () => {
    test('should execute Python code directly', async () => {
      const args: PythonExecutionArgs = {
        code: 'print("Hello, World!")'
      };
      
      const result = await codeExecutionService.runPython(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toContain('Hello, World!');
    });

    test('should execute Python script from file', async () => {
      const scriptContent = `print("Python script executed")`;
      const scriptPath = path.join(tempWorkspace, 'test_script.py');
      await fs.writeFile(scriptPath, scriptContent);
      
      const args: PythonExecutionArgs = {
        script_path: 'test_script.py'
      };
      
      const result = await codeExecutionService.runPython(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toContain('Python script executed');
    });

    test('should handle Python code with errors', async () => {
      const args: PythonExecutionArgs = {
        code: 'print(undefined_variable)'
      };
      
      await expect(codeExecutionService.runPython(args)).rejects.toThrow();
    });

    test('should execute Python with virtual environment', async () => {
      // This test should handle the error case where venv doesn't exist
      const args: PythonExecutionArgs = {
        code: 'import sys; print(sys.executable)',
        venv: 'nonexistent_venv'
      };
      
      await expect(codeExecutionService.runPython(args)).rejects.toThrow();
    });

    test('should require either code or script_path', async () => {
      const args: PythonExecutionArgs = {};
      
      await expect(codeExecutionService.runPython(args))
        .rejects.toThrow('Either code or script_path must be provided');
    });
  });

  describe('runJavaScript', () => {
    test('should execute JavaScript code directly', async () => {
      const args: JavaScriptExecutionArgs = {
        code: 'console.log("Hello from Node.js!")'
      };
      
      const result = await codeExecutionService.runJavaScript(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toContain('Hello from Node.js!');
    });

    test('should execute JavaScript script from file', async () => {
      const scriptContent = `console.log('JavaScript script executed');`;
      const scriptPath = path.join(tempWorkspace, 'test_script.js');
      await fs.writeFile(scriptPath, scriptContent);
      
      const args: JavaScriptExecutionArgs = {
        script_path: 'test_script.js'
      };
      
      const result = await codeExecutionService.runJavaScript(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toContain('JavaScript script executed');
    });

    test('should handle JavaScript with syntax errors', async () => {
      const args: JavaScriptExecutionArgs = {
        code: 'console.log(undefinedVariable);'
      };
      
      await expect(codeExecutionService.runJavaScript(args)).rejects.toThrow();
    });

    test('should require either code or script_path', async () => {
      const args: JavaScriptExecutionArgs = {};
      
      await expect(codeExecutionService.runJavaScript(args))
        .rejects.toThrow('Either code or script_path must be provided');
    });
  });

  describe('runCommand', () => {
    test('should execute basic shell command', async () => {
      const args: CommandExecutionArgs = {
        command: 'echo "Hello Shell"'
      };
      
      const result = await codeExecutionService.runCommand(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toContain('Hello Shell');
    });

    test('should require command parameter', async () => {
      const args = {} as CommandExecutionArgs;
      
      await expect(codeExecutionService.runCommand(args))
        .rejects.toThrow('Missing required parameters: command');
    });

    test('should handle failed commands', async () => {
      const args: CommandExecutionArgs = {
        command: 'nonexistent_command_xyz'
      };
      
      await expect(codeExecutionService.runCommand(args))
        .rejects.toThrow();
    });
  });

  describe('pipInstall', () => {
    test('should install Python packages', async () => {
      const args: PackageInstallArgs = {
        packages: ['requests']
      };
      
      const result = await codeExecutionService.pipInstall(args);
      
      expectValidMcpResponse(result);
      // Accept both "Successfully installed" and "Requirement already satisfied"
      expect(result.content[0]?.text).toMatch(/Successfully installed|Requirement already satisfied/);
    });

    test('should require either packages or requirements_file', async () => {
      const args: PackageInstallArgs = {};
      
      await expect(codeExecutionService.pipInstall(args))
        .rejects.toThrow('Either packages or requirements_file must be provided');
    });

    test('should handle pip install errors', async () => {
      const args: PackageInstallArgs = {
        packages: ['nonexistent-package-xyz-12345']
      };
      
      await expect(codeExecutionService.pipInstall(args))
        .rejects.toThrow();
    });
  });

  describe('npmCommand', () => {
    test('should run npm install', async () => {
      const args: NpmCommandArgs = {
        command: 'install',
        args: ['lodash']
      };
      
      const result = await codeExecutionService.npmCommand(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toMatch(/added|install|lodash/);
    });

    test('should require command parameter', async () => {
      const args = {} as NpmCommandArgs;
      
      await expect(codeExecutionService.npmCommand(args))
        .rejects.toThrow('Missing required parameters: command');
    });
  });

  describe('runTests', () => {
    test('should run Python tests with pytest', async () => {
      const testContent = `
def test_addition():
    assert 1 + 1 == 2

def test_string():
    assert "hello".upper() == "HELLO"
`;
      const testPath = path.join(tempWorkspace, 'test_example.py');
      await fs.writeFile(testPath, testContent);
      
      const args: TestExecutionArgs = {
        language: 'python',
        framework: 'pytest',
        path: '.'
      };
      
      const result = await codeExecutionService.runTests(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toMatch(/passed|test|FAILED/);
    });

    test('should require language parameter', async () => {
      const args = {} as TestExecutionArgs;
      
      await expect(codeExecutionService.runTests(args))
        .rejects.toThrow('Missing required parameters: language');
    });

    test('should handle unsupported language/framework combination', async () => {
      const args: TestExecutionArgs = {
        language: 'ruby',
        framework: 'rspec'
      };
      
      await expect(codeExecutionService.runTests(args))
        .rejects.toThrow('Unsupported test language: ruby');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle very long output', async () => {
      const args: PythonExecutionArgs = {
        code: 'print("A" * 10000)'
      };
      
      const result = await codeExecutionService.runPython(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text?.length || 0).toBeGreaterThan(9000);
    });

    test('should handle empty code execution', async () => {
      const args: PythonExecutionArgs = {
        code: 'pass'  // Valid Python code that produces no output
      };
      
      const result = await codeExecutionService.runPython(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toBeDefined();
    });

    test('should handle file path with spaces', async () => {
      const spacedDir = path.join(tempWorkspace, 'dir with spaces');
      await fs.mkdir(spacedDir, { recursive: true });
      
      const scriptPath = path.join(spacedDir, 'script with spaces.py');
      await fs.writeFile(scriptPath, 'print("File with spaces works")');
      
      const args: PythonExecutionArgs = {
        script_path: path.relative(tempWorkspace, scriptPath)
      };
      
      const result = await codeExecutionService.runPython(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0]?.text).toContain('File with spaces works');
    });
  });
});
