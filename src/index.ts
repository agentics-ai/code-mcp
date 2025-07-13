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
  CallToolRequest,
  ListToolsRequest,
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

class VSCodeAgentServer {
  private server: Server;
  private workspaceService: WorkspaceService;
  private fileService: FileService;
  private codeExecutionService: CodeExecutionService;
  private gitService: GitService;
  private processService: ProcessService;
  private analysisService: AnalysisService;
  private projectService: ProjectService;

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
    this.gitService = new GitService(this.workspaceService);
    this.processService = new ProcessService(this.workspaceService);
    this.analysisService = new AnalysisService(this.workspaceService, this.fileService);
    this.projectService = new ProjectService(this.workspaceService);

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

// Start the server
const server = new VSCodeAgentServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
