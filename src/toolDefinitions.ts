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

  // Docker Management
  {
    name: 'docker_check_availability',
    description: 'Check if Docker is installed and available',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'docker_build',
    description: 'Build a Docker image from a Dockerfile',
    inputSchema: {
      type: 'object',
      properties: {
        context: { type: 'string', description: 'Build context path (default: current directory)' },
        dockerfile: { type: 'string', description: 'Path to Dockerfile (relative to context)' },
        tag: { type: 'string', description: 'Tag for the built image (e.g., myapp:latest)' },
        build_args: { type: 'object', description: 'Build arguments as key-value pairs' },
        target: { type: 'string', description: 'Target stage for multi-stage builds' },
        no_cache: { type: 'boolean', description: 'Do not use cache when building' },
        pull: { type: 'boolean', description: 'Always attempt to pull newer version of base image' },
        platform: { type: 'string', description: 'Target platform (e.g., linux/amd64, linux/arm64)' },
      },
    },
  },
  {
    name: 'docker_run',
    description: 'Run a Docker container',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Docker image to run' },
        name: { type: 'string', description: 'Container name' },
        command: { type: 'string', description: 'Command to run in container' },
        args: { type: 'array', items: { type: 'string' }, description: 'Command arguments' },
        ports: { type: 'array', items: { type: 'string' }, description: 'Port mappings (e.g., ["8080:80", "3000:3000"])' },
        volumes: { type: 'array', items: { type: 'string' }, description: 'Volume mounts (e.g., ["/host/path:/container/path"])' },
        env: { type: 'object', description: 'Environment variables as key-value pairs' },
        detach: { type: 'boolean', description: 'Run container in background' },
        remove: { type: 'boolean', description: 'Remove container when it exits' },
        interactive: { type: 'boolean', description: 'Keep STDIN open' },
        tty: { type: 'boolean', description: 'Allocate a pseudo-TTY' },
        network: { type: 'string', description: 'Network to connect container to' },
        working_dir: { type: 'string', description: 'Working directory inside container' },
        user: { type: 'string', description: 'Username or UID (format: <name|uid>[:<group|gid>])' },
        memory: { type: 'string', description: 'Memory limit (e.g., "512m", "2g")' },
        cpus: { type: 'string', description: 'CPU limit (e.g., "0.5", "2")' },
        restart: { type: 'string', description: 'Restart policy (no, on-failure, always, unless-stopped)' },
      },
      required: ['image'],
    },
  },
  {
    name: 'docker_compose',
    description: 'Manage Docker Compose services',
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['up', 'down', 'build', 'logs', 'ps', 'exec', 'restart', 'stop', 'start', 'pull'],
          description: 'Docker Compose action to perform' 
        },
        service: { type: 'string', description: 'Specific service to target' },
        file: { type: 'string', description: 'Docker Compose file path (default: docker-compose.yml)' },
        detach: { type: 'boolean', description: 'Run in background (for up action)' },
        build: { type: 'boolean', description: 'Build images before starting (for up action)' },
        force_recreate: { type: 'boolean', description: 'Force recreate containers' },
        remove_orphans: { type: 'boolean', description: 'Remove containers for services not defined in compose file' },
        follow: { type: 'boolean', description: 'Follow log output (for logs action)' },
        tail: { type: 'number', description: 'Number of lines to show from end of logs' },
        command: { type: 'string', description: 'Command to execute (for exec action)' },
        project_name: { type: 'string', description: 'Project name for compose stack' },
      },
      required: ['action'],
    },
  },
  {
    name: 'docker_images',
    description: 'Manage Docker images (list, pull, push, remove, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['list', 'pull', 'push', 'remove', 'tag', 'inspect', 'prune', 'history'],
          description: 'Action to perform on images' 
        },
        image: { type: 'string', description: 'Image name or ID' },
        tag: { type: 'string', description: 'Tag for image operations' },
        force: { type: 'boolean', description: 'Force removal or operation' },
        all: { type: 'boolean', description: 'Apply to all images (for list/prune)' },
        filter: { type: 'string', description: 'Filter results (e.g., "dangling=true")' },
      },
      required: ['action'],
    },
  },
  {
    name: 'docker_containers',
    description: 'Manage Docker containers (list, start, stop, remove, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['list', 'start', 'stop', 'restart', 'remove', 'inspect', 'logs', 'exec', 'stats'],
          description: 'Action to perform on containers' 
        },
        container: { type: 'string', description: 'Container name or ID' },
        command: { type: 'string', description: 'Command to execute (for exec action)' },
        follow: { type: 'boolean', description: 'Follow log output (for logs action)' },
        tail: { type: 'number', description: 'Number of lines to show from end of logs' },
        all: { type: 'boolean', description: 'Show all containers including stopped ones' },
        force: { type: 'boolean', description: 'Force operation' },
        volumes: { type: 'boolean', description: 'Remove associated volumes (for remove action)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'docker_networks',
    description: 'Manage Docker networks',
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['list', 'create', 'remove', 'inspect', 'connect', 'disconnect'],
          description: 'Action to perform on networks' 
        },
        network: { type: 'string', description: 'Network name or ID' },
        container: { type: 'string', description: 'Container to connect/disconnect' },
        driver: { type: 'string', description: 'Network driver (bridge, overlay, host, etc.)' },
        subnet: { type: 'string', description: 'Subnet for network (e.g., 172.20.0.0/16)' },
        gateway: { type: 'string', description: 'Gateway for network' },
      },
      required: ['action'],
    },
  },
  {
    name: 'docker_volumes',
    description: 'Manage Docker volumes',
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['list', 'create', 'remove', 'inspect', 'prune'],
          description: 'Action to perform on volumes' 
        },
        volume: { type: 'string', description: 'Volume name' },
        driver: { type: 'string', description: 'Volume driver' },
        force: { type: 'boolean', description: 'Force operation' },
        filter: { type: 'string', description: 'Filter results' },
      },
      required: ['action'],
    },
  },
  {
    name: 'docker_system',
    description: 'Docker system operations and information',
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['info', 'version', 'events', 'df', 'prune'],
          description: 'System action to perform' 
        },
        all: { type: 'boolean', description: 'Apply to all resources (for prune)' },
        volumes: { type: 'boolean', description: 'Include volumes in operation' },
        force: { type: 'boolean', description: 'Force operation without confirmation' },
      },
      required: ['action'],
    },
  },
  {
    name: 'generate_dockerfile',
    description: 'Generate a Dockerfile template for a specific language/framework',
    inputSchema: {
      type: 'object',
      properties: {
        language: { 
          type: 'string', 
          enum: ['node', 'nodejs', 'javascript', 'typescript', 'python', 'java', 'go', 'rust'],
          description: 'Programming language for the Dockerfile' 
        },
        framework: { type: 'string', description: 'Framework-specific optimizations (e.g., alpine, express, fastapi)' },
      },
      required: ['language'],
    },
  },
  {
    name: 'generate_docker_compose',
    description: 'Generate a Docker Compose file template',
    inputSchema: {
      type: 'object',
      properties: {
        services: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'List of service names to include' 
        },
        include_database: { type: 'boolean', description: 'Include database services (PostgreSQL, Redis)' },
      },
      required: ['services'],
    },
  },
  {
    name: 'docker_cleanup',
    description: 'Clean up tracked Docker containers and resources',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  
  // Enhanced MCP Features - codemcp-inspired improvements
  
  // Project Configuration Management
  {
    name: 'load_project_config',
    description: 'Load project-specific configuration from .vscode-mcp.toml',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to workspace directory (defaults to current)' }
      }
    }
  },
  {
    name: 'save_project_config',
    description: 'Save project-specific configuration to .vscode-mcp.toml',
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', description: 'Project configuration object' },
        path: { type: 'string', description: 'Path to workspace directory (defaults to current)' }
      },
      required: ['config']
    }
  },
  {
    name: 'update_project_config',
    description: 'Update specific project configuration settings',
    inputSchema: {
      type: 'object',
      properties: {
        allowedCommands: {
          type: 'array',
          items: { type: 'string' },
          description: 'Commands that are allowed to run'
        },
        formatOnSave: {
          type: 'boolean',
          description: 'Auto-format files after editing'
        },
        gitAutoCommit: {
          type: 'boolean',
          description: 'Auto-commit AI changes'
        },
        formatCommand: {
          type: 'string',
          description: 'Format command (use {{file}} as placeholder)'
        },
        projectInstructions: {
          type: 'string',
          description: 'Project-specific instructions for AI'
        }
      }
    }
  },
  {
    name: 'generate_sample_config',
    description: 'Generate a sample .vscode-mcp.toml configuration file',
    inputSchema: {
      type: 'object',
      properties: {
        saveToFile: { type: 'boolean', description: 'Save generated config to .vscode-mcp.toml' }
      }
    }
  },

  // Session Management
  {
    name: 'start_coding_session',
    description: 'Start a new AI coding session with automatic change tracking',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'What this session will accomplish' },
        branch: { type: 'string', description: 'Git branch to work on (optional)' }
      },
      required: ['description']
    }
  },
  {
    name: 'end_coding_session',
    description: 'End the current AI coding session',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_session_info',
    description: 'Get information about the current coding session',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'rollback_session',
    description: 'Rollback all changes made in the current AI session',
    inputSchema: {
      type: 'object',
      properties: {
        confirm: { type: 'boolean', description: 'Confirm rollback (required)' },
        preserveUnstaged: { type: 'boolean', description: 'Keep unstaged changes' }
      },
      required: ['confirm']
    }
  },

  // Enhanced Git Operations
  {
    name: 'preview_changes',
    description: 'Preview all changes before committing',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'auto_commit_changes',
    description: 'Automatically commit AI-made changes with tracking',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Commit message' },
        files: { type: 'array', items: { type: 'string' }, description: 'Specific files to commit' },
        amendSession: { type: 'boolean', description: 'Amend to current session commit' }
      },
      required: ['message']
    }
  },
  {
    name: 'get_session_history',
    description: 'Get history of commits in current session',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // Enhanced Diff Management
  {
    name: 'enhanced_git_diff',
    description: 'Show git diff with multiple format options (unified, side-by-side, stat, word-diff)',
    inputSchema: {
      type: 'object',
      properties: {
        staged: { type: 'boolean', description: 'Show staged changes' },
        file: { type: 'string', description: 'Specific file to diff' },
        format: { 
          type: 'string', 
          enum: ['unified', 'side-by-side', 'inline', 'stat', 'name-only', 'word-diff'],
          description: 'Diff format' 
        },
        contextLines: { type: 'number', description: 'Number of context lines (default: 3)' },
        ignoreWhitespace: { type: 'boolean', description: 'Ignore whitespace changes' },
        colorOutput: { type: 'boolean', description: 'Enable color output' },
        commit1: { type: 'string', description: 'First commit for comparison' },
        commit2: { type: 'string', description: 'Second commit for comparison' },
        cwd: { type: 'string', description: 'Working directory' }
      }
    }
  },
  {
    name: 'get_diff_stats',
    description: 'Get diff statistics (files changed, lines added/removed)',
    inputSchema: {
      type: 'object',
      properties: {
        staged: { type: 'boolean', description: 'Show stats for staged changes' },
        file: { type: 'string', description: 'Specific file stats' },
        commit1: { type: 'string', description: 'First commit for comparison' },
        commit2: { type: 'string', description: 'Second commit for comparison' },
        cwd: { type: 'string', description: 'Working directory' }
      }
    }
  },
  {
    name: 'compare_commits',
    description: 'Compare two commits with detailed analysis',
    inputSchema: {
      type: 'object',
      properties: {
        commit1: { type: 'string', description: 'First commit hash or reference' },
        commit2: { type: 'string', description: 'Second commit hash or reference' },
        filePattern: { type: 'string', description: 'File pattern to filter' },
        format: { 
          type: 'string', 
          enum: ['unified', 'stat', 'name-only'],
          description: 'Output format' 
        },
        cwd: { type: 'string', description: 'Working directory' }
      },
      required: ['commit1', 'commit2']
    }
  },
  {
    name: 'preview_changes_enhanced',
    description: 'Enhanced change preview with multiple format options',
    inputSchema: {
      type: 'object',
      properties: {
        format: { 
          type: 'string', 
          enum: ['unified', 'side-by-side', 'stat', 'word-diff'],
          description: 'Preview format' 
        },
        contextLines: { type: 'number', description: 'Number of context lines' },
        ignoreWhitespace: { type: 'boolean', description: 'Ignore whitespace changes' },
        filePattern: { type: 'string', description: 'File pattern filter' },
        cwd: { type: 'string', description: 'Working directory' }
      }
    }
  },

  // Enhanced File Operations & Diff Management
  {
    name: 'compare_files',
    description: 'Compare two files and show differences with multiple format options',
    inputSchema: {
      type: 'object',
      properties: {
        file1: { type: 'string', description: 'First file path' },
        file2: { type: 'string', description: 'Second file path' },
        format: { 
          type: 'string', 
          enum: ['unified', 'side-by-side', 'inline', 'context'],
          description: 'Diff format' 
        },
        contextLines: { type: 'number', description: 'Number of context lines (default: 3)' },
        ignoreWhitespace: { type: 'boolean', description: 'Ignore whitespace changes' },
        wordDiff: { type: 'boolean', description: 'Show word-level differences' },
        label1: { type: 'string', description: 'Label for first file' },
        label2: { type: 'string', description: 'Label for second file' }
      },
      required: ['file1', 'file2']
    }
  },
  {
    name: 'analyze_file_differences',
    description: 'Analyze differences between two files with detailed statistics',
    inputSchema: {
      type: 'object',
      properties: {
        file1: { type: 'string', description: 'First file path' },
        file2: { type: 'string', description: 'Second file path' }
      },
      required: ['file1', 'file2']
    }
  },
  {
    name: 'apply_patch',
    description: 'Apply a patch file to the workspace',
    inputSchema: {
      type: 'object',
      properties: {
        patchFile: { type: 'string', description: 'Path to patch file' },
        dryRun: { type: 'boolean', description: 'Show what would be done without making changes' },
        reverse: { type: 'boolean', description: 'Apply patch in reverse' },
        stripPaths: { type: 'number', description: 'Number of path components to strip' },
        backup: { type: 'boolean', description: 'Create backup files' }
      },
      required: ['patchFile']
    }
  },
  {
    name: 'create_patch',
    description: 'Create a patch file from differences between files or directories',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source file or directory' },
        target: { type: 'string', description: 'Target file or directory' },
        outputFile: { type: 'string', description: 'Output patch file (optional, prints to output if not specified)' }
      },
      required: ['source', 'target']
    }
  },
  {
    name: 'find_and_replace',
    description: 'Find and replace text across multiple files with preview option',
    inputSchema: {
      type: 'object',
      properties: {
        searchPattern: { type: 'string', description: 'Text or regex pattern to search for' },
        replacement: { type: 'string', description: 'Replacement text' },
        files: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Specific files to process' 
        },
        filePattern: { type: 'string', description: 'File pattern to match (e.g., "**/*.ts")' },
        regex: { type: 'boolean', description: 'Treat search pattern as regex' },
        caseSensitive: { type: 'boolean', description: 'Case sensitive search (default: true)' },
        wholeWord: { type: 'boolean', description: 'Match whole words only' },
        preview: { type: 'boolean', description: 'Preview changes without applying them' },
        backup: { type: 'boolean', description: 'Create backup files before changes' }
      },
      required: ['searchPattern', 'replacement']
    }
  },
  
  // Secure Command Execution Management
  {
    name: 'secure_run_command',
    description: 'Execute a command with security restrictions (only allowed commands)',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute securely' },
        cwd: { type: 'string', description: 'Working directory' },
        timeout: { type: 'number', description: 'Command timeout in milliseconds' },
        env: { type: 'object', description: 'Environment variables' },
        commitResult: { type: 'boolean', description: 'Auto-commit changes after successful execution' },
        commitMessage: { type: 'string', description: 'Custom commit message if commitResult is true' }
      },
      required: ['command']
    }
  },
  {
    name: 'secure_run_command_sequence',
    description: 'Execute multiple commands in sequence with security restrictions',
    inputSchema: {
      type: 'object',
      properties: {
        commands: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of commands to execute in sequence' 
        },
        cwd: { type: 'string', description: 'Working directory for all commands' },
        timeout: { type: 'number', description: 'Timeout per command in milliseconds' },
        commitResult: { type: 'boolean', description: 'Auto-commit after successful sequence' },
        commitMessage: { type: 'string', description: 'Custom commit message' },
        stopOnError: { type: 'boolean', description: 'Stop execution on first error (default: true)' }
      },
      required: ['commands']
    }
  },
  {
    name: 'get_allowed_commands',
    description: 'Get list of commands that are allowed to run in this project',
    inputSchema: {
      type: 'object',
      properties: {},
    }
  },
  {
    name: 'add_allowed_command',
    description: 'Add a command to the project\'s allowed commands list',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to add to allowed list' }
      },
      required: ['command']
    }
  },
  {
    name: 'remove_allowed_command',
    description: 'Remove a command from the project\'s allowed commands list',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to remove from allowed list' }
      },
      required: ['command']
    }
  },
  {
    name: 'run_custom_tool',
    description: 'Execute a custom tool defined in project configuration',
    inputSchema: {
      type: 'object',
      properties: {
        toolName: { type: 'string', description: 'Name of the custom tool to run' },
        args: { type: 'object', description: 'Arguments to pass to the custom tool (replaces {{key}} placeholders)' }
      },
      required: ['toolName']
    }
  },

  // Session Management
  {
    name: 'start_coding_session',
    description: 'Start a new coding session for change tracking',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Description of what will be worked on' },
        branch: { type: 'string', description: 'Git branch for this session' }
      },
      required: ['description']
    }
  },
  {
    name: 'end_coding_session',
    description: 'End the current coding session',
    inputSchema: {
      type: 'object',
      properties: {},
    }
  },
  {
    name: 'get_current_session',
    description: 'Get information about the current coding session',
    inputSchema: {
      type: 'object',
      properties: {},
    }
  },
  {
    name: 'get_session_history',
    description: 'Get history of all coding sessions and their commits',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of sessions to return' }
      }
    }
  },
];
