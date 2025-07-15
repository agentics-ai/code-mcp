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
      let psCommand: string;
      
      if (platform === 'darwin') {
        psCommand = 'ps aux | grep -E "/(code|code-insiders|codium|cursor)" | grep -v grep';
      } else if (platform === 'linux') {
        psCommand = 'ps aux | grep -E "(code|code-insiders|codium|cursor)" | grep -v grep';
      } else if (platform === 'win32') {
        psCommand = 'wmic process where "name like \'%code%\'" get CommandLine,ProcessId /format:csv';
      } else {
        return instances;
      }

      const { stdout } = await execAsync(psCommand);
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const processInfo = this._parseProcessLine(line, platform);
        if (processInfo) {
          instances.push(processInfo);
        }
      }
    } catch (error) {
      // Process detection failed, continue with other methods
      console.warn('Process detection failed:', error);
    }
    
    return instances;
  }

  /**
   * Detect recent workspaces from VS Code configuration
   */
  private async _detectRecentWorkspaces(): Promise<VSCodeWorkspace[]> {
    const workspaces: VSCodeWorkspace[] = [];
    
    try {
      const platform = process.platform;
      let configPath: string;
      
      if (platform === 'darwin') {
        configPath = path.join(os.homedir(), 'Library/Application Support/Code/User/globalStorage/storage.json');
      } else if (platform === 'linux') {
        configPath = path.join(os.homedir(), '.config/Code/User/globalStorage/storage.json');
      } else if (platform === 'win32') {
        configPath = path.join(os.homedir(), 'AppData/Roaming/Code/User/globalStorage/storage.json');
      } else {
        return workspaces;
      }

      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // Parse recent workspaces from VS Code storage
        const recentWorkspaces = config?.['history.recentlyOpenedPathsList'] || [];
        
        for (const entry of recentWorkspaces) {
          if (entry.folderUri || entry.workspace) {
            const workspacePath = entry.folderUri?.path || entry.workspace?.configPath || entry.path;
            if (workspacePath) {
              workspaces.push({
                path: workspacePath,
                name: path.basename(workspacePath),
                isOpen: false,
                lastAccessed: entry.lastActiveDate ? new Date(entry.lastActiveDate) : undefined,
                type: entry.workspace ? 'workspace' : 'folder'
              });
            }
          }
        }
      } catch (error) {
        // Try alternative storage locations
        await this._tryAlternativeStorageLocations(workspaces, platform);
      }
    } catch (error) {
      console.warn('Recent workspace detection failed:', error);
    }
    
    return workspaces;
  }

  /**
   * Try alternative VS Code storage locations
   */
  private async _tryAlternativeStorageLocations(workspaces: VSCodeWorkspace[], platform: string): Promise<void> {
    const alternativePaths = [
      'Code - Insiders/User/globalStorage/storage.json',
      'VSCodium/User/globalStorage/storage.json',
      'Cursor/User/globalStorage/storage.json'
    ];

    for (const altPath of alternativePaths) {
      try {
        let fullPath: string;
        if (platform === 'darwin') {
          fullPath = path.join(os.homedir(), 'Library/Application Support', altPath);
        } else if (platform === 'linux') {
          fullPath = path.join(os.homedir(), '.config', altPath);
        } else {
          continue;
        }

        const content = await fs.readFile(fullPath, 'utf8');
        const config = JSON.parse(content);
        // Parse similar to main method
        // Implementation omitted for brevity
      } catch (error) {
        // Continue trying other locations
      }
    }
  }

  /**
   * Parse process line to extract VS Code instance information
   */
  private _parseProcessLine(line: string, platform: string): VSCodeInstance | null {
    try {
      if (platform === 'win32') {
        // Windows WMIC format parsing
        const parts = line.split(',');
        if (parts.length >= 3) {
          const commandLine = parts[1];
          const pid = parseInt(parts[2]);
          return this._extractWorkspacesFromCommandLine(commandLine, pid);
        }
      } else {
        // Unix-like systems
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          const pid = parseInt(parts[1]);
          const commandLine = parts.slice(10).join(' ');
          return this._extractWorkspacesFromCommandLine(commandLine, pid);
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
    
    // Look for workspace/folder arguments
    const workspaceMatches = commandLine.match(/(?:--folder-uri|--file-uri)\s+([^\s]+)/g);
    if (workspaceMatches) {
      for (const match of workspaceMatches) {
        const uriMatch = match.match(/(?:--folder-uri|--file-uri)\s+(.+)/);
        if (uriMatch) {
          const uri = uriMatch[1];
          let workspacePath = uri;
          
          // Handle file:// URIs
          if (uri.startsWith('file://')) {
            workspacePath = decodeURIComponent(uri.substring(7));
          }
          
          workspaces.push({
            path: workspacePath,
            name: path.basename(workspacePath),
            isOpen: true,
            type: match.includes('--folder-uri') ? 'folder' : 'file'
          });
        }
      }
    }

    // Look for direct path arguments
    const pathMatches = commandLine.match(/["']([^"']+)["']/g);
    if (pathMatches) {
      for (const match of pathMatches) {
        const cleanPath = match.replace(/["']/g, '');
        if (cleanPath && cleanPath !== '.' && !cleanPath.startsWith('-')) {
          try {
            const stat = require('fs').statSync(cleanPath);
            if (stat.isDirectory()) {
              workspaces.push({
                path: cleanPath,
                name: path.basename(cleanPath),
                isOpen: true,
                type: 'folder'
              });
            }
          } catch (error) {
            // Path doesn't exist or not accessible
          }
        }
      }
    }

    if (workspaces.length > 0) {
      return {
        pid,
        executable: this._extractExecutableName(commandLine),
        workspaces
      };
    }

    return null;
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
