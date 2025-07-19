/**
 * Simple tests for the SecureCommandService
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { SecureCommandService } from '../../src/services/SecureCommandService.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';

describe('SecureCommandService - Basic Tests', () => {
  let secureCommandService: SecureCommandService;
  let mockProjectConfigService: any;
  let mockGitAutoCommitService: any;
  let workspaceService: WorkspaceService;

  beforeEach(() => {
    // Create mocked services
    mockProjectConfigService = {
      isCommandAllowed: jest.fn(),
      loadProjectConfig: jest.fn(),
      saveProjectConfig: jest.fn(),
    };

    mockGitAutoCommitService = {
      autoCommitChanges: jest.fn(),
    };

    workspaceService = new WorkspaceService();
    
    secureCommandService = new SecureCommandService(
      mockProjectConfigService,
      mockGitAutoCommitService,
      workspaceService
    );
  });

  it('should block unauthorized commands', async () => {
    mockProjectConfigService.isCommandAllowed.mockResolvedValue(false);
    mockProjectConfigService.loadProjectConfig.mockResolvedValue({
      allowedCommands: ['npm', 'git'],
      gitAutoCommit: false,
      formatOnSave: false,
      sessionTracking: false,
    });

    const result = await secureCommandService.runCommand('rm -rf .');

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not allowed');
    expect(result.content[0].text).toContain('npm, git');
  });

  it('should get list of allowed commands', async () => {
    mockProjectConfigService.loadProjectConfig.mockResolvedValue({
      allowedCommands: ['npm', 'git', 'docker'],
      customTools: [
        { name: 'test-tool', command: 'echo test', description: 'Test tool' }
      ],
      gitAutoCommit: false,
      formatOnSave: false,
      sessionTracking: false,
    });

    const result = await secureCommandService.getAllowedCommands();

    expect(result.content[0].text).toContain('• npm');
    expect(result.content[0].text).toContain('• git'); 
    expect(result.content[0].text).toContain('• docker');
    expect(result.content[0].text).toContain('Custom Tools:');
    expect(result.content[0].text).toContain('test-tool: Test tool');
  });

  it('should add new allowed command', async () => {
    const mockConfig = {
      allowedCommands: ['npm', 'git'],
      gitAutoCommit: false,
      formatOnSave: false,
      sessionTracking: false,
    };

    mockProjectConfigService.loadProjectConfig.mockResolvedValue(mockConfig);
    mockProjectConfigService.saveProjectConfig.mockResolvedValue({
      content: [{ type: 'text', text: 'Config saved' }]
    });

    const result = await secureCommandService.addAllowedCommand('docker');

    expect(result.content[0].text).toContain('docker');
    expect(result.content[0].text).toContain('added to allowed list');
    expect(mockConfig.allowedCommands).toContain('docker');
    expect(mockProjectConfigService.saveProjectConfig).toHaveBeenCalledWith(mockConfig);
  });

  it('should not add duplicate command', async () => {
    mockProjectConfigService.loadProjectConfig.mockResolvedValue({
      allowedCommands: ['npm', 'git'],
      gitAutoCommit: false,
      formatOnSave: false,
      sessionTracking: false,
    });

    const result = await secureCommandService.addAllowedCommand('npm');

    expect(result.content[0].text).toContain('already allowed');
    expect(mockProjectConfigService.saveProjectConfig).not.toHaveBeenCalled();
  });

  it('should remove allowed command', async () => {
    const mockConfig = {
      allowedCommands: ['npm', 'git', 'docker'],
      gitAutoCommit: false,
      formatOnSave: false,
      sessionTracking: false,
    };

    mockProjectConfigService.loadProjectConfig.mockResolvedValue(mockConfig);
    mockProjectConfigService.saveProjectConfig.mockResolvedValue({
      content: [{ type: 'text', text: 'Config saved' }]
    });

    const result = await secureCommandService.removeAllowedCommand('docker');

    expect(result.content[0].text).toContain('docker');
    expect(result.content[0].text).toContain('removed from allowed list');
    expect(mockConfig.allowedCommands).not.toContain('docker');
    expect(mockProjectConfigService.saveProjectConfig).toHaveBeenCalledWith(mockConfig);
  });

  it('should handle non-existent custom tool', async () => {
    mockProjectConfigService.loadProjectConfig.mockResolvedValue({
      customTools: [],
      allowedCommands: [],
      gitAutoCommit: false,
      formatOnSave: false,
      sessionTracking: false,
    });

    const result = await secureCommandService.runCustomTool('nonexistent');

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found in project configuration');
  });
});
