# VS Code Agent MCP Server

A comprehensive **Model Context Protocol (MCP) server** that enables AI assistants like Claude to interact seamlessly with VS Code workspaces. This server provides **30+ powerful development tools** for file operations, code execution, Git management, project scaffolding, and intelligent workspace analysis.

[![Test Status](https://img.shields.io/badge/tests-351%20passing-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.15%2B-purple.svg)](https://modelcontextprotocol.io/)

## ✨ Key Features

### 🎯 **Intelligent Workspace Management**
- **Smart workspace detection** - Automatically detect VS Code workspaces and running instances
- **Secure path validation** - Built-in security to prevent unauthorized file access
- **Workspace history** - Track and switch between recent workspaces
- **Multi-root workspace support** - Handle complex project structures

### 📂 **Advanced File Operations**
- **Complete CRUD operations** - Create, read, update, delete files and directories
- **Intelligent search** - Content search with regex, glob patterns, and filtering
- **Bulk operations** - Copy, move, and manage multiple files efficiently
- **File metadata** - Access file stats, permissions, and detailed information
- **Backup support** - Automatic backups for critical file operations

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
- **Search & navigation** - Advanced code search and symbol finding

## 📋 Prerequisites & Compatibility

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 18.0+ | ES Modules support required |
| **pnpm** | 8.0+ | Recommended package manager |
| **TypeScript** | 5.0+ | For development and building |
| **Python** | 3.8+ | Optional, for Python project support |
| **Git** | 2.0+ | For version control features |
| **VS Code** | Any recent version | For workspace detection |
| **Claude Desktop** | Latest | Or other MCP-compatible AI |

### Operating System Support
- ✅ **macOS** - Fully supported and tested
- ✅ **Linux** - Fully supported and tested  
- ✅ **Windows** - Supported with WSL recommended

## 🚀 Quick Start Guide

### Method 1: Local Installation (Recommended)

1. **Clone and Setup:**
   ```bash
   git clone <your-repository-url>
   cd vscode-mcp
   pnpm install
   ```

2. **Build the Server:**
   ```bash
   pnpm run build
   ```

3. **Test Installation:**
   ```bash
   # Run comprehensive test suite (351 tests)
   pnpm test
   
   # Quick verification
   node dist/src/index.js --version
   ```

4. **Configure Claude Desktop:**
   ```bash
   # Copy the included configuration
   cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Or manually add to your Claude config:
   ```
   
   ```json
   {
     "mcpServers": {
       "vscode-agent": {
         "command": "node",
         "args": ["/path/to/vscode-mcp/dist/src/index.js"],
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

### Method 2: Docker Installation

1. **Quick Docker Setup:**
   ```bash
   # Clone and start with Docker Compose
   git clone <your-repository-url>
   cd vscode-mcp
   docker-compose up -d
   ```

2. **Configure Claude for Docker:**
   ```json
   {
     "mcpServers": {
       "vscode-agent": {
         "command": "docker",
         "args": ["exec", "-i", "vscode-mcp-server", "node", "/app/dist/src/index.js"],
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

The server provides **30+ tools** organized by functionality:

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

### ⚡ Code Execution & Development
| Tool | Description | Example Use |
|------|-------------|-------------|
| `execute_python` | Run Python code with venv support | Run data analysis scripts |
| `execute_javascript` | Execute JavaScript/Node.js code | Test code snippets |
| `execute_command` | Run shell commands safely | Build projects |
| `install_python_packages` | Install Python packages via pip | Set up dependencies |
| `run_npm_command` | Execute npm operations | Install Node packages |
| `run_tests` | Execute test suites | Run pytest/jest tests |
| `start_server` | Start development servers | Launch local servers |
| `stop_server` | Stop running processes | Clean up resources |
| `list_processes` | View active processes | Monitor running tasks |

### 🔧 Git & Version Control
| Tool | Description | Example Use |
|------|-------------|-------------|
| `git_status` | Check repository status | Review changes |
| `git_add` | Stage files for commit | Prepare commits |
| `git_commit` | Commit staged changes | Save work |
| `git_push` | Push to remote repository | Share changes |
| `git_pull` | Pull latest changes | Sync with team |
| `git_branch` | Manage branches | Feature development |
| `git_log` | View commit history | Track progress |
| `git_diff` | Show file differences | Review changes |
| `execute_git_command` | Run custom git commands | Advanced operations |

### 🏗️ Project & Workspace Management
| Tool | Description | Example Use |
|------|-------------|-------------|
| `create_project` | Generate new projects from templates | Start new applications |
| `get_workspace_info` | Analyze current workspace | Understand project structure |
| `change_workspace` | Switch working directory | Navigate projects |
| `list_workspace_history` | View recent workspaces | Quick workspace switching |
| `detect_vscode_workspaces` | Find VS Code workspaces | Discover projects |
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

### Example 4: Debugging and Investigation
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
    ├── FileService.ts       # File operations
    ├── CodeExecutionService.ts  # Code execution
    ├── GitService.ts        # Git operations
    ├── ProjectService.ts    # Project management
    ├── WorkspaceService.ts  # Workspace operations
    ├── ProcessService.ts    # Process management
    └── AnalysisService.ts   # Code analysis

tests/
├── integration.test.ts      # Integration tests
├── e2e.test.ts              # End-to-end tests
├── VSCodeAgentServer.test.ts # Server tests
└── services/                # Service unit tests
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

The project includes comprehensive test coverage:

- **Unit Tests**: Test individual service components
- **Integration Tests**: Test service interactions
- **E2E Tests**: Test complete MCP protocol workflows

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm run test:coverage

# Run specific test files
pnpm test -- --testPathPatterns="e2e"
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `WORKSPACE_PATH` - Default workspace path

### TypeScript Configuration

The project uses modern TypeScript with ES modules:

- **Target**: ES2022
- **Module**: ESNext  
- **Strict mode enabled**
- **ES Module imports/exports**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `pnpm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Write TypeScript with strict typing
- Add unit tests for new features
- Follow existing code style and patterns
- Update documentation for new tools
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the inline code documentation
- **Testing**: Run `pnpm test` to verify functionality

## 🔄 Version History

- **2.0.0** - Comprehensive MCP server with 30+ tools
- **1.x.x** - Initial releases and feature development

---

Built with ❤️ for the AI development community.
