/**
 * Simplified ProjectService tests for TypeScript implementation
 * Testing only methods that actually exist in the current implementation
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ProjectService } from '../../src/services/ProjectService.js';
import { TestUtils } from '../utils.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { PROJECT_TYPES } from '../../src/constants.js';
import fs from 'fs/promises';
import path from 'path';

describe('ProjectService (Simple)', () => {
  let projectService: ProjectService;
  let mockWorkspaceService: WorkspaceService;
  let tempWorkspace: string;

  beforeEach(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('project-service-test');
    mockWorkspaceService = TestUtils.createMockWorkspaceService(tempWorkspace);
    projectService = new ProjectService(mockWorkspaceService);
  });

  afterEach(async () => {
    if (tempWorkspace) {
      await TestUtils.cleanupTempWorkspace(tempWorkspace);
    }
  });

  describe('constructor', () => {
    test('should initialize with workspace service dependency', () => {
      expect(projectService).toBeDefined();
      // Note: workspaceService is private, so we can't test it directly
    });
  });

  describe('createProject', () => {
    test('should create Python project with basic structure', async () => {
      const result = await projectService.createProject({
        name: 'my-python-app',
        type: PROJECT_TYPES.PYTHON,
        path: '.'
      });
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Project "my-python-app" created');
      expect(result.content[0].text).toContain('Type: python');
      
      // Verify basic files were created
      const projectPath = path.join(tempWorkspace, 'my-python-app');
      const files = await fs.readdir(projectPath, { recursive: true });
      
      expect(files).toContain('README.md');
      expect(files).toContain('requirements.txt');
      expect(files).toContain('src');
      expect(files).toContain('tests');
      expect(files.some((f: string) => f.includes('main.py'))).toBe(true);
    });

    test('should create Node.js project with basic structure', async () => {
      const result = await projectService.createProject({
        name: 'my-node-app',
        type: PROJECT_TYPES.NODE,
        path: '.'
      });
      
      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('Project "my-node-app" created');
      expect(result.content[0].text).toContain('Type: node');
      
      // Verify basic files were created
      const projectPath = path.join(tempWorkspace, 'my-node-app');
      const files = await fs.readdir(projectPath, { recursive: true });
      
      expect(files).toContain('package.json');
      expect(files).toContain('README.md');
      expect(files).toContain('src');
      expect(files).toContain('tests');
    });

    test('should create React project with basic structure', async () => {
      const result = await projectService.createProject({
        name: 'my-react-app',
        type: PROJECT_TYPES.REACT,
        path: '.'
      });
      
      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('Project "my-react-app" created');
      expect(result.content[0].text).toContain('Type: react');
      
      // Verify basic files were created
      const projectPath = path.join(tempWorkspace, 'my-react-app');
      const files = await fs.readdir(projectPath, { recursive: true });
      
      expect(files).toContain('package.json');
      expect(files).toContain('README.md');
      expect(files).toContain('src');
    });

    test('should create Express project with basic structure', async () => {
      const result = await projectService.createProject({
        name: 'my-express-app',
        type: PROJECT_TYPES.EXPRESS,
        path: '.'
      });
      
      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('Project "my-express-app" created');
      expect(result.content[0].text).toContain('Type: express');
      
      // Verify basic files were created
      const projectPath = path.join(tempWorkspace, 'my-express-app');
      const files = await fs.readdir(projectPath, { recursive: true });
      
      expect(files).toContain('package.json');
      expect(files).toContain('README.md');
      expect(files).toContain('src');
      expect(files).toContain('tests');
    });

    test('should create project in custom subdirectory', async () => {
      const customPath = path.join(tempWorkspace, 'projects');
      await fs.mkdir(customPath, { recursive: true });
      
      const result = await projectService.createProject({
        name: 'custom-app',
        type: PROJECT_TYPES.PYTHON,
        path: 'projects'
      });
      
      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('Project "custom-app" created');
      
      // Verify project was created in custom location
      const projectPath = path.join(customPath, 'custom-app');
      const exists = await fs.access(projectPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should require name parameter', async () => {
      await expect(projectService.createProject({
        name: '',
        type: PROJECT_TYPES.PYTHON,
      })).rejects.toThrow();
    });

    test('should require type parameter', async () => {
      await expect(projectService.createProject({
        name: 'test-app',
        type: '' as any,
      })).rejects.toThrow();
    });

    test('should validate project type', async () => {
      await expect(projectService.createProject({
        name: 'test-app',
        type: 'invalid-type' as any,
      })).rejects.toThrow();
    });

    test('should handle existing directory name', async () => {
      const existingPath = path.join(tempWorkspace, 'existing-app');
      await fs.mkdir(existingPath, { recursive: true });
      
      const result = await projectService.createProject({
        name: 'existing-app',
        type: PROJECT_TYPES.PYTHON,
        path: '.'
      });
      
      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('Project "existing-app" created');
    });
  });

  describe('error handling', () => {
    test('should handle project names with special characters', async () => {
      const result = await projectService.createProject({
        name: 'my-app-2024_v2',
        type: PROJECT_TYPES.PYTHON,
        path: '.'
      });
      
      expect(result).toBeDefined();
      const projectPath = path.join(tempWorkspace, 'my-app-2024_v2');
      const exists = await fs.access(projectPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should handle nested path creation', async () => {
      const result = await projectService.createProject({
        name: 'nested-app',
        type: PROJECT_TYPES.PYTHON,
        path: 'very/deep/nested/path'
      });
      
      expect(result).toBeDefined();
      const projectPath = path.join(tempWorkspace, 'very/deep/nested/path/nested-app');
      const exists = await fs.access(projectPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should handle Unicode project names', async () => {
      const unicodeName = 'プロジェクト-测试';
      const result = await projectService.createProject({
        name: unicodeName,
        type: PROJECT_TYPES.PYTHON,
        path: '.'
      });
      
      expect(result).toBeDefined();
      const projectPath = path.join(tempWorkspace, unicodeName);
      const exists = await fs.access(projectPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });
});
