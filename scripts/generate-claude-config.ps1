# generate-claude-config.ps1
# Generate Claude Desktop configuration for vscode-mcp on Windows

param(
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

try {
    # Get the current directory (should be the vscode-mcp project root)
    $ProjectDir = Get-Location
    $ProjectName = Split-Path $ProjectDir -Leaf

    # Check if we're in the right directory
    if (-not (Test-Path "package.json") -or -not (Test-Path "src")) {
        Write-Host "❌ Please run this script from the vscode-mcp project root directory" -ForegroundColor Red
        exit 1
    }

    # Check if dist exists
    if (-not (Test-Path "dist\src\index.js")) {
        Write-Host "⚠️  Built files not found. Building project first..." -ForegroundColor Yellow
        
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            & pnpm run build
        } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
            & npm run build
        } else {
            Write-Host "❌ Neither pnpm nor npm found. Please install one and build the project." -ForegroundColor Red
            exit 1
        }
    }

    # Create Claude config directory if it doesn't exist
    $ClaudeConfigDir = Join-Path $env:APPDATA "Claude"
    $ConfigFile = Join-Path $ClaudeConfigDir "claude_desktop_config.json"

    Write-Host "🖥️  Detected OS: Windows" -ForegroundColor Green
    Write-Host "📁 Config directory: $ClaudeConfigDir" -ForegroundColor Cyan

    if (-not (Test-Path $ClaudeConfigDir)) {
        New-Item -ItemType Directory -Path $ClaudeConfigDir -Force | Out-Null
    }

    # Generate the configuration
    Write-Host "🔧 Generating Claude Desktop configuration..." -ForegroundColor Yellow

    # Convert Windows path to use forward slashes for JSON
    $JsonProjectDir = $ProjectDir.ToString().Replace('\', '/')

    $ConfigContent = @{
        mcpServers = @{
            "vscode-agent" = @{
                command = "node"
                args = @("$JsonProjectDir/dist/src/index.js")
                env = @{
                    NODE_ENV = "production"
                }
            }
        }
    }

    # Convert to JSON and write to file
    $JsonConfig = $ConfigContent | ConvertTo-Json -Depth 3
    $JsonConfig | Out-File -FilePath $ConfigFile -Encoding UTF8

    Write-Host "✅ Configuration written to: $ConfigFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Configuration content:" -ForegroundColor Cyan
    Get-Content $ConfigFile | Write-Host
    Write-Host ""
    Write-Host "🔄 Please restart Claude Desktop to apply the new configuration." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Test the connection by asking Claude: 'What development tools do you have available?'" -ForegroundColor Magenta

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
