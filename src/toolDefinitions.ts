/**
 * Tool definitions for the VS Code Agent Server
 */
import { ToolDefinition } from './types.js';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // Workspace Management
  {
    name: 'get_workspace',
    description: 'Get current workspace path',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_workspace',
    description: 'Set the active workspace directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to workspace directory' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_workspaces',
    description: 'List recently used workspaces',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'detect_vscode_workspaces',
    description: 'Automatically detect open VS Code instances and their workspaces',
    inputSchema: {
      type: 'object',
      properties: {
        includeRecent: { type: 'boolean', description: 'Include recent workspaces from VS Code history' },
        includeRunning: { type: 'boolean', description: 'Include currently running VS Code instances' },
        maxResults: { type: 'number', description: 'Maximum number of workspaces to return' },
      },
    },
  },
  {
    name: 'present_workspace_choice',
    description: 'Present detected workspaces to user for selection',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'auto_select_workspace',
    description: 'Automatically select the most appropriate VS Code workspace',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'smart_workspace_init',
    description: 'Intelligently initialize workspace with VS Code detection and user choice',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // File Operations
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to write' },
        content: { type: 'string', description: 'Content to write to the file' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_directory',
    description: 'List contents of a directory with details',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the directory' },
        recursive: { type: 'boolean', description: 'List recursively' },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_directory',
    description: 'Create a new directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path for the new directory' },
      },
      required: ['path'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file or directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'move_file',
    description: 'Move or rename a file or directory',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source path' },
        destination: { type: 'string', description: 'Destination path' },
      },
      required: ['source', 'destination'],
    },
  },

  // Code Execution
  {
    name: 'run_python',
    description: 'Execute Python code or script',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Python code to execute' },
        script_path: { type: 'string', description: 'Path to Python script file' },
        args: { type: 'array', items: { type: 'string' }, description: 'Command line arguments' },
        venv: { type: 'string', description: 'Path to virtual environment' },
      },
    },
  },
  {
    name: 'run_javascript',
    description: 'Execute JavaScript code or script with Node.js',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute' },
        script_path: { type: 'string', description: 'Path to JavaScript file' },
        args: { type: 'array', items: { type: 'string' }, description: 'Command line arguments' },
      },
    },
  },
  {
    name: 'run_command',
    description: 'Execute a shell command',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        cwd: { type: 'string', description: 'Working directory' },
        env: { type: 'object', description: 'Environment variables' },
      },
      required: ['command'],
    },
  },

  // Package Management
  {
    name: 'pip_install',
    description: 'Install Python packages using pip',
    inputSchema: {
      type: 'object',
      properties: {
        packages: { type: 'array', items: { type: 'string' }, description: 'Package names' },
        requirements_file: { type: 'string', description: 'Path to requirements.txt' },
        venv: { type: 'string', description: 'Path to virtual environment' },
      },
    },
  },
  {
    name: 'npm_command',
    description: 'Run npm commands (install, test, build, etc)',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'npm command (install, test, run, etc)' },
        args: { type: 'array', items: { type: 'string' }, description: 'Additional arguments' },
        cwd: { type: 'string', description: 'Working directory' },
      },
      required: ['command'],
    },
  },

  // Testing
  {
    name: 'run_tests',
    description: 'Run tests using appropriate test runner',
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', description: 'Programming language' },
        framework: { type: 'string', description: 'Test framework (pytest, jest, mocha, etc)' },
        path: { type: 'string', description: 'Path to test file or directory' },
        pattern: { type: 'string', description: 'Test file pattern' },
      },
      required: ['language'],
    },
  },

  // Git Operations
  {
    name: 'git_status',
    description: 'Get git repository status',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Repository path' },
      },
    },
  },
  {
    name: 'git_diff',
    description: 'Show git diff',
    inputSchema: {
      type: 'object',
      properties: {
        staged: { type: 'boolean', description: 'Show staged changes' },
        file: { type: 'string', description: 'Specific file to diff' },
        cwd: { type: 'string', description: 'Repository path' },
      },
    },
  },
  {
    name: 'git_add',
    description: 'Stage files for commit',
    inputSchema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' }, description: 'Files to stage' },
        all: { type: 'boolean', description: 'Stage all changes' },
        cwd: { type: 'string', description: 'Repository path' },
      },
    },
  },
  {
    name: 'git_commit',
    description: 'Commit staged changes',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Commit message' },
        cwd: { type: 'string', description: 'Repository path' },
      },
      required: ['message'],
    },
  },
  {
    name: 'git_push',
    description: 'Push commits to remote',
    inputSchema: {
      type: 'object',
      properties: {
        remote: { type: 'string', description: 'Remote name' },
        branch: { type: 'string', description: 'Branch name' },
        cwd: { type: 'string', description: 'Repository path' },
      },
    },
  },
  {
    name: 'git_pull',
    description: 'Pull changes from remote',
    inputSchema: {
      type: 'object',
      properties: {
        remote: { type: 'string', description: 'Remote name' },
        branch: { type: 'string', description: 'Branch name' },
        cwd: { type: 'string', description: 'Repository path' },
      },
    },
  },
  {
    name: 'git_branch',
    description: 'List, create, or switch branches',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action to perform' },
        name: { type: 'string', description: 'Branch name (for create/switch)' },
        cwd: { type: 'string', description: 'Repository path' },
      },
      required: ['action'],
    },
  },
  {
    name: 'git_log',
    description: 'Show commit history',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of commits to show' },
        oneline: { type: 'boolean', description: 'One line format' },
        cwd: { type: 'string', description: 'Repository path' },
      },
    },
  },

  // Code Analysis
  {
    name: 'analyze_code',
    description: 'Analyze code structure and dependencies',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File or directory to analyze' },
        language: { type: 'string', description: 'Programming language' },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_code',
    description: 'Search for patterns in code',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query or regex' },
        path: { type: 'string', description: 'Directory to search in' },
        file_pattern: { type: 'string', description: 'File pattern (e.g., *.py, *.js)' },
        regex: { type: 'boolean', description: 'Use regex search' },
      },
      required: ['query', 'path'],
    },
  },

  // Project Management
  {
    name: 'create_project',
    description: 'Create a new project with boilerplate',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        type: { type: 'string', description: 'Project type' },
        path: { type: 'string', description: 'Where to create the project' },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'install_dependencies',
    description: 'Install all project dependencies',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
      },
    },
  },

  // Process Management
  {
    name: 'start_server',
    description: 'Start a development server',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Server command' },
        port: { type: 'number', description: 'Port number' },
        name: { type: 'string', description: 'Process name for reference' },
        cwd: { type: 'string', description: 'Working directory' },
      },
      required: ['command', 'name'],
    },
  },
  {
    name: 'stop_server',
    description: 'Stop a running server',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Process name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_processes',
    description: 'List all running processes started by the agent',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
] as const;
