# Code MCP Server

> **⚠️ Experimental Project** - This is an experimental MCP server for VS Code integration. While it includes comprehensive testing, it's still in active development. Use with caution in production environments and expect potential breaking changes.

An **experimental Model Context Protocol (MCP) server** that aims to enable AI assistants like Claude to interact with VS Code workspaces. This project attempts to provide development tools for file operations, code execution, Git management, Docker integration, and project management, though it's still evolving and may have limitations.

> **Inspired by [codemcp](https://github.com/ezyang/codemcp)** - This experimental project adapts security and configuration concepts from the codemcp project, exploring project-specific TOML configuration, restricted command execution, and session management features. We're learning and iterating on these concepts.

[![Test Status](https://img.shields.io/badge/tests-473%20passing-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.15%2B-purple.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-agentics--ai%2Fcode--mcp-blue.svg)](https://github.com/agentics-ai/code-mcp)

## ✨ Key Features (Experimental)

- 🎯 **Workspace Management** - Attempts to provide smart VS Code workspace detection and path validation
- 🛡️ **Project Configuration** - Experimental `.vscode-mcp.toml` configuration system for project-specific settings
- 📂 **File Operations** - Basic file CRUD operations, search, and comparison features
- ⚡ **Code Execution** - Experimental support for Python and JavaScript execution with package management
- 🔧 **Git Integration** - Git workflow tools with diff analysis (still being refined)
- 🐳 **Docker Integration** - Basic Docker container and image operations
- 🏗️ **Project Scaffolding** - Template-based project creation (limited framework support)
- 🔍 **Code Analysis** - Experimental code analysis and quality metrics

> **Note**: All features are experimental and may not work perfectly in all environments. We're actively working to improve reliability and coverage.

## 🚀 Quick Start

> **⚠️ Experimental Software**: Please test thoroughly in development environments before using with important projects. This MCP server is under active development and may have unexpected behaviors.

### Method 1: NPM Installation (Experimental)

Try the experimental package installation:

```bash
# Install globally (experimental)
npm install -g code-mcp

# Or use with npx (recommended for testing)
npx code-mcp --help
```

**Experimental Claude Desktop integration:**
```bash
# Generate configuration (may need adjustments)
npx code-mcp --config

# Follow the instructions to add the config to Claude Desktop
```

**Manual Claude Desktop Configuration:**
Add this to your Claude Desktop config file:
```json
{
  "mcpServers": {
    "code-mcp": {
      "command": "npx",
      "args": ["code-mcp"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

### Method 2: Local Development Installation

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

## ⚙️ Project Configuration (Experimental)

This experimental feature allows creating a `.vscode-mcp.toml` file in your project root for project-specific settings. Please note that this configuration system is still being developed and may change:

```toml
[general]
projectName = "My Project"
autoCommit = true  # Experimental feature
sessionTracking = true  # Still in development

[security]
# Experimental allowlist-based security
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

**Experimental Features:**
- **Command allowlisting** - Attempts to restrict command execution for security
- **Session management** - Experimental development session tracking
- **Custom tools** - Define project-specific command sequences (basic implementation)
- **Auto-commit** - Experimental AI change tracking (may miss some changes)

> **Warning**: The configuration system is experimental and may not provide complete security. Always review and test commands before relying on them.

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

## 🛠️ Available Tools (Experimental)

This experimental server provides development tools organized by category. Please note that not all tools may work reliably in all environments:

- **📁 File Operations** - Basic CRUD operations, search, comparison (still refining reliability)
- **⚡ Code Execution** - Python and JavaScript execution with package management (experimental)
- **🔧 Git Integration** - Git workflow tools with diff analysis (may have edge cases)
- **🐳 Docker** - Container and image operations (basic implementation)
- **🏗️ Project Management** - Scaffolding and workspace detection (limited templates)
- **🛡️ Security** - Experimental command restriction and session management

**Key Tools (All Experimental):**
- `read_file` / `write_file` - File operations with backup support
- `run_python` / `run_javascript` - Code execution with dependency management
- `git_status` / `git_commit` / `enhanced_git_diff` - Git operations  
- `docker_build` / `docker_run` / `docker_compose` - Container management
- `create_project` - Multi-framework project scaffolding
- `secure_run_command` - Allowlist-based command execution
- `load_project_config` - Project-specific configuration management

*Explore available tools through the Claude interface, but please test functionality before relying on it for important work.*

## 🎯 Usage Examples (Experimental Results May Vary)

> **💡 Best Practice**: Always specify full project paths for more reliable workspace detection and operations. This helps the MCP server understand your project context better.

**Project Setup with Full Path:**
```
👤 "Create a new React project at /Users/username/projects/my-react-app"
🤖 Attempts to use: create_project, npm_command, create_file
📝 Note: Full paths help with workspace detection and file operations
```

**Code Analysis with Specific Project:**
```
👤 "Analyze the codebase at /Users/username/projects/my-app and run tests"
🤖 Tries to use: analyze_code, search_files, run_tests, git_status
📝 Note: Specifying the project path improves analysis accuracy
```

**Git Workflow with Project Context:**
```
👤 "Review changes in /Users/username/projects/my-app and commit my work"
🤖 Uses: git_status, enhanced_git_diff, git_add, git_commit  
📝 Note: Full paths ensure Git operations target the correct repository
```

**Working with Multiple Projects:**
```
👤 "Compare the package.json files between /Users/username/projects/app-v1 and /Users/username/projects/app-v2"
🤖 Uses: read_file, compare_files with proper workspace context
📝 Note: Full paths prevent confusion when working with multiple projects
```

**Docker Operations with Project Path:**
```
👤 "Build a Docker image for the project at /Users/username/projects/my-docker-app"
🤖 Uses: docker_build, read_file (for Dockerfile) with correct working directory
📝 Note: Ensures Docker commands run in the correct project context
```

**Experimental Security Features:**
```
👤 "Start a development session for /Users/username/projects/secure-app and run tests"
🤖 Attempts: start_coding_session, secure_run_command, auto_commit_changes
📝 Note: Project-specific security settings work better with full paths
```

## 🧪 Development & Testing

**Setup:**
```bash
pnpm install && pnpm run build
pnpm test  # Run test suite (currently 473 tests across 15 suites)
pnpm run dev  # Development with auto-rebuild
```

**Docker (Experimental):**
```bash
docker-compose up --build  # Run with Docker (may need adjustments)
docker-compose run --rm app pnpm test  # Test in container
```

**Testing:** We maintain a comprehensive test suite with 473 tests covering unit, integration, and e2e scenarios. However, as an experimental project, real-world usage may reveal edge cases not covered by tests.

> **Note**: While we have extensive tests, this is still experimental software. Test thoroughly in your specific environment before relying on it.

## 🤝 Contributing

We welcome contributions to this experimental project! Please keep in mind that we're still figuring out best practices and the architecture may evolve:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Add tests for new functionality (our test suite helps catch regressions)
4. Run the test suite: `pnpm test`
5. Submit a pull request with a clear description

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines. As an experimental project, we're especially interested in:
- Bug reports and edge cases
- Suggestions for improving reliability  
- Use cases that don't work well yet
- Ideas for better security and configuration approaches

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support & Known Limitations

**This is experimental software** - please be patient as we work through issues and limitations.

**Known Limitations:**
- **Incomplete error handling**: Some edge cases may not be handled gracefully
- **Platform-specific issues**: Primarily tested on macOS and Linux; Windows support may be incomplete
- **Performance**: Some operations may be slower than expected
- **Security**: Experimental security features need more real-world testing

**Common Issues:**
- **MCP server won't start**: Check Node.js version (18+) and run `pnpm test` to identify issues
- **Claude connection issues**: Verify config file path and restart Claude Desktop (may need manual config adjustments)
- **Command execution blocked**: Commands must be in `.vscode-mcp.toml` allowlist (security feature is experimental)
- **VS Code detection issues**: Ensure VS Code is running with open workspaces (detection logic is still being refined)

**Getting Help:**
- Create an issue on [GitHub](https://github.com/agentics-ai/code-mcp) with detailed reproduction steps
- Check the test suite for usage examples (though real usage may differ)
- Review tool descriptions in the Claude interface
- Be specific about your environment and use case when reporting issues

## 🙏 Acknowledgments

Inspired by [codemcp](https://github.com/ezyang/codemcp) by Edward Z. Yang. We're experimenting with and learning from key security and configuration concepts while exploring VS Code integration and MCP tool coverage.

**Experimental adaptations from codemcp:**
- Project-specific `.vscode-mcp.toml` configuration (still refining the format)
- Allowlist-based command execution security (needs more testing)
- Development session tracking and rollback capabilities (basic implementation)

Built with ❤️ for the AI development community as an experimental contribution. We're learning as we build and welcome feedback on what works and what doesn't.
