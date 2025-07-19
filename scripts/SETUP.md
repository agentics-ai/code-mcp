# Cross-Platform Setup Guide

This guide provides detailed setup instructions for all supported platforms.

## Quick Setup Summary

| Platform | Comma{
  "mcpServers": {
    "co{
  "mcpServers": {
    {
  "mcp**Windows:**
```json
{
  "mcpServers": {
    "code-mcp": {
      "command": "node",
      "args": ["C:/Users/Username/Desktop/code-mcp/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}   "code-mcp": {
      "command": "node",
      "args": ["C:/Users/Username/Desktop/code-mcp/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
} {
      "command": "node",
      "args": ["/Users/username/Desktop/code-mcp/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}      "command": "node",
      "args": ["/path/to/your/project/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
} |
|----------|---------|--------|
| **macOS/Linux** | `./scripts/generate-claude-config.sh` | Bash script |
| **Windows (CMD)** | `scripts\generate-claude-config.bat` | Batch script |
| **Windows (PowerShell)** | `.\scripts\generate-claude-config.ps1` | PowerShell script |

## Platform-Specific Details

### 🍎 macOS Setup

#### Prerequisites
```bash
# Install Node.js (if not already installed)
brew install node

# Install pnpm
npm install -g pnpm

# Verify installations
node --version
pnpm --version
```

#### Automatic Setup
```bash
# Clone and setup
git clone <repository-url>
cd code-mcp
pnpm install
pnpm run build

# Generate Claude configuration
./scripts/generate-claude-config.sh
```

#### Manual Configuration
```bash
# Create config directory
mkdir -p ~/Library/Application\ Support/Claude

# Edit configuration
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Configuration path: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 🐧 Linux Setup

#### Prerequisites
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm git

# Fedora/RHEL
sudo dnf install nodejs npm git

# Arch Linux
sudo pacman -S nodejs npm git

# Install pnpm
npm install -g pnpm
```

#### Automatic Setup
```bash
# Clone and setup
git clone <repository-url>
cd code-mcp
pnpm install
pnpm run build

# Generate Claude configuration
./scripts/generate-claude-config.sh
```

#### Manual Configuration
```bash
# Create config directory
mkdir -p ~/.config/Claude

# Edit configuration
nano ~/.config/Claude/claude_desktop_config.json
```

Configuration path: `~/.config/Claude/claude_desktop_config.json`

### 🪟 Windows Setup

#### Prerequisites

**Option 1: Native Windows**
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Install Git from [git-scm.com](https://git-scm.com/)
3. Install pnpm: `npm install -g pnpm`

**Option 2: WSL (Recommended)**
```bash
# Install WSL2 and Ubuntu
wsl --install

# In WSL terminal, follow Linux setup instructions
```

#### Automatic Setup (Command Prompt)
```cmd
# Clone and setup
git clone <repository-url>
cd code-mcp
pnpm install
pnpm run build

# Generate Claude configuration
scripts\generate-claude-config.bat
```

#### Automatic Setup (PowerShell)
```powershell
# Clone and setup
git clone <repository-url>
cd code-mcp
pnpm install
pnpm run build

# Generate Claude configuration
.\scripts\generate-claude-config.ps1
```

#### Manual Configuration
```powershell
# Create config directory
New-Item -ItemType Directory -Path "$env:APPDATA\Claude" -Force

# Edit configuration
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

Configuration path: `%APPDATA%\Claude\claude_desktop_config.json`

## Configuration Content

### JSON Configuration Template

```json
{
  "mcpServers": {
    "code-mcp": {
      "command": "node",
      "args": ["<PATH_TO_PROJECT>/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Path Examples by Platform

**macOS/Linux:**
```json
{
  "mcpServers": {
    "code-mcp": {
      "command": "node",
      "args": ["/Users/username/Desktop/code-mcp/dist/src/index.js"],
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
      "args": ["C:/Users/Username/Desktop/code-mcp/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### "Command not found: node"
- **Solution**: Install Node.js for your platform
- **macOS**: `brew install node`
- **Linux**: Use your package manager
- **Windows**: Download from nodejs.org

#### "Command not found: pnpm"
- **Solution**: Install pnpm globally
- **All platforms**: `npm install -g pnpm`

#### "Permission denied" on Linux/macOS
- **Solution**: Make script executable
- **Command**: `chmod +x scripts/generate-claude-config.sh`

#### Claude Desktop not detecting server
1. Verify configuration path is correct for your platform
2. Restart Claude Desktop completely
3. Check that the project is built: `pnpm run build`
4. Verify file path exists: `ls dist/src/index.js` (Unix) or `dir dist\src\index.js` (Windows)

### Testing Your Setup

After configuration, test by asking Claude:
- "What development tools do you have available?"
- "Show me the current workspace structure"
- "What's the status of this git repository?"

### Getting Help

If you encounter issues:
1. Check the [GitHub Issues](../../issues)
2. Verify prerequisites are installed
3. Try the manual configuration approach
4. Run `pnpm test` to verify the installation

## Script Details

### generate-claude-config.sh
- **Platform**: macOS, Linux, WSL
- **Features**: Auto-detects OS, builds project if needed
- **Requirements**: Bash shell

### generate-claude-config.bat
- **Platform**: Windows Command Prompt
- **Features**: Native Windows batch script
- **Requirements**: Windows CMD

### generate-claude-config.ps1
- **Platform**: Windows PowerShell
- **Features**: Advanced PowerShell with error handling
- **Requirements**: PowerShell 5.0+
