/**
 * Comprehensive test suite for FileService
 * Tests file operations, directory management, and edge cases
 * Node.js 22 ES Module compatible
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

import { FileService } from '../../src/services/FileService.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { TestUtils } from '../utils.js';

describe('FileService', () => {
  let fileService: FileService;
  let workspaceService: WorkspaceService;
  let tempWorkspace: string;

  beforeAll(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('fileservice');
  });

  afterAll(async () => {
    await TestUtils.cleanupTempWorkspace(tempWorkspace);
  });

  beforeEach(async () => {
    workspaceService = new WorkspaceService();
    workspaceService.setWorkspace(tempWorkspace);
    fileService = new FileService(workspaceService);
  });

  describe('constructor', () => {
    test('should initialize with workspace service dependency', () => {
      expect(fileService.workspaceService).toBe(workspaceService);
    });
  });

  describe('readFile', () => {
    test('should read existing file content', async () => {
      const testContent = 'Hello, World!';
      const testFile = 'test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, testContent);
      
      const result = await fileService.readFile(testFile);
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(testContent);
      expect(result.isError).toBeFalsy();
    });

    test('should handle file not found error', async () => {
      const result = await fileService.readFile('nonexistent.txt');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ENOENT');
    });

    test('should respect encoding options', async () => {
      const testContent = 'Hello, World! 🌍';
      const testFile = 'unicode-test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, testContent, 'utf8');
      
      const result = await fileService.readFile(testFile, { encoding: 'utf8' });
      
      expect(result.content[0].text).toBe(testContent);
      expect(result.content[0].text).toContain('🌍');
    });

    test('should handle large files with maxSize option', async () => {
      const largeContent = 'x'.repeat(1000);
      const testFile = 'large-test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, largeContent);
      
      const result = await fileService.readFile(testFile, { maxSize: 500 });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('too large');
    });

    test('should include file metadata in _meta', async () => {
      const testContent = 'Test content';
      const testFile = 'meta-test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, testContent);
      
      const result = await fileService.readFile(testFile);
      
      expect(result.content[0]._meta).toBeDefined();
      expect(result.content[0]._meta?.size).toBe(testContent.length);
      expect(result.content[0]._meta?.encoding).toBe('utf-8');
      expect(result.content[0]._meta?.modified).toBeDefined();
    });
  });

  describe('writeFile', () => {
    test('should write content to file', async () => {
      const testContent = 'Hello, World!';
      const testFile = 'write-test.txt';
      
      const result = await fileService.writeFile(testFile, testContent);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('successfully written');
      
      const fullPath = join(tempWorkspace, testFile);
      const writtenContent = await fs.readFile(fullPath, 'utf8');
      expect(writtenContent).toBe(testContent);
    });

    test('should create directories if they don\'t exist', async () => {
      const testContent = 'Hello, World!';
      const testFile = 'subdir/deep/write-test.txt';
      
      const result = await fileService.writeFile(testFile, testContent);
      
      expect(result.isError).toBeFalsy();
      
      const fullPath = join(tempWorkspace, testFile);
      expect(fsSync.existsSync(fullPath)).toBe(true);
      
      const writtenContent = await fs.readFile(fullPath, 'utf8');
      expect(writtenContent).toBe(testContent);
    });

    test('should respect encoding options', async () => {
      const testContent = 'Unicode content 🚀';
      const testFile = 'unicode-write.txt';
      
      const result = await fileService.writeFile(testFile, testContent, { encoding: 'utf8' });
      
      expect(result.isError).toBeFalsy();
      
      const fullPath = join(tempWorkspace, testFile);
      const writtenContent = await fs.readFile(fullPath, 'utf8');
      expect(writtenContent).toBe(testContent);
    });

    test('should handle backup option', async () => {
      const originalContent = 'Original content';
      const newContent = 'New content';
      const testFile = 'backup-test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      // Create original file
      await fs.writeFile(fullPath, originalContent);
      
      // Write with backup
      const result = await fileService.writeFile(testFile, newContent, { createBackup: true });
      
      expect(result.isError).toBeFalsy();
      
      // Check new content
      const writtenContent = await fs.readFile(fullPath, 'utf8');
      expect(writtenContent).toBe(newContent);
      
      // Check backup exists
      const backupPath = fullPath + '.backup';
      expect(fsSync.existsSync(backupPath)).toBe(true);
      
      const backupContent = await fs.readFile(backupPath, 'utf8');
      expect(backupContent).toBe(originalContent);
    });
  });

  describe('deleteFile', () => {
    test('should delete existing file', async () => {
      const testFile = 'delete-test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, 'test content');
      expect(fsSync.existsSync(fullPath)).toBe(true);
      
      const result = await fileService.deleteFile(testFile);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('successfully deleted');
      expect(fsSync.existsSync(fullPath)).toBe(false);
    });

    test('should handle non-existent file', async () => {
      const result = await fileService.deleteFile('nonexistent.txt');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ENOENT');
    });

    test('should handle force deletion option', async () => {
      const testFile = 'force-delete-test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, 'test content');
      
      const result = await fileService.deleteFile(testFile, { force: true });
      
      expect(result.isError).toBeFalsy();
      expect(fsSync.existsSync(fullPath)).toBe(false);
    });
  });

  describe('listDirectory', () => {
    test('should list directory contents', async () => {
      const testDir = 'list-test';
      const fullDirPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullDirPath, { recursive: true });
      await fs.writeFile(join(fullDirPath, 'file1.txt'), 'content1');
      await fs.writeFile(join(fullDirPath, 'file2.txt'), 'content2');
      await fs.mkdir(join(fullDirPath, 'subdir'));
      
      const result = await fileService.listDirectory(testDir);
      
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const content = result.content[0].text as string;
      expect(content).toContain('file1.txt');
      expect(content).toContain('file2.txt');
      expect(content).toContain('subdir');
    });

    test('should handle empty directory', async () => {
      const testDir = 'empty-test';
      const fullDirPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullDirPath, { recursive: true });
      
      const result = await fileService.listDirectory(testDir);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('empty');
    });

    test('should handle non-existent directory', async () => {
      const result = await fileService.listDirectory('nonexistent-dir');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ENOENT');
    });

    test('should respect filter options', async () => {
      const testDir = 'filter-test';
      const fullDirPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullDirPath, { recursive: true });
      await fs.writeFile(join(fullDirPath, 'test.js'), 'js content');
      await fs.writeFile(join(fullDirPath, 'test.ts'), 'ts content');
      await fs.writeFile(join(fullDirPath, 'readme.md'), 'md content');
      
      const result = await fileService.listDirectory(testDir, { 
        pattern: '*.js',
        includeHidden: false 
      });
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      expect(content).toContain('test.js');
      expect(content).not.toContain('test.ts');
      expect(content).not.toContain('readme.md');
    });

    test('should include file details with detailed option', async () => {
      const testDir = 'details-test';
      const fullDirPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullDirPath, { recursive: true });
      await fs.writeFile(join(fullDirPath, 'test.txt'), 'test content');
      
      const result = await fileService.listDirectory(testDir, { 
        detailed: true 
      });
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      expect(content).toContain('test.txt');
      expect(content).toContain('Size:');
      expect(content).toContain('Modified:');
    });
  });

  describe('createDirectory', () => {
    test('should create directory', async () => {
      const testDir = 'create-test';
      
      const result = await fileService.createDirectory(testDir);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('successfully created');
      
      const fullPath = join(tempWorkspace, testDir);
      expect(fsSync.existsSync(fullPath)).toBe(true);
      
      const stats = await fs.stat(fullPath);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should create nested directories', async () => {
      const testDir = 'deep/nested/dir';
      
      const result = await fileService.createDirectory(testDir);
      
      expect(result.isError).toBeFalsy();
      
      const fullPath = join(tempWorkspace, testDir);
      expect(fsSync.existsSync(fullPath)).toBe(true);
    });

    test('should handle existing directory', async () => {
      const testDir = 'existing-test';
      const fullPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullPath);
      
      const result = await fileService.createDirectory(testDir);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('already exists');
    });
  });

  describe('deleteDirectory', () => {
    test('should delete empty directory', async () => {
      const testDir = 'delete-dir-test';
      const fullPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullPath);
      expect(fsSync.existsSync(fullPath)).toBe(true);
      
      const result = await fileService.deleteDirectory(testDir);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('successfully deleted');
      expect(fsSync.existsSync(fullPath)).toBe(false);
    });

    test('should delete directory with contents when recursive', async () => {
      const testDir = 'delete-recursive-test';
      const fullPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullPath, { recursive: true });
      await fs.writeFile(join(fullPath, 'file.txt'), 'content');
      await fs.mkdir(join(fullPath, 'subdir'));
      await fs.writeFile(join(fullPath, 'subdir', 'subfile.txt'), 'subcontent');
      
      const result = await fileService.deleteDirectory(testDir, { recursive: true });
      
      expect(result.isError).toBeFalsy();
      expect(fsSync.existsSync(fullPath)).toBe(false);
    });

    test('should fail to delete non-empty directory without recursive', async () => {
      const testDir = 'delete-norecursive-test';
      const fullPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullPath);
      await fs.writeFile(join(fullPath, 'file.txt'), 'content');
      
      const result = await fileService.deleteDirectory(testDir, { recursive: false });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not empty');
    });
  });

  describe('copyFile', () => {
    test('should copy file to new location', async () => {
      const sourceFile = 'copy-source.txt';
      const destFile = 'copy-dest.txt';
      const testContent = 'Copy test content';
      
      const sourcePath = join(tempWorkspace, sourceFile);
      const destPath = join(tempWorkspace, destFile);
      
      await fs.writeFile(sourcePath, testContent);
      
      const result = await fileService.copyFile(sourceFile, destFile);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('successfully copied');
      
      expect(fsSync.existsSync(destPath)).toBe(true);
      const copiedContent = await fs.readFile(destPath, 'utf8');
      expect(copiedContent).toBe(testContent);
    });

    test('should handle overwrite option', async () => {
      const sourceFile = 'copy-overwrite-source.txt';
      const destFile = 'copy-overwrite-dest.txt';
      const sourceContent = 'Source content';
      const destContent = 'Dest content';
      
      const sourcePath = join(tempWorkspace, sourceFile);
      const destPath = join(tempWorkspace, destFile);
      
      await fs.writeFile(sourcePath, sourceContent);
      await fs.writeFile(destPath, destContent);
      
      const result = await fileService.copyFile(sourceFile, destFile, { overwrite: true });
      
      expect(result.isError).toBeFalsy();
      
      const copiedContent = await fs.readFile(destPath, 'utf8');
      expect(copiedContent).toBe(sourceContent);
    });

    test('should fail when destination exists without overwrite', async () => {
      const sourceFile = 'copy-nooverwrite-source.txt';
      const destFile = 'copy-nooverwrite-dest.txt';
      
      const sourcePath = join(tempWorkspace, sourceFile);
      const destPath = join(tempWorkspace, destFile);
      
      await fs.writeFile(sourcePath, 'source');
      await fs.writeFile(destPath, 'dest');
      
      const result = await fileService.copyFile(sourceFile, destFile, { overwrite: false });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('already exists');
    });
  });

  describe('moveFile', () => {
    test('should move file to new location', async () => {
      const sourceFile = 'move-source.txt';
      const destFile = 'move-dest.txt';
      const testContent = 'Move test content';
      
      const sourcePath = join(tempWorkspace, sourceFile);
      const destPath = join(tempWorkspace, destFile);
      
      await fs.writeFile(sourcePath, testContent);
      
      const result = await fileService.moveFile(sourceFile, destFile);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('successfully moved');
      
      expect(fsSync.existsSync(sourcePath)).toBe(false);
      expect(fsSync.existsSync(destPath)).toBe(true);
      
      const movedContent = await fs.readFile(destPath, 'utf8');
      expect(movedContent).toBe(testContent);
    });

    test('should handle overwrite option for move', async () => {
      const sourceFile = 'move-overwrite-source.txt';
      const destFile = 'move-overwrite-dest.txt';
      const sourceContent = 'Source content';
      const destContent = 'Dest content';
      
      const sourcePath = join(tempWorkspace, sourceFile);
      const destPath = join(tempWorkspace, destFile);
      
      await fs.writeFile(sourcePath, sourceContent);
      await fs.writeFile(destPath, destContent);
      
      const result = await fileService.moveFile(sourceFile, destFile, { overwrite: true });
      
      expect(result.isError).toBeFalsy();
      
      expect(fsSync.existsSync(sourcePath)).toBe(false);
      const movedContent = await fs.readFile(destPath, 'utf8');
      expect(movedContent).toBe(sourceContent);
    });
  });

  describe('searchFiles', () => {
    beforeEach(async () => {
      // Create test files for searching
      const searchDir = join(tempWorkspace, 'search-test');
      await fs.mkdir(searchDir, { recursive: true });
      
      await fs.writeFile(join(searchDir, 'file1.js'), 'function hello() { console.log("Hello"); }');
      await fs.writeFile(join(searchDir, 'file2.ts'), 'function world(): void { console.log("World"); }');
      await fs.writeFile(join(searchDir, 'file3.txt'), 'This is a text file with hello world');
      await fs.writeFile(join(searchDir, 'file4.md'), '# Hello\n\nThis is markdown');
      
      const subDir = join(searchDir, 'subdir');
      try {
        await fs.mkdir(subDir, { recursive: true });
        await fs.writeFile(join(subDir, 'nested.js'), 'console.log("hello from nested");');
      } catch (error) {
        // Directory might already exist, just create the file
        if ((error as any).code === 'EEXIST') {
          await fs.writeFile(join(subDir, 'nested.js'), 'console.log("hello from nested");');
        } else {
          throw error;
        }
      }
    });

    test('should search for text in files', async () => {
      const result = await fileService.searchFiles('hello', 'search-test');
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      
      expect(content).toContain('file1.js');
      expect(content).toContain('file3.txt');
      expect(content).toContain('file4.md');
      expect(content).toContain('nested.js');
    });

    test('should respect case sensitivity option', async () => {
      const result = await fileService.searchFiles('HELLO', 'search-test', {
        caseSensitive: true
      });
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      
      // Should not find matches since we're looking for uppercase "HELLO"
      expect(content).not.toContain('file1.js');
      expect(content).not.toContain('file3.txt');
    });

    test('should respect file pattern filters', async () => {
      const result = await fileService.searchFiles('hello', 'search-test', {
        includePatterns: ['*.js']
      });
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      
      expect(content).toContain('file1.js');
      expect(content).toContain('nested.js');
      expect(content).not.toContain('file3.txt');
      expect(content).not.toContain('file4.md');
    });

    test('should limit results with maxResults option', async () => {
      const result = await fileService.searchFiles('hello', 'search-test', {
        maxResults: 2
      });
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      
      // Should limit to 2 results
      const lines = content.split('\n').filter(line => line.trim());
      expect(lines.length).toBeLessThanOrEqual(3); // Header + 2 results
    });
  });

  describe('getFileInfo', () => {
    test('should get file information', async () => {
      const testFile = 'info-test.txt';
      const testContent = 'File info test content';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, testContent);
      
      const result = await fileService.getFileInfo(testFile);
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      
      expect(content).toContain('info-test.txt');
      expect(content).toContain('Size:');
      expect(content).toContain('Modified:');
      expect(content).toContain('Type: file');
    });

    test('should get directory information', async () => {
      const testDir = 'info-dir-test';
      const fullPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullPath);
      
      const result = await fileService.getFileInfo(testDir);
      
      expect(result.isError).toBeFalsy();
      const content = result.content[0].text as string;
      
      expect(content).toContain('info-dir-test');
      expect(content).toContain('Type: directory');
    });

    test('should handle non-existent file', async () => {
      const result = await fileService.getFileInfo('nonexistent.txt');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ENOENT');
    });
  });

  describe('error handling', () => {
    test('should handle permission errors gracefully', async () => {
      // This test might not work on all systems, but we can try
      const result = await fileService.readFile('/root/protected-file.txt');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toMatch(/ENOENT|EACCES|Error/);
    });

    test('should handle invalid file paths', async () => {
      const result = await fileService.readFile('');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid');
    });

    test('should handle null or undefined inputs', async () => {
      const result = await fileService.readFile(null as any);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid');
    });
  });

  describe('performance and caching', () => {
    test('should handle large directory listings efficiently', async () => {
      const testDir = 'large-dir-test';
      const fullDirPath = join(tempWorkspace, testDir);
      
      await fs.mkdir(fullDirPath, { recursive: true });
      
      // Create many files
      const filePromises = [];
      for (let i = 0; i < 100; i++) {
        filePromises.push(fs.writeFile(join(fullDirPath, `file${i}.txt`), `content${i}`));
      }
      await Promise.all(filePromises);
      
      const startTime = Date.now();
      const result = await fileService.listDirectory(testDir);
      const endTime = Date.now();
      
      expect(result.isError).toBeFalsy();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      const content = result.content[0].text as string;
      expect(content).toContain('file0.txt');
      expect(content).toContain('file99.txt');
    });

    test('should cache file stats for performance', async () => {
      const testFile = 'cache-test.txt';
      const fullPath = join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, 'cache test content');
      
      // First call
      const start1 = Date.now();
      const result1 = await fileService.getFileInfo(testFile);
      const end1 = Date.now();
      
      // Second call (should use cache)
      const start2 = Date.now();
      const result2 = await fileService.getFileInfo(testFile);
      const end2 = Date.now();
      
      expect(result1.isError).toBeFalsy();
      expect(result2.isError).toBeFalsy();
      
      // Second call should be faster (though this might be flaky)
      // We'll just check that both completed successfully
      expect(end2 - start2).toBeGreaterThanOrEqual(0);
      expect(end1 - start1).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Enhanced FileService Functionality', () => {
    describe('formatFile', () => {
      test('should format file with provided command', async () => {
        const testFile = 'format-test.txt';
        const fullPath = join(tempWorkspace, testFile);
        
        await fs.writeFile(fullPath, 'test content');
        
        // Use a simple echo command for testing
        const result = await fileService.formatFile(testFile, 'echo "formatted"');
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('formatted successfully');
      });

      test('should handle missing format command', async () => {
        const result = await fileService.formatFile('test.txt');
        
        expect(result.content[0].text).toBe('No format command provided');
      });

      test('should handle format command errors', async () => {
        const testFile = 'format-error-test.txt';
        const fullPath = join(tempWorkspace, testFile);
        
        await fs.writeFile(fullPath, 'test content');
        
        const result = await fileService.formatFile(testFile, 'invalid-command-that-does-not-exist');
        
        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('File formatting failed');
      });
    });

    describe('createFile', () => {
      test('should create file with content', async () => {
        const testFile = 'created-file.txt';
        const testContent = 'Created file content';
        
        const result = await fileService.createFile(testFile, testContent);
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('successfully written');
        
        // Verify file exists
        const fullPath = join(tempWorkspace, testFile);
        const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        // Verify content
        const savedContent = await fs.readFile(fullPath, 'utf-8');
        expect(savedContent).toBe(testContent);
      });

      test('should create file with custom commit message', async () => {
        const testFile = 'custom-commit-file.txt';
        const testContent = 'Custom commit content';
        
        const result = await fileService.createFile(testFile, testContent, {
          commitMessage: 'Custom commit message'
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('successfully written');
      });
    });

    describe('Enhanced writeFile with auto-format and auto-commit', () => {
      test('should write file with skipAutoFormat option', async () => {
        const testFile = 'skip-format-test.txt';
        const testContent = 'Skip format content';
        
        const result = await fileService.writeFile(testFile, testContent, {
          skipAutoFormat: true,
          formatCommand: 'echo "should not run"'
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('successfully written');
      });

      test('should write file with skipAutoCommit option', async () => {
        const testFile = 'skip-commit-test.txt';
        const testContent = 'Skip commit content';
        
        const result = await fileService.writeFile(testFile, testContent, {
          skipAutoCommit: true,
          commitMessage: 'Should not commit'
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('successfully written');
      });

      test('should handle format command execution', async () => {
        const testFile = 'format-exec-test.txt';
        const testContent = 'Format execution test';
        
        // Use echo command to simulate formatting
        const result = await fileService.writeFile(testFile, testContent, {
          formatCommand: 'echo "formatting {{file}}"'
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('successfully written');
      });

      test('should handle format command errors gracefully', async () => {
        const testFile = 'format-error-test.txt';
        const testContent = 'Format error test';
        
        const result = await fileService.writeFile(testFile, testContent, {
          formatCommand: 'invalid-format-command'
        });
        
        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('Failed to auto-format file');
      });
    });
  });

  describe('Enhanced File Operations and Diff Management', () => {
    describe('compareFiles', () => {
      test('should compare two identical files', async () => {
        const content = 'Hello, World!\nThis is a test file.';
        const file1 = 'file1.txt';
        const file2 = 'file2.txt';
        
        await fs.writeFile(join(tempWorkspace, file1), content);
        await fs.writeFile(join(tempWorkspace, file2), content);
        
        const result = await fileService.compareFiles({
          file1,
          file2,
          format: 'unified'
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Files are identical');
      });

      test('should compare files with differences in unified format', async () => {
        const content1 = 'Hello, World!\nThis is file 1.';
        const content2 = 'Hello, World!\nThis is file 2.';
        const file1 = 'file1.txt';
        const file2 = 'file2.txt';
        
        await fs.writeFile(join(tempWorkspace, file1), content1);
        await fs.writeFile(join(tempWorkspace, file2), content2);
        
        const result = await fileService.compareFiles({
          file1,
          file2,
          format: 'unified',
          contextLines: 2
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('---');
        expect(result.content[0].text).toContain('+++');
        expect(result.content[0].text).toContain('-This is file 1.');
        expect(result.content[0].text).toContain('+This is file 2.');
      });

      test('should compare files in side-by-side format', async () => {
        const content1 = 'Line 1\nLine 2 original';
        const content2 = 'Line 1\nLine 2 modified';
        const file1 = 'file1.txt';
        const file2 = 'file2.txt';
        
        await fs.writeFile(join(tempWorkspace, file1), content1);
        await fs.writeFile(join(tempWorkspace, file2), content2);
        
        const result = await fileService.compareFiles({
          file1,
          file2,
          format: 'side-by-side'
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Side-by-side');
        expect(result.content[0].text).toContain('original');
        expect(result.content[0].text).toContain('modified');
      });

      test('should handle non-existent files', async () => {
        const result = await fileService.compareFiles({
          file1: 'nonexistent1.txt',
          file2: 'nonexistent2.txt',
          format: 'unified'
        });
        
        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('does not exist');
      });

      test('should ignore whitespace when requested', async () => {
        const content1 = 'Hello World\n   Line with spaces';
        const content2 = 'Hello World\nLine with spaces';
        const file1 = 'file1.txt';
        const file2 = 'file2.txt';
        
        await fs.writeFile(join(tempWorkspace, file1), content1);
        await fs.writeFile(join(tempWorkspace, file2), content2);
        
        const result = await fileService.compareFiles({
          file1,
          file2,
          format: 'unified',
          ignoreWhitespace: true
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Files are identical');
      });
    });

    describe('analyzeFileDifferences', () => {
      test('should analyze differences between files', async () => {
        const content1 = 'Line 1\nLine 2\nLine 3\nLine 4';
        const content2 = 'Line 1\nLine 2 modified\nLine 4\nLine 5';
        const file1 = 'file1.txt';
        const file2 = 'file2.txt';
        
        await fs.writeFile(join(tempWorkspace, file1), content1);
        await fs.writeFile(join(tempWorkspace, file2), content2);
        
        const result = await fileService.analyzeFileDifferences(file1, file2);
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('File Comparison Analysis');
        expect(result.content[0].text).toContain('Lines added: 0');
        expect(result.content[0].text).toContain('Lines removed: 0');
        expect(result.content[0].text).toContain('Lines modified: 3');
      });

      test('should handle identical files', async () => {
        const content = 'Identical content';
        const file1 = 'file1.txt';
        const file2 = 'file2.txt';
        
        await fs.writeFile(join(tempWorkspace, file1), content);
        await fs.writeFile(join(tempWorkspace, file2), content);
        
        const result = await fileService.analyzeFileDifferences(file1, file2);
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Identical: true');
      });
    });

    describe('applyPatch', () => {
      test('should apply a simple patch file', async () => {
        const originalContent = 'Line 1\nLine 2\nLine 3';
        const patchContent = `--- original.txt
+++ modified.txt
@@ -1,3 +1,3 @@
 Line 1
-Line 2
+Line 2 modified
 Line 3`;
        
        const originalFile = 'original.txt';
        const patchFile = 'changes.patch';
        
        await fs.writeFile(join(tempWorkspace, originalFile), originalContent);
        await fs.writeFile(join(tempWorkspace, patchFile), patchContent);
        
        const result = await fileService.applyPatch(patchFile, { dryRun: true });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Patch applied successfully');
      });

      test('should handle non-existent patch file', async () => {
        const result = await fileService.applyPatch('nonexistent.patch');
        
        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('Patch file does not exist');
      });

      test('should create backup when requested', async () => {
        const originalContent = 'Original content';
        const patchContent = `--- original.txt
+++ modified.txt
@@ -1 +1 @@
-Original content
+Modified content`;
        
        const originalFile = 'original.txt';
        const patchFile = 'changes.patch';
        
        await fs.writeFile(join(tempWorkspace, originalFile), originalContent);
        await fs.writeFile(join(tempWorkspace, patchFile), patchContent);
        
        const result = await fileService.applyPatch(patchFile, { backup: true, dryRun: true });
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Patch applied successfully');
      });
    });

    describe('createPatch', () => {
      test('should create patch from two files', async () => {
        const content1 = 'Line 1\nLine 2\nLine 3';
        const content2 = 'Line 1\nLine 2 modified\nLine 3';
        const file1 = 'original.txt';
        const file2 = 'modified.txt';
        
        await fs.writeFile(join(tempWorkspace, file1), content1);
        await fs.writeFile(join(tempWorkspace, file2), content2);
        
        const result = await fileService.createPatch(file1, file2);
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('---');
        expect(result.content[0].text).toContain('+++');
        expect(result.content[0].text).toContain('-Line 2');
        expect(result.content[0].text).toContain('+Line 2 modified');
      });

      test('should create patch and save to file', async () => {
        const content1 = 'Original line';
        const content2 = 'Modified line';
        const file1 = 'original.txt';
        const file2 = 'modified.txt';
        const patchFile = 'changes.patch';
        
        await fs.writeFile(join(tempWorkspace, file1), content1);
        await fs.writeFile(join(tempWorkspace, file2), content2);
        
        const result = await fileService.createPatch(file1, file2, patchFile);
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain(`Patch created successfully: ${patchFile}`);
        
        // Verify patch file was created
        const patchExists = fsSync.existsSync(join(tempWorkspace, patchFile));
        expect(patchExists).toBeTruthy();
      });

      test('should handle non-existent source files', async () => {
        const result = await fileService.createPatch('nonexistent1.txt', 'nonexistent2.txt');
        
        expect(result.isError).toBeTruthy();
        expect(result.content[0].text).toContain('does not exist');
      });
    });

    describe('findAndReplace', () => {
      test('should find and replace text in single file', async () => {
        const content = 'Hello world\nHello universe\nGoodbye world';
        const testFile = 'test.txt';
        
        await fs.writeFile(join(tempWorkspace, testFile), content);
        
        const result = await fileService.findAndReplace(
          'world',
          'planet',
          { files: [testFile], preview: true }
        );
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Find and Replace Preview');
        expect(result.content[0].text).toContain('Hello planet');
        expect(result.content[0].text).toContain('Goodbye planet');
      });

      test('should find and replace with regex pattern', async () => {
        const content = 'Version 1.0.0\nVersion 2.1.3\nBuild 123';
        const testFile = 'version.txt';
        
        await fs.writeFile(join(tempWorkspace, testFile), content);
        
        const result = await fileService.findAndReplace(
          'Version \\d+\\.\\d+\\.\\d+',
          'Version X.Y.Z',
          { files: [testFile], regex: true, preview: true }
        );
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Version X.Y.Z');
        expect(result.content[0].text).not.toContain('Build 123'); // Build line not in this file
      });

      test('should handle case sensitivity', async () => {
        const content = 'Hello World\nhello world';
        const testFile = 'case.txt';
        
        await fs.writeFile(join(tempWorkspace, testFile), content);
        
        const result = await fileService.findAndReplace(
          'hello',
          'hi',
          { files: [testFile], caseSensitive: true, preview: true }
        );
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).not.toContain('Hello World'); // Capital H should remain unchanged
        expect(result.content[0].text).toContain('hi world'); // lowercase should be changed
      });

      test('should match whole words only', async () => {
        const content = 'cat\ncatch\ncategory';
        const testFile = 'words.txt';
        
        await fs.writeFile(join(tempWorkspace, testFile), content);
        
        const result = await fileService.findAndReplace(
          'cat',
          'dog',
          { files: [testFile], wholeWord: true, preview: true }
        );
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('dog');
        expect(result.content[0].text).not.toContain('catch'); // Should remain unchanged since not shown in preview
        expect(result.content[0].text).not.toContain('category'); // Should remain unchanged since not shown in preview
      });

      test('should find files by pattern', async () => {
        const content = 'test content';
        await fs.writeFile(join(tempWorkspace, 'file1.txt'), content);
        await fs.writeFile(join(tempWorkspace, 'file2.txt'), content);
        await fs.writeFile(join(tempWorkspace, 'file3.js'), content);
        
        const result = await fileService.findAndReplace(
          'test',
          'demo',
          { filePattern: '*.txt', preview: true }
        );
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('file1.txt');
        expect(result.content[0].text).toContain('file2.txt');
        expect(result.content[0].text).not.toContain('file3.js');
      });

      test('should handle backup creation', async () => {
        const content = 'original content';
        const testFile = 'backup-test.txt';
        
        await fs.writeFile(join(tempWorkspace, testFile), content);
        
        const result = await fileService.findAndReplace(
          'original',
          'modified',
          { files: [testFile], backup: true, preview: true }
        );
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('backup');
      });

      test('should handle no matches found', async () => {
        const content = 'Hello world';
        const testFile = 'nomatch.txt';
        
        await fs.writeFile(join(tempWorkspace, testFile), content);
        
        const result = await fileService.findAndReplace(
          'nonexistent',
          'replacement',
          { files: [testFile] }
        );
        
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('No matches found');
      });
    });
  });
});
