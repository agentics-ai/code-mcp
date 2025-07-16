# Scripts Directory

This directory contains helper scripts for setting up and maintaining the vscode-mcp project.

## 🔧 Configuration Scripts

### `generate-claude-config.sh`
Automatically generates Claude Desktop configuration with the correct paths.

**Usage:**
```bash
./scripts/generate-claude-config.sh
```

**Features:**
- ✅ Detects current project directory automatically
- ✅ Builds the project if needed
- ✅ Creates Claude config directory if missing
- ✅ Generates configuration with absolute paths
- ✅ Provides verification steps

**Output:** Creates `~/Library/Application Support/Claude/claude_desktop_config.json`

---

## 🔄 Making Scripts Executable

If scripts are not executable, run:
```bash
chmod +x scripts/*.sh
```

## 🆘 Troubleshooting

### GitHub CLI Issues
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Check status
gh auth status
```

### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/generate-claude-config.sh
chmod +x scripts/setup-branch-protection.sh
```

### Path Issues
Always run scripts from the project root directory:
```bash
cd /path/to/vscode-mcp
./scripts/script-name.sh
```
