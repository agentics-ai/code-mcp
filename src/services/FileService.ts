/**
 * File operations service - Optimized version
 */
import fs from 'fs/promises';
import path from 'path';
import { ToolResult, FileInfo, SearchOptions } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

export interface FileReadOptions {
  encoding?: BufferEncoding;
  maxSize?: number;
}

export interface FileWriteOptions {
  encoding?: BufferEncoding;
  backup?: boolean;
  createBackup?: boolean;
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
      const { encoding = 'utf-8', backup = false, createBackup = false } = options;
      
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
}
