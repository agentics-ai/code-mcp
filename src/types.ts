// Core MCP types
export interface MCPRequest {
  id: number | string;
  method: string;
  params?: any;
}

// VS Code workspace detection types
export interface VSCodeWorkspace {
  path: string;
  name: string;
  isOpen: boolean;
  lastAccessed?: Date;
  type: 'folder' | 'workspace' | 'file';
}

export interface VSCodeInstance {
  pid: number;
  executable: string;
  workspaces: VSCodeWorkspace[];
}

export interface VSCodeDetectionResult {
  instances: VSCodeInstance[];
  recentWorkspaces: VSCodeWorkspace[];
  totalWorkspaces: number;
}

export interface MCPResponse {
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// Tool definitions
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface ToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
    _meta?: Record<string, any>;
  }>;
  isError?: boolean;
  _meta?: Record<string, any>;
}

// File system types
export interface FileInfo {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  path: string;
}

export interface FileContent {
  content: string;
  encoding?: string;
  mimeType?: string;
}

// Process execution types
export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  cwd: string;
  duration: number;
}

export interface ProcessOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: string | boolean;
  encoding?: BufferEncoding;
}

// Git types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicts: string[];
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  changes: Array<{
    type: 'add' | 'delete' | 'modify';
    lineNumber: number;
    content: string;
  }>;
}

// Search types
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxResults?: number;
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  match: string;
}

// Task and diagnostic types
export interface VSCodeTask {
  type: string;
  label: string;
  command: string;
  args?: string[];
  group?: string;
  options?: {
    cwd?: string;
    env?: Record<string, string>;
  };
  problemMatcher?: string | string[];
  isBackground?: boolean;
}

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source?: string;
  code?: string | number;
}

// Extension types
export interface VSCodeExtension {
  id: string;
  displayName: string;
  version: string;
  isActive: boolean;
  packageJSON: any;
}

// Workspace types
export interface WorkspaceFolder {
  uri: string;
  name: string;
  index: number;
}

export interface WorkspaceConfiguration {
  [key: string]: any;
}

// Terminal types
export interface TerminalOptions {
  name?: string;
  cwd?: string;
  env?: Record<string, string>;
  shellPath?: string;
  shellArgs?: string[];
}

export interface TerminalInfo {
  name: string;
  processId?: number;
  creationOptions: TerminalOptions;
}

// Snippet types
export interface CodeSnippet {
  prefix: string;
  body: string[];
  description: string;
  scope?: string;
}

// Environment types
export interface PythonEnvironment {
  path: string;
  version: string;
  type: 'conda' | 'venv' | 'system' | 'pyenv';
  packages: Array<{
    name: string;
    version: string;
  }>;
}

// Service base types
export interface ServiceOptions {
  timeout?: number;
  retries?: number;
  verbose?: boolean;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// Utility types
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
