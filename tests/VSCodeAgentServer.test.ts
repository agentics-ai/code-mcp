/**
 * Tests for VSCodeAgentServer main functionality
 * Node.js 22 ES Modules compatible
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestUtils, TestFixtures, TestWorkspace, TestStructure } from './utils.js';
import fs from 'fs';
import path from 'path';

describe('VSCodeAgentServer Integration Tests', () => {
  let tempWorkspace: string;

  beforeEach(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('server-test');
  });

  afterEach(async () => {
    if (tempWorkspace) {
      await TestUtils.cleanupTempWorkspace(tempWorkspace);
    }
  });

  test('should create and manage temporary workspace', async () => {
    expect(tempWorkspace).toBeDefined();
    expect(typeof tempWorkspace).toBe('string');
    expect(tempWorkspace.length).toBeGreaterThan(0);
  });

  test('should create test file structure', async () => {
    const testStructure: TestStructure = {
      'test.txt': 'Hello World',
      'subdir/test2.txt': 'Hello Subdirectory'
    };

    await TestUtils.createFileStructure(tempWorkspace, testStructure);
    
    // Verify files were created
    const testFile = path.join(tempWorkspace, 'test.txt');
    const subTestFile = path.join(tempWorkspace, 'subdir/test2.txt');
    
    expect(fs.existsSync(testFile)).toBe(true);
    expect(fs.existsSync(subTestFile)).toBe(true);
    
    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toBe('Hello World');
  });

  test('should manage mock workspace lifecycle', async () => {
    const mockWorkspace = await TestUtils.createMockWorkspace('test-lifecycle');
    
    expect(mockWorkspace.path).toBeDefined();
    expect(typeof mockWorkspace.path).toBe('string');
    expect(typeof mockWorkspace.cleanup).toBe('function');
    
    // Verify mock structure was created
    const packageJsonPath = path.join(mockWorkspace.path, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    
    const indexJsPath = path.join(mockWorkspace.path, 'index.js');
    expect(fs.existsSync(indexJsPath)).toBe(true);
    
    // Cleanup
    await mockWorkspace.cleanup();
    expect(fs.existsSync(mockWorkspace.path)).toBe(false);
  });

  test('should provide utility functions for file operations', async () => {
    const testFile = path.join(tempWorkspace, 'utility-test.txt');
    await fs.promises.writeFile(testFile, 'Test content');
    
    // Test file existence check
    const exists = await TestUtils.fileExists(testFile);
    expect(exists).toBe(true);
    
    const notExists = await TestUtils.fileExists(path.join(tempWorkspace, 'nonexistent.txt'));
    expect(notExists).toBe(false);
    
    // Test file reading
    const content = await TestUtils.readFile(testFile);
    expect(content).toBe('Test content');
    
    // Test file stats
    const stats = await TestUtils.getFileStats(testFile);
    expect(stats.isFile).toBe(true);
    expect(stats.isDirectory).toBe(false);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should provide directory utility functions', async () => {
    const testDir = path.join(tempWorkspace, 'test-directory');
    await fs.promises.mkdir(testDir);
    
    // Test directory existence
    const exists = await TestUtils.directoryExists(testDir);
    expect(exists).toBe(true);
    
    // Test directory stats
    const stats = await TestUtils.getFileStats(testDir);
    expect(stats.isDirectory).toBe(true);
    expect(stats.isFile).toBe(false);
    
    // Create some files in directory
    await fs.promises.writeFile(path.join(testDir, 'file1.txt'), 'content1');
    await fs.promises.writeFile(path.join(testDir, 'file2.txt'), 'content2');
    
    // Test directory listing
    const contents = await TestUtils.listDirectory(testDir);
    expect(contents).toContain('file1.txt');
    expect(contents).toContain('file2.txt');
    expect(contents.length).toBe(2);
  });

  test('should handle test fixtures correctly', () => {
    // Test sample code fixtures
    expect(TestFixtures.SAMPLE_PYTHON_CODE).toContain('def fibonacci');
    expect(TestFixtures.SAMPLE_JAVASCRIPT_CODE).toContain('function fibonacci');
    expect(TestFixtures.SAMPLE_HTML).toContain('<!DOCTYPE html>');
    expect(TestFixtures.SAMPLE_CSS).toContain('font-family');
    expect(TestFixtures.SAMPLE_MARKDOWN).toContain('# Test Project');
    
    // Test JSON config
    expect(TestFixtures.SAMPLE_JSON_CONFIG.name).toBe('test-project');
    expect(TestFixtures.SAMPLE_JSON_CONFIG.scripts.test).toBe('jest');
    
    // Test complex project structure
    const complexStructure = TestFixtures.getComplexProjectStructure();
    expect(complexStructure['package.json']).toBeDefined();
    expect(complexStructure['README.md']).toBeDefined();
    expect(complexStructure['src']).toBeDefined();
    expect(complexStructure['tests']).toBeDefined();
  });

  test('should provide retry functionality', async () => {
    let attemptCount = 0;
    
    // Function that fails twice then succeeds
    const flakyFunction = async (): Promise<string> => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      return 'Success!';
    };
    
    const result = await TestUtils.retry(flakyFunction, 5, 10);
    expect(result).toBe('Success!');
    expect(attemptCount).toBe(3);
  });

  test('should provide wait functionality', async () => {
    const startTime = Date.now();
    await TestUtils.wait(100);
    const endTime = Date.now();
    
    const elapsed = endTime - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some variance
    expect(elapsed).toBeLessThan(200);
  });

  test('should generate random strings', () => {
    const str1 = TestUtils.randomString();
    const str2 = TestUtils.randomString();
    const str3 = TestUtils.randomString(16);
    
    expect(str1).toHaveLength(8); // default length
    expect(str2).toHaveLength(8);
    expect(str3).toHaveLength(16);
    expect(str1).not.toBe(str2); // Should be different
    expect(/^[a-z0-9]+$/.test(str1)).toBe(true); // Should match pattern
  });

  test('should handle complex project structure creation', async () => {
    const complexStructure = TestFixtures.getComplexProjectStructure();
    await TestUtils.createFileStructure(tempWorkspace, complexStructure);
    
    // Verify key files exist
    expect(fs.existsSync(path.join(tempWorkspace, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(tempWorkspace, 'src/app.js'))).toBe(true);
    expect(fs.existsSync(path.join(tempWorkspace, 'src/components/header.js'))).toBe(true);
    expect(fs.existsSync(path.join(tempWorkspace, 'tests/app.test.js'))).toBe(true);
    expect(fs.existsSync(path.join(tempWorkspace, 'public/index.html'))).toBe(true);
    
    // Verify content
    const packageJson = fs.readFileSync(path.join(tempWorkspace, 'package.json'), 'utf8');
    const packageData = JSON.parse(packageJson);
    expect(packageData.name).toBe('test-project');
    expect(packageData.scripts.test).toBe('jest');
    
    const indexHtml = fs.readFileSync(path.join(tempWorkspace, 'public/index.html'), 'utf8');
    expect(indexHtml).toContain('Hello World');
  });
});
