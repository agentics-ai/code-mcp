/**
 * Tests for AnalysisService - TypeScript version
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { AnalysisService } from '../../src/services/AnalysisService.js';
import { TestUtils } from '../utils.js';
import fs from 'fs/promises';
import path from 'path';

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  let mockWorkspaceService: any;
  let mockFileService: any;
  let tempWorkspace: string;

  beforeEach(async () => {
    tempWorkspace = await TestUtils.createTempWorkspace('analysis-service-test');
    mockWorkspaceService = TestUtils.createMockWorkspaceService(tempWorkspace);
    mockFileService = TestUtils.createMockFileService();
    analysisService = new AnalysisService(mockWorkspaceService, mockFileService);
  });

  afterEach(async () => {
    if (tempWorkspace) {
      await TestUtils.cleanupTempWorkspace(tempWorkspace);
    }
  });

  describe('constructor', () => {
    test('should initialize correctly', () => {
      expect(analysisService).toBeInstanceOf(AnalysisService);
      expect(mockWorkspaceService).toBeDefined();
      expect(mockFileService).toBeDefined();
    });
  });

  describe('analyzeCode', () => {
    test('should analyze a Python file', async () => {
      const testCode = 'def hello():\n    print("Hello World")\n';
      const testFile = 'test.py';
      const fullPath = path.join(tempWorkspace, testFile);
      
      await fs.writeFile(fullPath, testCode);
      
      const result = await analysisService.analyzeCode({
        path: testFile,
        language: 'python'
      });
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBeDefined();
      
      const analysis = JSON.parse(result.content[0].text!);
      expect(analysis.type).toBe('file');
      expect(analysis.path).toBe(fullPath);
      expect(analysis.language).toBe('python');
    });

    test('should analyze a directory', async () => {
      const structure = {
        'main.py': 'print("Hello")',
        'utils.py': 'def helper(): pass'
      };
      
      await TestUtils.createFileStructure(tempWorkspace, structure);
      
      const result = await analysisService.analyzeCode({
        path: '.'
      });
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      
      const analysis = JSON.parse(result.content[0].text!);
      expect(analysis.type).toBe('directory');
    });

    test('should handle non-existent path', async () => {
      await expect(analysisService.analyzeCode({
        path: 'nonexistent.py'
      })).rejects.toThrow();
    });
  });

  describe('searchCode', () => {
    test('should find text in files', async () => {
      const structure = {
        'main.py': 'def main():\n    print("Hello World")',
        'utils.py': 'def helper():\n    print("Helper")'
      };
      
      await TestUtils.createFileStructure(tempWorkspace, structure);
      
      const result = await analysisService.searchCode({
        query: 'print',
        path: '.'
      });
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      
      // Handle both JSON array format (TypeScript) and text format (JavaScript)
      const resultText = result.content[0].text!;
      if (resultText.startsWith('[') || resultText.startsWith('{')) {
        // JSON format from TypeScript version
        const results = JSON.parse(resultText);
        expect(Array.isArray(results)).toBe(true);
      } else {
        // Text format from JavaScript version  
        expect(resultText).toContain('Found');
        expect(resultText).toContain('matches');
      }
    });

    test('should return empty for no matches', async () => {
      const structure = {
        'main.py': 'def main(): pass'
      };
      
      await TestUtils.createFileStructure(tempWorkspace, structure);
      
      const result = await analysisService.searchCode({
        query: 'nonexistent',
        path: '.'
      });
      
      expect(result).toBeDefined();
      
      // Handle both JSON array format (TypeScript) and text format (JavaScript)
      const resultText = result.content[0].text!;
      if (resultText.startsWith('[') || resultText.startsWith('{')) {
        // JSON format from TypeScript version
        const results = JSON.parse(resultText);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      } else {
        // Text format from JavaScript version
        expect(resultText).toContain('No matches found');
      }
    });

    test('should handle search in non-existent directory', async () => {
      const result = await analysisService.searchCode({
        query: 'anything',
        path: 'nonexistent'
      });
      
      // Different implementations handle non-existent directories differently:
      // - JavaScript version returns "No matches found" text
      // - TypeScript version returns empty JSON array []
      expect(result).toBeDefined();
      const resultText = result.content[0].text!;
      
      if (resultText.startsWith('[') || resultText.startsWith('{')) {
        // JSON format from TypeScript version - should be empty array
        const results = JSON.parse(resultText);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      } else {
        // Text format from JavaScript version
        expect(resultText).toContain('No matches found');
      }
    });
  });
});
