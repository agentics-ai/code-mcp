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
] as const;
