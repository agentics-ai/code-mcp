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

  describe('Focused Docker Tools - Token Efficiency', () => {
    describe('focused Docker Compose tools', () => {
      describe('dockerComposeUp', () => {
        it('should call dockerCompose with up action', async () => {
          const dockerComposeSpy = jest.spyOn(dockerService, 'dockerCompose')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Services started' }]
            });

          const result = await dockerService.dockerComposeUp({
            file: 'docker-compose.yml',
            services: ['web', 'db'],
            detach: true,
            build: true
          });

          expect(dockerComposeSpy).toHaveBeenCalledWith({
            action: 'up',
            file: 'docker-compose.yml',
            service: 'web', // First service
            detach: true,
            build: true,
            project_name: undefined
          });

          expect(result.content[0].text).toContain('Services started');
        });
      });

      describe('dockerComposeDown', () => {
        it('should call dockerCompose with down action', async () => {
          const dockerComposeSpy = jest.spyOn(dockerService, 'dockerCompose')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Services stopped' }]
            });

          const result = await dockerService.dockerComposeDown({
            file: 'custom-compose.yml',
            volumes: true,
            remove_orphans: true
          });

          expect(dockerComposeSpy).toHaveBeenCalledWith({
            action: 'down',
            file: 'custom-compose.yml',
            remove_volumes: true,
            remove_orphans: true,
            project_name: undefined
          });

          expect(result.content[0].text).toContain('Services stopped');
        });
      });

      describe('dockerComposeLogs', () => {
        it('should call dockerCompose with logs action', async () => {
          const dockerComposeSpy = jest.spyOn(dockerService, 'dockerCompose')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Container logs' }]
            });

          const result = await dockerService.dockerComposeLogs({
            services: ['api'],
            follow: true,
            tail: 100
          });

          expect(dockerComposeSpy).toHaveBeenCalledWith({
            action: 'logs',
            file: undefined,
            service: 'api',
            follow: true,
            tail: 100,
            project_name: undefined
          });

          expect(result.content[0].text).toContain('Container logs');
        });
      });

      describe('dockerComposeRestart', () => {
        it('should call dockerCompose with restart action', async () => {
          const dockerComposeSpy = jest.spyOn(dockerService, 'dockerCompose')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Services restarted' }]
            });

          const result = await dockerService.dockerComposeRestart({
            services: ['web'],
            project_name: 'myproject'
          });

          expect(dockerComposeSpy).toHaveBeenCalledWith({
            action: 'restart',
            file: undefined,
            service: 'web',
            project_name: 'myproject'
          });

          expect(result.content[0].text).toContain('Services restarted');
        });
      });
    });

    describe('focused Docker container tools', () => {
      describe('dockerContainerStart', () => {
        it('should call manageContainers with start action', async () => {
          const manageContainersSpy = jest.spyOn(dockerService, 'manageContainers')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Container started' }]
            });

          const result = await dockerService.dockerContainerStart({
            container: 'my-container'
          });

          expect(manageContainersSpy).toHaveBeenCalledWith({
            action: 'start',
            container: 'my-container'
          });

          expect(result.content[0].text).toContain('Container started');
        });
      });

      describe('dockerContainerStop', () => {
        it('should call manageContainers with stop action', async () => {
          const manageContainersSpy = jest.spyOn(dockerService, 'manageContainers')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Container stopped' }]
            });

          const result = await dockerService.dockerContainerStop({
            container: 'my-container',
            timeout: 30
          });

          expect(manageContainersSpy).toHaveBeenCalledWith({
            action: 'stop',
            container: 'my-container',
            time: 30
          });

          expect(result.content[0].text).toContain('Container stopped');
        });
      });

      describe('dockerContainerRestart', () => {
        it('should call manageContainers with restart action', async () => {
          const manageContainersSpy = jest.spyOn(dockerService, 'manageContainers')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Container restarted' }]
            });

          const result = await dockerService.dockerContainerRestart({
            container: 'my-container',
            timeout: 10
          });

          expect(manageContainersSpy).toHaveBeenCalledWith({
            action: 'restart',
            container: 'my-container',
            time: 10
          });

          expect(result.content[0].text).toContain('Container restarted');
        });
      });

      describe('dockerContainerRemove', () => {
        it('should call manageContainers with remove action', async () => {
          const manageContainersSpy = jest.spyOn(dockerService, 'manageContainers')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Container removed' }]
            });

          const result = await dockerService.dockerContainerRemove({
            container: 'my-container',
            force: true,
            volumes: true
          });

          expect(manageContainersSpy).toHaveBeenCalledWith({
            action: 'remove',
            container: 'my-container',
            force: true,
            volumes: true
          });

          expect(result.content[0].text).toContain('Container removed');
        });
      });

      describe('dockerContainerLogs', () => {
        it('should call manageContainers with logs action', async () => {
          const manageContainersSpy = jest.spyOn(dockerService, 'manageContainers')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Container logs output' }]
            });

          const result = await dockerService.dockerContainerLogs({
            container: 'my-container',
            follow: true,
            tail: 50,
            since: '1h'
          });

          expect(manageContainersSpy).toHaveBeenCalledWith({
            action: 'logs',
            container: 'my-container',
            follow: true,
            tail: 50,
            since: '1h'
          });

          expect(result.content[0].text).toContain('Container logs output');
        });
      });

      describe('dockerContainerExec', () => {
        it('should call manageContainers with exec action', async () => {
          const manageContainersSpy = jest.spyOn(dockerService, 'manageContainers')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Command executed' }]
            });

          const result = await dockerService.dockerContainerExec({
            container: 'my-container',
            command: 'bash -c "ls -la"',
            interactive: true,
            tty: true
          });

          expect(manageContainersSpy).toHaveBeenCalledWith({
            action: 'exec',
            container: 'my-container',
            command: 'bash -c "ls -la"',
            interactive: true,
            tty: true
          });

          expect(result.content[0].text).toContain('Command executed');
        });
      });
    });

    describe('focused Docker image tools', () => {
      describe('dockerImagePull', () => {
        it('should call manageImages with pull action', async () => {
          const manageImagesSpy = jest.spyOn(dockerService, 'manageImages')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Image pulled' }]
            });

          const result = await dockerService.dockerImagePull({
            image: 'nginx:latest',
            all_tags: false
          });

          expect(manageImagesSpy).toHaveBeenCalledWith({
            action: 'pull',
            image: 'nginx:latest',
            all: false
          });

          expect(result.content[0].text).toContain('Image pulled');
        });
      });

      describe('dockerImagePush', () => {
        it('should call manageImages with push action', async () => {
          const manageImagesSpy = jest.spyOn(dockerService, 'manageImages')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Image pushed' }]
            });

          const result = await dockerService.dockerImagePush({
            image: 'myapp:v1.0',
            all_tags: true
          });

          expect(manageImagesSpy).toHaveBeenCalledWith({
            action: 'push',
            image: 'myapp:v1.0',
            all: true
          });

          expect(result.content[0].text).toContain('Image pushed');
        });
      });

      describe('dockerImageRemove', () => {
        it('should call manageImages with remove action', async () => {
          const manageImagesSpy = jest.spyOn(dockerService, 'manageImages')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Image removed' }]
            });

          const result = await dockerService.dockerImageRemove({
            image: 'old-image:v1.0',
            force: true,
            no_prune: false
          });

          expect(manageImagesSpy).toHaveBeenCalledWith({
            action: 'remove',
            image: 'old-image:v1.0',
            force: true,
            no_prune: false
          });

          expect(result.content[0].text).toContain('Image removed');
        });
      });

      describe('dockerImageBuild', () => {
        it('should call buildImage with build arguments', async () => {
          const buildImageSpy = jest.spyOn(dockerService, 'buildImage')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Image built successfully' }]
            });

          const result = await dockerService.dockerImageBuild({
            context: './app',
            dockerfile: 'Dockerfile.prod',
            tag: 'myapp:latest',
            build_args: { NODE_ENV: 'production' },
            no_cache: true
          });

          expect(buildImageSpy).toHaveBeenCalledWith({
            context: './app',
            dockerfile: 'Dockerfile.prod',
            tag: 'myapp:latest',
            build_args: { NODE_ENV: 'production' },
            no_cache: true
          });

          expect(result.content[0].text).toContain('Image built successfully');
        });
      });

      describe('dockerImageTag', () => {
        it('should call manageImages with tag action', async () => {
          const manageImagesSpy = jest.spyOn(dockerService, 'manageImages')
            .mockResolvedValue({
              content: [{ type: 'text', text: 'Image tagged' }]
            });

          const result = await dockerService.dockerImageTag({
            source: 'myapp:latest',
            target: 'myapp:v1.0'
          });

          expect(manageImagesSpy).toHaveBeenCalledWith({
            action: 'tag',
            image: 'myapp:latest',
            tag: 'myapp:v1.0'
          });

          expect(result.content[0].text).toContain('Image tagged');
        });
      });
    });

    describe('error propagation', () => {
      it('should propagate errors from underlying methods', async () => {
        jest.spyOn(dockerService, 'manageContainers')
          .mockResolvedValue({
            isError: true,
            content: [{ type: 'text', text: 'Container not found' }]
          });

        const result = await dockerService.dockerContainerStart({
          container: 'nonexistent'
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Container not found');
      });
    });
  });
});
