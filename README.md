# VS Code MCP Server

# VS Code MCP Server

A comprehensive Model Context Protocol (MCP) server that enables AI assistants like Claude to interact with VS Code workspaces. This server provides 30+ development tools for file operations, code execution, Git management, project scaffolding, and more.

## 🚀 Features

### 📁 File & Workspace Management
- Read, write, create, and delete files
- List directory contents and search files
- Workspace navigation and management
- File content analysis and search

### ⚙️ Code Execution
- **Python**: Execute Python scripts with virtual environment support
- **JavaScript/Node.js**: Run JavaScript code and Node.js applications  
- **Shell Commands**: Execute system commands with proper error handling
- **Process Management**: Start, stop, and monitor background processes

### 🔧 Git Operations
- Repository initialization and cloning
- Staging, committing, and pushing changes
- Branch management and switching
- Status checking and diff viewing
- Conflict resolution support

### 🏗️ Project Scaffolding
- Create new projects from templates
- Support for Python, JavaScript, React, Express, and more
- Automatic dependency installation
- Configuration file generation

### 🔍 Analysis & Search
- Code analysis and complexity metrics
- Dependency analysis and vulnerability scanning
- File search with glob patterns and content search
- Project structure analysis

## 📋 Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+ (recommended package manager)
- **VS Code** (any recent version)
- **Python** 3.8+ (for Python project support)
- **Git** (for version control features)
- **Claude AI** or other MCP-compatible AI assistant

## 🛠️ Installation

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd vscode-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Build the project:**
   ```bash
   pnpm run build
   ```

4. **Run tests to verify installation:**
   ```bash
   pnpm test
   ```

### Docker Installation

1. **Using Docker Compose (Recommended):**
   ```bash
   docker-compose up -d
   ```

2. **Using Docker directly:**
   ```bash
   docker build -t vscode-mcp-server .
   docker run -d --name mcp-server vscode-mcp-server
   ```

## 🚀 Usage

### Starting the Server

**Local:**
```bash
pnpm start
```

**Docker:**
```bash
docker-compose up
```

The server runs on stdio and communicates using the MCP protocol.

### Configuration with Claude Desktop

Add this configuration to your Claude MCP settings (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "vscode-mcp-server": {
      "command": "node",
      "args": ["/path/to/vscode-mcp-server/dist/src/index.js"],
      "env": {}
    }
  }
}
```

For Docker deployment:
```json
{
  "mcpServers": {
    "vscode-mcp-server": {
      "command": "docker",
      "args": ["exec", "-i", "mcp-server", "node", "/app/dist/src/index.js"],
      "env": {}
    }
  }
}
```

### Available Tools

The server provides 30+ tools organized into categories:

#### File Operations
- `read_file` - Read file contents
- `write_file` - Write content to files
- `create_file` - Create new files
- `delete_file` - Delete files
- `list_files` - List directory contents
- `search_files` - Search for files by pattern

#### Code Execution  
- `execute_python` - Run Python code
- `execute_javascript` - Run JavaScript/Node.js code
- `execute_command` - Execute shell commands
- `start_process` - Start background processes
- `stop_process` - Stop running processes

#### Git Operations
- `git_init` - Initialize repository
- `git_status` - Check repository status
- `git_add` - Stage changes
- `git_commit` - Commit changes
- `git_push` - Push to remote
- `git_pull` - Pull from remote
- `git_branch` - Manage branches

#### Project Management
- `create_project` - Create new projects
- `install_dependencies` - Install project dependencies
- `analyze_project` - Analyze project structure
- `scaffold_component` - Create project components

## 🤖 Claude Desktop Integration

### Quick Setup

1. **Build the server:**
   ```bash
   pnpm run build
   ```

2. **Configure Claude Desktop:**
   ```bash
   # Copy the configuration file
   cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Restart Claude Desktop** to load the MCP server

4. **Start testing!** Ask Claude: "What tools do you have available?"

### Testing with Claude Desktop

Once configured, you can use Claude Desktop to:

- **Explore Projects**: "Show me the workspace structure"
- **Code Analysis**: "Find all TODO comments in the codebase" 
- **Run Tests**: "Execute the test suite and show results"
- **Git Operations**: "Check git status and create a new branch"
- **File Operations**: "Read the main config file and explain it"

### Testing with Claude Desktop

Once configured, you can use Claude Desktop to:

- **Explore Projects**: "Show me the workspace structure"
- **Code Analysis**: "Find all TODO comments in the codebase" 
- **Run Tests**: "Execute the test suite and show results"
- **Git Operations**: "Check git status and create a new branch"
- **File Operations**: "Read the main config file and explain it"

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
