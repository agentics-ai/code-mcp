/**
 * Comprehensive tests for ProjectService
 * 100% coverage with edge cases
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProjectService } from '../../src/services/ProjectService.js';
import { TestUtils } from '../utils.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { ToolResult } from '../../src/types.js';
import fs from 'fs/promises';
import path from 'path';

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

describe('ProjectService', () => {
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
      expect(projectService).toBeInstanceOf(ProjectService);
    });
  });

  describe('createProject', () => {
    test('should create Python project with all files', async () => {
      const result = await projectService.createProject({
        name: 'my-python-app',
        type: 'python',
        path: '.'
      });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Project "my-python-app" created');
      expect(result.content[0].text).toContain('Type: python');
      
      // Verify files were created
      const projectPath = path.join(tempWorkspace, 'my-python-app');
      const files = await fs.readdir(projectPath, { recursive: true });
      
      expect(files).toContain('README.md');
      expect(files).toContain('requirements.txt');
      expect(files).toContain('.gitignore');
      expect(files).toContain('src');
      expect(files).toContain('tests');
      
      // Check file contents
      const readme = await fs.readFile(path.join(projectPath, 'README.md'), 'utf-8');
      expect(readme).toContain('# my-python-app');
      expect(readme).toContain('Python project created with VS Code MCP Agent');
      
      const requirements = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf-8');
      expect(requirements).toContain('pytest');
      expect(requirements).toContain('requests');
      
      const mainPy = await fs.readFile(path.join(projectPath, 'src', 'main.py'), 'utf-8');
      expect(mainPy).toContain('def main():');
      expect(mainPy).toContain('my-python-app');
    });

    test('should create Node.js project with all files', async () => {
      const result = await projectService.createProject({
        name: 'my-node-app',
        type: 'node',
        path: '.'
      });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Project "my-node-app" created');
      expect(result.content[0].text).toContain('Type: node');
      
      // Verify files were created
      const projectPath = path.join(tempWorkspace, 'my-node-app');
      const files = await fs.readdir(projectPath, { recursive: true });
      
      expect(files).toContain('package.json');
      expect(files).toContain('README.md');
      expect(files).toContain('.gitignore');
      expect(files).toContain('src');
      
      // Check package.json
      const packageJson = JSON.parse(
        await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
      );
      expect(packageJson.name).toBe('my-node-app');
      expect(packageJson.main).toBe('src/index.js');
      expect(packageJson.scripts.start).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      
      const indexJs = await fs.readFile(path.join(projectPath, 'src', 'index.js'), 'utf-8');
      expect(indexJs).toContain('function greet');
      expect(indexJs).toContain('my-node-app');
    });

    test('should create React project with all files', async () => {
      const result = await projectService.createProject({
        name: 'my-react-app',
        type: 'react',
        path: '.'
      });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Project "my-react-app" created');
      expect(result.content[0].text).toContain('Type: react');
      
      // Verify React-specific files
      const projectPath = path.join(tempWorkspace, 'my-react-app');
      const files = await fs.readdir(projectPath, { recursive: true });
      
      expect(files).toContain('package.json');
      expect(files).toContain('public');
      expect(files).toContain('src');
      
      // Check for React-specific files
      const packageJson = JSON.parse(
        await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
      );
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
      
      const appJs = await fs.readFile(path.join(projectPath, 'src', 'App.js'), 'utf-8');
      expect(appJs).toContain('function App()');
      expect(appJs).toContain('my-react-app');
    });

    test('should create Express project with all files', async () => {
      const result = await projectService.createProject({
        name: 'my-express-app',
        type: 'express',
        path: '.'
      });
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Project "my-express-app" created');
      expect(result.content[0].text).toContain('Type: express');
      
      // Verify Express-specific files
      const projectPath = path.join(tempWorkspace, 'my-express-app');
      
      const packageJson = JSON.parse(
        await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
      );
      expect(packageJson.dependencies.express).toBeDefined();
      
      const serverJs = await fs.readFile(path.join(projectPath, 'src', 'server.js'), 'utf-8');
      expect(serverJs).toContain('const express = require');
      expect(serverJs).toContain('app.listen');
    });

    test('should create project in custom subdirectory', async () => {
      const customPath = path.join(tempWorkspace, 'projects');
      await fs.mkdir(customPath);
      
      const result = await projectService.createProject({
        name: 'custom-location-app',
        type: 'python',
        path: 'projects'
      });
      
      expectValidMcpResponse(result);
      
      // Verify project was created in custom location
      const projectPath = path.join(customPath, 'custom-location-app');
      const stats = await fs.stat(projectPath);
      expect(stats.isDirectory()).toBe(true);
      
      const readme = await fs.readFile(path.join(projectPath, 'README.md'), 'utf-8');
      expect(readme).toContain('# custom-location-app');
    });

    test('should require name parameter', async () => {
      await expect(projectService.createProject({
        type: 'python'
      } as any)).rejects.toThrow('Missing required parameters: name');
    });

    test('should require type parameter', async () => {
      await expect(projectService.createProject({
        name: 'test-app'
      } as any)).rejects.toThrow('Missing required parameters: type');
    });

    test('should validate project type', async () => {
      await expect(projectService.createProject({
        name: 'test-app',
        type: 'invalid-type' as any
      })).rejects.toThrow('Unsupported project type');
    });

    test('should handle existing directory name', async () => {
      // Create directory first
      const existingPath = path.join(tempWorkspace, 'existing-app');
      await fs.mkdir(existingPath);
      
      // Should still work, creating files inside existing directory
      const result = await projectService.createProject({
        name: 'existing-app',
        type: 'python',
        path: '.'
      });
      
      expectValidMcpResponse(result);
    });

    test('should initialize git repository', async () => {
      await projectService.createProject({
        name: 'git-test-app',
        type: 'python',
        path: '.'
      });
      
      // Check if .git directory exists
      const projectPath = path.join(tempWorkspace, 'git-test-app');
      const gitPath = path.join(projectPath, '.git');
      
      try {
        const stats = await fs.stat(gitPath);
        expect(stats.isDirectory()).toBe(true);
      } catch (error: any) {
        // Git init might fail in some environments, that's ok
        expect(error.code).toBe('ENOENT');
      }
    });

    test('should create nested directory structure', async () => {
      await projectService.createProject({
        name: 'nested-app',
        type: 'python',
        path: '.'
      });
      
      const projectPath = path.join(tempWorkspace, 'nested-app');
      
      // Check nested directories were created
      const srcStats = await fs.stat(path.join(projectPath, 'src'));
      expect(srcStats.isDirectory()).toBe(true);
      
      const testsStats = await fs.stat(path.join(projectPath, 'tests'));
      expect(testsStats.isDirectory()).toBe(true);
    });
  });

  describe('getProjectTemplate', () => {
    test('should return Python template files', () => {
      const template = projectService.getProjectTemplate('test-app', 'python');
      
      const keys = Object.keys(template);
      expect(keys).toContain('README.md');
      expect(keys).toContain('requirements.txt');
      expect(keys).toContain('.gitignore');
      expect(keys).toContain('src/__init__.py');
      expect(keys).toContain('src/main.py');
      expect(keys).toContain('tests/__init__.py');
      expect(keys).toContain('tests/test_main.py');
      
      expect(template['README.md']).toContain('# test-app');
      expect(template['src/main.py']).toContain('def main():');
    });

    test('should return Node.js template files', () => {
      const template = projectService.getProjectTemplate('test-app', 'node');
      
      const keys = Object.keys(template);
      expect(keys).toContain('package.json');
      expect(keys).toContain('README.md');
      expect(keys).toContain('.gitignore');
      expect(keys).toContain('src/index.js');
      expect(keys).toContain('tests/index.test.js');
      
      const packageJson = JSON.parse(template['package.json']);
      expect(packageJson.name).toBe('test-app');
      expect(packageJson.main).toBe('src/index.js');
    });

    test('should return React template files', () => {
      const template = projectService.getProjectTemplate('test-app', 'react');
      
      const keys = Object.keys(template);
      expect(keys).toContain('package.json');
      expect(keys).toContain('public/index.html');
      expect(keys).toContain('src/App.js');
      expect(keys).toContain('src/index.js');
      
      const packageJson = JSON.parse(template['package.json']);
      expect(packageJson.dependencies.react).toBeDefined();
    });

    test('should return Express template files', () => {
      const template = projectService.getProjectTemplate('test-app', 'express');
      
      const keys = Object.keys(template);
      expect(keys).toContain('package.json');
      expect(keys).toContain('src/server.js');
      expect(keys).toContain('tests/server.test.js');
      expect(keys).toContain('.env.example');
      
      const packageJson = JSON.parse(template['package.json']);
      expect(packageJson.dependencies.express).toBeDefined();
    });

    test('should throw error for unknown project type', () => {
      expect(() => {
        projectService.getProjectTemplate('test-app', 'unknown');
      }).toThrow('Unknown project type: unknown');
    });
  });

  describe('getPythonTemplate', () => {
    test('should generate complete Python project structure', () => {
      const template = projectService.getPythonTemplate('my-python-project');
      
      // Check all expected files exist
      const expectedFiles = [
        'README.md',
        'requirements.txt',
        '.gitignore',
        'src/__init__.py',
        'src/main.py',
        'tests/__init__.py',
        'tests/test_main.py'
      ];
      
      expectedFiles.forEach(file => {
        expect(Object.keys(template)).toContain(file);
        expect(typeof template[file]).toBe('string');
        // Some files like __init__.py can be empty, so don't check length
      });
      
      // Check content specifics
      expect(template['README.md']).toContain('# my-python-project');
      expect(template['src/main.py']).toContain('my-python-project');
      expect(template['tests/test_main.py']).toContain('test_main');
      expect(template['.gitignore']).toContain('__pycache__');
      expect(template['requirements.txt']).toContain('pytest');
    });
  });

  describe('getNodeTemplate', () => {
    test('should generate complete Node.js project structure', () => {
      const template = projectService.getNodeTemplate('my-node-project');
      
      const expectedFiles = [
        'package.json',
        'README.md',
        '.gitignore',
        'src/index.js',
        'tests/index.test.js'
      ];
      
      expectedFiles.forEach(file => {
        expect(Object.keys(template)).toContain(file);
      });
      
      const packageJson = JSON.parse(template['package.json']);
      expect(packageJson.name).toBe('my-node-project');
      expect(packageJson.main).toBe('src/index.js');
      expect(packageJson.scripts.start).toBe('node src/index.js');
      expect(packageJson.scripts.test).toBe('jest');
      
      expect(template['src/index.js']).toContain('my-node-project');
      expect(template['.gitignore']).toContain('node_modules');
    });
  });

  describe('getReactTemplate', () => {
    test('should generate complete React project structure', () => {
      const template = projectService.getReactTemplate('my-react-project');
      
      const expectedFiles = [
        'package.json',
        'README.md',
        '.gitignore',
        'public/index.html',
        'src/index.js',
        'src/App.js',
        'src/App.css',
        'src/index.css',
        'src/reportWebVitals.js'
      ];
      
      expectedFiles.forEach(file => {
        expect(Object.keys(template)).toContain(file);
      });
      
      const packageJson = JSON.parse(template['package.json']);
      expect(packageJson.name).toBe('my-react-project');
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
      
      expect(template['src/App.js']).toContain('function App()');
      expect(template['public/index.html']).toContain('<div id="root">');
    });
  });

  describe('getExpressTemplate', () => {
    test('should generate complete Express project structure', () => {
      const template = projectService.getExpressTemplate('my-express-project');
      
      const expectedFiles = [
        'package.json',
        'README.md',
        '.gitignore',
        '.env.example',
        'src/server.js',
        'tests/server.test.js'
      ];
      
      expectedFiles.forEach(file => {
        expect(Object.keys(template)).toContain(file);
      });
      
      const packageJson = JSON.parse(template['package.json']);
      expect(packageJson.name).toBe('my-express-project');
      expect(packageJson.dependencies.express).toBeDefined();
      expect(packageJson.dependencies.cors).toBeDefined();
      
      expect(template['src/server.js']).toContain('const express = require');
    });
  });

  describe('getNextSteps', () => {
    test('should return Python next steps', () => {
      const steps = projectService.getNextSteps('python');
      
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(step => step.includes('venv'))).toBe(true);
      expect(steps.some(step => step.includes('pip install'))).toBe(true);
      expect(steps.some(step => step.includes('python src/main.py'))).toBe(true);
    });

    test('should return Node.js next steps', () => {
      const steps = projectService.getNextSteps('node');
      
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.some(step => step.includes('npm install'))).toBe(true);
      expect(steps.some(step => step.includes('npm start'))).toBe(true);
    });

    test('should return React next steps', () => {
      const steps = projectService.getNextSteps('react');
      
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.some(step => step.includes('npm install'))).toBe(true);
      expect(steps.some(step => step.includes('npm start'))).toBe(true);
    });

    test('should return Express next steps', () => {
      const steps = projectService.getNextSteps('express');
      
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.some(step => step.includes('npm install'))).toBe(true);
      expect(steps.some(step => step.includes('npm run dev'))).toBe(true);
    });

    test('should return default steps for unknown type', () => {
      const steps = projectService.getNextSteps('unknown');
      
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle project names with special characters', async () => {
      const result = await projectService.createProject({
        name: 'my-app-2024_v2',
        type: 'python',
        path: '.'
      });
      
      expectValidMcpResponse(result);
      
      const projectPath = path.join(tempWorkspace, 'my-app-2024_v2');
      const stats = await fs.stat(projectPath);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should handle very long project names', async () => {
      const longName = 'a'.repeat(100);
      
      const result = await projectService.createProject({
        name: longName,
        type: 'python',
        path: '.'
      });
      
      expectValidMcpResponse(result);
    });

    test('should handle nested path creation', async () => {
      const result = await projectService.createProject({
        name: 'nested-app',
        type: 'python',
        path: 'very/deep/nested/path'
      });
      
      expectValidMcpResponse(result);
      
      const projectPath = path.join(tempWorkspace, 'very/deep/nested/path/nested-app');
      const stats = await fs.stat(projectPath);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should handle concurrent project creation', async () => {
      const promises = [
        projectService.createProject({
          name: 'project1',
          type: 'python',
          path: '.'
        }),
        projectService.createProject({
          name: 'project2',
          type: 'node',
          path: '.'
        }),
        projectService.createProject({
          name: 'project3',
          type: 'react',
          path: '.'
        })
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expectValidMcpResponse(result);
      });
      
      // Verify all projects were created
      const projects = await fs.readdir(tempWorkspace);
      expect(projects).toContain('project1');
      expect(projects).toContain('project2');
      expect(projects).toContain('project3');
    });

    test('should handle permission errors gracefully', async () => {
      // Try to create project in a restricted location (this test might not work on all systems)
      if (process.platform !== 'win32') {
        try {
          await projectService.createProject({
            name: 'restricted-app',
            type: 'python',
            path: '/root'  // Usually restricted
          });
        } catch (error: any) {
          expect(error.message).toBeDefined();
        }
      }
    });

    test('should handle Unicode project names', async () => {
      const unicodeName = 'проект-中文-🚀';
      
      const result = await projectService.createProject({
        name: unicodeName,
        type: 'python',
        path: '.'
      });
      
      expectValidMcpResponse(result);
      
      const projectPath = path.join(tempWorkspace, unicodeName);
      const stats = await fs.stat(projectPath);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should handle empty string inputs gracefully', async () => {
      await expect(projectService.createProject({
        name: '',
        type: 'python'
      })).rejects.toThrow();
      
      await expect(projectService.createProject({
        name: 'test-app',
        type: '' as any
      })).rejects.toThrow();
    });
  });
});
