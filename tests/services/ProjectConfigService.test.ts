/**
 * Simple tests for the new ProjectConfigService
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ProjectConfigService } from '../../src/services/ProjectConfigService.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ProjectConfigService - Basic Tests', () => {
  let projectConfigService: ProjectConfigService;
  let workspaceService: WorkspaceService;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-config-test-'));
    
    workspaceService = new WorkspaceService();
    workspaceService.workspacePath = tempDir;
    
    projectConfigService = new ProjectConfigService(workspaceService);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should load default configuration when no config file exists', async () => {
    const config = await projectConfigService.loadProjectConfig();
    
    expect(config).toBeDefined();
    expect(config.allowedCommands).toContain('npm');
    expect(config.allowedCommands).toContain('git');
    expect(config.formatOnSave).toBe(true);
    expect(config.gitAutoCommit).toBe(true);
  });

  it('should save and load configuration', async () => {
    const testConfig = await projectConfigService.loadProjectConfig();
    testConfig.projectInstructions = 'Test project instructions';
    testConfig.allowedCommands.push('custom-command');

    const saveResult = await projectConfigService.saveProjectConfig(testConfig);
    expect(saveResult.isError).toBeFalsy();

    // Load again and verify
    const loadedConfig = await projectConfigService.loadProjectConfig();
    expect(loadedConfig.projectInstructions).toBe('Test project instructions');
    expect(loadedConfig.allowedCommands).toContain('custom-command');
  });

  it('should check if command is allowed', async () => {
    const isNpmAllowed = await projectConfigService.isCommandAllowed('npm install');
    expect(isNpmAllowed).toBe(true);

    const isRmAllowed = await projectConfigService.isCommandAllowed('rm -rf /');
    expect(isRmAllowed).toBe(false);
  });

  it('should start and manage coding sessions', async () => {
    const session = await projectConfigService.startCodingSession('Test session');
    
    expect(session).toBeDefined();
    expect(session.description).toBe('Test session');
    expect(session.isActive).toBe(true);
    
    const currentSession = projectConfigService.getCurrentSession();
    expect(currentSession).toBeDefined();
    expect(currentSession?.id).toBe(session.id);
    
    await projectConfigService.endCodingSession();
    expect(projectConfigService.getCurrentSession()).toBeUndefined();
  });

  it('should generate sample configuration', () => {
    const sampleConfig = projectConfigService.generateSampleConfig();
    
    expect(sampleConfig).toContain('[general]');
    expect(sampleConfig).toContain('formatOnSave');
    expect(sampleConfig).toContain('gitAutoCommit');
    expect(sampleConfig).toContain('[security]');
    expect(sampleConfig).toContain('allowedCommands');
    expect(sampleConfig).toContain('[customTools]');
    expect(sampleConfig).toContain('[remoteServer]');
  });

  it('should track commits in session', async () => {
    const session = await projectConfigService.startCodingSession('Commit test');
    
    projectConfigService.addCommitToSession('abc123');
    projectConfigService.addCommitToSession('def456');
    
    const currentSession = projectConfigService.getCurrentSession();
    expect(currentSession?.commitHashes).toContain('abc123');
    expect(currentSession?.commitHashes).toContain('def456');
    expect(currentSession?.commitHashes).toHaveLength(2);
  });
});
