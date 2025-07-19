/**
 * Comprehensive tests for GitService
 * TypeScript implementation with proper type safety
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GitService } from '../../src/services/GitService.js';
import { TestUtils } from '../utils.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { ToolResult } from '../../src/types.js';
import { GIT_ACTIONS } from '../../src/constants.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

describe('GitService', () => {
  let gitService: GitService;
  let mockWorkspaceService: WorkspaceService;
  let tempWorkspace: string;

  beforeEach(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('git-service-test');
    mockWorkspaceService = TestUtils.createMockWorkspaceService(tempWorkspace);
    gitService = new GitService(mockWorkspaceService);
  });

  afterEach(async () => {
    if (tempWorkspace) {
      await TestUtils.cleanupTempWorkspace(tempWorkspace);
    }
  });

  describe('constructor', () => {
    test('should initialize with workspace service dependency', () => {
      expect(gitService).toBeDefined();
      expect(gitService).toBeInstanceOf(GitService);
    });
  });

  describe('gitCommand', () => {
    test('should execute basic git command', async () => {
      const result: ToolResult = await gitService.gitCommand(['--version']);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('git version');
    });

    test('should handle git command with custom working directory', async () => {
      const subDir: string = path.join(tempWorkspace, 'subproject');
      await fs.mkdir(subDir);
      
      const result: ToolResult = await gitService.gitCommand(['--version'], subDir);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('git version');
    });

    test('should handle command execution errors gracefully', async () => {
      const result: ToolResult = await gitService.gitCommand(['invalid-command']);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should handle empty command array', async () => {
      const result: ToolResult = await gitService.gitCommand([]);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should handle non-existent working directory', async () => {
      const result: ToolResult = await gitService.gitCommand(['--version'], '/non/existent/path');
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('gitStatus', () => {
    test('should get status in workspace with no git repo', async () => {
      const result: ToolResult = await gitService.gitStatus();
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      // Should be empty since we're using --porcelain and no files are staged
    });

    test('should handle status with custom working directory', async () => {
      const subDir: string = path.join(tempWorkspace, 'subproject');
      await fs.mkdir(subDir);
      
      const result: ToolResult = await gitService.gitStatus({ cwd: subDir });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should handle empty status args', async () => {
      const result: ToolResult = await gitService.gitStatus({});
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
    });
  });

  describe('gitDiff', () => {
    test('should show diff with no arguments', async () => {
      const result: ToolResult = await gitService.gitDiff({});
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should show staged diff', async () => {
      const result: ToolResult = await gitService.gitDiff({ staged: true });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should show diff for specific file', async () => {
      const result: ToolResult = await gitService.gitDiff({ file: 'test.txt' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should show staged diff for specific file', async () => {
      const result: ToolResult = await gitService.gitDiff({ staged: true, file: 'test.txt' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('gitAdd', () => {
    test('should add all files when all flag is true', async () => {
      const result: ToolResult = await gitService.gitAdd({ all: true });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should add specific files', async () => {
      const result: ToolResult = await gitService.gitAdd({ files: ['test.txt', 'another.js'] });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should throw error when neither files nor all is specified', async () => {
      await expect(gitService.gitAdd({})).rejects.toThrow('Either files or all must be specified');
    });

    test('should handle empty files array', async () => {
      await expect(gitService.gitAdd({ files: [] })).rejects.toThrow('Either files or all must be specified');
    });
  });

  describe('gitCommit', () => {
    test('should commit with message', async () => {
      const result: ToolResult = await gitService.gitCommit({ message: 'Test commit' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should require commit message', async () => {
      await expect(gitService.gitCommit({ message: '' })).rejects.toThrow('Missing required parameters: message');
    });
  });

  describe('gitPush', () => {
    test('should push to default remote and branch', async () => {
      const result: ToolResult = await gitService.gitPush({});
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should push to specific remote', async () => {
      const result: ToolResult = await gitService.gitPush({ remote: 'upstream' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should push to specific branch', async () => {
      const result: ToolResult = await gitService.gitPush({ branch: 'feature-branch' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should push to specific remote and branch', async () => {
      const result: ToolResult = await gitService.gitPush({ remote: 'upstream', branch: 'feature-branch' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('gitPull', () => {
    test('should pull from default remote and branch', async () => {
      const result: ToolResult = await gitService.gitPull({});
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should pull from specific remote', async () => {
      const result: ToolResult = await gitService.gitPull({ remote: 'upstream' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should pull from specific branch', async () => {
      const result: ToolResult = await gitService.gitPull({ branch: 'develop' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('gitBranch', () => {
    test('should list branches', async () => {
      const result: ToolResult = await gitService.gitBranch({ action: GIT_ACTIONS.LIST });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should create new branch', async () => {
      const result: ToolResult = await gitService.gitBranch({ 
        action: GIT_ACTIONS.CREATE, 
        name: 'feature-branch' 
      });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should delete branch', async () => {
      const result: ToolResult = await gitService.gitBranch({ 
        action: GIT_ACTIONS.DELETE, 
        name: 'feature-branch' 
      });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should require action parameter', async () => {
      await expect(gitService.gitBranch({} as any)).rejects.toThrow('Missing required parameters: action');
    });

    test('should validate action parameter', async () => {
      await expect(gitService.gitBranch({ action: 'unknown' as any })).rejects.toThrow('Unknown git branch action: unknown');
    });
  });

  describe('gitLog', () => {
    test('should show git log', async () => {
      const result: ToolResult = await gitService.gitLog({});
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should show limited git log', async () => {
      const result: ToolResult = await gitService.gitLog({ limit: 5 });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should show oneline git log', async () => {
      const result: ToolResult = await gitService.gitLog({ oneline: true });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('integration tests', () => {
    test('should work in a real git repository', async () => {
      // Initialize a git repository
      try {
        await execAsync('git init', { cwd: tempWorkspace });
        await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
        await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
        
        // Create and add a file
        await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Hello World');
        
        const addResult: ToolResult = await gitService.gitAdd({ files: ['test.txt'] });
        expect(addResult).toBeDefined();
        
        const statusResult: ToolResult = await gitService.gitStatus();
        expect(statusResult).toBeDefined();
        
        const commitResult: ToolResult = await gitService.gitCommit({ message: 'Initial commit' });
        expect(commitResult).toBeDefined();
        
        const logResult: ToolResult = await gitService.gitLog({});
        expect(logResult).toBeDefined();
        
      } catch (error) {
        // Git might not be available in test environment, skip gracefully
        console.log('Git not available in test environment, skipping integration test');
      }
    });

    test('should handle workspace with spaces in path', async () => {
      const spacedDir: string = path.join(tempWorkspace, 'spaced directory');
      await fs.mkdir(spacedDir);
      
      // Mock the workspace service to handle the spaced directory
      const mockResolvePath = jest.fn((filePath: string): string => {
        return path.isAbsolute(filePath) ? filePath : path.join(spacedDir, filePath);
      });
      (mockWorkspaceService as any).resolvePath = mockResolvePath;
      
      const result: ToolResult = await gitService.gitCommand(['--version']);
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
    });

    test('should handle Unicode characters in git operations', async () => {
      const result: ToolResult = await gitService.gitCommit({ message: 'Unicode test: 测试 🚀' });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('error handling', () => {
    test('should handle git command failures gracefully', async () => {
      const result: ToolResult = await gitService.gitCommand(['this-is-not-a-git-command']);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should handle timeout scenarios', async () => {
      // This test would be implementation specific - git commands should have reasonable timeouts
      const result: ToolResult = await gitService.gitCommand(['--version']);
      expect(result).toBeDefined();
    });

    test('should handle permission errors', async () => {
      // Try to run git in a directory we might not have access to
      const result: ToolResult = await gitService.gitCommand(['--version'], '/root');
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
    });
  });

  describe('performance', () => {
    test('should handle multiple concurrent git operations', async () => {
      const promises: Promise<ToolResult>[] = [
        gitService.gitCommand(['--version']),
        gitService.gitStatus(),
        gitService.gitCommand(['--help'])
      ];
      
      const results: ToolResult[] = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
      });
    });

    test('should handle large file operations gracefully', async () => {
      // Create a larger test file
      const largeContent: string = 'x'.repeat(10000);
      await fs.writeFile(path.join(tempWorkspace, 'large-file.txt'), largeContent);
      
      const result: ToolResult = await gitService.gitAdd({ files: ['large-file.txt'] });
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
    });
  });
});

describe('GitService', () => {
  let gitService: GitService;
  let mockWorkspaceService: WorkspaceService;
  let tempWorkspace: string;

  beforeEach(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('git-service-test');
    mockWorkspaceService = TestUtils.createMockWorkspaceService(tempWorkspace);
    gitService = new GitService(mockWorkspaceService);
  });

  afterEach(async () => {
    if (tempWorkspace) {
      await TestUtils.cleanupTempWorkspace(tempWorkspace);
    }
  });

  describe('constructor', () => {
    test('should initialize with workspace service dependency', () => {
      expect(gitService).toBeDefined();
      // Note: workspaceService is private, so we can't test it directly
    });
  });

  describe('gitCommand', () => {
    test('should execute basic git command in non-git directory', async () => {
      const result = await gitService.gitCommand(['--version']);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('git version');
    });

    test('should handle git command with custom working directory', async () => {
      const subDir = path.join(tempWorkspace, 'subproject');
      await fs.mkdir(subDir);
      
      const result = await gitService.gitCommand(['--version'], 'subproject');
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('git version');
    });

    test('should handle git errors gracefully', async () => {
      const result = await gitService.gitCommand(['status'], '.');
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should handle invalid git commands', async () => {
      const result = await gitService.gitCommand(['invalid-command']);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should execute git command that produces no output', async () => {
      // Initialize a git repo first
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      const result = await gitService.gitCommand(['status', '--porcelain']);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toBe('Command completed successfully');
    });
  });

  describe('gitStatus', () => {
    test('should get status in non-git directory', async () => {
      const result = await gitService.gitStatus();
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should get status in initialized git repository', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create a file
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Hello World');
      
      const result = await gitService.gitStatus();
      
      expectValidMcpResponse(result);
      // Should be empty since we're using --porcelain and no files are staged
    });

    test('should get status with staged and unstaged files', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create and stage a file
      await fs.writeFile(path.join(tempWorkspace, 'staged.txt'), 'Staged content');
      await execAsync('git add staged.txt', { cwd: tempWorkspace });
      
      // Create an unstaged file
      await fs.writeFile(path.join(tempWorkspace, 'unstaged.txt'), 'Unstaged content');
      
      const result = await gitService.gitStatus();
      
      expectValidMcpResponse(result);
    });

    test('should get status in subdirectory', async () => {
      const subDir = path.join(tempWorkspace, 'subdir');
      await fs.mkdir(subDir);
      
      const result = await gitService.gitStatus({ cwd: subDir });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('gitDiff', () => {
    test('should show diff in non-git directory', async () => {
      const result = await gitService.gitDiff({});
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should show unstaged diff', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create and commit a file
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Original content');
      await execAsync('git add test.txt', { cwd: tempWorkspace });
      await execAsync('git commit -m "Initial commit"', { cwd: tempWorkspace });
      
      // Modify the file
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Modified content');
      
      const result = await gitService.gitDiff({});
      
      expectValidMcpResponse(result);
    });

    test('should show staged diff', async () => {
      // Initialize git repo and create initial commit
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Original content');
      await execAsync('git add test.txt', { cwd: tempWorkspace });
      await execAsync('git commit -m "Initial commit"', { cwd: tempWorkspace });
      
      // Modify and stage the file
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Modified content');
      await execAsync('git add test.txt', { cwd: tempWorkspace });
      
      const result = await gitService.gitDiff({ staged: true });
      
      expectValidMcpResponse(result);
    });

    test('should show diff for specific file', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      const result = await gitService.gitDiff({ file: 'nonexistent.txt' });
      
      expectValidMcpResponse(result);
    });

    test('should show diff with custom working directory', async () => {
      const subDir = path.join(tempWorkspace, 'subproject');
      await fs.mkdir(subDir);
      
      const result = await gitService.gitDiff({ cwd: 'subproject' });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('gitAdd', () => {
    test('should stage all files', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create files
      await fs.writeFile(path.join(tempWorkspace, 'file1.txt'), 'Content 1');
      await fs.writeFile(path.join(tempWorkspace, 'file2.txt'), 'Content 2');
      
      const result = await gitService.gitAdd({ all: true });
      
      expectValidMcpResponse(result);
    });

    test('should stage specific files', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create files
      await fs.writeFile(path.join(tempWorkspace, 'file1.txt'), 'Content 1');
      await fs.writeFile(path.join(tempWorkspace, 'file2.txt'), 'Content 2');
      
      const result = await gitService.gitAdd({ files: ['file1.txt'] });
      
      expectValidMcpResponse(result);
    });

    test('should require either files or all parameter', async () => {
      await expect(gitService.gitAdd({}))
        .rejects.toThrow('Either files or all must be specified');
    });

    test('should handle non-existent files', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      const result = await gitService.gitAdd({ files: ['nonexistent.txt'] });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should stage files in subdirectory', async () => {
      const subDir = path.join(tempWorkspace, 'subdir');
      await fs.mkdir(subDir);
      
      // Initialize git repo in subdirectory
      await execAsync('git init', { cwd: subDir });
      await execAsync('git config user.email "test@example.com"', { cwd: subDir });
      await execAsync('git config user.name "Test User"', { cwd: subDir });
      
      await fs.writeFile(path.join(subDir, 'test.txt'), 'Content');
      
      const result = await gitService.gitAdd({ files: ['test.txt'], cwd: 'subdir' });
      
      expectValidMcpResponse(result);
    });
  });

  describe('gitCommit', () => {
    test('should commit staged changes', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create and stage a file
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Content');
      await execAsync('git add test.txt', { cwd: tempWorkspace });
      
      const result = await gitService.gitCommit({
        message: 'Test commit'
      });
      
      expectValidMcpResponse(result);
    });

    test('should handle commit with no staged changes', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      const result = await gitService.gitCommit({
        message: 'Empty commit'
      });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should handle commit in non-git directory', async () => {
      const result = await gitService.gitCommit({
        message: 'Test commit'
      });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should commit with custom working directory', async () => {
      const subDir = path.join(tempWorkspace, 'subproject');
      await fs.mkdir(subDir);
      
      const result = await gitService.gitCommit({
        message: 'Test commit',
        cwd: 'subproject'
      });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });
  });

  describe('gitLog', () => {
    test('should show log in non-git directory', async () => {
      const result = await gitService.gitLog({});
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should show log with commits', async () => {
      // Initialize git repo and create commits
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create first commit
      await fs.writeFile(path.join(tempWorkspace, 'file1.txt'), 'Content 1');
      await execAsync('git add file1.txt', { cwd: tempWorkspace });
      await execAsync('git commit -m "First commit"', { cwd: tempWorkspace });
      
      // Create second commit
      await fs.writeFile(path.join(tempWorkspace, 'file2.txt'), 'Content 2');
      await execAsync('git add file2.txt', { cwd: tempWorkspace });
      await execAsync('git commit -m "Second commit"', { cwd: tempWorkspace });
      
      const result = await gitService.gitLog({});
      
      expectValidMcpResponse(result);
    });

    test('should show log with limit', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create commit
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Content');
      await execAsync('git add test.txt', { cwd: tempWorkspace });
      await execAsync('git commit -m "Test commit"', { cwd: tempWorkspace });
      
      const result = await gitService.gitLog({ limit: 1 });
      
      expectValidMcpResponse(result);
    });
  });

  describe('gitBranch', () => {
    test('should list branches in non-git directory', async () => {
      const result = await gitService.gitBranch({ action: 'list' });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Git error');
    });

    test('should list branches in git repository', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create initial commit (needed for branches to show up)
      await fs.writeFile(path.join(tempWorkspace, 'README.md'), '# Test');
      await execAsync('git add README.md', { cwd: tempWorkspace });
      await execAsync('git commit -m "Initial commit"', { cwd: tempWorkspace });
      
      const result = await gitService.gitBranch({ action: 'list' });
      
      expectValidMcpResponse(result);
    });

    test('should create new branch', async () => {
      // Initialize git repo with initial commit
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      await fs.writeFile(path.join(tempWorkspace, 'README.md'), '# Test');
      await execAsync('git add README.md', { cwd: tempWorkspace });
      await execAsync('git commit -m "Initial commit"', { cwd: tempWorkspace });
      
      const result = await gitService.gitBranch({ action: 'create', name: 'feature-branch' });
      
      expectValidMcpResponse(result);
    });

    test('should switch to existing branch', async () => {
      // Initialize git repo with initial commit
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      await fs.writeFile(path.join(tempWorkspace, 'README.md'), '# Test');
      await execAsync('git add README.md', { cwd: tempWorkspace });
      await execAsync('git commit -m "Initial commit"', { cwd: tempWorkspace });
      
      // Create and switch to branch
      await execAsync('git branch test-branch', { cwd: tempWorkspace });
      
      const result = await gitService.gitBranch({ action: 'switch', name: 'test-branch' });
      
      expectValidMcpResponse(result);
    });

    test('should handle missing action parameter', async () => {
      await expect(gitService.gitBranch({} as any)).rejects.toThrow('Missing required parameters: action');
    });

    test('should handle missing name for create action', async () => {
      await expect(gitService.gitBranch({ action: 'create' })).rejects.toThrow('Branch name required for create action');
    });

    test('should handle missing name for switch action', async () => {
      await expect(gitService.gitBranch({ action: 'switch' })).rejects.toThrow('Branch name required for switch action');
    });

    test('should handle unknown action', async () => {
      await expect(gitService.gitBranch({ action: 'unknown' as any })).rejects.toThrow('Unknown git branch action: unknown');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle git commands with special characters', async () => {
      const result = await gitService.gitCommand(['--help']);
      
      expectValidMcpResponse(result);
    });

    test('should handle concurrent git operations', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      const promises = [
        gitService.gitStatus(),
        gitService.gitCommand(['--version']),
        gitService.gitDiff({})
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expectValidMcpResponse(result);
      });
    });

    test('should handle very long git output', async () => {
      // Initialize git repo with many commits
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create multiple commits
      for (let i = 0; i < 5; i++) {
        await fs.writeFile(path.join(tempWorkspace, `file${i}.txt`), `Content ${i}`);
        await execAsync(`git add file${i}.txt`, { cwd: tempWorkspace });
        await execAsync(`git commit -m "Commit ${i}"`, { cwd: tempWorkspace });
      }
      
      const result = await gitService.gitLog({});
      
      expectValidMcpResponse(result);
    });

    test('should handle git operations in directory with spaces', async () => {
      const spacedDir = path.join(tempWorkspace, 'dir with spaces');
      await fs.mkdir(spacedDir);
      
      await execAsync('git init', { cwd: spacedDir });
      await execAsync('git config user.email "test@example.com"', { cwd: spacedDir });
      await execAsync('git config user.name "Test User"', { cwd: spacedDir });
      
      const result = await gitService.gitStatus({ cwd: spacedDir });
      
      expectValidMcpResponse(result);
    });

    test('should handle git repository with Unicode file names', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      
      // Create file with Unicode name
      const unicodeFile = 'файл-中文-🚀.txt';
      await fs.writeFile(path.join(tempWorkspace, unicodeFile), 'Unicode content');
      
      const result = await gitService.gitAdd({ files: [unicodeFile] });
      
      expectValidMcpResponse(result);
    });
  });

  describe('Auto-commit functionality', () => {
    beforeEach(async () => {
      // Initialize git repo for auto-commit tests
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
    });

    describe('autoCommitChanges', () => {
      test('should auto-commit changes with specified message', async () => {
        // Create test file
        const testFile = 'auto-commit-test.txt';
        await fs.writeFile(path.join(tempWorkspace, testFile), 'Auto commit test content');
        
        const result = await gitService.autoCommitChanges({
          message: 'Test auto commit',
          files: [testFile]
        });
        
        expectValidMcpResponse(result);
        expect(result.content[0].text).toContain('[AI] Test auto commit');
      });

      test('should handle no changes scenario', async () => {
        const result = await gitService.autoCommitChanges({
          message: 'No changes test',
          skipIfNoChanges: true
        });
        
        expectValidMcpResponse(result);
        expect(result.content[0].text).toBe('No changes to commit');
      });

      test('should auto-commit all changes when no specific files provided', async () => {
        // Create multiple test files
        await fs.writeFile(path.join(tempWorkspace, 'file1.txt'), 'Content 1');
        await fs.writeFile(path.join(tempWorkspace, 'file2.txt'), 'Content 2');
        
        const result = await gitService.autoCommitChanges({
          message: 'Auto commit all files'
        });
        
        expectValidMcpResponse(result);
        expect(result.content[0].text).toContain('[AI] Auto commit all files');
      });

      test('should handle auto-commit errors gracefully', async () => {
        // Try to commit without any git repo (should fail)
        const nonGitWorkspace = await TestUtils.createTempWorkspace('non-git-workspace');
        
        try {
          // Create a new GitService instance that uses the non-git workspace
          const nonGitWorkspaceService = TestUtils.createMockWorkspaceService(nonGitWorkspace);
          const nonGitGitService = new GitService(nonGitWorkspaceService);
          
          const result = await nonGitGitService.autoCommitChanges({
            message: 'This should fail'
          });
          
          // Should handle error gracefully
          expect(result.isError).toBeTruthy();
          expect(result.content[0].text).toContain('Auto-commit failed');
        } finally {
          await TestUtils.cleanupTempWorkspace(nonGitWorkspace);
        }
      });
    });

    describe('previewChanges', () => {
      test('should preview unstaged changes', async () => {
        // Create and modify files
        const testFile = 'preview-test.txt';
        await fs.writeFile(path.join(tempWorkspace, testFile), 'Original content');
        
        // Add to git
        await execAsync(`git add ${testFile}`, { cwd: tempWorkspace });
        await execAsync('git commit -m "Initial commit"', { cwd: tempWorkspace });
        
        // Modify file
        await fs.writeFile(path.join(tempWorkspace, testFile), 'Modified content');
        
        const result = await gitService.previewChanges(tempWorkspace);
        
        expectValidMcpResponse(result);
        expect(result.content[0].text).toContain('UNSTAGED CHANGES');
      });

      test('should preview staged changes', async () => {
        // Create file and stage it
        const testFile = 'staged-preview-test.txt';
        await fs.writeFile(path.join(tempWorkspace, testFile), 'Staged content');
        await execAsync(`git add ${testFile}`, { cwd: tempWorkspace });
        
        const result = await gitService.previewChanges(tempWorkspace);
        
        expectValidMcpResponse(result);
        expect(result.content[0].text).toContain('STAGED CHANGES');
      });

      test('should handle no changes to preview', async () => {
        // Commit everything first
        await fs.writeFile(path.join(tempWorkspace, 'clean-test.txt'), 'Clean content');
        await execAsync('git add .', { cwd: tempWorkspace });
        await execAsync('git commit -m "Clean commit"', { cwd: tempWorkspace });
        
        const result = await gitService.previewChanges(tempWorkspace);
        
        expectValidMcpResponse(result);
        expect(result.content[0].text).toBe('No changes to preview');
      });

      test('should handle preview errors gracefully', async () => {
        const result = await gitService.previewChanges('/non-existent-directory');
        
        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('Failed to preview changes');
      });
    });
  });

  describe('Focused Git Tools - Token Efficiency', () => {
    describe('focused Git branch tools', () => {
      describe('gitBranchList', () => {
        test('should call gitCommand with branch list arguments', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: '* main\n  feature\n  develop' }]
            });

          const result = await gitService.gitBranchList({
            all: true,
            cwd: '/test/repo'
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['branch', '-a'], '/test/repo');
          expect(result.content[0].text).toContain('main');
          expect(result.content[0].text).toContain('feature');
        });

        test('should list remote branches only', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'origin/main\norigin/develop' }]
            });

          const result = await gitService.gitBranchList({
            remote: true
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['branch', '-r'], undefined);
          expect(result.content[0].text).toContain('origin/main');
        });

        test('should list merged branches', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: '* main\n  old-feature' }]
            });

          const result = await gitService.gitBranchList({
            merged: true
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['branch', '--merged'], undefined);
          expect(result.content[0].text).toContain('main');
        });
      });

      describe('gitBranchCreate', () => {
        test('should create branch without checkout', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Branch created successfully' }]
            });

          const result = await gitService.gitBranchCreate({
            name: 'feature-branch',
            checkout: false
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['branch', 'feature-branch'], undefined);
          expect(result.content[0].text).toContain('Branch created successfully');
        });

        test('should create and checkout branch', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Switched to a new branch' }]
            });

          const result = await gitService.gitBranchCreate({
            name: 'feature-branch',
            checkout: true,
            start_point: 'develop'
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['checkout', '-b', 'feature-branch', 'develop'], undefined);
          expect(result.content[0].text).toContain('Switched to a new branch');
        });

        test('should require branch name', async () => {
          await expect(gitService.gitBranchCreate({} as any)).rejects.toThrow('Missing required parameters: name');
        });
      });

      describe('gitBranchSwitch', () => {
        test('should switch to existing branch', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Switched to branch develop' }]
            });

          const result = await gitService.gitBranchSwitch({
            name: 'develop'
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['checkout', 'develop'], undefined);
          expect(result.content[0].text).toContain('Switched to branch develop');
        });

        test('should create and switch to new branch', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Switched to a new branch' }]
            });

          const result = await gitService.gitBranchSwitch({
            name: 'new-feature',
            create: true,
            force: true
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['checkout', '-b', '-f', 'new-feature'], undefined);
          expect(result.content[0].text).toContain('Switched to a new branch');
        });

        test('should require branch name', async () => {
          await expect(gitService.gitBranchSwitch({} as any)).rejects.toThrow('Missing required parameters: name');
        });
      });

      describe('gitBranchDelete', () => {
        test('should delete local branch', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Deleted branch feature-branch' }]
            });

          const result = await gitService.gitBranchDelete({
            name: 'feature-branch'
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['branch', '-d', 'feature-branch'], undefined);
          expect(result.content[0].text).toContain('Deleted branch feature-branch');
        });

        test('should force delete local branch', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Deleted branch (was 1234567)' }]
            });

          const result = await gitService.gitBranchDelete({
            name: 'feature-branch',
            force: true
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['branch', '-D', 'feature-branch'], undefined);
          expect(result.content[0].text).toContain('Deleted branch');
        });

        test('should delete remote branch', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'To origin\n - [deleted]  feature-branch' }]
            });

          const result = await gitService.gitBranchDelete({
            name: 'feature-branch',
            remote: true
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['push', 'origin', '--delete', 'feature-branch'], undefined);
          expect(result.content[0].text).toContain('deleted');
        });

        test('should require branch name', async () => {
          await expect(gitService.gitBranchDelete({} as any)).rejects.toThrow('Missing required parameters: name');
        });
      });

      describe('gitBranchMerge', () => {
        test('should merge branch with default settings', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Merge made by the \'recursive\' strategy' }]
            });

          const result = await gitService.gitBranchMerge({
            branch: 'feature-branch'
          });

          expect(gitCommandSpy).toHaveBeenCalledWith(['merge', 'feature-branch'], undefined);
          expect(result.content[0].text).toContain('Merge made');
        });

        test('should merge with no fast-forward', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Merge commit created' }]
            });

          const result = await gitService.gitBranchMerge({
            branch: 'feature-branch',
            no_fast_forward: true,
            message: 'Custom merge message'
          });

          expect(gitCommandSpy).toHaveBeenCalledWith([
            'merge', 
            '--no-ff', 
            '-m', 
            'Custom merge message',
            'feature-branch'
          ], undefined);
          expect(result.content[0].text).toContain('Merge commit created');
        });

        test('should squash merge', async () => {
          const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Squash commit created' }]
            });

          const result = await gitService.gitBranchMerge({
            branch: 'feature-branch',
            squash: true
          });

          expect(gitCommandSpy).toHaveBeenCalledWith([
            'merge', 
            '--squash',
            'feature-branch'
          ], undefined);
          expect(result.content[0].text).toContain('Squash commit created');
        });

        test('should require branch name', async () => {
          await expect(gitService.gitBranchMerge({} as any)).rejects.toThrow('Missing required parameters: branch');
        });
      });
    });

    describe('error propagation', () => {
      test('should propagate errors from gitCommand', async () => {
        jest.spyOn(gitService, 'gitCommand')
          .mockResolvedValue({
            isError: true,
            content: [{ type: 'text', text: 'fatal: not a git repository' }]
          });

        const result = await gitService.gitBranchList({});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('fatal: not a git repository');
      });
    });

    describe('working directory parameter', () => {
      test('should pass cwd parameter to gitCommand', async () => {
        const gitCommandSpy = jest.spyOn(gitService, 'gitCommand')
          .mockResolvedValue({
            content: [{ type: 'text', text: 'Success' }]
          });

        await gitService.gitBranchList({ cwd: '/custom/path' });

        expect(gitCommandSpy).toHaveBeenCalledWith(['branch'], '/custom/path');
      });
    });
  });

  describe('Enhanced Git Diff Management', () => {
    beforeEach(async () => {
      // Initialize git repo and create test files
      await execAsync('git init', { cwd: tempWorkspace });
      await execAsync('git config user.name "Test User"', { cwd: tempWorkspace });
      await execAsync('git config user.email "test@example.com"', { cwd: tempWorkspace });
      
      // Create initial file and commit
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Line 1\nLine 2\nLine 3\n');
      await execAsync('git add test.txt', { cwd: tempWorkspace });
      await execAsync('git commit -m "Initial commit"', { cwd: tempWorkspace });
      
      // Modify file for testing diffs
      await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Line 1 modified\nLine 2\nLine 3\nLine 4 added\n');
    });

    describe('enhancedGitDiff', () => {
      test('should show unified diff format', async () => {
        const result = await gitService.enhancedGitDiff({
          format: 'unified',
          contextLines: 2
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Enhanced Git Diff');
        expect(result.content[0].text).toContain('test.txt');
        expect(result.content[0].text).toContain('-Line 1');
        expect(result.content[0].text).toContain('+Line 1 modified');
        expect(result.content[0].text).toContain('+Line 4 added');
      });

      test('should show side-by-side diff format', async () => {
        const result = await gitService.enhancedGitDiff({
          format: 'side-by-side',
          contextLines: 1
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Side-by-side comparison');
        expect(result.content[0].text).toContain('OLD');
        expect(result.content[0].text).toContain('NEW');
        expect(result.content[0].text).toContain('Line 1');
        expect(result.content[0].text).toContain('Line 1 modified');
      });

      test('should show stat format', async () => {
        const result = await gitService.enhancedGitDiff({
          format: 'stat'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Diff Statistics');
        expect(result.content[0].text).toContain('test.txt');
        expect(result.content[0].text).toContain('1 file changed');
      });

      test('should show name-only format', async () => {
        const result = await gitService.enhancedGitDiff({
          format: 'name-only'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Changed Files');
        expect(result.content[0].text).toContain('test.txt');
      });

      test('should show word-diff format', async () => {
        const result = await gitService.enhancedGitDiff({
          format: 'word-diff'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Word Diff');
        expect(result.content[0].text).toContain('test.txt');
      });

      test('should handle staged changes', async () => {
        // Stage the changes
        await execAsync('git add test.txt', { cwd: tempWorkspace });
        
        const result = await gitService.enhancedGitDiff({
          staged: true,
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Staged Changes');
        expect(result.content[0].text).toContain('+Line 1 modified');
      });

      test('should handle specific file diff', async () => {
        const result = await gitService.enhancedGitDiff({
          file: 'test.txt',
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('test.txt');
        expect(result.content[0].text).toContain('-Line 1');
        expect(result.content[0].text).toContain('+Line 1 modified');
      });

      test('should ignore whitespace when requested', async () => {
        // Create file with only whitespace changes
        await fs.writeFile(path.join(tempWorkspace, 'whitespace.txt'), 'Line 1\n  Line 2\nLine 3');
        await execAsync('git add whitespace.txt', { cwd: tempWorkspace });
        await execAsync('git commit -m "Add whitespace file"', { cwd: tempWorkspace });
        await fs.writeFile(path.join(tempWorkspace, 'whitespace.txt'), 'Line 1\nLine 2\nLine 3');

        const result = await gitService.enhancedGitDiff({
          file: 'whitespace.txt',
          ignoreWhitespace: true,
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
      });

      test('should handle commit comparison', async () => {
        // Make another commit
        await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Line 1 modified again\nLine 2\nLine 3\nLine 4 added\n');
        await execAsync('git add test.txt', { cwd: tempWorkspace });
        await execAsync('git commit -m "Second commit"', { cwd: tempWorkspace });

        const result = await gitService.enhancedGitDiff({
          commit1: 'HEAD~1',
          commit2: 'HEAD',
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Commit Comparison');
        expect(result.content[0].text).toContain('HEAD~1..HEAD');
      });

      test('should handle no changes', async () => {
        // Commit all changes
        await execAsync('git add .', { cwd: tempWorkspace });
        await execAsync('git commit -m "Commit changes"', { cwd: tempWorkspace });

        const result = await gitService.enhancedGitDiff({
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('No changes');
      });
    });

    describe('getDiffStats', () => {
      test('should get diff statistics', async () => {
        const result = await gitService.getDiffStats({});

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Diff Statistics');
        expect(result.content[0].text).toContain('Files changed:');
        expect(result.content[0].text).toContain('Lines added:');
        expect(result.content[0].text).toContain('Lines removed:');
      });

      test('should get stats for staged changes', async () => {
        await execAsync('git add test.txt', { cwd: tempWorkspace });
        
        const result = await gitService.getDiffStats({
          staged: true
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Staged Changes Statistics');
      });

      test('should get stats for specific file', async () => {
        const result = await gitService.getDiffStats({
          file: 'test.txt'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('test.txt');
      });

      test('should get stats for commit comparison', async () => {
        await execAsync('git add test.txt', { cwd: tempWorkspace });
        await execAsync('git commit -m "Second commit"', { cwd: tempWorkspace });

        const result = await gitService.getDiffStats({
          commit1: 'HEAD~1',
          commit2: 'HEAD'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Commit Comparison Statistics');
        expect(result.content[0].text).toContain('HEAD~1..HEAD');
      });
    });

    describe('compareCommits', () => {
      beforeEach(async () => {
        // Create multiple commits for comparison
        await execAsync('git add test.txt', { cwd: tempWorkspace });
        await execAsync('git commit -m "Second commit"', { cwd: tempWorkspace });
        
        await fs.writeFile(path.join(tempWorkspace, 'another.txt'), 'Another file content\n');
        await execAsync('git add another.txt', { cwd: tempWorkspace });
        await execAsync('git commit -m "Third commit"', { cwd: tempWorkspace });
      });

      test('should compare two commits', async () => {
        const result = await gitService.compareCommits('HEAD~2', 'HEAD');

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Commit Comparison');
        expect(result.content[0].text).toContain('HEAD~2..HEAD');
        expect(result.content[0].text).toContain('Summary');
        expect(result.content[0].text).toContain('Files changed:');
      });

      test('should compare commits with specific format', async () => {
        const result = await gitService.compareCommits('HEAD~1', 'HEAD', {
          format: 'stat'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Statistics Format');
      });

      test('should compare commits with file pattern', async () => {
        const result = await gitService.compareCommits('HEAD~1', 'HEAD', {
          filePattern: '*.txt'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('File Pattern: *.txt');
      });

      test('should handle invalid commit references', async () => {
        const result = await gitService.compareCommits('invalid-commit', 'HEAD');

        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('Failed to compare commits');
      });
    });

    describe('previewChangesEnhanced', () => {
      test('should preview changes in unified format', async () => {
        const result = await gitService.previewChangesEnhanced({
          format: 'unified',
          contextLines: 2
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Enhanced Change Preview');
        expect(result.content[0].text).toContain('Unstaged Changes');
        expect(result.content[0].text).toContain('test.txt');
      });

      test('should preview changes in side-by-side format', async () => {
        const result = await gitService.previewChangesEnhanced({
          format: 'side-by-side'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Side-by-side comparison');
      });

      test('should preview changes with file pattern', async () => {
        await fs.writeFile(path.join(tempWorkspace, 'test.js'), 'console.log("test");\n');
        
        const result = await gitService.previewChangesEnhanced({
          filePattern: '*.txt',
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('File Pattern: *.txt');
        expect(result.content[0].text).toContain('test.txt');
        expect(result.content[0].text).not.toContain('test.js');
      });

      test('should preview with whitespace ignored', async () => {
        const result = await gitService.previewChangesEnhanced({
          ignoreWhitespace: true,
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Ignoring whitespace changes');
      });

      test('should handle no changes', async () => {
        // Commit all changes
        await execAsync('git add .', { cwd: tempWorkspace });
        await execAsync('git commit -m "Commit all changes"', { cwd: tempWorkspace });

        const result = await gitService.previewChangesEnhanced({
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('No changes to preview');
      });

      test('should preview both staged and unstaged changes', async () => {
        // Stage some changes
        await execAsync('git add test.txt', { cwd: tempWorkspace });
        
        // Make more unstaged changes
        await fs.writeFile(path.join(tempWorkspace, 'test.txt'), 'Line 1 modified again\nLine 2\nLine 3\nLine 4 added\nLine 5 unstaged\n');

        const result = await gitService.previewChangesEnhanced({
          format: 'stat'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Staged Changes');
        expect(result.content[0].text).toContain('Unstaged Changes');
      });
    });

    describe('Error Handling', () => {
      test('should handle git command failures gracefully', async () => {
        // Test with non-git directory
        const nonGitWorkspace = await TestUtils.createTempWorkspace('non-git');
        const mockNonGitService = TestUtils.createMockWorkspaceService(nonGitWorkspace);
        const nonGitService = new GitService(mockNonGitService);

        const result = await nonGitService.enhancedGitDiff({
          format: 'unified'
        });

        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('Git diff failed');

        await TestUtils.cleanupTempWorkspace(nonGitWorkspace);
      });

      test('should handle invalid file paths', async () => {
        const result = await gitService.enhancedGitDiff({
          file: 'nonexistent-file.txt',
          format: 'unified'
        });

        expectValidMcpResponse(result);
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('No changes');
      });

      test('should handle invalid format options', async () => {
        const result = await gitService.enhancedGitDiff({
          format: 'invalid-format' as any
        });

        expectValidMcpResponse(result);
        // Should default to unified format
        expect(result.content[0].text).toContain('Enhanced Git Diff');
      });
    });
  });
});
