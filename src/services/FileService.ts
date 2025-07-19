/**
 * File operations service - Enhanced with formatting and auto-commit capabilities
 */
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolResult, FileInfo, SearchOptions } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

const execAsync = promisify(exec);

export interface FileReadOptions {
  encoding?: BufferEncoding;
  maxSize?: number;
}

export interface FileWriteOptions {
  encoding?: BufferEncoding;
  backup?: boolean;
  createBackup?: boolean;
  skipAutoFormat?: boolean;
  skipAutoCommit?: boolean;
  commitMessage?: string;
  formatCommand?: string;
}

export interface DirectoryListOptions {
  recursive?: boolean;
  includeHidden?: boolean;
  filter?: string;
  pattern?: string;
  detailed?: boolean;
  sortBy?: 'name' | 'size' | 'modified';
  sortOrder?: 'asc' | 'desc';
}

export interface FileCopyOptions {
  overwrite?: boolean;
  preserveTimestamps?: boolean;
}

// Enhanced diff management interfaces
export interface DiffOptions {
  format?: 'unified' | 'side-by-side' | 'inline' | 'context';
  contextLines?: number;
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  wordDiff?: boolean;
  colorOutput?: boolean;
}

export interface FileDiffOptions extends DiffOptions {
  file1: string;
  file2: string;
  label1?: string;
  label2?: string;
}

export interface PatchOptions {
  dryRun?: boolean;
  reverse?: boolean;
  stripPaths?: number;
  backup?: boolean;
}

export interface FileComparisonResult {
  identical: boolean;
  differences: Array<{
    line: number;
    type: 'added' | 'removed' | 'modified';
    content: string;
    oldContent?: string;
  }>;
  stats: {
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
  };
}

interface FileStats {
  size: number;
  mtime: Date;
  isDirectory: boolean;
  isFile: boolean;
}

interface CachedStats {
  stats: FileStats;
  timestamp: number;
}

export class FileService {
  public workspaceService: WorkspaceService;
  private statsCache: Map<string, CachedStats>;
  private cacheTimeout: number;

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
    // Performance optimizations
    this.statsCache = new Map();
    this.cacheTimeout = 5000; // 5 seconds
  }

  /**
   * Read the contents of a file with enhanced options
   */
  async readFile(filePath: string, options: FileReadOptions = {}): Promise<ToolResult> {
    try {
      // Validate file path
      if (!filePath || typeof filePath !== 'string') {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'Invalid file path provided'
          }]
        };
      }

      const fullPath = this.workspaceService.resolvePath(filePath);
      const { encoding = 'utf-8', maxSize } = options;
      
      // Check file size first for large files
      const stats = await this.getFileStats(fullPath);
      if (maxSize && stats.size > maxSize) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `File too large (${stats.size} bytes). Maximum allowed: ${maxSize} bytes`
          }]
        };
      }
      
      const content = await fs.readFile(fullPath, encoding);
      return {
        content: [{ 
          type: 'text', 
          text: content,
          _meta: {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            encoding: encoding
          }
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to read file'
        }]
      };
    }
  }

  /**
   * Write content to a file with enhanced options
   */
  async writeFile(filePath: string, content: string, options: FileWriteOptions = {}): Promise<ToolResult> {
    try {
      const fullPath = this.workspaceService.resolvePath(filePath);
      const { 
        encoding = 'utf-8', 
        backup = false, 
        createBackup = false,
        skipAutoFormat = false,
        skipAutoCommit = false,
        commitMessage,
        formatCommand
      } = options;
      
      // Create backup if requested (support both backup and createBackup options)
      const shouldBackup = backup || createBackup;
      if (shouldBackup && await this.fileExists(fullPath)) {
        const backupPath = `${fullPath}.backup`;
        await fs.copyFile(fullPath, backupPath);
      }
      
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, encoding);
      
      // Clear cache for this file
      this.clearStatsCache(fullPath);
      
      // Auto-format file if requested
      if (!skipAutoFormat && formatCommand) {
        try {
          await execAsync(formatCommand.replace(/\{\{file\}\}/g, fullPath));
        } catch (formatError) {
          return {
            isError: true,
            content: [{
              type: 'text',
              text: `Failed to auto-format file: ${formatError instanceof Error ? formatError.message : String(formatError)}`
            }]
          };
        }
      }
      
      // Auto-commit changes if requested
      if (!skipAutoCommit && commitMessage) {
        try {
          // First check if we're in a git repository
          await execAsync('git rev-parse --git-dir');
          
          const gitAddCommand = `git add ${JSON.stringify(fullPath)}`;
          await execAsync(gitAddCommand);
          
          const gitCommitCommand = `git commit -m ${JSON.stringify(commitMessage)}`;
          await execAsync(gitCommitCommand);
        } catch (commitError) {
          // Silently skip auto-commit if not in a git repository
          const errorMessage = commitError instanceof Error ? commitError.message : String(commitError);
          if (!errorMessage.includes('not a git repository') && !errorMessage.includes('Not a git repository')) {
            console.warn(`Auto-commit skipped: ${errorMessage}`);
          }
          // Don't return error - just continue without committing
        }
      }
      
      const stats = await this.getFileStats(fullPath);
      return {
        content: [{ 
          type: 'text', 
          text: `File successfully written: ${fullPath}`,
          _meta: {
            size: stats.size,
            modified: stats.mtime.toISOString()
          }
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to write file'
        }]
      };
    }
  }

  /**
   * List contents of a directory with enhanced options
   */
  async listDirectory(dirPath: string, options: DirectoryListOptions = {}): Promise<ToolResult> {
    try {
      const fullPath = this.workspaceService.resolvePath(dirPath);
      
      // Check if directory exists first
      try {
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
          return {
            content: [{ type: "text", text: `Path is not a directory: ${dirPath}` }],
            isError: true
          };
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Directory not found: ${(error as Error).message}` }],
          isError: true
        };
      }
      
      const { 
        recursive = false, 
        includeHidden = false, 
        filter, 
        pattern,
        detailed = false,
        sortBy = 'name', 
        sortOrder = 'asc' 
      } = options;
      
      const items: FileInfo[] = [];
      
      await this._listDirectoryRecursive(fullPath, items, recursive, includeHidden, filter);
      
      // Apply pattern filtering if specified
      let filteredItems = items;
      if (pattern) {
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        filteredItems = items.filter(item => regex.test(item.name));
      }
      
      // Sort items
      this._sortFileList(filteredItems, sortBy, sortOrder);
      
      if (filteredItems.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'Directory is empty',
            _meta: {
              totalItems: 0,
              directory: fullPath
            }
          }],
        };
      }
      
      // Format output based on detailed option
      if (detailed) {
        const detailedText = filteredItems.map(item => 
          `${item.name}\n  Type: ${item.type}\n  Size: ${item.size || 0} bytes\n  Modified: ${item.modified || 'Unknown'}`
        ).join('\n\n');
        
        return {
          content: [{
            type: 'text',
            text: detailedText,
            _meta: {
              totalItems: filteredItems.length,
              directory: fullPath
            }
          }],
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(filteredItems, null, 2),
          _meta: {
            totalItems: filteredItems.length,
            directory: fullPath
          }
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to list directory'
        }]
      };
    }
  }

  /**
   * Create a new directory
   */
  async createDirectory(dirPath: string): Promise<ToolResult> {
    try {
      const fullPath = this.workspaceService.resolvePath(dirPath);
      
      // Check if directory already exists
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          return {
            isError: true,
            content: [{
              type: 'text',
              text: `Directory already exists: ${fullPath}`
            }]
          };
        }
      } catch {
        // Directory doesn't exist, which is what we want
      }
      
      await fs.mkdir(fullPath, { recursive: true });
      
      return {
        content: [{
          type: 'text',
          text: `Directory successfully created: ${fullPath}`,
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to create directory'
        }]
      };
    }
  }

  /**
   * Delete a file or directory
   */
  async deleteFile(filePath: string, options?: { force?: boolean }): Promise<ToolResult> {
    try {
      const fullPath = this.workspaceService.resolvePath(filePath);
      
      const stats = await this.getFileStats(fullPath);
      if (stats.isDirectory) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
      
      // Clear cache
      this.clearStatsCache(fullPath);
      
      return {
        content: [{
          type: 'text',
          text: `${stats.isDirectory ? 'Directory' : 'File'} successfully deleted: ${fullPath}`,
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to delete file/directory'
        }]
      };
    }
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(dirPath: string, options?: { recursive?: boolean }): Promise<ToolResult> {
    const fullPath = this.workspaceService.resolvePath(dirPath);
    const { recursive = false } = options || {};
    
    try {
      if (recursive) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.rmdir(fullPath);
      }
      
      // Clear cache
      this.clearStatsCache(fullPath);
      
      return {
        content: [{
          type: 'text',
          text: `Directory successfully deleted: ${fullPath}`,
        }],
      };
    } catch (error: any) {
      if (error.code === 'ENOTEMPTY' && !recursive) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Directory not empty: ${fullPath}. Use recursive option to delete non-empty directories.`,
          }],
        };
      }
      throw error;
    }
  }

  /**
   * Move or rename a file or directory
   */
  async moveFile(sourcePath: string, destinationPath: string, options?: { overwrite?: boolean }): Promise<ToolResult> {
    try {
      const fullSourcePath = this.workspaceService.resolvePath(sourcePath);
      const fullDestPath = this.workspaceService.resolvePath(destinationPath);
      
      // Ensure destination directory exists
      await fs.mkdir(path.dirname(fullDestPath), { recursive: true });
      
      await fs.rename(fullSourcePath, fullDestPath);
      
      // Clear cache for both paths
      this.clearStatsCache(fullSourcePath);
      this.clearStatsCache(fullDestPath);
      
      return {
        content: [{
          type: 'text',
          text: `File successfully moved: ${fullSourcePath} → ${fullDestPath}`,
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to move file'
        }]
      };
    }
  }

  /**
   * Copy a file or directory
   */
  async copyFile(sourcePath: string, destinationPath: string, options: FileCopyOptions = {}): Promise<ToolResult> {
    try {
      const fullSourcePath = this.workspaceService.resolvePath(sourcePath);
      const fullDestPath = this.workspaceService.resolvePath(destinationPath);
      const { overwrite = false, preserveTimestamps = true } = options;
      
      if (!overwrite && await this.fileExists(fullDestPath)) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Destination already exists: ${fullDestPath}`
          }]
        };
      }
      
      // Ensure destination directory exists
      await fs.mkdir(path.dirname(fullDestPath), { recursive: true });
      
      const sourceStats = await this.getFileStats(fullSourcePath);
      
      if (sourceStats.isDirectory) {
        await this._copyDirectory(fullSourcePath, fullDestPath, preserveTimestamps);
      } else {
        await fs.copyFile(fullSourcePath, fullDestPath);
        if (preserveTimestamps) {
          await fs.utimes(fullDestPath, sourceStats.mtime, sourceStats.mtime);
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: `File successfully copied: ${fullSourcePath} → ${fullDestPath}`,
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to copy file'
        }]
      };
    }
  }

  /**
   * Get file or directory information
   */
  async getFileInfo(filePath: string): Promise<ToolResult> {
    try {
      const fullPath = this.workspaceService.resolvePath(filePath);
      const stats = await this.getFileStats(fullPath);
      
      const info: FileInfo = {
        name: path.basename(fullPath),
        path: fullPath,
        type: stats.isDirectory ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime
      };
      
      // Format as readable text instead of JSON
      const formattedText = [
        `Name: ${info.name}`,
        `Path: ${info.path}`,
        `Type: ${info.type}`,
        `Size: ${info.size} bytes`,
        `Modified: ${info.modified?.toISOString().split('T')[0] || 'Unknown'}`
      ].join('\n');
      
      return {
        content: [{
          type: 'text',
          text: formattedText,
        }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: error.message || 'Failed to get file info'
        }]
      };
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Search for files by pattern or content
   */
  async searchFiles(query: string, directory?: string, options?: SearchOptions): Promise<ToolResult> {
    const { 
      caseSensitive = false, 
      includePatterns = [], 
      excludePatterns = [], 
      maxResults,
      regex = false 
    } = options || {};
    
    const searchDir = directory ? this.workspaceService.resolvePath(directory) : (this.workspaceService as any).workspacePath;
    
    const results: Array<{ file: string; line?: number; content?: string }> = [];
    
    const matchesPattern = (fileName: string, patterns: string[]): boolean => {
      if (patterns.length === 0) return true;
      return patterns.some(pattern => {
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(`^${regexPattern}$`, 'i').test(fileName);
      });
    };

    const searchInFile = async (filePath: string): Promise<void> => {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Stop if we've reached maxResults
          if (maxResults && results.length >= maxResults) return;
          
          let match = false;
          
          if (regex) {
            try {
              const regexPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
              match = regexPattern.test(line);
            } catch {
              // Invalid regex, fall back to literal search
              const searchLine = caseSensitive ? line : line.toLowerCase();
              const searchQuery = caseSensitive ? query : query.toLowerCase();
              match = searchLine.includes(searchQuery);
            }
          } else {
            const searchLine = caseSensitive ? line : line.toLowerCase();
            const searchQuery = caseSensitive ? query : query.toLowerCase();
            match = searchLine.includes(searchQuery);
          }
          
          if (match) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      } catch {
        // Skip files that can't be read
      }
    };

    const searchInDirectory = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // Stop if we've reached maxResults
          if (maxResults && results.length >= maxResults) return;
          
          if (entry.name.startsWith('.')) continue; // Skip hidden files
          
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            await searchInDirectory(fullPath);
          } else if (entry.isFile()) {
            // Check include/exclude patterns
            if (includePatterns.length > 0 && !matchesPattern(entry.name, includePatterns)) {
              continue;
            }
            if (excludePatterns.length > 0 && matchesPattern(entry.name, excludePatterns)) {
              continue;
            }
            
            // Only search in text files
            const ext = path.extname(entry.name).toLowerCase();
            if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.txt', '.md', '.json'].includes(ext)) {
              await searchInFile(fullPath);
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    await searchInDirectory(searchDir);
    
    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No matches found',
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Found ${results.length} matches:\n\n` + 
              results.map(r => `${r.file}:${r.line}: ${r.content}`).join('\n'),
      }],
    };
  }

  /**
   * Get file stats with caching
   */
  private async getFileStats(filePath: string): Promise<FileStats> {
    const cached = this.statsCache.get(filePath);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.stats;
    }
    
    const stats = await fs.stat(filePath);
    const fileStats: FileStats = {
      size: stats.size,
      mtime: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
    
    this.statsCache.set(filePath, {
      stats: fileStats,
      timestamp: Date.now()
    });
    
    return fileStats;
  }

  /**
   * Clear stats cache for a specific file
   */
  private clearStatsCache(filePath: string): void {
    this.statsCache.delete(filePath);
  }

  /**
   * Recursively list directory contents
   */
  private async _listDirectoryRecursive(
    dirPath: string, 
    items: FileInfo[], 
    recursive: boolean, 
    includeHidden: boolean, 
    filter?: string,
    depth: number = 0
  ): Promise<void> {
    if (depth > 10) return; // Prevent infinite recursion
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden files unless requested
        if (!includeHidden && entry.name.startsWith('.')) {
          continue;
        }
        
        // Apply filter if provided
        if (filter && !entry.name.includes(filter)) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry.name);
        const stats = await this.getFileStats(fullPath);
        
        const fileInfo: FileInfo = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime
        };
        
        items.push(fileInfo);
        
        // Recurse into subdirectories if requested
        if (recursive && entry.isDirectory()) {
          await this._listDirectoryRecursive(fullPath, items, recursive, includeHidden, filter, depth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  /**
   * Sort file list by specified criteria
   */
  private _sortFileList(items: FileInfo[], sortBy: string, sortOrder: string): void {
    items.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          const aTime = a.modified ? new Date(a.modified).getTime() : 0;
          const bTime = b.modified ? new Date(b.modified).getTime() : 0;
          comparison = aTime - bTime;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Copy directory recursively
   */
  private async _copyDirectory(sourcePath: string, destPath: string, preserveTimestamps: boolean): Promise<void> {
    await fs.mkdir(destPath, { recursive: true });
    
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(sourcePath, entry.name);
      const dstPath = path.join(destPath, entry.name);
      
      if (entry.isDirectory()) {
        await this._copyDirectory(srcPath, dstPath, preserveTimestamps);
      } else {
        await fs.copyFile(srcPath, dstPath);
        if (preserveTimestamps) {
          const stats = await fs.stat(srcPath);
          await fs.utimes(dstPath, stats.mtime, stats.mtime);
        }
      }
    }
  }

  /**
   * Format a file using the provided format command
   */
  async formatFile(filePath: string, formatCommand?: string): Promise<ToolResult> {
    if (!formatCommand) {
      return {
        content: [{
          type: 'text',
          text: 'No format command provided'
        }]
      };
    }

    try {
      const fullPath = this.workspaceService.resolvePath(filePath);
      const command = formatCommand.replace(/\{\{file\}\}/g, fullPath);
      
      const cwd = this.workspaceService.workspacePath;
      await execAsync(command, { cwd });

      return {
        content: [{
          type: 'text',
          text: `File formatted successfully: ${filePath}`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `File formatting failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Create a new file with optional formatting and auto-commit
   */
  async createFile(filePath: string, content: string, options: FileWriteOptions = {}): Promise<ToolResult> {
    // Only set commitMessage if explicitly provided in options
    if (options.commitMessage) {
      return this.writeFile(filePath, content, options);
    } else {
      // Skip auto-commit by default for createFile unless explicitly requested
      return this.writeFile(filePath, content, { ...options, skipAutoCommit: true });
    }
  }

  /**
   * Format the entire project using common formatting tools
   */
  async formatProject(): Promise<ToolResult> {
    try {
      const cwd = this.workspaceService.workspacePath;
      const results: string[] = [];

      // Try Prettier first (most common)
      try {
        await execAsync('npx prettier --write .', { cwd });
        results.push('Prettier formatting completed');
      } catch (error) {
        // Prettier not available or failed, try other formatters
      }

      // Try ESLint with --fix
      try {
        await execAsync('npx eslint --fix .', { cwd });
        results.push('ESLint auto-fix completed');
      } catch (error) {
        // ESLint not available or failed
      }

      // Try TypeScript compiler for type checking
      try {
        await execAsync('npx tsc --noEmit', { cwd });
        results.push('TypeScript type checking passed');
      } catch (error) {
        // TypeScript not available or has errors
      }

      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No formatting tools found or available. Consider installing Prettier, ESLint, or other code formatters.'
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `Project formatting completed:\n${results.join('\n')}`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Project formatting failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  // ==========================================
  // ENHANCED FILE OPERATIONS & DIFF MANAGEMENT
  // ==========================================

  /**
   * Compare two files and show differences
   */
  async compareFiles(options: FileDiffOptions): Promise<ToolResult> {
    try {
      const { file1, file2, format = 'unified', contextLines = 3, ignoreWhitespace = false, wordDiff = false } = options;
      
      const fullPath1 = this.workspaceService.resolvePath(file1);
      const fullPath2 = this.workspaceService.resolvePath(file2);
      
      // Check if files exist
      if (!await this.fileExists(fullPath1)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `File does not exist: ${file1}` }]
        };
      }
      
      if (!await this.fileExists(fullPath2)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `File does not exist: ${file2}` }]
        };
      }
      
      // Build diff command
      const diffArgs = ['diff'];
      
      switch (format) {
        case 'unified':
          if (contextLines !== 3) {
            diffArgs.push(`-U${contextLines}`);
          } else {
            diffArgs.push('-u');
          }
          break;
        case 'side-by-side':
          diffArgs.push('--side-by-side', '--width=120');
          break;
        case 'context':
          if (contextLines !== 3) {
            diffArgs.push(`-C${contextLines}`);
          } else {
            diffArgs.push('-c');
          }
          break;
        case 'inline':
          // Default diff format
          break;
      }
      
      if (ignoreWhitespace) {
        diffArgs.push('-w');
      }
      
      if (wordDiff) {
        diffArgs.push('--word-diff');
      }
      
      diffArgs.push(fullPath1, fullPath2);
      
      try {
        const { stdout } = await execAsync(diffArgs.join(' '));
        
        let output = '';
        if (format === 'side-by-side') {
          output = `Side-by-side comparison:\n\n${stdout || 'Files are identical'}`;
        } else {
          output = stdout || 'Files are identical';
        }
        
        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error: any) {
        // diff command returns exit code 1 when files differ, but that's not an error
        if (error.code === 1 && error.stdout) {
          // Exit code 1 means files differ - this is normal, not an error
          const diffOutput = error.stdout || '';
          let output = '';
          if (format === 'side-by-side') {
            output = `Side-by-side comparison:\n\n${diffOutput}`;
          } else {
            output = diffOutput;
          }
          
          return {
            content: [{
              type: 'text',
              text: output
            }]
          };
        } else {
          // Actual error occurred (exit code != 1 or no stdout)
          return {
            isError: true,
            content: [{
              type: 'text',
              text: `File comparison failed: ${error.message || String(error)}`
            }]
          };
        }
      }
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `File comparison failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Generate a detailed file comparison with statistics
   */
  async analyzeFileDifferences(file1: string, file2: string): Promise<ToolResult> {
    try {
      const fullPath1 = this.workspaceService.resolvePath(file1);
      const fullPath2 = this.workspaceService.resolvePath(file2);
      
      // Read both files
      const content1 = await fs.readFile(fullPath1, 'utf-8');
      const content2 = await fs.readFile(fullPath2, 'utf-8');
      
      const lines1 = content1.split('\n');
      const lines2 = content2.split('\n');
      
      const result: FileComparisonResult = {
        identical: content1 === content2,
        differences: [],
        stats: {
          linesAdded: 0,
          linesRemoved: 0,
          linesModified: 0
        }
      };
      
      // Simple line-by-line comparison
      const maxLines = Math.max(lines1.length, lines2.length);
      
      for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i];
        const line2 = lines2[i];
        
        if (line1 === undefined) {
          // Line added in file2
          result.differences.push({
            line: i + 1,
            type: 'added',
            content: line2
          });
          result.stats.linesAdded++;
        } else if (line2 === undefined) {
          // Line removed from file1
          result.differences.push({
            line: i + 1,
            type: 'removed',
            content: line1
          });
          result.stats.linesRemoved++;
        } else if (line1 !== line2) {
          // Line modified
          result.differences.push({
            line: i + 1,
            type: 'modified',
            content: line2,
            oldContent: line1
          });
          result.stats.linesModified++;
        }
      }
      
      // Format the output
      let output = `File Comparison Analysis:\n`;
      output += `File 1: ${file1}\n`;
      output += `File 2: ${file2}\n`;
      output += `Identical: ${result.identical}\n\n`;
      
      if (!result.identical) {
        output += `Statistics:\n`;
        output += `- Lines added: ${result.stats.linesAdded}\n`;
        output += `- Lines removed: ${result.stats.linesRemoved}\n`;
        output += `- Lines modified: ${result.stats.linesModified}\n`;
        output += `- Total differences: ${result.differences.length}\n\n`;
        
        if (result.differences.length <= 50) {
          output += `Differences:\n`;
          for (const diff of result.differences) {
            switch (diff.type) {
              case 'added':
                output += `+ Line ${diff.line}: ${diff.content}\n`;
                break;
              case 'removed':
                output += `- Line ${diff.line}: ${diff.content}\n`;
                break;
              case 'modified':
                output += `~ Line ${diff.line}:\n`;
                output += `  - ${diff.oldContent}\n`;
                output += `  + ${diff.content}\n`;
                break;
            }
          }
        } else {
          output += `Too many differences to display (${result.differences.length}). Use compareFiles for detailed diff.`;
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: output,
          _meta: {
            identical: result.identical,
            stats: result.stats,
            differenceCount: result.differences.length
          }
        }]
      };
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `File analysis failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Apply a patch file to the workspace
   */
  async applyPatch(patchFile: string, options: PatchOptions = {}): Promise<ToolResult> {
    try {
      const { dryRun = false, reverse = false, stripPaths = 0, backup = false } = options;
      const fullPatchPath = this.workspaceService.resolvePath(patchFile);
      
      // Check if patch file exists
      if (!await this.fileExists(fullPatchPath)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Patch file does not exist: ${patchFile}` }]
        };
      }
      
      // Build patch command
      const patchArgs = ['patch'];
      
      if (dryRun) {
        patchArgs.push('--dry-run');
      }
      
      if (reverse) {
        patchArgs.push('--reverse');
      }
      
      if (stripPaths > 0) {
        patchArgs.push(`-p${stripPaths}`);
      }
      
      if (backup) {
        patchArgs.push('--backup');
      }
      
      patchArgs.push('<', fullPatchPath);
      
      const cwd = this.workspaceService.workspacePath;
      
      try {
        const { stdout, stderr } = await execAsync(patchArgs.join(' '), { cwd });
        
        return {
          content: [{
            type: 'text',
            text: `Patch applied successfully:\n${stdout}${stderr ? `\nWarnings:\n${stderr}` : ''}`
          }]
        };
      } catch (error: any) {
        // For dry-run, patch command may exit with non-zero even on success
        if (dryRun && error.stdout && !error.stderr?.includes('FAILED')) {
          return {
            content: [{
              type: 'text', 
              text: `Patch applied successfully:\n${error.stdout}${error.stderr ? `\nWarnings:\n${error.stderr}` : ''}`
            }]
          };
        } else {
          return {
            isError: true,
            content: [{
              type: 'text',
              text: `Patch application failed: ${error.message}\n${error.stderr || ''}`
            }]
          };
        }
      }
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Patch application failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Create a patch file from differences between two files or directories
   */
  async createPatch(source: string, target: string, outputFile?: string): Promise<ToolResult> {
    try {
      const sourcePath = this.workspaceService.resolvePath(source);
      const targetPath = this.workspaceService.resolvePath(target);
      
      // Check if source exists
      if (!await this.fileExists(sourcePath)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Source does not exist: ${source}` }]
        };
      }
      
      // Check if target exists
      if (!await this.fileExists(targetPath)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Target does not exist: ${target}` }]
        };
      }
      
      // Generate unified diff
      const diffArgs = ['diff', '-u', sourcePath, targetPath];
      
      try {
        const { stdout } = await execAsync(diffArgs.join(' '));
        const patchContent = stdout;
        
        if (outputFile) {
          const outputPath = this.workspaceService.resolvePath(outputFile);
          await fs.writeFile(outputPath, patchContent);
          
          return {
            content: [{
              type: 'text',
              text: `Patch created successfully: ${outputFile}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: patchContent || 'No differences found'
            }]
          };
        }
        
      } catch (error: any) {
        // diff returns non-zero when files differ
        if (error.stdout) {
          const patchContent = error.stdout;
          
          if (outputFile) {
            const outputPath = this.workspaceService.resolvePath(outputFile);
            await fs.writeFile(outputPath, patchContent);
            
            return {
              content: [{
                type: 'text',
                text: `Patch created successfully: ${outputFile}`
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: patchContent
              }]
            };
          }
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Patch creation failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Find and replace text across multiple files with preview option
   */
  async findAndReplace(
    searchPattern: string, 
    replacement: string, 
    options: {
      files?: string[];
      filePattern?: string;
      regex?: boolean;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      preview?: boolean;
      backup?: boolean;
    } = {}
  ): Promise<ToolResult> {
    try {
      const {
        files,
        filePattern = '**/*',
        regex = false,
        caseSensitive = true,
        wholeWord = false,
        preview = false,
        backup = false
      } = options;
      
      let filesToProcess: string[] = [];
      
      if (files && files.length > 0) {
        filesToProcess = files;
      } else {
        // Find files matching pattern (simple implementation)
        const workspaceDir = this.workspaceService.getCurrentWorkspace();
        filesToProcess = await this._findMatchingFiles(workspaceDir, filePattern);
      }
      
      const results: Array<{
        file: string;
        matches: Array<{
          line: number;
          content: string;
          newContent: string;
        }>;
        error?: string;
      }> = [];
      
      for (const file of filesToProcess) {
        try {
          const fullPath = this.workspaceService.resolvePath(file);
          
          // Skip if file doesn't exist or is not a file
          const stats = await this.getFileStats(fullPath);
          if (!stats.isFile) continue;
          
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');
          
          const fileResult = {
            file,
            matches: [] as Array<{ line: number; content: string; newContent: string; }>
          };
          
          let pattern: RegExp;
          if (regex) {
            const flags = caseSensitive ? 'g' : 'gi';
            pattern = new RegExp(searchPattern, flags);
          } else {
            let escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (wholeWord) {
              escapedPattern = `\\b${escapedPattern}\\b`;
            }
            const flags = caseSensitive ? 'g' : 'gi';
            pattern = new RegExp(escapedPattern, flags);
          }
          
          let hasChanges = false;
          const newLines: string[] = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (pattern.test(line)) {
              const newLine = line.replace(pattern, replacement);
              newLines.push(newLine);
              fileResult.matches.push({
                line: i + 1,
                content: line,
                newContent: newLine
              });
              hasChanges = true;
            } else {
              newLines.push(line);
            }
          }
          
          if (hasChanges) {
            if (!preview) {
              // Create backup if requested
              if (backup) {
                await fs.copyFile(fullPath, `${fullPath}.backup`);
              }
              
              // Write the modified content
              await fs.writeFile(fullPath, newLines.join('\n'));
            }
            
            results.push(fileResult);
          }
          
        } catch (error) {
          results.push({
            file,
            matches: [],
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Format output
      let output = preview ? 'Find and Replace Preview:\n\n' : 'Find and Replace Results:\n\n';
      
      if (results.length === 0) {
        output += 'No matches found.';
      } else {
        for (const result of results) {
          if (result.error) {
            output += `❌ ${result.file}: ${result.error}\n`;
          } else if (result.matches.length > 0) {
            output += `📄 ${result.file} (${result.matches.length} matches):\n`;
            for (const match of result.matches) {
              output += `  Line ${match.line}:\n`;
              output += `    - ${match.content}\n`;
              output += `    + ${match.newContent}\n`;
            }
            output += '\n';
          }
        }
        
        const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
        const fileCount = results.filter(r => r.matches.length > 0).length;
        
        output += `\nSummary: ${totalMatches} matches in ${fileCount} files`;
        if (preview) {
          output += ' (preview mode - no changes made)';
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: output,
          _meta: {
            totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
            fileCount: results.filter(r => r.matches.length > 0).length,
            preview,
            results: results.slice(0, 10) // Limit metadata to prevent huge responses
          }
        }]
      };
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Find and replace failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Helper method to find files matching a simple pattern
   */
  private async _findMatchingFiles(directory: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dir: string, relativePath: string = ''): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          // Skip common directories we don't want to search
          if (entry.isDirectory() && ['node_modules', '.git', '.vscode', 'dist', 'build'].includes(entry.name)) {
            continue;
          }
          
          const fullPath = path.join(dir, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath, relativeFilePath);
          } else {
            // Simple pattern matching - support *.ext and **/* patterns
            if (this._matchesPattern(relativeFilePath, pattern)) {
              files.push(relativeFilePath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    await scanDirectory(directory);
    return files;
  }

  /**
   * Simple pattern matching helper
   */
  private _matchesPattern(filePath: string, pattern: string): boolean {
    if (pattern === '**/*') return true;
    
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
}
