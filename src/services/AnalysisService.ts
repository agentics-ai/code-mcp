/**
 * Code analysis service
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { ValidationUtils } from '../utils.js';
import { ToolResult, SearchResult, SearchOptions } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';
import { FileService } from './FileService.js';

export interface AnalyzeCodeArgs {
  path: string;
  language?: string;
}

export interface SearchCodeArgs {
  query: string;
  path: string;
  file_pattern?: string;
  regex?: boolean;
}

export class AnalysisService {
  private workspaceService: WorkspaceService;
  private fileService: FileService;

  constructor(workspaceService: WorkspaceService, fileService: FileService) {
    this.workspaceService = workspaceService;
    this.fileService = fileService;
  }

  /**
   * Analyze code structure and dependencies
   */
  async analyzeCode(args: AnalyzeCodeArgs): Promise<ToolResult> {
    const { path: analysispath, language } = args;
    ValidationUtils.validateRequired({ path: analysispath }, ['path']);
    
    const fullPath = this.workspaceService.resolvePath(analysispath);
    
    try {
      const stats = await fs.stat(fullPath);
      const analysis = {
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        language: language || this.detectLanguage(fullPath),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        structure: await this.analyzeStructure(fullPath, stats.isDirectory())
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        }],
      };
    } catch (error) {
      throw new Error(`Failed to analyze code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for patterns in code
   */
  async searchCode(args: SearchCodeArgs): Promise<ToolResult> {
    const { query, path: searchPath, file_pattern, regex = false } = args;
    ValidationUtils.validateRequired({ query, path: searchPath }, ['query', 'path']);
    
    const fullPath = this.workspaceService.resolvePath(searchPath);
    const results: SearchResult[] = [];
    
    try {
      await this.searchInDirectory(fullPath, query, file_pattern, regex, results);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2),
        }],
      };
    } catch (error) {
      throw new Error(`Failed to search code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
    };
    
    return languageMap[ext] || 'Unknown';
  }

  /**
   * Analyze code structure
   */
  private async analyzeStructure(filePath: string, isDirectory: boolean): Promise<any> {
    if (isDirectory) {
      return await this.analyzeDirectoryStructure(filePath);
    } else {
      return await this.analyzeFileStructure(filePath);
    }
  }

  /**
   * Analyze directory structure
   */
  private async analyzeDirectoryStructure(dirPath: string): Promise<any> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const structure = {
        files: entries.filter(e => e.isFile()).length,
        directories: entries.filter(e => e.isDirectory()).length,
        codeFiles: 0,
        languages: new Set<string>()
      };
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp'].includes(ext)) {
            structure.codeFiles++;
            structure.languages.add(this.detectLanguage(entry.name));
          }
        }
      }
      
      return {
        ...structure,
        languages: Array.from(structure.languages)
      };
    } catch (error) {
      return { error: 'Unable to analyze directory structure' };
    }
  }

  /**
   * Analyze file structure
   */
  private async analyzeFileStructure(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      return {
        lines: lines.length,
        characters: content.length,
        functions: this.countFunctions(content, this.detectLanguage(filePath)),
        imports: this.countImports(content, this.detectLanguage(filePath))
      };
    } catch (error) {
      return { error: 'Unable to analyze file structure' };
    }
  }

  /**
   * Count functions in code
   */
  private countFunctions(content: string, language: string): number {
    const patterns: Record<string, RegExp> = {
      'JavaScript': /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{|class\s+\w+/g,
      'TypeScript': /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{|class\s+\w+/g,
      'Python': /def\s+\w+|class\s+\w+/g,
      'Java': /public\s+\w+\s+\w+\(|private\s+\w+\s+\w+\(|class\s+\w+/g,
    };
    
    const pattern = patterns[language];
    if (!pattern) return 0;
    
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Count imports in code
   */
  private countImports(content: string, language: string): number {
    const patterns: Record<string, RegExp> = {
      'JavaScript': /import\s+.*from|require\s*\(/g,
      'TypeScript': /import\s+.*from|require\s*\(/g,
      'Python': /import\s+\w+|from\s+\w+\s+import/g,
      'Java': /import\s+[\w.]+/g,
    };
    
    const pattern = patterns[language];
    if (!pattern) return 0;
    
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Search in directory recursively
   */
  private async searchInDirectory(
    dirPath: string, 
    query: string, 
    filePattern?: string, 
    regex: boolean = false, 
    results: SearchResult[] = []
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // Skip hidden files
        
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.searchInDirectory(fullPath, query, filePattern, regex, results);
        } else if (entry.isFile()) {
          // Check file pattern if specified
          if (filePattern && !entry.name.match(new RegExp(filePattern))) {
            continue;
          }
          
          // Only search in text files
          const ext = path.extname(entry.name).toLowerCase();
          if (!['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.txt', '.md'].includes(ext)) {
            continue;
          }
          
          await this.searchInFile(fullPath, query, regex, results);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  /**
   * Search in a single file
   */
  private async searchInFile(filePath: string, query: string, regex: boolean, results: SearchResult[]): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      const searchPattern = regex ? new RegExp(query, 'gi') : query.toLowerCase();
      
      lines.forEach((line, index) => {
        let match = false;
        let matchText = '';
        
        if (regex && searchPattern instanceof RegExp) {
          const regexMatch = line.match(searchPattern);
          if (regexMatch) {
            match = true;
            matchText = regexMatch[0];
          }
        } else {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes(searchPattern as string)) {
            match = true;
            matchText = query;
          }
        }
        
        if (match) {
          results.push({
            file: filePath,
            line: index + 1,
            column: line.indexOf(matchText) + 1,
            content: line.trim(),
            match: matchText
          });
        }
      });
    } catch (error) {
      // Skip files we can't read
    }
  }
}
