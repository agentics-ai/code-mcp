/**
 * Services module exports
 * Centralized exports for all service classes
 */

export { AnalysisService } from './AnalysisService.js';
export { CodeExecutionService } from './CodeExecutionService.js';
export { DockerService } from './DockerService.js';
export { FileService } from './FileService.js';
export { GitService } from './GitService.js';
export { ProcessService } from './ProcessService.js';
export { ProjectService } from './ProjectService.js';
export { VSCodeDetectionService } from './VSCodeDetectionService.js';
export { WorkspaceService } from './WorkspaceService.js';

// Enhanced services with codemcp-inspired improvements
export { ProjectConfigService } from './ProjectConfigService.js';
export { SecureCommandService } from './SecureCommandService.js';

// Export types/interfaces
export type {
  PythonExecutionArgs,
  JavaScriptExecutionArgs,
  CommandExecutionArgs,
  TestExecutionArgs,
  PackageInstallArgs,
  NpmCommandArgs
} from './CodeExecutionService.js';

export type {
  DockerBuildArgs,
  DockerRunArgs,
  DockerComposeArgs,
  DockerImageArgs,
  DockerContainerArgs,
  DockerNetworkArgs,
  DockerVolumeArgs,
  DockerSystemArgs
} from './DockerService.js';
