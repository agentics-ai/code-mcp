#!/usr/bin/env node
/**
 * Refactored VS Code Agent MCP Server with service-oriented architecture
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';

// Import configuration and tool definitions
import { SERVER_CONFIG } from './constants.js';
import { TOOL_DEFINITIONS } from './toolDefinitions.js';
import { ToolResult } from './types.js';

// Import services
import { WorkspaceService } from './services/WorkspaceService.js';
import { FileService } from './services/FileService.js';
import { 
  CodeExecutionService, 
  CommandExecutionArgs, 
  TestExecutionArgs, 
  NpmCommandArgs 
} from './services/CodeExecutionService.js';
import { 
  DockerService,
  DockerBuildArgs,
  DockerRunArgs,
  DockerComposeArgs,
  DockerImageArgs,
  DockerContainerArgs,
  DockerNetworkArgs,
  DockerVolumeArgs,
  DockerSystemArgs
} from './services/DockerService.js';
import { 
  GitService, 
  GitCommitArgs, 
  GitBranchArgs 
} from './services/GitService.js';
import { ProcessService, StartServerArgs, StopServerArgs } from './services/ProcessService.js';
import { 
  AnalysisService, 
  AnalyzeCodeArgs, 
  SearchCodeArgs 
} from './services/AnalysisService.js';
import { ProjectService, CreateProjectArgs } from './services/ProjectService.js';
import { VSCodeDetectionService, DetectWorkspacesArgs } from './services/VSCodeDetectionService.js';

// Enhanced services with codemcp-inspired improvements
import { ProjectConfigService } from './services/ProjectConfigService.js';
import { SecureCommandService } from './services/SecureCommandService.js';

export class VSCodeAgentServer {
  private server: Server;
  private workspaceService: WorkspaceService;
  private fileService: FileService;
  private codeExecutionService: CodeExecutionService;
  private dockerService: DockerService;
  private gitService: GitService;
  private processService: ProcessService;
  private analysisService: AnalysisService;
  private projectService: ProjectService;
  private vsCodeDetectionService: VSCodeDetectionService;
  
  // Enhanced services
  private projectConfigService: ProjectConfigService;
  private secureCommandService: SecureCommandService;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize services
    this.workspaceService = new WorkspaceService();
    this.fileService = new FileService(this.workspaceService);
    this.codeExecutionService = new CodeExecutionService(this.workspaceService);
    this.dockerService = new DockerService(this.workspaceService);
    this.gitService = new GitService(this.workspaceService);
    this.processService = new ProcessService(this.workspaceService);
    this.analysisService = new AnalysisService(this.workspaceService, this.fileService);
    this.projectService = new ProjectService(this.workspaceService);
    this.vsCodeDetectionService = new VSCodeDetectionService();
    
    // Initialize enhanced services
    this.projectConfigService = new ProjectConfigService(this.workspaceService);
    this.secureCommandService = new SecureCommandService(
      this.projectConfigService,
      this.gitService,
      this.workspaceService
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers(): void {
    // Register tool list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS,
    }));

    // Register tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      try {
        const { name, arguments: args } = request.params;
        return await this.executeToolCommand(name, args || {});
      } catch (error) {
        if (error instanceof McpError) throw error;
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${message}`);
      }
    });
  }

  async executeToolCommand(name: string, args: Record<string, any>): Promise<ToolResult> {
    switch (name) {
      // Workspace Management
      case 'get_workspace':
        return await this.workspaceService.getWorkspace();
      case 'set_workspace':
        const success = this.workspaceService.setWorkspace(args.path);
        return {
          content: [{
            type: 'text',
            text: success ? `Workspace set to: ${args.path}` : `Failed to set workspace: ${args.path}`
          }],
          isError: !success
        };
      case 'list_workspaces':
        return await this.workspaceService.listWorkspaces();
      case 'detect_vscode_workspaces':
        return await this.vsCodeDetectionService.detectWorkspaces(args as DetectWorkspacesArgs);
      case 'present_workspace_choice':
        // For now, just call the method without args since it doesn't need them
        const detectionResult = await this.vsCodeDetectionService.detectWorkspaces();
        return await this.vsCodeDetectionService.presentWorkspaceChoice();
      case 'auto_select_workspace':
        return await this.vsCodeDetectionService.autoSelectWorkspace();
      case 'smart_workspace_init':
        return await this.workspaceService.smartInitializeWorkspace();
        
      // File Operations
      case 'read_file':
        return await this.fileService.readFile(args.path, args);
      case 'write_file':
        return await this.fileService.writeFile(args.path, args.content, args);
      case 'list_directory':
        return await this.fileService.listDirectory(args.path, args);
      case 'create_directory':
        return await this.fileService.createDirectory(args.path);
      case 'delete_file':
        return await this.fileService.deleteFile(args.path);
      case 'move_file':
        return await this.fileService.moveFile(args.source, args.destination);
      
      // Code Execution
      case 'run_python':
        return await this.codeExecutionService.runPython(args);
      case 'run_javascript':
        return await this.codeExecutionService.runJavaScript(args);
      case 'run_command':
        return await this.codeExecutionService.runCommand(args as CommandExecutionArgs);
      case 'pip_install':
        return await this.codeExecutionService.pipInstall(args);
      case 'npm_command':
        return await this.codeExecutionService.npmCommand(args as NpmCommandArgs);
      case 'run_tests':
        return await this.codeExecutionService.runTests(args as TestExecutionArgs);
      
      // Git Operations
      case 'git_status':
        return await this.gitService.gitStatus(args);
      case 'git_diff':
        return await this.gitService.gitDiff(args);
      case 'git_add':
        return await this.gitService.gitAdd(args);
      case 'git_commit':
        return await this.gitService.gitCommit(args as GitCommitArgs);
      case 'git_push':
        return await this.gitService.gitPush(args);
      case 'git_pull':
        return await this.gitService.gitPull(args);
      case 'git_branch':
        return await this.gitService.gitBranch(args as GitBranchArgs);
      case 'git_log':
        return await this.gitService.gitLog(args);
      
      // Docker Operations
      case 'docker_check_availability':
        return await this.dockerService.checkDockerAvailability();
      case 'docker_build':
        return await this.dockerService.buildImage(args as DockerBuildArgs);
      case 'docker_run':
        return await this.dockerService.runContainer(args as DockerRunArgs);
      case 'docker_compose':
        return await this.dockerService.dockerCompose(args as DockerComposeArgs);
      case 'docker_images':
        return await this.dockerService.manageImages(args as DockerImageArgs);
      case 'docker_containers':
        return await this.dockerService.manageContainers(args as DockerContainerArgs);
      case 'docker_networks':
        return await this.dockerService.manageNetworks(args as DockerNetworkArgs);
      case 'docker_volumes':
        return await this.dockerService.manageVolumes(args as DockerVolumeArgs);
      case 'docker_system':
        return await this.dockerService.systemOperations(args as DockerSystemArgs);
      case 'generate_dockerfile':
        return await this.dockerService.generateDockerfile(args.language, args.framework);
      case 'generate_docker_compose':
        return await this.dockerService.generateDockerCompose(args.services, args.include_database);
      case 'docker_cleanup':
        return await this.dockerService.cleanupTrackedContainers();
      
      // Code Analysis
      case 'analyze_code':
        return await this.analysisService.analyzeCode(args as AnalyzeCodeArgs);
      case 'search_code':
        return await this.analysisService.searchCode(args as SearchCodeArgs);
      
      // Project Management
      case 'create_project':
        return await this.projectService.createProject(args as CreateProjectArgs);
      case 'install_dependencies':
        return await this.processService.installDependencies(args);
      
      // Process Management
      case 'start_server':
        return await this.processService.startServer(args as StartServerArgs);
      case 'stop_server':
        return await this.processService.stopServer(args as StopServerArgs);
      case 'list_processes':
        return await this.processService.listProcesses();
      
      // Enhanced MCP Features - codemcp-inspired improvements
      
      // Project Configuration Management
      case 'load_project_config':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(await this.projectConfigService.loadProjectConfig(args.path), null, 2)
          }]
        };
      case 'save_project_config':
        return await this.projectConfigService.saveProjectConfig(args.config, args.path);
      case 'update_project_config':
        const currentConfig = await this.projectConfigService.loadProjectConfig();
        const updatedConfig = { ...currentConfig, ...args };
        return await this.projectConfigService.saveProjectConfig(updatedConfig);
      case 'generate_sample_config':
        const sampleConfig = this.projectConfigService.generateSampleConfig();
        if (args.saveToFile) {
          await this.fileService.writeFile('.vscode-mcp.toml', sampleConfig);
          return {
            content: [{
              type: 'text',
              text: 'Sample configuration saved to .vscode-mcp.toml'
            }]
          };
        }
        return {
          content: [{
            type: 'text',
            text: sampleConfig
          }]
        };

      // Session Management
      case 'start_coding_session':
        const session = await this.projectConfigService.startCodingSession(args.description, args.branch);
        return {
          content: [{
            type: 'text',
            text: `Started coding session: ${session.description}\n` +
                  `Session ID: ${session.id}\n` +
                  `Started at: ${session.startTime}` +
                  (session.branch ? `\nBranch: ${session.branch}` : '')
          }]
        };
      case 'end_coding_session':
        await this.projectConfigService.endCodingSession();
        return {
          content: [{
            type: 'text',
            text: 'Coding session ended'
          }]
        };
      case 'get_current_session':
        const currentSession = this.projectConfigService.getCurrentSession();
        if (!currentSession) {
          return {
            content: [{
              type: 'text',
              text: 'No active coding session'
            }]
          };
        }
        return {
          content: [{
            type: 'text',
            text: `Current Session:\n` +
                  `ID: ${currentSession.id}\n` +
                  `Description: ${currentSession.description}\n` +
                  `Started: ${currentSession.startTime}\n` +
                  `Commits: ${currentSession.commitHashes.length}` +
                  (currentSession.branch ? `\nBranch: ${currentSession.branch}` : '') +
                  `\nStatus: ${currentSession.isActive ? 'Active' : 'Inactive'}`
          }]
        };
      case 'get_session_history':
        return await this.gitService.getSessionHistory(args.limit);

      // Secure Command Execution
      case 'secure_run_command':
        return await this.secureCommandService.runCommand(args.command, {
          cwd: args.cwd,
          timeout: args.timeout,
          env: args.env,
          commitResult: args.commitResult,
          commitMessage: args.commitMessage
        });
      case 'secure_run_command_sequence':
        return await this.secureCommandService.runCommandSequence(args.commands, {
          cwd: args.cwd,
          timeout: args.timeout,
          commitResult: args.commitResult,
          commitMessage: args.commitMessage
        });
      case 'get_allowed_commands':
        return await this.secureCommandService.getAllowedCommands();
      case 'add_allowed_command':
        return await this.secureCommandService.addAllowedCommand(args.command);
      case 'remove_allowed_command':
        return await this.secureCommandService.removeAllowedCommand(args.command);
      case 'run_custom_tool':
        return await this.secureCommandService.runCustomTool(args.toolName, args.args);

      // Enhanced Git Operations
      case 'preview_changes':
        return await this.gitService.previewChanges();
      case 'auto_commit_changes':
        return await this.gitService.autoCommitChanges({
          message: args.message,
          files: args.files,
          amendSession: args.amendSession
        });
      case 'get_session_history':
        return await this.gitService.getSessionHistory();

      // Enhanced File Operations
      case 'enhanced_write_file':
        return await this.fileService.writeFile(args.path, args.content, {
          skipAutoFormat: args.skipAutoFormat,
          skipAutoCommit: args.skipAutoCommit,
          commitMessage: args.commitMessage,
          formatCommand: args.formatCommand
        });
      case 'enhanced_create_file':
        return await this.fileService.createFile(args.path, args.content, {
          skipAutoFormat: args.skipAutoFormat,
          skipAutoCommit: args.skipAutoCommit,
          commitMessage: args.commitMessage
        });
      case 'format_file':
        return await this.fileService.formatFile(args.path, args.formatCommand);
      case 'format_project':
        return await this.fileService.formatProject();

      // Additional Productivity Tools
      case 'set_project_context':
        const config = await this.projectConfigService.loadProjectConfig();
        config.projectInstructions = args.context;
        if (args.persist) {
          await this.projectConfigService.saveProjectConfig(config);
        }
        return {
          content: [{
            type: 'text',
            text: args.persist ? 'Project context saved to configuration' : 'Project context set for current session'
          }]
        };



      // Focused Docker Tools - Better Token Efficiency
      case 'docker_compose_up':
        return await this.dockerService.dockerComposeUp(args as any);
      case 'docker_compose_down':
        return await this.dockerService.dockerComposeDown(args as any);
      case 'docker_compose_logs':
        return await this.dockerService.dockerComposeLogs(args as any);
      case 'docker_compose_restart':
        return await this.dockerService.dockerComposeRestart(args as any);
      case 'docker_container_start':
        return await this.dockerService.dockerContainerStart(args as any);
      case 'docker_container_stop':
        return await this.dockerService.dockerContainerStop(args as any);
      case 'docker_container_restart':
        return await this.dockerService.dockerContainerRestart(args as any);
      case 'docker_container_remove':
        return await this.dockerService.dockerContainerRemove(args as any);
      case 'docker_container_logs':
        return await this.dockerService.dockerContainerLogs(args as any);
      case 'docker_container_exec':
        return await this.dockerService.dockerContainerExec(args as any);
      case 'docker_image_pull':
        return await this.dockerService.dockerImagePull(args as any);
      case 'docker_image_push':
        return await this.dockerService.dockerImagePush(args as any);
      case 'docker_image_remove':
        return await this.dockerService.dockerImageRemove(args as any);
      case 'docker_image_build':
        return await this.dockerService.dockerImageBuild(args as any);
      case 'docker_image_tag':
        return await this.dockerService.dockerImageTag(args as any);

      // Focused Git Tools - Better Token Efficiency
      case 'git_branch_list':
        return await this.gitService.gitBranchList(args as any);
      case 'git_branch_create':
        return await this.gitService.gitBranchCreate(args as any);
      case 'git_branch_switch':
        return await this.gitService.gitBranchSwitch(args as any);
      case 'git_branch_delete':
        return await this.gitService.gitBranchDelete(args as any);
      case 'git_branch_merge':
        return await this.gitService.gitBranchMerge(args as any);

      // Enhanced Git Diff Operations
      case 'enhanced_git_diff':
        return await this.gitService.enhancedGitDiff(args);
      case 'get_diff_stats':
        return await this.gitService.getDiffStats(args);
      case 'compare_commits':
        return await this.gitService.compareCommits(args.commit1, args.commit2, args.options || {});
      case 'preview_changes_enhanced':
        return await this.gitService.previewChangesEnhanced(args);

      // Enhanced File Operations
      case 'compare_files':
        return await this.fileService.compareFiles(args as any);
      case 'analyze_file_differences':
        return await this.fileService.analyzeFileDifferences(args.file1, args.file2);
      case 'apply_patch':
        return await this.fileService.applyPatch(args.patchFile, args.options || {});
      case 'create_patch':
        return await this.fileService.createPatch(args.source, args.target, args.outputFile);
      case 'find_and_replace':
        return await this.fileService.findAndReplace(args.searchPattern, args.replacement, {
          files: args.files,
          filePattern: args.filePattern,
          regex: args.regex,
          caseSensitive: args.caseSensitive,
          wholeWord: args.wholeWord,
          preview: args.preview,
          backup: args.backup
        });

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  setupErrorHandling(): void {
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async cleanup(): Promise<void> {
    try {
      // Stop all running processes
      await this.processService.stopAllProcesses();
      console.error('VS Code Agent MCP Server shutting down...');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('VS Code Agent MCP Server running on stdio');
  }
}

// CLI functionality
function showHelp(): void {
  console.log(`
Code MCP Server v${SERVER_CONFIG.version} (Experimental)

An experimental Model Context Protocol (MCP) server that aims to enable AI 
assistants like Claude to interact with VS Code workspaces. This project is 
still in active development - please use with caution.

Usage:
  npx code-mcp                    Start the MCP server
  npx code-mcp --help, -h        Show this help message
  npx code-mcp --version, -v     Show version information
  npx code-mcp --config          Generate Claude Desktop configuration

Experimental Features:
  • 🎯 Workspace Management (basic implementation)
  • 🛡️ Project Configuration (.vscode-mcp.toml - still evolving)
  • 📂 File Operations (core functionality working)
  • ⚡ Code Execution (Python, JavaScript - experimental)
  • 🔧 Git Integration (basic workflow support)
  • 🐳 Docker Integration (limited container operations)
  • 🏗️ Project Scaffolding (basic templates)
  • 🔍 Code Analysis (experimental features)

⚠️  Warning: This is experimental software. Test thoroughly in development 
    environments before using with important projects.

Configuration:
  Place a .vscode-mcp.toml file in your project root for project-specific settings.
  Run 'npx code-mcp --config' to generate Claude Desktop configuration.
  (Configuration format may change as we refine the system)

Documentation:
  https://github.com/agentics-ai/code-mcp#readme

Issues & Feedback:
  https://github.com/agentics-ai/code-mcp/issues
  (We especially welcome reports of what works and what doesn't!)
`);
}

function showVersion(): void {
  console.log(`Code MCP Server v${SERVER_CONFIG.version}`);
}

function generateClaudeConfig(): void {
  const config = {
    mcpServers: {
      "code-mcp": {
        command: "npx",
        args: ["code-mcp"],
        env: {
          NODE_ENV: "production"
        }
      }
    }
  };

  console.log(`
Claude Desktop Configuration:

Add this to your Claude Desktop configuration file:

${JSON.stringify(config, null, 2)}

Configuration file locations:
• macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
• Linux: ~/.config/Claude/claude_desktop_config.json  
• Windows: %APPDATA%\\Claude\\claude_desktop_config.json

After adding the configuration, restart Claude Desktop.
`);
}

// Handle CLI arguments
function handleCLI(): boolean {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return true;
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return true;
  }
  
  if (args.includes('--config')) {
    generateClaudeConfig();
    return true;
  }
  
  return false;
}

// Start the server
if (handleCLI()) {
  process.exit(0);
}

const server = new VSCodeAgentServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
