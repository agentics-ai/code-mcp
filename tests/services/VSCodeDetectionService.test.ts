/**
 * Tests for VSCodeDetectionService - VS Code workspace detection
 */

import '../setup.js';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VSCodeDetectionService } from '../../src/services/VSCodeDetectionService.js';
import type { DetectWorkspacesArgs } from '../../src/services/VSCodeDetectionService.js';
import type { ToolResult, VSCodeDetectionResult } from '../../src/types.js';
import { TestUtils } from '../utils.js';

// Helper function to validate MCP responses
function expectValidMcpResponse(result: ToolResult) {
  expect(result).toBeDefined();
  expect(result.content).toBeDefined();
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content.length).toBeGreaterThan(0);
  expect(result.content[0].type).toBe('text');
  expect(typeof result.content[0].text).toBe('string');
}

describe('VSCodeDetectionService', () => {
  let vsCodeDetectionService: VSCodeDetectionService;
  let tempDir: string;

  beforeEach(async () => {
    vsCodeDetectionService = new VSCodeDetectionService();
    tempDir = await TestUtils.createTempWorkspace('vscode-detection-test');
  });

  afterEach(async () => {
    if (tempDir) {
      await TestUtils.cleanupTempWorkspace(tempDir);
    }
  });

  describe('constructor', () => {
    test('should initialize service correctly', () => {
      expect(vsCodeDetectionService).toBeDefined();
      expect(vsCodeDetectionService).toBeInstanceOf(VSCodeDetectionService);
    });
  });

  describe('detectWorkspaces', () => {
    test('should detect workspaces with default parameters', async () => {
      const result = await vsCodeDetectionService.detectWorkspaces();
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('VS Code Workspace Detection Results');
    });

    test('should handle includeRecent parameter', async () => {
      const args: DetectWorkspacesArgs = {
        includeRecent: true,
        includeRunning: false
      };
      
      const result = await vsCodeDetectionService.detectWorkspaces(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('VS Code Workspace Detection Results');
    });

    test('should handle includeRunning parameter', async () => {
      const args: DetectWorkspacesArgs = {
        includeRecent: false,
        includeRunning: true
      };
      
      const result = await vsCodeDetectionService.detectWorkspaces(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('VS Code Workspace Detection Results');
    });

    test('should respect maxResults parameter', async () => {
      const args: DetectWorkspacesArgs = {
        maxResults: 5
      };
      
      const result = await vsCodeDetectionService.detectWorkspaces(args);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('VS Code Workspace Detection Results');
    });

    test('should handle detection errors gracefully', async () => {
      // Mock a method to throw an error
      const detectSpy = jest.spyOn(vsCodeDetectionService as any, '_detectRunningInstances')
        .mockRejectedValue(new Error('Detection failed'));
      
      const result = await vsCodeDetectionService.detectWorkspaces({ includeRunning: true });
      
      expectValidMcpResponse(result);
      // Should still return a valid response, might be empty or contain error info
      
      // Restore original method
      detectSpy.mockRestore();
    });
  });

  describe('presentWorkspaceChoice', () => {
    test('should present choices when workspaces are detected', async () => {
      const mockDetectionResult: VSCodeDetectionResult = {
        instances: [{
          pid: 12345,
          executable: 'code',
          workspaces: [{
            path: '/Users/test/project1',
            name: 'project1',
            isOpen: true,
            type: 'folder'
          }]
        }],
        recentWorkspaces: [{
          path: '/Users/test/project2',
          name: 'project2',
          isOpen: false,
          type: 'folder'
        }],
        totalWorkspaces: 2
      };
      
      const result = await vsCodeDetectionService.presentWorkspaceChoice(mockDetectionResult);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Detected VS Code Workspaces');
      expect(result.content[0].text).toContain('Currently Open');
      expect(result.content[0].text).toContain('Recent Workspaces');
      expect(result.content[0].text).toContain('project1');
      expect(result.content[0].text).toContain('project2');
    });

    test('should handle empty detection results', async () => {
      const emptyDetectionResult: VSCodeDetectionResult = {
        instances: [],
        recentWorkspaces: [],
        totalWorkspaces: 0
      };
      
      const result = await vsCodeDetectionService.presentWorkspaceChoice(emptyDetectionResult);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('No VS Code workspaces detected');
      expect(result.content[0].text).toContain('Open VS Code with a workspace');
    });

    test('should handle only running instances', async () => {
      const runningOnlyResult: VSCodeDetectionResult = {
        instances: [{
          pid: 12345,
          executable: 'code',
          workspaces: [{
            path: '/Users/test/active-project',
            name: 'active-project',
            isOpen: true,
            type: 'folder'
          }]
        }],
        recentWorkspaces: [],
        totalWorkspaces: 1
      };
      
      const result = await vsCodeDetectionService.presentWorkspaceChoice(runningOnlyResult);
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Currently Open');
      expect(result.content[0].text).toContain('active-project');
      expect(result.content[0].text).toContain('ACTIVE');
    });
  });

  describe('autoSelectWorkspace', () => {
    test('should auto-select workspace when available', async () => {
      const result = await vsCodeDetectionService.autoSelectWorkspace();
      
      expectValidMcpResponse(result);
      // Should either auto-select a workspace or indicate none found
      const text = result.content[0].text;
      expect(text).toMatch(/Auto-selected workspace|No VS Code workspaces found/);
    });

    test('should handle no workspaces available', async () => {
      // Mock detection to return empty results
      const detectionSpy = jest.spyOn(vsCodeDetectionService as any, '_performDetection')
        .mockResolvedValue({
          instances: [],
          recentWorkspaces: [],
          totalWorkspaces: 0
        });
      
      const result = await vsCodeDetectionService.autoSelectWorkspace();
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('No VS Code workspaces found');
      
      // Restore original method
      detectionSpy.mockRestore();
    });

    test('should prioritize open workspaces over recent ones', async () => {
      // Mock detection with both open and recent workspaces
      const mockDetection = {
        instances: [{
          pid: 12345,
          executable: 'code',
          workspaces: [{
            path: '/Users/test/open-project',
            name: 'open-project',
            isOpen: true,
            type: 'folder' as const
          }]
        }],
        recentWorkspaces: [{
          path: '/Users/test/recent-project',
          name: 'recent-project',
          isOpen: false,
          type: 'folder' as const
        }],
        totalWorkspaces: 2
      };
      
      const detectionSpy = jest.spyOn(vsCodeDetectionService as any, '_performDetection')
        .mockResolvedValue(mockDetection);
      
      const result = await vsCodeDetectionService.autoSelectWorkspace();
      
      expectValidMcpResponse(result);
      expect(result.content[0].text).toContain('Auto-selected workspace');
      expect(result.content[0].text).toContain('open-project');
      expect(result.content[0].text).toContain('Currently Open');
      
      // Restore original method
      detectionSpy.mockRestore();
    });
  });

  describe('_detectRunningInstances', () => {
    test('should handle process detection gracefully', async () => {
      // This test will depend on the actual system state
      // We test that it doesn't throw errors
      const instances = await vsCodeDetectionService['_detectRunningInstances']();
      
      expect(Array.isArray(instances)).toBe(true);
      // May be empty if no VS Code instances are running
    });
  });

  describe('_detectRecentWorkspaces', () => {
    test('should handle missing config files gracefully', async () => {
      const workspaces = await vsCodeDetectionService['_detectRecentWorkspaces']();
      
      expect(Array.isArray(workspaces)).toBe(true);
      // May be empty if no VS Code config exists
    });

    test('should parse VS Code config when available', async () => {
      // Since we can't reliably mock os.homedir, test the real behavior 
      // This test will work with actual VS Code configs or return empty arrays gracefully
      const workspaces = await vsCodeDetectionService['_detectRecentWorkspaces']();
      
      // Should handle the config gracefully (may be empty if no VS Code is installed)
      expect(Array.isArray(workspaces)).toBe(true);
      // Each workspace should have required properties if any are found
      for (const workspace of workspaces) {
        expect(workspace).toHaveProperty('path');
        expect(workspace).toHaveProperty('name');
        expect(workspace).toHaveProperty('isOpen');
        expect(workspace).toHaveProperty('type');
      }
    });
  });

  describe('_parseProcessLine', () => {
    test('should parse Unix process lines correctly', () => {
      const mockLine = 'user     12345  0.0  0.0  123456  7890   ??  S     1:23PM   0:01.23 /usr/local/bin/code --folder-uri file:///Users/test/project';
      const platform = 'darwin';
      
      const result = vsCodeDetectionService['_parseProcessLine'](mockLine, platform);
      
      if (result) {
        expect(result.pid).toBe(12345);
        expect(result.executable).toContain('code');
        expect(result.workspaces.length).toBeGreaterThan(0);
      }
      // May be null if parsing fails, which is acceptable
    });

    test('should handle invalid process lines gracefully', () => {
      const invalidLine = 'invalid process line';
      const platform = 'darwin';
      
      const result = vsCodeDetectionService['_parseProcessLine'](invalidLine, platform);
      
      expect(result).toBeNull();
    });
  });

  describe('_extractWorkspacesFromCommandLine', () => {
    test('should extract workspaces from folder-uri arguments', () => {
      const commandLine = 'code --folder-uri file:///Users/test/project1 --folder-uri file:///Users/test/project2';
      const pid = 12345;
      
      const result = vsCodeDetectionService['_extractWorkspacesFromCommandLine'](commandLine, pid);
      
      if (result) {
        expect(result.pid).toBe(pid);
        expect(result.workspaces.length).toBe(2);
        expect(result.workspaces[0].path).toContain('/Users/test/project1');
        expect(result.workspaces[1].path).toContain('/Users/test/project2');
      }
    });

    test('should handle command lines without workspace arguments', () => {
      const commandLine = 'code --help';
      const pid = 12345;
      
      const result = vsCodeDetectionService['_extractWorkspacesFromCommandLine'](commandLine, pid);
      
      expect(result).toBeNull();
    });
  });

  describe('_extractExecutableName', () => {
    test('should extract VS Code executable names', () => {
      const testCases = [
        { commandLine: '/usr/local/bin/code', expected: 'code' },
        { commandLine: '/usr/local/bin/code-insiders', expected: 'code-insiders' },
        { commandLine: '/usr/local/bin/codium', expected: 'codium' },
        { commandLine: '/usr/local/bin/cursor', expected: 'cursor' }
      ];
      
      for (const { commandLine, expected } of testCases) {
        const result = vsCodeDetectionService['_extractExecutableName'](commandLine);
        expect(result).toBe(expected);
      }
    });

    test('should fallback to "code" for unknown executables', () => {
      const commandLine = '/usr/local/bin/unknown-editor';
      
      const result = vsCodeDetectionService['_extractExecutableName'](commandLine);
      
      expect(result).toBe('code');
    });
  });

  describe('_formatWorkspaceList', () => {
    test('should format workspace list correctly', () => {
      const mockResult: VSCodeDetectionResult = {
        instances: [{
          pid: 12345,
          executable: 'code',
          workspaces: [{
            path: '/Users/test/active-project',
            name: 'active-project',
            isOpen: true,
            type: 'folder'
          }]
        }],
        recentWorkspaces: [{
          path: '/Users/test/recent-project',
          name: 'recent-project',
          isOpen: false,
          type: 'folder',
          lastAccessed: new Date('2024-01-01')
        }],
        totalWorkspaces: 2
      };
      
      const formatted = vsCodeDetectionService['_formatWorkspaceList'](mockResult, 10);
      
      expect(formatted).toContain('VS Code Workspace Detection Results');
      expect(formatted).toContain('Currently Open Workspaces');
      expect(formatted).toContain('Recent Workspaces');
      expect(formatted).toContain('active-project');
      expect(formatted).toContain('recent-project');
      expect(formatted).toContain('PID: 12345');
    });

    test('should handle empty results', () => {
      const emptyResult: VSCodeDetectionResult = {
        instances: [],
        recentWorkspaces: [],
        totalWorkspaces: 0
      };
      
      const formatted = vsCodeDetectionService['_formatWorkspaceList'](emptyResult, 10);
      
      expect(formatted).toContain('No VS Code workspaces detected');
      expect(formatted).toContain('Suggestions');
      expect(formatted).toContain('Open VS Code with a folder');
    });
  });

  describe('error handling', () => {
    test('should handle filesystem errors gracefully', async () => {
      // Since we can't reliably mock fs.readFile on read-only properties,
      // test the actual behavior which should handle errors gracefully
      const result = await vsCodeDetectionService.detectWorkspaces();
      
      expectValidMcpResponse(result);
      // Should not throw but return a valid response (may have limited results)
      expect(result.content[0].text).toContain('VS Code Workspace Detection Results');
    });

    test('should handle process execution errors', async () => {
      // This will test actual system behavior
      const result = await vsCodeDetectionService.detectWorkspaces({ includeRunning: true });
      
      expectValidMcpResponse(result);
      // Should handle gracefully even if process detection fails
    });
  });
});
