# Code MCP Server

A comprehensive **Model Context Protocol (MCP) server** that enables AI assistants like Claude to interact seamlessly with VS Code workspaces. This server provides **70+ powerful development tools** for file operations, code execution, Git management, Docker containerization, project scaffolding, intelligent workspace analysis, **project-specific configuration**, and **secure command execution**.

> **Inspired by [codemcp](https://github.com/ezyang/codemcp)** - This project incorporates security and configuration concepts from the codemcp project, adding project-specific TOML configuration, restricted command execution, and session management features to enhance developer productivity and security.

[![Test Status](https://img.shields.io/badge/tests-473%20passing-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.15%2B-purple.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-agentics--ai%2Fcode--mcp-blue.svg)](https://github.com/agentics-ai/code-mcp)

## ✨ Key Features

### 🎯 **Intelligent Workspace Management**
- **Smart workspace detection** - Automatically detect VS Code workspaces and running instances
- **Secure path validation** - Built-in security to prevent unauthorized file access
- **Workspace history** - Track and switch between recent workspaces
- **Multi-root workspace support** - Handle complex project structures

### 🛡️ **Project Configuration & Security** *(Inspired by codemcp)*
- **Project-specific configuration** - `.vscode-mcp.toml` files for per-project settings
- **Restricted command execution** - Allowlist-based security for command execution
- **Session management** - Track development sessions with automatic commit tracking
- **Custom tools** - Define project-specific tools with pre-approved commands
- **Secure command validation** - Commands must be explicitly allowed before execution
- **Configuration inheritance** - Global and project-specific settings with smart merging

### 📂 **Advanced File Operations**
- **Complete CRUD operations** - Create, read, update, delete files and directories
- **Intelligent search** - Content search with regex, glob patterns, and filtering
- **Bulk operations** - Copy, move, and manage multiple files efficiently
- **File metadata** - Access file stats, permissions, and detailed information
- **Backup support** - Automatic backups for critical file operations
- **Multi-format file comparison** - Compare files with unified, side-by-side, inline, and context formats
- **Advanced diff analysis** - Detailed statistics and difference analysis between files
- **Patch management** - Apply and create patches with dry-run and backup options
- **Find & replace** - Advanced text replacement across multiple files with regex support

### ⚡ **Multi-Language Code Execution**
- **Python** - Execute scripts with virtual environment and package management
- **JavaScript/Node.js** - Run code with npm integration and dependency handling  
- **Shell Commands** - Safe system command execution with timeout protection
- **Background Processes** - Start, monitor, and manage long-running processes
- **Test Execution** - Run test suites across different frameworks

### 🔧 **Complete Git Integration**
- **Full Git workflow** - Init, clone, add, commit, push, pull operations
- **Advanced branching** - Create, switch, merge, and delete branches
- **Conflict resolution** - Handle merge conflicts and complex scenarios
- **Repository analysis** - Status checking, diff viewing, and log analysis
- **Remote management** - Work with multiple remotes and complex topologies
- **Enhanced diff management** - Multi-format diffs (unified, side-by-side, stat, word-diff, name-only)
- **Commit comparison** - Detailed analysis and comparison between commits
- **Diff statistics** - Comprehensive stats on lines added, removed, and modified
- **Whitespace handling** - Advanced options for ignoring whitespace changes
- **Auto-commit integration** - AI changes automatically tracked with `[AI]` prefixed commits
- **Token-efficient operations** - Focused tools for specific Git operations to reduce token usage

### 🐳 **Docker Integration**
- **Container lifecycle management** - Build, run, stop, restart, and remove containers
- **Image operations** - Build, tag, push, pull, and manage Docker images
- **Docker Compose support** - Multi-container applications and service orchestration
- **Dockerfile generation** - Auto-generate optimized Dockerfiles for different languages
- **Network management** - Create, connect, and manage Docker networks
- **Volume management** - Handle persistent storage and data volumes
- **System operations** - Prune unused resources and system cleanup
- **Multi-platform builds** - Support for different target platforms
- **Container inspection** - Detailed container and image information
- **Log management** - Stream and analyze container logs
- **Health checks** - Monitor container health and status

### 🏗️ **Project Scaffolding & Templates**
- **Multi-framework support** - Python, Node.js, React, Express, and more
- **Intelligent templates** - Context-aware project generation
- **Dependency management** - Automatic package installation and configuration
- **Best practices** - Generated projects follow industry standards
- **Custom templates** - Extensible template system

### 🔍 **Code Analysis & Intelligence**
- **Static analysis** - Code complexity, quality metrics, and insights
- **Dependency scanning** - Vulnerability detection and updates  
- **Project structure analysis** - Understand codebase architecture
- **Advanced search & navigation** - Code search with regex and filtering
- **Multi-language support** - Analysis for Python, JavaScript, TypeScript, and more
- **Performance metrics** - Code quality scoring and recommendations

## 📋 Prerequisites & Compatibility

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 18.0+ | ES Modules support required |
| **pnpm** | 8.0+ | Recommended package manager |
| **TypeScript** | 5.0+ | For development and building |
| **Python** | 3.8+ | Optional, for Python project support |
| **Docker** | 20.10+ | For containerization features |
| **VS Code** | Any recent version | For workspace detection |
| **Claude Desktop** | Latest | Or other MCP-compatible AI |

### Operating System Support
- ✅ **macOS** - Fully supported and tested
- ✅ **Linux** - Fully supported and tested  
- ✅ **Windows** - Supported with WSL recommended

### Claude Desktop Configuration Paths
| Platform | Configuration Path |
|----------|-------------------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

**Note**: The automatic configuration scripts will detect your platform and use the correct path.

## 🚀 Quick Start Guide

### Method 1: Local Installation (Recommended)

1. **Clone and Setup:**
   ```bash
   git clone https://github.com/agentics-ai/code-mcp.git
   cd code-mcp
   pnpm install
   ```

2. **Build the Server:**
   ```bash
   pnpm run build
   ```

3. **Test Installation:**
   ```bash
   # Run comprehensive test suite (473 tests)
   pnpm test
   
   # Quick verification
   node dist/src/index.js --version
   ```

4. **Configure Claude Desktop:**
   
   **Option A: Automatic Setup (Recommended)**
   
   **🍎 macOS/Linux:**
   ```bash
   # Run the cross-platform configuration generator script
   ./scripts/generate-claude-config.sh
   ```
   
   **🪟 Windows (Command Prompt):**
   ```cmd
   # Run the Windows batch script
   scripts\generate-claude-config.bat
   ```
   
   **🪟 Windows (PowerShell):**
   ```powershell
   # Run the PowerShell script
   .\scripts\generate-claude-config.ps1
   ```
   
   **📖 Need detailed setup instructions?** See [scripts/SETUP.md](scripts/SETUP.md) for comprehensive platform-specific guides.
   
   **Option B: Manual Setup by Platform**
   
   **🍎 macOS:**
   ```bash
   # Create the config directory if it doesn't exist
   mkdir -p ~/Library/Application\ Support/Claude
   
   # Edit the configuration file
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
   
   **🐧 Linux:**
   ```bash
   # Create the config directory if it doesn't exist
   mkdir -p ~/.config/Claude
   
   # Edit the configuration file
   nano ~/.config/Claude/claude_desktop_config.json
   ```
   
   **🪟 Windows:**
   ```powershell
   # Create the config directory if it doesn't exist (PowerShell)
   New-Item -ItemType Directory -Path "$env:APPDATA\Claude" -Force
   
   # Edit the configuration file
   notepad "$env:APPDATA\Claude\claude_desktop_config.json"
   ```
   
   **Configuration Content (All Platforms):**
   
   Add the following configuration (replace `/path/to/code-mcp` with your actual path):
   ```json
   {
     "mcpServers": {
       "code-mcp": {
         "command": "node",
         "args": ["/path/to/code-mcp/dist/src/index.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```
   
   **Platform-specific examples:**
   
   **macOS/Linux:**
   ```json
   {
     "mcpServers": {
       "code-mcp": {
         "command": "node",
         "args": ["/Users/yourusername/Desktop/code-mcp/dist/src/index.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```
   
   **Windows:**
   ```json
   {
     "mcpServers": {
       "code-mcp": {
         "command": "node",
         "args": ["C:\\Users\\YourUsername\\Desktop\\code-mcp\\dist\\src\\index.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

5. **Start Using:**
   - Restart Claude Desktop
   - Ask: "*What development tools do you have available?*"
   - Test: "*Show me the current workspace structure*"

## ⚙️ Project Configuration (`.vscode-mcp.toml`)

The server supports project-specific configuration through `.vscode-mcp.toml` files. This feature is inspired by the [codemcp](https://github.com/ezyang/codemcp) project and provides enhanced security and customization capabilities.

### Configuration Structure

Create a `.vscode-mcp.toml` file in your project root:

```toml
# Project Configuration
[general]
projectName = "My VS Code MCP Project"
description = "Enhanced development environment with secure command execution"
version = "1.0.0"
autoCommit = true

[security]
# Allowed commands for secure execution
allowedCommands = [
  "npm install",
  "npm run build",
  "npm test",
  "git status",
  "git add .",
  "python -m pytest"
]

# Environment variables for command execution
env = { NODE_ENV = "development", PYTHONPATH = "./src" }

# Command execution timeout (seconds)
commandTimeout = 300

[project]
# Project-specific settings
language = "typescript"
framework = "node"
testCommand = "npm test"
buildCommand = "npm run build"
startCommand = "npm start"

# Custom project tools
[[project.customTools]]
name = "full-test-suite"
description = "Run comprehensive test suite with coverage"
commands = ["npm run test:unit", "npm run test:integration", "npm run test:coverage"]

[[project.customTools]]
name = "deploy-staging"
description = "Deploy to staging environment"
commands = ["npm run build", "npm run deploy:staging"]

[remoteServer]
# Optional remote server configuration
enabled = false
host = ""
port = 3000
apiKey = ""

[advanced]
# Advanced settings
maxFileSize = 10485760  # 10MB
enableBackup = true
logLevel = "info"
debugMode = false
```

### Session Management

The configuration system includes session management for tracking development work:

- **Start Session**: `project_config_start_session` - Begin a tracked coding session
- **End Session**: `project_config_end_session` - End session with automatic commit
- **List Sessions**: `project_config_list_sessions` - View session history

Sessions help track:
- Development time and progress
- Automatic commit creation with session context
- Change rollback capabilities
- Work session analytics

### Secure Command Execution

Commands must be explicitly allowed in the configuration before they can be executed:

```bash
# ❌ This will fail if not in allowedCommands
secure_command_execute: "rm -rf /"

# ✅ This will work if properly configured
secure_command_execute: "npm test"
```

**Security Features:**
- **Command allowlist validation** - Only pre-approved commands can execute
- **Environment variable control** - Secure environment variable management
- **Timeout protection** - Commands automatically timeout to prevent hanging
- **Safe command execution sandbox** - Commands run in controlled environment
- **Custom tool validation** - Project-specific tools must be explicitly defined
- **Session-based rollback** - Undo all changes made during an AI session
- **Audit logging** - Track all command executions and changes
- **Path traversal protection** - Prevent access to files outside workspace

### Method 2: Docker Installation

1. **Quick Docker Setup:**
   ```bash
   # Clone and start with Docker Compose
   git clone https://github.com/agentics-ai/code-mcp.git
   cd code-mcp
   docker-compose up -d
   ```

2. **Configure Claude for Docker:**
   ```json
   {
     "mcpServers": {
       "code-mcp": {
         "command": "docker",
         "args": ["exec", "-i", "code-mcp-server", "node", "/app/dist/src/index.js"],
         "env": {}
       }
     }
   }
   ```

3. **Verify Docker Installation:**
   ```bash
   # Check container status
   docker-compose ps
   
   # View logs
   docker-compose logs -f mcp-server
   
   # Run tests in container
   docker-compose run --rm app pnpm test
   ```

## 🛠️ Complete Tool Reference

The server provides **70+ tools** organized by functionality:

### 🛡️ **Project Configuration & Security** *(codemcp-inspired)*
| Tool | Description | Example Use |
|------|-------------|-------------|
| `load_project_config` | Load project configuration from TOML | Read current settings |
| `save_project_config` | Save project configuration to TOML | Update project settings |
| `update_project_config` | Update specific configuration values | Modify security settings |
| `generate_sample_config` | Generate sample configuration file | Create initial setup |
| `start_coding_session` | Begin tracked development session | Start focused work |
| `end_coding_session` | End session with optional commit | Save session progress |
| `get_current_session` | Get current session information | View active session |
| `get_session_history` | List previous development sessions | Track work sessions |
| `rollback_session` | Rollback changes from current session | Undo AI changes |
| `secure_run_command` | Execute approved commands only | Run safe system commands |
| `secure_run_command_sequence` | Execute command sequences securely | Multi-step operations |
| `add_allowed_command` | Add command to security allowlist | Approve new commands |
| `remove_allowed_command` | Remove command from allowlist | Revoke command access |
| `get_allowed_commands` | List all allowed commands | View approved commands |
| `run_custom_tool` | Execute custom project-defined tools | Run project-specific tools |

### 📁 File & Directory Operations
| Tool | Description | Example Use |
|------|-------------|-------------|
| `read_file` | Read file contents with encoding support | Read configuration files |
| `write_file` | Write content to files with backup option | Update code files |
| `create_file` | Create new files with directory creation | Generate new components |
| `delete_file` | Delete files with safety checks | Clean up temporary files |
| `list_directory` | List directory contents with filtering | Explore project structure |
| `create_directory` | Create directories recursively | Set up folder structure |
| `delete_directory` | Remove directories safely | Clean up build artifacts |
| `copy_file` | Copy files with overwrite protection | Duplicate templates |
| `move_file` | Move/rename files safely | Reorganize code |
| `search_files` | Advanced file search with patterns | Find specific code files |
| `get_file_info` | Get detailed file metadata | Check file properties |
| `compare_files` | Compare files with multiple formats | File difference analysis |
| `analyze_file_differences` | Detailed file difference analysis | In-depth comparison |
| `apply_patch` | Apply patch files to workspace | Update from patches |
| `create_patch` | Create patch files from differences | Generate update patches |
| `find_and_replace` | Advanced text replacement | Bulk text modifications |

### ⚡ Code Execution & Development
| Tool | Description | Example Use |
|------|-------------|-------------|
| `run_python` | Execute Python code with venv support | Run data analysis scripts |
| `run_javascript` | Execute JavaScript/Node.js code | Test code snippets |
| `run_command` | Run shell commands safely | Build projects |
| `pip_install` | Install Python packages via pip | Set up dependencies |
| `npm_command` | Execute npm operations | Install Node packages |
| `run_tests` | Execute test suites | Run pytest/jest tests |
| `start_server` | Start development servers | Launch local servers |
| `stop_server` | Stop running processes | Clean up resources |
| `list_processes` | View active processes | Monitor running tasks |
| `install_dependencies` | Auto-install project dependencies | Setup project environment |

### 🔧 Git & Version Control
| Tool | Description | Example Use |
|------|-------------|-------------|
| `git_status` | Check repository status | Review changes |
| `git_add` | Stage files for commit | Prepare commits |
| `git_commit` | Commit staged changes | Save work |
| `git_push` | Push to remote repository | Share changes |
| `git_pull` | Pull latest changes | Sync with team |
| `git_log` | View commit history | Track progress |
| `git_diff` | Show file differences | Review changes |
| `git_branch` | Manage branches (list/create/delete) | Branch operations |
| `auto_commit_changes` | Auto-commit with AI tracking | Save AI changes |
| `preview_changes` | Preview uncommitted changes | Review before commit |
| `enhanced_git_diff` | Multi-format diff viewer | Advanced diff analysis |
| `preview_changes_enhanced` | Enhanced change preview | Detailed change review |
| `get_diff_stats` | Get diff statistics and analysis | Quantify changes |
| `compare_commits` | Compare two specific commits | Commit analysis |
| `compare_files` | Compare files with multiple formats | File comparison |
| `analyze_file_differences` | Analyze differences between files | Detailed file analysis |

### 🐳 Docker & Containerization
| Tool | Description | Example Use |
|------|-------------|-------------|
| `docker_check_availability` | Verify Docker installation | Check Docker status |
| `docker_build` | Build Docker images | Create application images |
| `docker_run` | Run Docker containers | Start applications |
| `docker_compose` | Manage multi-container apps | Orchestrate services |
| `docker_images` | Manage Docker images | List, remove, tag images |
| `docker_containers` | Manage containers | List, stop, remove containers |
| `docker_networks` | Manage Docker networks | Create custom networks |
| `docker_volumes` | Manage Docker volumes | Handle persistent storage |
| `docker_system` | System-wide operations | Prune unused resources |
| `generate_dockerfile` | Auto-generate Dockerfiles | Create container configs |
| `generate_docker_compose` | Create compose files | Multi-service setup |
| `docker_cleanup` | Clean up containers | Remove tracked containers |

### 🏗️ Project & Workspace Management
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_workspace` | Get current workspace path | View active workspace |
| `set_workspace` | Set active workspace directory | Change working directory |
| `list_workspaces` | View recent workspaces | Quick workspace switching |
| `detect_vscode_workspaces` | Auto-detect VS Code workspaces | Discover open projects |
| `present_workspace_choice` | Present workspace options to user | Interactive workspace selection |
| `auto_select_workspace` | Auto-select best workspace | Intelligent workspace choice |
| `smart_workspace_init` | Initialize with VS Code detection | Smart workspace setup |
| `create_project` | Generate new projects from templates | Start new applications |
| `analyze_code` | Perform code analysis | Code quality review |
| `search_code` | Search within code files | Find implementations |

## 🎯 Real-World Usage Examples

### Example 1: Project Setup and Development
```
👤 "Create a new React project called 'my-app' and set up the basic structure"

🤖 Claude uses these tools:
1. create_project (type: "react", name: "my-app")
2. change_workspace (to the new project directory)
3. run_npm_command (command: "install")
4. create_file (for additional configuration)
```

### Example 2: Code Analysis and Testing
```
👤 "Analyze the current codebase and run all tests"

🤖 Claude uses these tools:
1. get_workspace_info (analyze project structure)
2. analyze_code (check code quality)
3. search_files (find test files)
4. run_tests (execute test suite)
5. git_status (check for uncommitted changes)
```

### Example 3: Git Workflow
```
👤 "Review my changes, create a feature branch, and commit my work"

🤖 Claude uses these tools:
1. git_status (check current changes)
2. git_diff (review modifications)
3. git_branch (create new feature branch)
4. git_add (stage changes)
5. git_commit (save work with message)
```

### Example 4: Docker Development Workflow
```
👤 "Create a Dockerfile for my Node.js app and set up a development environment"

🤖 Claude uses these tools:
1. docker_check_availability (verify Docker is installed)
2. generate_dockerfile (language: "nodejs", framework: "express")
3. docker_build (build the application image)
4. generate_docker_compose (with database service)
5. docker_compose (start the development environment)
```

### Example 5: Secure Development Workflow *(codemcp-inspired)*
```
👤 "Start a development session, run tests securely, and commit my changes"

🤖 Claude uses these tools:
1. project_config_start_session (begin tracked session)
2. project_config_get (check allowed commands)
3. secure_command_execute (command: "npm test")
4. git_auto_commit (auto-commit with AI prefix)
5. project_config_end_session (end session with summary)
```

### Example 6: Custom Tool Execution
```
👤 "Run our custom deployment pipeline"

🤖 Claude uses these tools:
1. secure_command_list_allowed (verify permissions)
2. secure_command_execute_custom_tool (tool: "deploy-staging")
3. git_status (check for uncommitted changes)
4. project_config_set (update deployment timestamp)
```

### Example 7: Project Configuration Management
```
👤 "Show me the current project configuration and add a new allowed command"

🤖 Claude uses these tools:
1. project_config_get (show current settings)
2. secure_command_add_allowed (add new command to allowlist)
3. project_config_set (update configuration)
4. secure_command_list_allowed (verify changes)
```
### Example 8: Debugging and Investigation
```
👤 "Find all TODO comments in the codebase and help me prioritize them"

🤖 Claude uses these tools:
1. search_code (pattern: "TODO|FIXME|BUG")
2. read_file (examine files with TODOs)
3. analyze_code (assess complexity)
4. get_file_info (check file modification dates)
```

## 🧪 Development

### Project Structure

```
src/
├── index.ts              # Main server entry point
├── constants.ts          # Configuration constants
├── toolDefinitions.ts    # MCP tool definitions
├── types.ts             # TypeScript type definitions
├── utils.ts             # Utility functions
└── services/            # Service implementations
    ├── AnalysisService.ts       # Code analysis
    ├── CodeExecutionService.ts  # Code execution
    ├── DockerService.ts         # Docker operations
    ├── FileService.ts           # File operations
    ├── GitService.ts            # Git operations
    ├── ProcessService.ts        # Process management
    ├── ProjectConfigService.ts  # Project configuration (codemcp-inspired)
    ├── ProjectService.ts        # Project management
    ├── SecureCommandService.ts  # Secure command execution (codemcp-inspired)
    ├── VSCodeDetectionService.ts # VS Code detection
    └── WorkspaceService.ts      # Workspace operations

tests/
├── integration.test.ts      # Integration tests
├── e2e.test.ts              # End-to-end tests
├── VSCodeAgentServer.test.ts # Server tests
└── services/                # Service unit tests
    ├── AnalysisService.test.ts
    ├── CodeExecutionService.test.ts
    ├── DockerService.test.ts
    ├── FileService.test.ts
    ├── GitService.test.ts
    ├── ProcessService.test.ts
    ├── ProjectConfigService.test.ts  # Project configuration tests
    ├── ProjectService.test.ts
    ├── SecureCommandService.test.ts  # Secure command execution tests
    ├── VSCodeDetectionService.test.ts
    └── WorkspaceService.test.ts
```

### Available Scripts

```bash
# Build the project
pnpm run build

# Start the server
pnpm start

# Run all tests
pnpm test

# Run integration tests
pnpm test tests/integration.test.ts

# Generate test coverage
pnpm run test:coverage

# Development mode with auto-rebuild
pnpm run dev
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run tests in Docker
docker-compose run --rm app pnpm test

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Running Tests

The project includes comprehensive test coverage with **473 tests** across **15 test suites**:

**Test Categories:**
- **Unit Tests**: Test individual service components in isolation
- **Integration Tests**: Test service interactions and MCP protocol compliance  
- **End-to-End Tests**: Test complete workflows from client to server
- **Service Tests**: Comprehensive testing for each service class
- **Error Handling Tests**: Robust error scenario coverage
- **Performance Tests**: Validation of performance under load

**Test Coverage by Service:**
- AnalysisService: Code analysis and search functionality
- CodeExecutionService: Python, JavaScript, and shell execution
- DockerService: Container, image, and compose operations
- FileService: File operations, comparison, and patch management  
- GitService: Git operations and enhanced diff management
- ProcessService: Process management and lifecycle
- ProjectConfigService: Configuration and session management
- ProjectService: Project scaffolding and templates
- SecureCommandService: Security and command validation
- VSCodeDetectionService: Workspace detection and selection
- WorkspaceService: Workspace management and validation

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm test -- --testPathPatterns="services"
npm test -- --testPathPatterns="integration"
npm test -- --testPathPatterns="e2e"

# Run tests in watch mode during development
npm test -- --watch
```

**Test Results Summary:**
- ✅ **473 tests passing** across all test suites
- ✅ **Zero flaky tests** - consistent and reliable
- ✅ **Comprehensive error handling** validation  
- ✅ **Full MCP protocol compliance** verification
- ✅ **Cross-platform compatibility** testing

## 🔧 Configuration

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `WORKSPACE_PATH` - Default workspace path

### Project Configuration (`.vscode-mcp.toml`)

Each project can have its own configuration file defining:

- **Security settings** - Allowed commands and execution environment
- **Project metadata** - Name, version, description
- **Custom tools** - Project-specific command sequences
- **Session management** - Development session tracking
- **Advanced settings** - File size limits, logging, debug mode

See the [Project Configuration section](#%EF%B8%8F-project-configuration-vscode-mcptoml) above for detailed configuration options.

### TypeScript Configuration

The project uses modern TypeScript with ES modules:

- **Target**: ES2022
- **Module**: ESNext  
- **Strict mode enabled**
- **ES Module imports/exports**

## 📚 API Reference

### Key Service Interfaces

**WorkspaceService**
- Manages workspace paths and validation
- Provides security through path traversal prevention
- Tracks workspace history and provides navigation

**FileService** 
- Comprehensive file operations (CRUD, search, comparison)
- Enhanced diff management and patch operations
- Auto-formatting and backup capabilities

**GitService**
- Full Git workflow support with enhanced diff formats
- Auto-commit tracking for AI changes
- Multi-format diff analysis and commit comparison

**ProjectConfigService**
- TOML-based project configuration management
- Session tracking with rollback capabilities
- Security policy enforcement

**SecureCommandService**
- Command allowlist validation and enforcement
- Custom tool execution with parameter substitution
- Environment variable and timeout management

**DockerService**
- Complete Docker ecosystem management
- Container, image, network, and volume operations
- Dockerfile and Compose file generation

**VSCodeDetectionService**
- Intelligent VS Code workspace detection
- Running instance discovery and workspace enumeration
- Smart workspace selection and presentation

### MCP Tool Response Format

All tools return responses in the standard MCP format:

```typescript
interface ToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
    _meta?: Record<string, any>;
  }>;
  isError?: boolean;
  _meta?: Record<string, any>;
}
```

### Configuration Schema

The `.vscode-mcp.toml` configuration follows this schema:

```toml
[general]
formatOnSave = boolean
gitAutoCommit = boolean
sessionTracking = boolean
maxSessionCommits = number
formatCommand = string
gitAutoCommitMessage = string

[security]
allowedCommands = array of strings
commandTimeout = number (milliseconds)
auditLogging = boolean

[project]
projectDescription = string
projectInstructions = string
language = string
framework = string

[[customTools]]
name = string
command = string  
description = string

[advanced]
maxOutputLength = number
logLevel = "debug" | "info" | "warn" | "error"
sessionTimeout = number (minutes)
```

## 🤝 Contributing

We welcome contributions to the VS Code Agent MCP Server! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- 🚀 Getting started with development
- 📝 Code style and standards  
- 🧪 Testing requirements
- 📋 Pull request process
- 🐛 Bug reporting
- 💡 Feature requests

**Quick Start for Contributors:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the full test suite: `pnpm test`
5. Submit a pull request

For detailed instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues and Solutions

**MCP Server Won't Start**
```bash
# Check Node.js version (requires 18+)
node --version

# Verify installation
npm test

# Check permissions
chmod +x dist/src/index.js
```

**Claude Desktop Connection Issues**
1. Verify the configuration file path is correct for your OS
2. Restart Claude Desktop after making config changes
3. Check the absolute path in your claude_desktop_config.json
4. Ensure the MCP server builds successfully with `npm run build`

**Command Execution Blocked**
- Commands must be in the `allowedCommands` list in `.vscode-mcp.toml`
- Use `get_allowed_commands` tool to see current permissions
- Use `add_allowed_command` tool to approve new commands

**VS Code Workspace Detection Issues**
- Ensure VS Code is running with workspaces open
- Check that workspace folders contain valid projects
- Use `detect_vscode_workspaces` tool for manual detection

**Performance Issues**
- Run `docker system prune` if using Docker features heavily
- Clear workspace history with workspace service reset
- Check available disk space for temporary files

### Getting Help

- **Issues**: Create an issue on [GitHub](https://github.com/agentics-ai/code-mcp)
- **Documentation**: Check the inline code documentation and tool descriptions
- **Testing**: Run `npm test` to verify functionality and identify issues
- **Debug Mode**: Set `NODE_ENV=development` for verbose logging

### Reporting Bugs

When reporting issues, please include:
1. Operating system and version
2. Node.js version (`node --version`)
3. MCP server version
4. Claude Desktop version
5. Exact error message or unexpected behavior
6. Steps to reproduce the issue
7. Your `.vscode-mcp.toml` configuration (remove sensitive data)

### Feature Requests

We welcome feature requests! Please check existing issues first, then create a new issue with:
- Clear description of the requested feature
- Use case and benefits
- Proposed implementation approach (if applicable)

## 📝 Helper Scripts

The `scripts/` directory contains useful automation tools:

### Configuration Scripts
- **`generate-claude-config.sh`** - Automatically generates Claude Desktop configuration
  ```bash
  ./scripts/generate-claude-config.sh
  ```

### Repository Setup Scripts  
- **`setup-branch-protection.sh`** - Configures GitHub branch protection rules
  ```bash
  ./scripts/setup-branch-protection.sh
  ```
- **`setup-branch-protection.md`** - Manual setup guide for branch protection

### Usage
All scripts are executable and include built-in help. Run any script without arguments to see usage information.

## 🔄 Version History

- **2.1.0** - **Comprehensive Feature Release** *(codemcp-inspired)*
  - Added project-specific `.vscode-mcp.toml` configuration files
  - Implemented secure command execution with allowlist-based validation
  - Added session management for development tracking and rollback capabilities
  - Enhanced Git operations with multi-format diffs and auto-commit features
  - Added comprehensive file comparison and patch management tools
  - Implemented advanced find & replace with regex and preview capabilities
  - Added enhanced VS Code workspace detection and intelligent selection
  - Expanded to 70+ MCP tools with focused, token-efficient implementations
  - Comprehensive test coverage (473 tests passing across 15 test suites)
  - Full Docker integration with container, image, network, and volume management
  - Enhanced project scaffolding with multiple language and framework support
  - Inspired by security and configuration concepts from [codemcp](https://github.com/ezyang/codemcp)

- **2.0.0** - Comprehensive MCP server with 40+ tools
- **1.x.x** - Initial releases and feature development

---

## 🙏 Acknowledgments

This project was inspired by [codemcp](https://github.com/ezyang/codemcp) by Edward Z. Yang. We've incorporated and adapted several key concepts from codemcp:

- **Project-specific configuration** - The `.vscode-mcp.toml` configuration system
- **Restricted command execution** - Security-first approach to command validation
- **Session management** - Development session tracking and rollback capabilities

While maintaining our focus on VS Code integration and comprehensive MCP tool coverage, these security and configuration enhancements make the server more suitable for production development environments.

Built with ❤️ for the AI development community.
