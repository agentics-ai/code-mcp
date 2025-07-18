/**
 * Test suite for DockerService - focused on actual public methods
 */
import { DockerService } from '../../src/services/DockerService.js';
import { jest } from '@jest/globals';
import { TestUtils } from '../utils.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('DockerService', () => {
  let dockerService: DockerService;
  let mockWorkspaceService: any;
  let tempWorkspace: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create temp workspace and mock service
    tempWorkspace = await TestUtils.createTempWorkspace('docker-service-test');
    mockWorkspaceService = TestUtils.createMockWorkspaceService(tempWorkspace);
    
    dockerService = new DockerService(mockWorkspaceService);
  });

  afterEach(async () => {
    if (tempWorkspace) {
      await TestUtils.cleanupTempWorkspace(tempWorkspace);
    }
  });

  describe('constructor', () => {
    it('should initialize with workspace service dependency', () => {
      expect(dockerService).toBeInstanceOf(DockerService);
      expect(mockWorkspaceService.getCurrentWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('parameter validation', () => {
    it('should handle missing tag parameter in buildImage', async () => {
      // Test with missing context (should fail because build context is required)
      await expect(dockerService.buildImage({ context: '/non/existent/path' } as any)).rejects.toThrow();
    });

    it('should handle missing image parameter in runContainer', async () => {
      await expect(dockerService.runContainer({} as any)).rejects.toThrow('image');
    });

    it('should handle missing action parameter in manageImages', async () => {
      await expect(dockerService.manageImages({} as any)).rejects.toThrow('action');
    });

    it('should handle unsupported language in generateDockerfile', async () => {
      await expect(dockerService.generateDockerfile('unsupported')).rejects.toThrow('Unsupported language');
    });
  });

  describe('generateDockerfile', () => {
    it('should generate Node.js Dockerfile', async () => {
      const result = await dockerService.generateDockerfile('node');
      
      expect(result.content[0].text).toContain('Dockerfile generated successfully');
      expect(result.content[0].text).toContain('FROM node:18');
      expect(result.content[0].text).toContain('WORKDIR /app');
      
      // Verify file was created
      const dockerfilePath = path.join(tempWorkspace, 'Dockerfile');
      const dockerfileExists = await TestUtils.fileExists(dockerfilePath);
      expect(dockerfileExists).toBe(true);
    });

    it('should generate Python Dockerfile', async () => {
      const result = await dockerService.generateDockerfile('python');
      
      expect(result.content[0].text).toContain('Dockerfile generated successfully');
      expect(result.content[0].text).toContain('FROM python:3.11-slim');
      expect(result.content[0].text).toContain('WORKDIR /app');
      
      // Verify file was created
      const dockerfilePath = path.join(tempWorkspace, 'Dockerfile');
      const dockerfileExists = await TestUtils.fileExists(dockerfilePath);
      expect(dockerfileExists).toBe(true);
    });

    it('should generate Java Dockerfile', async () => {
      const result = await dockerService.generateDockerfile('java');
      
      expect(result.content[0].text).toContain('Dockerfile generated successfully');
      expect(result.content[0].text).toContain('FROM openjdk:17-jdk-slim');
      expect(result.content[0].text).toContain('WORKDIR /app');
      
      // Verify file was created
      const dockerfilePath = path.join(tempWorkspace, 'Dockerfile');
      const dockerfileExists = await TestUtils.fileExists(dockerfilePath);
      expect(dockerfileExists).toBe(true);
    });

    it('should generate Go Dockerfile', async () => {
      const result = await dockerService.generateDockerfile('go');
      
      expect(result.content[0].text).toContain('Dockerfile generated successfully');
      expect(result.content[0].text).toContain('FROM golang:1.21-alpine');
      expect(result.content[0].text).toContain('WORKDIR /app');
      
      // Verify file was created
      const dockerfilePath = path.join(tempWorkspace, 'Dockerfile');
      const dockerfileExists = await TestUtils.fileExists(dockerfilePath);
      expect(dockerfileExists).toBe(true);
    });
  });

  describe('generateDockerCompose', () => {
    it('should generate compose file with database', async () => {
      const result = await dockerService.generateDockerCompose(['web', 'api'], true);
      
      expect(result.content[0].text).toContain('Docker Compose file generated successfully');
      expect(result.content[0].text).toContain('version: \'3.8\'');
      expect(result.content[0].text).toContain('services:');
      expect(result.content[0].text).toContain('web:');
      expect(result.content[0].text).toContain('api:');
      expect(result.content[0].text).toContain('db:');
      expect(result.content[0].text).toContain('postgres:15');
      
      // Verify file was created
      const composePath = path.join(tempWorkspace, 'docker-compose.yml');
      const composeExists = await TestUtils.fileExists(composePath);
      expect(composeExists).toBe(true);
    });

    it('should generate compose file without database', async () => {
      const result = await dockerService.generateDockerCompose(['web'], false);
      
      expect(result.content[0].text).toContain('Docker Compose file generated successfully');
      expect(result.content[0].text).toContain('version: \'3.8\'');
      expect(result.content[0].text).toContain('services:');
      expect(result.content[0].text).toContain('web:');
      expect(result.content[0].text).not.toContain('db:');
      expect(result.content[0].text).not.toContain('postgres');
      
      // Verify file was created
      const composePath = path.join(tempWorkspace, 'docker-compose.yml');
      const composeExists = await TestUtils.fileExists(composePath);
      expect(composeExists).toBe(true);
    });
  });

  describe('cleanupTrackedContainers', () => {
    it('should handle empty tracked containers', async () => {
      const result = await dockerService.cleanupTrackedContainers();

      expect(result.content[0].text).toContain('No tracked containers to clean up');
    });

    it('should return tracked containers map', () => {
      const trackedContainers = dockerService.getTrackedContainers();
      expect(trackedContainers).toBeInstanceOf(Map);
      expect(trackedContainers.size).toBe(0);
    });
  });

  describe('validation utilities', () => {
    it('should validate required parameters for manageContainers', async () => {
      await expect(dockerService.manageContainers({} as any)).rejects.toThrow('action');
    });

    it('should validate required parameters for manageNetworks', async () => {
      await expect(dockerService.manageNetworks({} as any)).rejects.toThrow('action');
    });

    it('should validate required parameters for manageVolumes', async () => {
      await expect(dockerService.manageVolumes({} as any)).rejects.toThrow('action');
    });

    it('should validate required parameters for systemOperations', async () => {
      await expect(dockerService.systemOperations({} as any)).rejects.toThrow('action');
    });

    it('should validate required parameters for dockerCompose', async () => {
      await expect(dockerService.dockerCompose({} as any)).rejects.toThrow('action');
    });
  });
});
