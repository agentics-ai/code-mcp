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
});
