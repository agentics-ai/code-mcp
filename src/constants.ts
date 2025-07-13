/**
 * Application constants and configuration
 */

export const SERVER_CONFIG = {
  name: 'vscode-agent-mcp',
  version: '2.0.0',
} as const;

export const DEFAULT_LIMITS = {
  maxWorkspaceHistory: 10,
  maxSearchResults: 50,
  serverStartupDelay: 2000,
} as const;

export const SUPPORTED_LANGUAGES = {
  PYTHON: 'python',
  JAVASCRIPT: 'javascript',
} as const;

export const PROJECT_TYPES = {
  PYTHON: 'python',
  NODE: 'node',
  REACT: 'react',
  EXPRESS: 'express',
} as const;

export const TEST_FRAMEWORKS = {
  PYTHON: {
    PYTEST: 'pytest',
    UNITTEST: 'unittest',
  },
  JAVASCRIPT: {
    JEST: 'jest',
    MOCHA: 'mocha',
  },
} as const;

export const GIT_ACTIONS = {
  LIST: 'list',
  CREATE: 'create',
  SWITCH: 'switch',
  DELETE: 'delete',
  MERGE: 'merge',
  REBASE: 'rebase',
} as const;

export const FILE_EXTENSIONS = {
  CODE_FILES: ['.py', '.js', '.jsx', '.ts', '.tsx'],
  PYTHON: '.py',
  JAVASCRIPT: '.js',
} as const;

// Type exports for compile-time type safety
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES];
export type ProjectType = typeof PROJECT_TYPES[keyof typeof PROJECT_TYPES];
export type GitAction = typeof GIT_ACTIONS[keyof typeof GIT_ACTIONS];
export type FileExtension = typeof FILE_EXTENSIONS.CODE_FILES[number] | typeof FILE_EXTENSIONS.PYTHON | typeof FILE_EXTENSIONS.JAVASCRIPT;
