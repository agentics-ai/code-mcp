/**
 * VS Code workspace detection service
 * Automatically detects open VS Code instances and their workspaces
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { VSCODE_DETECTION } from '../constants.js';
import { VSCodeWorkspace, VSCodeInstance, VSCodeDetectionResult, ToolResult } from '../types.js';
import { ValidationUtils } from '../utils.js';

const execAsync = promisify(exec);

export interface DetectWorkspacesArgs {
  includeRecent?: boolean;
  includeRunning?: boolean;
  maxResults?: number;
}

export interface SelectWorkspaceArgs {
  workspacePath: string;
  source: 'detected' | 'recent' | 'manual';
}

export class VSCodeDetectionService {
  
  constructor() {}

  /**
   * Detect all available VS Code workspaces
   */
  async detectWorkspaces(args: DetectWorkspacesArgs = {}): Promise<ToolResult> {
    const { includeRecent = true, includeRunning = true, maxResults = 20 } = args;
    
    try {
      const result: VSCodeDetectionResult = {
        instances: [],
        recentWorkspaces: [],
        totalWorkspaces: 0
      };

      // Detect running VS Code instances
      if (includeRunning) {
        result.instances = await this._detectRunningInstances();
      }

      // Detect recent workspaces from VS Code settings
      if (includeRecent) {
        result.recentWorkspaces = await this._detectRecentWorkspaces();
      }

      // Calculate total and limit results
      const allWorkspaces = [
        ...result.instances.flatMap(instance => instance.workspaces),
        ...result.recentWorkspaces
      ];
      
      result.totalWorkspaces = allWorkspaces.length;

      // Format response for user selection
      const workspaceList = this._formatWorkspaceList(result, maxResults);
      
      return {
        content: [{
          type: 'text',
          text: workspaceList,
        }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to detect VS Code workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }

  /**
   * Present workspace selection to user and handle choice
   */
  async presentWorkspaceChoice(detectedWorkspaces: VSCodeDetectionResult): Promise<ToolResult> {
    const allWorkspaces = [
      ...detectedWorkspaces.instances.flatMap(instance => instance.workspaces),
      ...detectedWorkspaces.recentWorkspaces
    ];

    if (allWorkspaces.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No VS Code workspaces detected. You can:\n1. Open VS Code with a workspace\n2. Manually set a workspace path using set_workspace\n3. Create a new project using create_project',
        }],
      };
    }

    let choiceText = '📁 **Detected VS Code Workspaces:**\n\n';
    choiceText += '**Currently Open:**\n';
    
    // List running instances first
    let index = 1;
    for (const instance of detectedWorkspaces.instances) {
      for (const workspace of instance.workspaces) {
        choiceText += `${index}. 🟢 ${workspace.name} (${workspace.path}) - ACTIVE\n`;
        index++;
      }
    }

    if (detectedWorkspaces.recentWorkspaces.length > 0) {
      choiceText += '\n**Recent Workspaces:**\n';
      for (const workspace of detectedWorkspaces.recentWorkspaces.slice(0, 10)) {
        if (!detectedWorkspaces.instances.some(inst => 
          inst.workspaces.some(ws => ws.path === workspace.path))) {
          choiceText += `${index}. 📂 ${workspace.name} (${workspace.path})\n`;
          index++;
        }
      }
    }

    choiceText += '\n**Instructions:**\n';
    choiceText += '• To use a workspace, tell me the number or path\n';
    choiceText += '• I can automatically set the most recently used active workspace\n';
    choiceText += '• Or you can manually specify a different path\n';

    return {
      content: [{
        type: 'text',
        text: choiceText,
      }],
    };
  }

  /**
   * Auto-select the most appropriate workspace
   */
  async autoSelectWorkspace(): Promise<ToolResult> {
    try {
      const detection = await this._performDetection();
      
      // Priority: Currently open workspace > Most recent workspace
      let selectedWorkspace: VSCodeWorkspace | null = null;
      
      if (detection.instances.length > 0 && detection.instances[0].workspaces.length > 0) {
        selectedWorkspace = detection.instances[0].workspaces[0];
      } else if (detection.recentWorkspaces.length > 0) {
        selectedWorkspace = detection.recentWorkspaces[0];
      }

      if (!selectedWorkspace) {
        return {
          content: [{
            type: 'text',
            text: 'No VS Code workspaces found. Please open VS Code with a workspace or manually set a workspace path.',
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: `🎯 **Auto-selected workspace:** ${selectedWorkspace.name}\n📍 **Path:** ${selectedWorkspace.path}\n🟢 **Status:** ${selectedWorkspace.isOpen ? 'Currently Open' : 'Recent'}\n\nI'll use this workspace for our session. You can change it anytime by asking me to switch workspaces.`,
        }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to auto-select workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }

  /**
   * Detect running VS Code instances using process detection
   */
  private async _detectRunningInstances(): Promise<VSCodeInstance[]> {
    const instances: VSCodeInstance[] = [];
    
    try {
      const platform = process.platform;
      
      // Try multiple detection methods for better compatibility
      const detectionMethods = this._getDetectionMethods(platform);
      
      for (const method of detectionMethods) {
        try {
          const { stdout } = await execAsync(method.command);
          const lines = stdout.trim().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const processInfo = this._parseProcessLine(line, platform, method.format);
            if (processInfo) {
              // Avoid duplicates
              const exists = instances.some(inst => inst.pid === processInfo.pid);
              if (!exists) {
                instances.push(processInfo);
              }
            }
          }
          
          // If we found instances with this method, we can stop
          if (instances.length > 0) {
            break;
          }
        } catch (methodError) {
          // Try next method
          continue;
        }
      }
    } catch (error) {
      // Process detection failed, continue with other methods
      console.warn('Process detection failed:', error);
    }
    
    return instances;
  }

  /**
   * Get platform-specific detection methods
   */
  private _getDetectionMethods(platform: string): Array<{command: string, format: string}> {
    if (platform === 'darwin') {
      return [
        // More flexible grep patterns for macOS
        { command: 'ps aux | grep -i "visual studio code" | grep -v grep', format: 'unix' },
        { command: 'ps aux | grep -E "(Code Helper|Electron)" | grep -E "(code|vscode)" | grep -v grep', format: 'unix' },
        { command: 'ps aux | grep -E "/(code|code-insiders|codium|cursor)" | grep -v grep', format: 'unix' },
        { command: 'pgrep -fl "Visual Studio Code|Code Helper.*code"', format: 'pgrep' }
      ];
    } else if (platform === 'linux') {
      return [
        { command: 'ps aux | grep -E "(code|code-insiders|codium|cursor)" | grep -v grep', format: 'unix' },
        { command: 'pgrep -fl "code|vscode"', format: 'pgrep' }
      ];
    } else if (platform === 'win32') {
      return [
        { command: 'wmic process where "name like \'%code%\'" get CommandLine,ProcessId /format:csv', format: 'wmic' },
        { command: 'tasklist /fo csv | findstr /i code', format: 'tasklist' }
      ];
    }
    
    return [];
  }

  /**
   * Detect recent workspaces from VS Code configuration
   */
  private async _detectRecentWorkspaces(): Promise<VSCodeWorkspace[]> {
    const workspaces: VSCodeWorkspace[] = [];
    
    try {
      const platform = process.platform;
      
      // Try multiple storage locations and formats
      const storagePaths = this._getStoragePaths(platform);
      
      for (const storagePath of storagePaths) {
        try {
          // Try SQLite database first (more reliable)
          if (storagePath.includes('state.vscdb')) {
            await this._parseVSCodeDatabase(storagePath, workspaces);
          } else {
            // Try JSON storage file
            await this._parseVSCodeStorage(storagePath, workspaces);
          }
          
          // If we found workspaces, we can break
          if (workspaces.length > 0) {
            break;
          }
        } catch (error) {
          // Try next storage location
          continue;
        }
      }
    } catch (error) {
      console.warn('Recent workspace detection failed:', error);
    }
    
    return workspaces;
  }

  /**
   * Get all possible VS Code storage paths
   */
  private _getStoragePaths(platform: string): string[] {
    const paths: string[] = [];
    const homeDir = os.homedir();
    
    const variants = [
      'Code',
      'Code - Insiders', 
      'VSCodium',
      'Cursor'
    ];
    
    for (const variant of variants) {
      if (platform === 'darwin') {
        const basePath = path.join(homeDir, 'Library/Application Support', variant, 'User/globalStorage');
        paths.push(path.join(basePath, 'state.vscdb'));
        paths.push(path.join(basePath, 'storage.json'));
      } else if (platform === 'linux') {
        const basePath = path.join(homeDir, '.config', variant, 'User/globalStorage');
        paths.push(path.join(basePath, 'state.vscdb'));
        paths.push(path.join(basePath, 'storage.json'));
      } else if (platform === 'win32') {
        const basePath = path.join(homeDir, 'AppData/Roaming', variant, 'User/globalStorage');
        paths.push(path.join(basePath, 'state.vscdb'));
        paths.push(path.join(basePath, 'storage.json'));
      }
    }
    
    return paths;
  }

  /**
   * Parse VS Code SQLite database for workspace information
   */
  private async _parseVSCodeDatabase(dbPath: string, workspaces: VSCodeWorkspace[]): Promise<void> {
    try {
      // Check if file exists
      await fs.access(dbPath);
      
      // Use sqlite3 command line tool
      const query = `sqlite3 "${dbPath}" "SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList';"`;
      const { stdout } = await execAsync(query);
      
      if (stdout.trim()) {
        const data = JSON.parse(stdout.trim());
        this._parseRecentWorkspaces(data, workspaces);
      }
    } catch (error) {
      // SQLite not available or query failed
      throw error;
    }
  }

  /**
   * Parse VS Code JSON storage file
   */
  private async _parseVSCodeStorage(storagePath: string, workspaces: VSCodeWorkspace[]): Promise<void> {
    const configContent = await fs.readFile(storagePath, 'utf8');
    const config = JSON.parse(configContent);
    
    // Try different possible keys for recent workspaces
    const recentData = config?.['history.recentlyOpenedPathsList'] || 
                      config?.recentlyOpenedPathsList ||
                      config?.history?.recentlyOpenedPathsList;
    
    if (recentData) {
      this._parseRecentWorkspaces(recentData, workspaces);
    }
  }

  /**
   * Parse recent workspaces data from VS Code storage
   */
  private _parseRecentWorkspaces(data: any, workspaces: VSCodeWorkspace[]): void {
    const entries = data.entries || data || [];
    
    for (const entry of entries) {
      let workspacePath: string | undefined;
      let workspaceType: 'folder' | 'workspace' = 'folder';
      
      // Handle different entry formats
      if (entry.folderUri) {
        workspacePath = entry.folderUri.path || entry.folderUri;
        if (typeof workspacePath === 'string' && workspacePath.startsWith('file://')) {
          workspacePath = decodeURIComponent(workspacePath.substring(7));
        }
      } else if (entry.workspace) {
        workspacePath = entry.workspace.configPath || entry.workspace;
        workspaceType = 'workspace';
      } else if (entry.fileUri) {
        // Skip individual files
        continue;
      } else if (typeof entry === 'string') {
        workspacePath = entry;
      }
      
      if (workspacePath && typeof workspacePath === 'string') {
        // Clean and validate path
        const cleanPath = this._cleanWorkspacePath(workspacePath);
        if (cleanPath && !workspaces.some(ws => ws.path === cleanPath)) {
          workspaces.push({
            path: cleanPath,
            name: path.basename(cleanPath),
            isOpen: false,
            lastAccessed: entry.lastActiveDate ? new Date(entry.lastActiveDate) : undefined,
            type: workspaceType
          });
        }
      }
    }
  }

  /**
   * Parse process line to extract VS Code instance information
   */
  private _parseProcessLine(line: string, platform: string, format: string = 'unix'): VSCodeInstance | null {
    try {
      if (platform === 'win32') {
        if (format === 'wmic') {
          // Windows WMIC format parsing
          const parts = line.split(',');
          if (parts.length >= 3) {
            const commandLine = parts[1];
            const pid = parseInt(parts[2]);
            return this._extractWorkspacesFromCommandLine(commandLine, pid);
          }
        } else if (format === 'tasklist') {
          // Windows tasklist CSV format
          const parts = line.split(',');
          if (parts.length >= 2) {
            const processName = parts[0].replace(/"/g, '');
            const pid = parseInt(parts[1].replace(/"/g, ''));
            if (processName.toLowerCase().includes('code')) {
              // For tasklist, we can't get command line args, so create basic instance
              return {
                pid,
                executable: 'code',
                workspaces: []
              };
            }
          }
        }
      } else {
        if (format === 'pgrep') {
          // pgrep format: PID command
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            const pid = parseInt(parts[0]);
            const commandLine = parts.slice(1).join(' ');
            return this._extractWorkspacesFromCommandLine(commandLine, pid);
          }
        } else {
          // Standard Unix ps aux format
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 11) {
            const pid = parseInt(parts[1]);
            const commandLine = parts.slice(10).join(' ');
            return this._extractWorkspacesFromCommandLine(commandLine, pid);
          }
        }
      }
    } catch (error) {
      // Skip invalid lines
    }
    
    return null;
  }

  /**
   * Extract workspace information from command line
   */
  private _extractWorkspacesFromCommandLine(commandLine: string, pid: number): VSCodeInstance | null {
    const workspaces: VSCodeWorkspace[] = [];
    
    // Enhanced workspace detection patterns
    const detectionPatterns = [
      // Standard URI arguments
      { pattern: /(?:--folder-uri|--file-uri)\s+([^\s]+)/g, type: 'uri' },
      // Direct file/folder paths in quotes
      { pattern: /["']([^"']+)["']/g, type: 'quoted' },
      // Workspace files
      { pattern: /--workspace\s+([^\s]+)/g, type: 'workspace' },
      // Add/goto arguments
      { pattern: /(?:--add|--goto)\s+([^\s]+)/g, type: 'add' },
      // Simple paths without quotes (last resort)
      { pattern: /\s([~/][^\s]+(?:\.code-workspace|\.vscode)?)(?:\s|$)/g, type: 'simple' }
    ];

    for (const { pattern, type } of detectionPatterns) {
      let match;
      while ((match = pattern.exec(commandLine)) !== null) {
        let workspacePath = match[1];
        
        // Handle different URI formats
        if (type === 'uri') {
          if (workspacePath.startsWith('file://')) {
            workspacePath = decodeURIComponent(workspacePath.substring(7));
          } else if (workspacePath.startsWith('vscode-remote://')) {
            // Remote workspace
            continue;
          }
        }
        
        // Validate and clean path
        const cleanedPath = this._cleanWorkspacePath(workspacePath);
        if (!cleanedPath) continue;
        
        // Check if path exists and is accessible
        try {
          if (this._isValidWorkspacePath(cleanedPath)) {
            const workspace: VSCodeWorkspace = {
              path: cleanedPath,
              name: path.basename(cleanedPath),
              isOpen: true,
              type: type === 'workspace' || cleanedPath.endsWith('.code-workspace') ? 'workspace' : 'folder'
            };
            
            // Avoid duplicates
            if (!workspaces.some(ws => ws.path === workspace.path)) {
              workspaces.push(workspace);
            }
          }
        } catch (error) {
          // Path doesn't exist or not accessible, skip
        }
      }
    }

    // If we found workspaces, create instance
    if (workspaces.length > 0) {
      return {
        pid,
        executable: this._extractExecutableName(commandLine),
        workspaces
      };
    }

    // For processes without explicit workspace args, check if it's a main VS Code process
    if (this._isMainVSCodeProcess(commandLine)) {
      return {
        pid,
        executable: this._extractExecutableName(commandLine),
        workspaces: [] // Main process without specific workspace
      };
    }

    return null;
  }

  /**
   * Clean and normalize workspace path
   */
  private _cleanWorkspacePath(path: string): string | null {
    if (!path) return null;
    
    // Remove quotes and trim
    path = path.replace(/^["']|["']$/g, '').trim();
    
    // Expand tilde
    if (path.startsWith('~/')) {
      path = os.homedir() + path.substring(1);
    }
    
    // Skip invalid paths
    if (path.includes('\0') || path.length === 0 || path === '.') {
      return null;
    }
    
    return path;
  }

  /**
   * Check if path is a valid workspace path
   */
  private _isValidWorkspacePath(workspacePath: string): boolean {
    try {
      const stat = require('fs').statSync(workspacePath);
      return stat.isDirectory() || workspacePath.endsWith('.code-workspace');
    } catch {
      return false;
    }
  }

  /**
   * Check if this is a main VS Code process (not helper/renderer)
   */
  private _isMainVSCodeProcess(commandLine: string): boolean {
    // Main process indicators
    const mainProcessIndicators = [
      'Electron',
      '--type=browser',
      '--main-pid',
      '--crash-reporter-id'
    ];
    
    const helperProcessIndicators = [
      '--type=renderer',
      '--type=utility',
      '--type=gpu-process',
      'Code Helper',
      'language-server',
      'tsserver'
    ];
    
    // Exclude helper processes
    if (helperProcessIndicators.some(indicator => commandLine.includes(indicator))) {
      return false;
    }
    
    // Check for main process indicators
    return mainProcessIndicators.some(indicator => commandLine.includes(indicator));
  }

  /**
   * Extract executable name from command line
   */
  private _extractExecutableName(commandLine: string): string {
    const executableMatch = commandLine.match(/(code-insiders|codium|cursor|code)/);
    return executableMatch ? executableMatch[1] : 'code';
  }

  /**
   * Perform full detection and return structured result
   */
  private async _performDetection(): Promise<VSCodeDetectionResult> {
    const instances = await this._detectRunningInstances();
    const recentWorkspaces = await this._detectRecentWorkspaces();
    
    return {
      instances,
      recentWorkspaces,
      totalWorkspaces: instances.flatMap(i => i.workspaces).length + recentWorkspaces.length
    };
  }

  /**
   * Format workspace list for display
   */
  private _formatWorkspaceList(result: VSCodeDetectionResult, maxResults: number): string {
    let text = '🔍 **VS Code Workspace Detection Results**\n\n';
    
    if (result.instances.length > 0) {
      text += '**🟢 Currently Open Workspaces:**\n';
      for (const instance of result.instances) {
        text += `📍 ${instance.executable} (PID: ${instance.pid})\n`;
        for (const workspace of instance.workspaces) {
          text += `   📁 ${workspace.name} → ${workspace.path}\n`;
        }
      }
      text += '\n';
    }

    if (result.recentWorkspaces.length > 0) {
      text += '**📂 Recent Workspaces:**\n';
      const recentToShow = result.recentWorkspaces.slice(0, Math.min(maxResults - result.instances.flatMap(i => i.workspaces).length, 10));
      for (const workspace of recentToShow) {
        text += `📁 ${workspace.name} → ${workspace.path}\n`;
        if (workspace.lastAccessed) {
          text += `   🕒 Last accessed: ${workspace.lastAccessed.toLocaleDateString()}\n`;
        }
      }
    }

    if (result.totalWorkspaces === 0) {
      text += '❌ **No VS Code workspaces detected**\n\n';
      text += '**Suggestions:**\n';
      text += '• Open VS Code with a folder/workspace\n';
      text += '• Use `set_workspace` to manually specify a path\n';
      text += '• Use `create_project` to create a new project\n';
    } else {
      text += `\n**📊 Summary:** Found ${result.totalWorkspaces} workspace(s)\n`;
      text += '• Use `set_workspace` with any of these paths\n';
      text += '• Or ask me to auto-select the best workspace\n';
    }

    return text;
  }
}
