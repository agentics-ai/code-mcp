#!/bin/bash

# generate-claude-config.sh
# Generate Claude Desktop configuration for vscode-mcp

set -e

# Get the current directory (should be the vscode-mcp project root)
PROJECT_DIR=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
    echo "❌ Please run this script from the vscode-mcp project root directory"
    exit 1
fi

# Check if dist exists
if [[ ! -f "dist/src/index.js" ]]; then
    echo "⚠️  Built files not found. Building project first..."
    if command -v pnpm &> /dev/null; then
        pnpm run build
    elif command -v npm &> /dev/null; then
        npm run build
    else
        echo "❌ Neither pnpm nor npm found. Please install one and build the project."
        exit 1
    fi
fi

# Create Claude config directory if it doesn't exist
# Detect the operating system and set appropriate config directory
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "freebsd"* ]]; then
    # Linux/FreeBSD
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash, MSYS2, Cygwin)
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
else
    # Fallback to Linux-style config
    echo "⚠️  Unknown OS type: $OSTYPE. Using Linux-style config directory."
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
fi

CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo "🖥️  Detected OS: $OSTYPE"
echo "📁 Config directory: $CLAUDE_CONFIG_DIR"

mkdir -p "$CLAUDE_CONFIG_DIR"

# Generate the configuration
echo "🔧 Generating Claude Desktop configuration..."

cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "vscode-agent": {
      "command": "node",
      "args": ["$PROJECT_DIR/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF

echo "✅ Claude Desktop configuration created!"
echo "📁 Location: $CONFIG_FILE"
echo ""
echo "📝 Configuration:"
cat "$CONFIG_FILE"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart Claude Desktop"
echo "   2. Test with: 'What development tools do you have available?'"
echo "   3. Try: 'Show me the current workspace structure'"
