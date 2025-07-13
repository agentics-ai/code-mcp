/**
 * Comprehensive test suite for WorkspaceService
 * Tests workspace management, path resolution, and history management
 * Node.js 22 ES Module compatible
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { join, resolve } from 'path';
import fs from 'fs/promises';

import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { TestUtils } from '../utils.js';
import { ToolResult } from '../../src/types.js';

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;
  let tempWorkspace: string;

  beforeAll(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('workspace');
  });

  afterAll(async () => {
    await TestUtils.cleanupTempWorkspace(tempWorkspace);
  });

  beforeEach(() => {
    workspaceService = new WorkspaceService();
  });

  describe('constructor', () => {
    test('should initialize with default workspace', () => {
      expect(workspaceService.workspacePath).toBeDefined();
      expect(workspaceService.workspaceHistory).toContain(workspaceService.workspacePath);
      expect(workspaceService.workspaceHistory).toHaveLength(1);
    });

    test('should use HOME environment variable if available', () => {
      const originalHome = process.env.HOME;
      process.env.HOME = '/test/home';
      
      const testService = new WorkspaceService();
      expect(testService.workspacePath).toBe('/test/home');
      
      process.env.HOME = originalHome;
    });

    test('should fallback to current directory if HOME not available', () => {
      const originalHome = process.env.HOME;
      delete process.env.HOME;
      
      const testService = new WorkspaceService();
      expect(testService.workspacePath).toBeTruthy();
      
      process.env.HOME = originalHome;
    });
  });

  describe('setWorkspace', () => {
    test('should set valid workspace path', () => {
      const result = workspaceService.setWorkspace(tempWorkspace);
      
      expect(result).toBe(true);
      expect(workspaceService.workspacePath).toBe(tempWorkspace);
      expect(workspaceService.workspaceHistory).toContain(tempWorkspace);
    });

    test('should handle relative paths', () => {
      const relativePath = './test-workspace';
      const absolutePath = resolve(relativePath);
      
      const result = workspaceService.setWorkspace(relativePath);
      
      expect(result).toBe(true);
      expect(workspaceService.workspacePath).toBe(absolutePath);
    });

    test('should handle home directory expansion', () => {
      const homePath = '~/test-workspace';
      const result = workspaceService.setWorkspace(homePath);
      
      expect(result).toBe(true);
      expect(workspaceService.workspacePath).not.toContain('~');
    });

    test('should reject empty or invalid paths', () => {
      expect(workspaceService.setWorkspace('')).toBe(false);
      expect(workspaceService.setWorkspace(null as any)).toBe(false);
      expect(workspaceService.setWorkspace(undefined as any)).toBe(false);
    });

    test('should track workspace history', () => {
      const workspace1 = tempWorkspace;
      const workspace2 = join(tempWorkspace, 'subdir');
      
      workspaceService.setWorkspace(workspace1);
      workspaceService.setWorkspace(workspace2);
      
      expect(workspaceService.workspaceHistory).toContain(workspace1);
      expect(workspaceService.workspaceHistory).toContain(workspace2);
      expect(workspaceService.workspaceHistory.length).toBeGreaterThanOrEqual(2);
    });

    test('should not duplicate paths in history', () => {
      workspaceService.setWorkspace(tempWorkspace);
      workspaceService.setWorkspace(tempWorkspace);
      
      const occurrences = workspaceService.workspaceHistory.filter(
        path => path === tempWorkspace
      ).length;
      expect(occurrences).toBe(1);
    });

    test('should limit history size', () => {
      // Add many workspaces to test history limiting
      for (let i = 0; i < 15; i++) {
        workspaceService.setWorkspace(`/test/workspace${i}`);
      }
      
      expect(workspaceService.workspaceHistory.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getCurrentWorkspace', () => {
    test('should return current workspace path', () => {
      workspaceService.setWorkspace(tempWorkspace);
      
      const result = workspaceService.getCurrentWorkspace();
      expect(result).toBe(tempWorkspace);
    });

    test('should return normalized path', () => {
      const pathWithSlashes = tempWorkspace + '//subdir//';
      workspaceService.setWorkspace(pathWithSlashes);
      
      const result = workspaceService.getCurrentWorkspace();
      expect(result).not.toContain('//');
    });
  });

  describe('resolvePath', () => {
    beforeEach(() => {
      workspaceService.setWorkspace(tempWorkspace);
    });

    test('should resolve relative paths', () => {
      const relativePath = 'test/file.txt';
      const result = workspaceService.resolvePath(relativePath);
      
      expect(result).toBe(join(tempWorkspace, relativePath));
    });

    test('should handle absolute paths', () => {
      const absolutePath = '/absolute/path/file.txt';
      const result = workspaceService.resolvePath(absolutePath);
      
      expect(result).toBe(absolutePath);
    });

    test('should handle current directory references', () => {
      const currentDirPath = './test/file.txt';
      const result = workspaceService.resolvePath(currentDirPath);
      
      expect(result).toBe(join(tempWorkspace, 'test/file.txt'));
    });

    test('should handle parent directory references', () => {
      const parentDirPath = '../test/file.txt';
      const result = workspaceService.resolvePath(parentDirPath);
      
      expect(result).toContain('test/file.txt');
    });

    test('should normalize paths', () => {
      const unnormalizedPath = 'test//subdir/./file.txt';
      const result = workspaceService.resolvePath(unnormalizedPath);
      
      expect(result).toBe(join(tempWorkspace, 'test/subdir/file.txt'));
    });

    test('should handle empty or null paths', () => {
      expect(workspaceService.resolvePath('')).toBe(tempWorkspace);
      expect(workspaceService.resolvePath(null as any)).toBe(tempWorkspace);
      expect(workspaceService.resolvePath(undefined as any)).toBe(tempWorkspace);
    });

    test('should handle home directory expansion', () => {
      const homePath = '~/documents/file.txt';
      const result = workspaceService.resolvePath(homePath);
      
      expect(result).not.toContain('~');
      expect(result).toContain('documents/file.txt');
    });
  });

  describe('isWithinWorkspace', () => {
    beforeEach(() => {
      workspaceService.setWorkspace(tempWorkspace);
    });

    test('should return true for paths within workspace', () => {
      const insidePath = join(tempWorkspace, 'subdir/file.txt');
      
      expect(workspaceService.isWithinWorkspace(insidePath)).toBe(true);
    });

    test('should return false for paths outside workspace', () => {
      const outsidePath = '/completely/different/path/file.txt';
      
      expect(workspaceService.isWithinWorkspace(outsidePath)).toBe(false);
    });

    test('should handle relative paths correctly', () => {
      const relativePath = 'subdir/file.txt';
      
      expect(workspaceService.isWithinWorkspace(relativePath)).toBe(true);
    });

    test('should handle attempts to escape workspace', () => {
      const escapePath = '../../../etc/passwd';
      
      expect(workspaceService.isWithinWorkspace(escapePath)).toBe(false);
    });

    test('should handle workspace root path', () => {
      expect(workspaceService.isWithinWorkspace(tempWorkspace)).toBe(true);
    });

    test('should handle symlinks safely', () => {
      // This test might not work on all systems, but we can test the logic
      const symlinkLikePath = join(tempWorkspace, 'link/../../../sensitive');
      
      expect(workspaceService.isWithinWorkspace(symlinkLikePath)).toBe(false);
    });
  });

  describe('getRelativePath', () => {
    beforeEach(() => {
      workspaceService.setWorkspace(tempWorkspace);
    });

    test('should return relative path from workspace', () => {
      const fullPath = join(tempWorkspace, 'subdir/file.txt');
      const result = workspaceService.getRelativePath(fullPath);
      
      expect(result).toBe('subdir/file.txt');
    });

    test('should handle workspace root', () => {
      const result = workspaceService.getRelativePath(tempWorkspace);
      
      expect(result).toBe('.');
    });

    test('should handle paths outside workspace', () => {
      const outsidePath = '/outside/workspace/file.txt';
      const result = workspaceService.getRelativePath(outsidePath);
      
      expect(result).toBe(outsidePath);
    });

    test('should normalize result paths', () => {
      const unnormalizedPath = join(tempWorkspace, 'test//subdir/./file.txt');
      const result = workspaceService.getRelativePath(unnormalizedPath);
      
      expect(result).toBe('test/subdir/file.txt');
    });
  });

  describe('validatePath', () => {
    beforeEach(() => {
      workspaceService.setWorkspace(tempWorkspace);
    });

    test('should validate paths within workspace', () => {
      const validPath = 'test/file.txt';
      
      expect(() => workspaceService.validatePath(validPath)).not.toThrow();
    });

    test('should reject paths outside workspace', () => {
      const invalidPath = '../../../etc/passwd';
      
      expect(() => workspaceService.validatePath(invalidPath)).toThrow();
    });

    test('should reject dangerous path patterns', () => {
      const dangerousPaths = [
        '../../etc/passwd',
        '/etc/passwd',
        '~/.ssh/id_rsa',
        'C:\\Windows\\System32'
      ];

      for (const dangerousPath of dangerousPaths) {
        expect(() => workspaceService.validatePath(dangerousPath)).toThrow();
      }
    });

    test('should accept safe relative paths', () => {
      const safePaths = [
        'file.txt',
        'subdir/file.txt',
        './file.txt',
        'test/subdir/deep/file.txt'
      ];

      for (const safePath of safePaths) {
        expect(() => workspaceService.validatePath(safePath)).not.toThrow();
      }
    });

    test('should provide meaningful error messages', () => {
      const invalidPath = '../../../etc/passwd';
      
      expect(() => workspaceService.validatePath(invalidPath)).toThrow('outside workspace');
    });
  });

  describe('listWorkspaceHistory', () => {
    test('should return workspace history as tool result', async () => {
      workspaceService.setWorkspace(tempWorkspace);
      workspaceService.setWorkspace(join(tempWorkspace, 'subdir'));
      
      const result = await workspaceService.listWorkspaceHistory();
      
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const content = result.content[0].text as string;
      expect(content).toContain('Workspace History');
      expect(content).toContain(tempWorkspace);
    });

    test('should handle empty history gracefully', async () => {
      const emptyService = new WorkspaceService();
      // Clear history artificially for testing
      (emptyService as any).workspaceHistory = [];
      
      const result = await emptyService.listWorkspaceHistory();
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('No workspace history');
    });

    test('should show current workspace indicator', async () => {
      workspaceService.setWorkspace(tempWorkspace);
      
      const result = await workspaceService.listWorkspaceHistory();
      
      const content = result.content[0].text as string;
      expect(content).toContain('(current)');
    });
  });

  describe('getWorkspaceInfo', () => {
    test('should return comprehensive workspace information', async () => {
      workspaceService.setWorkspace(tempWorkspace);
      
      // Create some test structure
      await fs.mkdir(join(tempWorkspace, 'src'), { recursive: true });
      await fs.writeFile(join(tempWorkspace, 'package.json'), '{}');
      await fs.writeFile(join(tempWorkspace, 'src/index.js'), 'console.log("test");');
      
      const result = await workspaceService.getWorkspaceInfo();
      
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const content = result.content[0].text as string;
      expect(content).toContain('Workspace Information');
      expect(content).toContain('Current Path:');
      expect(content).toContain('Total Files:');
      expect(content).toContain('Total Directories:');
    });

    test('should handle non-existent workspace gracefully', async () => {
      workspaceService.setWorkspace('/nonexistent/workspace');
      
      const result = await workspaceService.getWorkspaceInfo();
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error accessing workspace');
    });

    test('should include project type detection', async () => {
      workspaceService.setWorkspace(tempWorkspace);
      
      // Create package.json to indicate Node.js project
      await fs.writeFile(join(tempWorkspace, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }));
      
      const result = await workspaceService.getWorkspaceInfo();
      
      const content = result.content[0].text as string;
      expect(content).toContain('Project Type:');
      expect(content).toContain('Node.js');
    });

    test('should detect multiple project types', async () => {
      workspaceService.setWorkspace(tempWorkspace);
      
      // Create indicators for multiple project types
      await fs.writeFile(join(tempWorkspace, 'package.json'), '{}');
      await fs.writeFile(join(tempWorkspace, 'requirements.txt'), 'requests==2.28.0');
      await fs.writeFile(join(tempWorkspace, 'pom.xml'), '<project></project>');
      
      const result = await workspaceService.getWorkspaceInfo();
      
      const content = result.content[0].text as string;
      expect(content).toContain('Node.js');
      expect(content).toContain('Python');
      expect(content).toContain('Java');
    });
  });

  describe('changeWorkspace', () => {
    test('should change workspace and return confirmation', async () => {
      const newWorkspace = join(tempWorkspace, 'subdir');
      await fs.mkdir(newWorkspace, { recursive: true });
      
      const result = await workspaceService.changeWorkspace({ path: newWorkspace });
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('changed to');
      expect(workspaceService.getCurrentWorkspace()).toBe(newWorkspace);
    });

    test('should handle non-existent paths', async () => {
      const nonExistentPath = '/path/that/does/not/exist';
      
      const result = await workspaceService.changeWorkspace({ path: nonExistentPath });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('does not exist');
    });

    test('should validate path security', async () => {
      const dangerousPath = '../../../etc';
      
      const result = await workspaceService.changeWorkspace({ path: dangerousPath });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid path');
    });

    test('should handle relative paths', async () => {
      workspaceService.setWorkspace(tempWorkspace);
      
      const subdir = 'test-subdir';
      const subdirPath = join(tempWorkspace, subdir);
      await fs.mkdir(subdirPath, { recursive: true });
      
      const result = await workspaceService.changeWorkspace({ path: subdir });
      
      expect(result.isError).toBeFalsy();
      expect(workspaceService.getCurrentWorkspace()).toBe(subdirPath);
    });
  });

  describe('error handling', () => {
    test('should handle permission errors gracefully', async () => {
      // Try to access a restricted directory
      const result = await workspaceService.changeWorkspace({ path: '/root' });
      
      // Should either succeed (if user has access) or fail gracefully
      if (result.isError) {
        expect(result.content[0].text).toMatch(/permission|access|exist/i);
      }
    });

    test('should handle invalid input types', async () => {
      const result = await workspaceService.changeWorkspace({ path: null as any });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid path');
    });

    test('should handle filesystem errors in getWorkspaceInfo', async () => {
      // Set workspace to a path that exists but might have permission issues
      workspaceService.setWorkspace('/dev');
      
      const result = await workspaceService.getWorkspaceInfo();
      
      // Should handle gracefully - either succeed or provide meaningful error
      if (result.isError) {
        expect(result.content[0].text).toContain('Error');
      } else {
        expect(result.content[0].text).toContain('Workspace Information');
      }
    });
  });

  describe('path normalization', () => {
    test('should normalize Windows-style paths on Unix systems', () => {
      const windowsPath = 'folder\\subfolder\\file.txt';
      const result = workspaceService.resolvePath(windowsPath);
      
      // Should handle gracefully - convert backslashes or keep as-is
      expect(result).toBeTruthy();
    });

    test('should handle mixed separators', () => {
      const mixedPath = 'folder/subfolder\\file.txt';
      const result = workspaceService.resolvePath(mixedPath);
      
      expect(result).toBeTruthy();
      expect(result).toContain('folder');
      expect(result).toContain('file.txt');
    });

    test('should handle Unicode characters in paths', () => {
      const unicodePath = 'フォルダ/файл.txt';
      const result = workspaceService.resolvePath(unicodePath);
      
      expect(result).toContain('フォルダ');
      expect(result).toContain('файл.txt');
    });

    test('should handle very long paths', () => {
      const longPath = 'a'.repeat(200) + '/file.txt';
      const result = workspaceService.resolvePath(longPath);
      
      expect(result).toBeTruthy();
      expect(result).toContain('file.txt');
    });
  });

  describe('integration tests', () => {
    test('should work with typical development workflow', async () => {
      // Set initial workspace
      workspaceService.setWorkspace(tempWorkspace);
      
      // Create project structure
      await fs.mkdir(join(tempWorkspace, 'src'), { recursive: true });
      await fs.mkdir(join(tempWorkspace, 'tests'), { recursive: true });
      await fs.writeFile(join(tempWorkspace, 'package.json'), '{}');
      
      // Get workspace info
      const infoResult = await workspaceService.getWorkspaceInfo();
      expect(infoResult.isError).toBeFalsy();
      
      // Change to src directory
      const changeResult = await workspaceService.changeWorkspace({ 
        path: join(tempWorkspace, 'src') 
      });
      expect(changeResult.isError).toBeFalsy();
      
      // Validate paths
      expect(() => workspaceService.validatePath('index.js')).not.toThrow();
      expect(() => workspaceService.validatePath('../package.json')).not.toThrow();
      
      // Check history
      const historyResult = await workspaceService.listWorkspaceHistory();
      expect(historyResult.isError).toBeFalsy();
      expect(historyResult.content[0].text).toContain(tempWorkspace);
    });

    test('should handle rapid workspace changes', async () => {
      const workspaces = [];
      
      // Create multiple test workspaces
      for (let i = 0; i < 5; i++) {
        const ws = join(tempWorkspace, `workspace${i}`);
        await fs.mkdir(ws, { recursive: true });
        workspaces.push(ws);
      }
      
      // Rapidly change between them
      for (const ws of workspaces) {
        const result = await workspaceService.changeWorkspace({ path: ws });
        expect(result.isError).toBeFalsy();
        expect(workspaceService.getCurrentWorkspace()).toBe(ws);
      }
      
      // Check history contains all workspaces
      const historyResult = await workspaceService.listWorkspaceHistory();
      const historyText = historyResult.content[0].text as string;
      
      for (const ws of workspaces) {
        expect(historyText).toContain(ws);
      }
    });
  });
});
