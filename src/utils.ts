/**
 * Utility functions for the VS Code Agent Server
 */
import path from 'path';
import { ChildProcess } from 'child_process';

/**
 * Path utilities
 */
export class PathUtils {
  /**
   * Resolve path relative to workspace
   */
  static resolvePath(filePath: string, workspacePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(workspacePath, filePath);
  }

  /**
   * Get file extension
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Check if file is a code file
   */
  static isCodeFile(filePath: string, codeExtensions: string[] = ['.py', '.js', '.jsx', '.ts', '.tsx']): boolean {
    const ext = this.getExtension(filePath);
    return codeExtensions.includes(ext);
  }
}

/**
 * String utilities
 */
export class StringUtils {
  /**
   * Escape quotes in command strings
   */
  static escapeQuotes(str: string): string {
    return str.replace(/"/g, '\\"');
  }

  /**
   * Format output with optional error section
   */
  static formatOutput(stdout: string, stderr?: string, prefix: string = 'Output'): string {
    return `${prefix}:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`;
  }

  /**
   * Truncate array of strings with "... and more" message
   */
  static truncateList(items: string[], maxItems: number = 50): string {
    if (items.length <= maxItems) {
      return items.join('\n');
    }
    return `${items.slice(0, maxItems).join('\n')}\n... and ${items.length - maxItems} more`;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate required parameters
   */
  static validateRequired(params: Record<string, any>, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !params[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Validate file path
   */
  static validatePath(filePath: any): asserts filePath is string {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }
  }

  /**
   * Validate project type
   */
  static validateProjectType(type: string, supportedTypes: string[]): void {
    if (!supportedTypes.includes(type)) {
      throw new Error(`Unsupported project type: ${type}. Supported types: ${supportedTypes.join(', ')}`);
    }
  }
}

/**
 * Process information interface
 */
export interface ProcessInfo {
  process: ChildProcess;
  command: string;
  port?: number;
  workspace: string;
  startTime: string;
}

/**
 * Process display format
 */
export interface ProcessDisplay {
  name: string;
  command: string;
  port?: number;
  pid?: number;
  workspace: string;
  startTime: string;
}

/**
 * Process utilities
 */
export class ProcessUtils {
  /**
   * Create process info object
   */
  static createProcessInfo(
    process: ChildProcess, 
    command: string, 
    port: number | undefined, 
    workspace: string
  ): ProcessInfo {
    return {
      process,
      command,
      port,
      workspace,
      startTime: new Date().toISOString(),
    };
  }

  /**
   * Format process list for display
   */
  static formatProcessList(processMap: Map<string, ProcessInfo>): string {
    const processes: ProcessDisplay[] = Array.from(processMap.entries()).map(([name, info]) => ({
      name,
      command: info.command,
      port: info.port,
      pid: info.process.pid,
      workspace: info.workspace,
      startTime: info.startTime,
    }));

    return processes.length > 0 
      ? `Active processes:\n${JSON.stringify(processes, null, 2)}`
      : 'No active processes';
  }
}
