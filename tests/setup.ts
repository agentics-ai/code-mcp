/**
 * Jest setup file for VS Code MCP Server tests
 * TypeScript compatible version
 */
import { jest } from '@jest/globals';
import { ToolResult } from '../src/types.js';

// Extend Jest matchers for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMcpResponse(): R;
      toBeValidError(): R;
    }
  }
}

// Make Jest globals available globally
globalThis.jest = jest;

// Custom matchers for MCP responses
expect.extend({
  toBeValidMcpResponse(received: ToolResult) {
    const pass = received && 
                 received.content && 
                 Array.isArray(received.content) &&
                 received.content.length > 0 &&
                 received.content.every(item => 
                   item.type && 
                   typeof item.text === 'string'
                 );

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid MCP response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid MCP response`,
        pass: false,
      };
    }
  },

  toBeValidError(received: ToolResult) {
    const pass = received && 
                 received.content && 
                 Array.isArray(received.content) &&
                 received.content.length > 0 &&
                 received.content[0].text &&
                 received.content[0].text.includes('Error');

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid error response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid error response`,
        pass: false,
      };
    }
  },
});
