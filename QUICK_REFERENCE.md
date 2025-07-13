# VS Code MCP Server - Quick Reference

## 🚀 Ready to Use!
Your MCP server is configured and ready for Claude Desktop testing.

## Configuration Files
- **MCP Server**: `/Users/braincraft/Desktop/vscode-mcp-server/dist/src/index.js`
- **Claude Config**: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Quick Start Commands for Claude Desktop

### 1. Project Exploration
```
"Show me the workspace structure and main files"
"Get an overview of this project"
"What type of project is this and what are its main components?"
```

### 2. Code Analysis
```
"Search for all error handling patterns in the codebase"
"Find any TODO or FIXME comments"
"Analyze the test coverage and suggest improvements"
```

### 3. Testing & Quality
```
"Run all tests and show me the results"
"Check for any linting errors or warnings"
"Analyze the dependencies for security issues"
```

### 4. Development Tasks
```
"Create a new service for [feature name] with proper tests"
"Refactor [filename] to improve readability"
"Add input validation to the API endpoints"
```

### 5. Git Operations
```
"Check the current git status"
"Create a feature branch for [feature name]"
"Show me the recent commit history"
```

## Available Tools Summary

| Category | Tools | Purpose |
|----------|-------|---------|
| **Workspace** | `list_files`, `get_workspace_info`, `search_files` | Project navigation |
| **Files** | `read_file`, `write_file`, `delete_file`, `rename_file` | File operations |
| **Code** | `execute_command`, `run_tests`, `npm_command` | Execution & testing |
| **Git** | `git_status`, `git_commit`, `git_branch`, `git_log` | Version control |
| **Analysis** | `semantic_search`, `analyze_dependencies`, `get_diagnostics` | Code analysis |

## Testing Workflow

1. **Start** → Ask Claude to explore your project
2. **Analyze** → Use semantic search to understand code patterns
3. **Modify** → Make changes with Claude's help
4. **Test** → Run tests to verify changes
5. **Commit** → Use git tools to save progress

## Troubleshooting

If MCP server doesn't appear in Claude Desktop:
1. Restart Claude Desktop
2. Check config file exists: `ls -la ~/Library/Application\ Support/Claude/`
3. Test server manually: `cd /Users/braincraft/Desktop/vscode-mcp-server && node dist/src/index.js`

## Example Session

**You**: "I want to improve error handling in this project"

**Claude will**:
1. Analyze current error patterns
2. Identify inconsistencies
3. Suggest improvements
4. Implement changes
5. Update tests
6. Verify everything works

---

🎉 **You're all set!** Open Claude Desktop and start testing your code with AI assistance!
