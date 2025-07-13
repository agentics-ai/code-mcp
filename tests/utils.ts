/**
 * Test utilities for VS Code MCP Server
 * Node.js 22 ES Modules compatible
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { jest } from '@jest/globals';

export interface TestStructure {
  [path: string]: string | TestStructure;
}

export interface TestWorkspace {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Test utilities class
 */
export class TestUtils {
  /**
   * Create a temporary workspace for testing
   */
  static async createTempWorkspace(suffix: string = ''): Promise<string> {
    const prefix = suffix ? `vscode-mcp-test-${suffix}-` : 'vscode-mcp-test-';
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    return tempDir;
  }

  /**
   * Clean up temporary workspace
   */
  static async cleanupTempWorkspace(workspacePath: string): Promise<void> {
    try {
      await fs.rm(workspacePath, { recursive: true, force: true });
    } catch (error: any) {
      console.warn(`Failed to cleanup ${workspacePath}:`, error.message);
    }
  }

  /**
   * Create file structure in workspace
   */
  static async createFileStructure(workspacePath: string, structure: TestStructure): Promise<void> {
    for (const [relativePath, content] of Object.entries(structure)) {
      const fullPath = path.join(workspacePath, relativePath);
      
      if (typeof content === 'string') {
        // It's a file
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
      } else {
        // It's a directory with nested structure
        await fs.mkdir(fullPath, { recursive: true });
        await TestUtils.createFileStructure(fullPath, content);
      }
    }
  }

  /**
   * Read file content
   */
  static async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   */
  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(filePath: string): Promise<{
    size: number;
    modified: Date;
    isDirectory: boolean;
    isFile: boolean;
  }> {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
  }

  /**
   * List directory contents
   */
  static async listDirectory(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error: any) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Create a mock workspace with common structure
   */
  static async createMockWorkspace(name: string = 'mock'): Promise<TestWorkspace> {
    const workspacePath = await TestUtils.createTempWorkspace(name);
    
    const mockStructure: TestStructure = {
      'package.json': JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          start: 'node index.js',
          test: 'jest'
        }
      }, null, 2),
      'index.js': 'console.log("Hello World");',
      'README.md': '# Test Project\n\nThis is a test project.',
      'src': {
        'main.js': 'export function main() { return "Hello from main"; }',
        'utils.js': 'export function helper() { return "Helper function"; }',
        'components': {
          'Button.js': 'export function Button() { return "Button component"; }'
        }
      },
      'tests': {
        'main.test.js': 'import { main } from "../src/main.js";\ntest("main function", () => { expect(main()).toBe("Hello from main"); });'
      },
      '.gitignore': 'node_modules/\n.env\ndist/',
      'docs': {
        'api.md': '# API Documentation\n\nAPI docs here.'
      }
    };

    await TestUtils.createFileStructure(workspacePath, mockStructure);

    return {
      path: workspacePath,
      cleanup: () => TestUtils.cleanupTempWorkspace(workspacePath)
    };
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await TestUtils.wait(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Generate random string
   */
  static randomString(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean up all test workspaces (useful for CI cleanup)
   */
  static async cleanupAllTestWorkspaces(): Promise<void> {
    const tempDir = os.tmpdir();
    try {
      const entries = await fs.readdir(tempDir);
      const testDirs = entries.filter(entry => entry.startsWith('vscode-mcp-test-'));
      
      for (const dir of testDirs) {
        const fullPath = path.join(tempDir, dir);
        try {
          await fs.rm(fullPath, { recursive: true, force: true });
        } catch (error: any) {
          console.warn(`Failed to cleanup test directory ${fullPath}:`, error.message);
        }
      }
    } catch (error: any) {
      console.warn('Failed to cleanup test workspaces:', error.message);
    }
  }

  /**
   * Create mock WorkspaceService for testing
   */
  static createMockWorkspaceService(workspacePath: string): any {
    return {
      workspacePath,
      resolvePath: jest.fn((relativePath: string) => {
        if (path.isAbsolute(relativePath)) {
          return relativePath;
        }
        return path.resolve(workspacePath, relativePath);
      }),
      validatePath: jest.fn((filePath: string) => {
        // Mock validation - just check if path exists relative to workspace
        return true;
      }),
      getRelativePath: jest.fn((fullPath: string) => {
        return path.relative(workspacePath, fullPath);
      }),
      getCurrentWorkspace: jest.fn(() => {
        return workspacePath;
      })
    };
  }

  /**
   * Create mock FileService for testing
   */
  static createMockFileService(): any {
    return {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      deleteFile: jest.fn(),
      listDirectory: jest.fn(),
      getFileInfo: jest.fn(),
      createDirectory: jest.fn()
    };
  }

  /**
   * Create mock ProcessService for testing
   */
  static createMockProcessService(): any {
    return {
      executeCommand: jest.fn(),
      startProcess: jest.fn(),
      stopProcess: jest.fn(),
      listProcesses: jest.fn(),
      getProcessStatus: jest.fn()
    };
  }

  /**
   * Create mock GitService for testing
   */
  static createMockGitService(): any {
    return {
      getStatus: jest.fn(),
      addFiles: jest.fn(),
      commit: jest.fn(),
      push: jest.fn(),
      pull: jest.fn(),
      createBranch: jest.fn(),
      switchBranch: jest.fn(),
      getDiff: jest.fn(),
      getCommitHistory: jest.fn()
    };
  }

}

/**
 * Test fixtures for common test data
 */
export class TestFixtures {
  static readonly SAMPLE_PYTHON_CODE = `
def fibonacci(n):
    """Calculate fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def main():
    for i in range(10):
        print(f"F({i}) = {fibonacci(i)}")

if __name__ == "__main__":
    main()
`.trim();

  static readonly SAMPLE_JAVASCRIPT_CODE = `
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

function main() {
    for (let i = 0; i < 10; i++) {
        console.log(\`F(\${i}) = \${fibonacci(i)}\`);
    }
}

export { fibonacci, main };
`.trim();

  static readonly SAMPLE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a test page.</p>
</body>
</html>
`.trim();

  static readonly SAMPLE_CSS = `
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}

.button {
    background-color: #007cba;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.button:hover {
    background-color: #005a8b;
}
`.trim();

  static readonly SAMPLE_JSON_CONFIG = {
    name: 'test-project',
    version: '1.0.0',
    description: 'A test project',
    main: 'index.js',
    scripts: {
      start: 'node index.js',
      test: 'jest',
      dev: 'nodemon index.js'
    },
    dependencies: {
      express: '^4.18.0'
    },
    devDependencies: {
      jest: '^29.0.0',
      nodemon: '^2.0.0'
    }
  };

  static readonly SAMPLE_MARKDOWN = `
# Test Project

This is a sample project for testing purposes.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`
`.trim();

  /**
   * Get a complex project structure for testing
   */
  static getComplexProjectStructure(): TestStructure {
    return {
      'package.json': JSON.stringify(TestFixtures.SAMPLE_JSON_CONFIG, null, 2),
      'README.md': TestFixtures.SAMPLE_MARKDOWN,
      'index.js': TestFixtures.SAMPLE_JAVASCRIPT_CODE,
      'src': {
        'app.js': TestFixtures.SAMPLE_JAVASCRIPT_CODE,
        'utils.js': 'export function helper() { return "helper"; }',
        'components': {
          'header.js': 'export function Header() { return "Header"; }',
          'footer.js': 'export function Footer() { return "Footer"; }'
        },
        'styles': {
          'main.css': TestFixtures.SAMPLE_CSS,
          'components.css': '.component { margin: 10px; }'
        }
      },
      'tests': {
        'app.test.js': 'test("app test", () => expect(true).toBe(true));',
        'utils.test.js': 'test("utils test", () => expect(true).toBe(true));'
      },
      'docs': {
        'api.md': '# API Documentation',
        'setup.md': '# Setup Guide'
      },
      'public': {
        'index.html': TestFixtures.SAMPLE_HTML,
        'style.css': TestFixtures.SAMPLE_CSS
      },
      '.gitignore': 'node_modules/\n.env\ndist/\ncoverage/',
      '.env.example': 'PORT=3000\nNODE_ENV=development'
    };
  }
}
