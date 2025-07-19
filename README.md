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

- 🎯 **Intelligent Workspace Management** - Smart VS Code workspace detection and secure path validation
- 🛡️ **Project Configuration & Security** - `.vscode-mcp.toml` files with allowlist-based command execution
- 📂 **Advanced File Operations** - Complete CRUD, search, comparison, and patch management
- ⚡ **Multi-Language Code Execution** - Python, JavaScript/Node.js with package management
- 🔧 **Complete Git Integration** - Full workflow with enhanced diff analysis and auto-commit
- 🐳 **Docker Integration** - Container lifecycle, image operations, and compose management
- 🏗️ **Project Scaffolding** - Multi-framework templates with intelligent setup
- 🔍 **Code Analysis & Intelligence** - Static analysis, dependency scanning, and quality metrics

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ with ES Modules support
- **pnpm** 8+ (recommended package manager)
- **VS Code** (any recent version)
- **Claude Desktop** or other MCP-compatible AI

### Installation

1. **Clone and build:**
   ```bash
   git clone https://github.com/agentics-ai/code-mcp.git
   cd code-mcp
   pnpm install && pnpm run build
   ```

2. **Auto-configure Claude Desktop:**
   ```bash
   # macOS/Linux
   ./scripts/generate-claude-config.sh
   
   # Windows
   scripts\generate-claude-config.bat
   ```

3. **Manual configuration** (if needed):
   
   Add to your Claude Desktop config file:
   ```json
   {
     "mcpServers": {
       "code-mcp": {
         "command": "node",
         "args": ["/path/to/code-mcp/dist/src/index.js"],
         "env": { "NODE_ENV": "production" }
       }
     }
   }
   ```

4. **Test installation:**
   ```bash
   pnpm test  # Run 473 tests
   ```

   Restart Claude Desktop and ask: "*What development tools are available?*"

## ⚙️ Project Configuration

Create a `.vscode-mcp.toml` file in your project root for secure, project-specific settings:

```toml
[general]
projectName = "My Project"
autoCommit = true
sessionTracking = true

[security]
allowedCommands = [
  "npm install", "npm test", "npm run build",
  "git status", "git add .", "git commit",
  "python -m pytest", "docker build"
]
commandTimeout = 300

[project]
language = "typescript"
framework = "node"
testCommand = "npm test"
buildCommand = "npm run build"

[[customTools]]
name = "deploy-staging"
description = "Deploy to staging environment"
commands = ["npm run build", "npm run deploy:staging"]
```

**Key Features:**
- **Secure command execution** - Only allowlisted commands can run
- **Session management** - Track development sessions with rollback
- **Custom tools** - Define project-specific command sequences
- **Auto-commit** - AI changes automatically tracked with `[AI]` prefix

### Docker Setup (Alternative)

```bash
# Quick Docker setup
docker-compose up -d

# Configure Claude for Docker
{
  "mcpServers": {
    "code-mcp": {
      "command": "docker",
      "args": ["exec", "-i", "code-mcp-server", "node", "/app/dist/src/index.js"]
    }
  }
}
```

## 🛠️ Available Tools (70+)

The server provides comprehensive development tools organized by category:

- **📁 File Operations** - CRUD, search, compare, patch management
- **⚡ Code Execution** - Python, JavaScript, shell commands with package management
- **🔧 Git Integration** - Full workflow, enhanced diffs, auto-commit tracking
- **🐳 Docker** - Container lifecycle, image management, compose operations
- **🏗️ Project Management** - Scaffolding, templates, workspace detection
- **🛡️ Security** - Project configuration, secure command execution, session management

**Key Tools:**
- `read_file` / `write_file` - File operations with backup support
- `run_python` / `run_javascript` - Code execution with dependency management
- `git_status` / `git_commit` / `enhanced_git_diff` - Git operations
- `docker_build` / `docker_run` / `docker_compose` - Container management
- `create_project` - Multi-framework project scaffolding
- `secure_run_command` - Allowlist-based command execution
- `load_project_config` - Project-specific configuration management

*Use the Claude interface to explore all available tools and their capabilities.*

## 🎯 Usage Examples

**Project Setup:**
```
👤 "Create a new React project called 'my-app'"
🤖 Uses: create_project, npm_command, create_file
```

**Code Analysis:**
```
👤 "Analyze the codebase and run tests"
🤖 Uses: analyze_code, search_files, run_tests, git_status
```

**Git Workflow:**
```
👤 "Review changes and commit my work"
🤖 Uses: git_status, enhanced_git_diff, git_add, git_commit
```

**Secure Development:**
```
👤 "Start a development session and run tests securely"
🤖 Uses: start_coding_session, secure_run_command, auto_commit_changes
```

## 🧪 Development

**Setup:**
```bash
pnpm install && pnpm run build
pnpm test  # Run 473 tests across 15 test suites
pnpm run dev  # Development with auto-rebuild
```

**Docker:**
```bash
docker-compose up --build  # Run with Docker
docker-compose run --rm app pnpm test  # Test in container
```

**Testing:** 473 tests with comprehensive coverage including unit, integration, and e2e tests.

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Add tests for new functionality
4. Run the test suite: `pnpm test`
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

**Common Issues:**
- **MCP server won't start**: Check Node.js version (18+) and run `pnpm test`
- **Claude connection issues**: Verify config file path and restart Claude Desktop
- **Command execution blocked**: Commands must be in `.vscode-mcp.toml` allowlist
- **VS Code detection issues**: Ensure VS Code is running with open workspaces

**Getting Help:**
- Create an issue on [GitHub](https://github.com/agentics-ai/code-mcp)
- Check the comprehensive test suite for usage examples
- Review tool descriptions in the Claude interface

## 🙏 Acknowledgments

Inspired by [codemcp](https://github.com/ezyang/codemcp) by Edward Z. Yang. We've adapted key security and configuration concepts while maintaining focus on VS Code integration and comprehensive MCP tool coverage.

**Key adaptations from codemcp:**
- Project-specific `.vscode-mcp.toml` configuration
- Allowlist-based command execution security
- Development session tracking and rollback capabilities

Built with ❤️ for the AI development community.
