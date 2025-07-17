@echo off
REM generate-claude-config.bat
REM Generate Claude Desktop configuration for vscode-mcp on Windows

setlocal enabledelayedexpansion

REM Get the current directory (should be the vscode-mcp project root)
set "PROJECT_DIR=%CD%"
for %%F in ("%PROJECT_DIR%") do set "PROJECT_NAME=%%~nxF"

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the vscode-mcp project root directory
    exit /b 1
)
if not exist "src" (
    echo ❌ Please run this script from the vscode-mcp project root directory
    exit /b 1
)

REM Check if dist exists
if not exist "dist\src\index.js" (
    echo ⚠️  Built files not found. Building project first...
    where pnpm >nul 2>&1
    if !errorlevel! == 0 (
        pnpm run build
    ) else (
        where npm >nul 2>&1
        if !errorlevel! == 0 (
            npm run build
        ) else (
            echo ❌ Neither pnpm nor npm found. Please install one and build the project.
            exit /b 1
        )
    )
)

REM Create Claude config directory if it doesn't exist
set "CLAUDE_CONFIG_DIR=%APPDATA%\Claude"
set "CONFIG_FILE=%CLAUDE_CONFIG_DIR%\claude_desktop_config.json"

echo 🖥️  Detected OS: Windows
echo 📁 Config directory: %CLAUDE_CONFIG_DIR%

if not exist "%CLAUDE_CONFIG_DIR%" mkdir "%CLAUDE_CONFIG_DIR%"

REM Generate the configuration
echo 🔧 Generating Claude Desktop configuration...

REM Convert Windows path to use forward slashes for JSON
set "JSON_PROJECT_DIR=%PROJECT_DIR:\=/%"

(
echo {
echo   "mcpServers": {
echo     "vscode-agent": {
echo       "command": "node",
echo       "args": ["%JSON_PROJECT_DIR%/dist/src/index.js"],
echo       "env": {
echo         "NODE_ENV": "production"
echo       }
echo     }
echo   }
echo }
) > "%CONFIG_FILE%"

echo ✅ Configuration written to: %CONFIG_FILE%
echo.
echo 📝 Configuration content:
type "%CONFIG_FILE%"
echo.
echo 🔄 Please restart Claude Desktop to apply the new configuration.
echo.
echo 💡 Test the connection by asking Claude: "What development tools do you have available?"
