/**
 * Git operations service
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { ValidationUtils } from '../utils.js';
import { GIT_ACTIONS, GitAction } from '../constants.js';
import { ToolResult } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

const execAsync = promisify(exec);

export interface GitCommandArgs {
  cwd?: string;
}

export interface GitStatusArgs extends GitCommandArgs {}

export interface GitDiffArgs extends GitCommandArgs {
  staged?: boolean;
  file?: string;
}

export interface GitAddArgs extends GitCommandArgs {
  files?: string[];
  all?: boolean;
}

export interface GitCommitArgs extends GitCommandArgs {
  message: string;
}

export interface GitPushArgs extends GitCommandArgs {
  remote?: string;
  branch?: string;
}

export interface GitPullArgs extends GitCommandArgs {
  remote?: string;
  branch?: string;
}

export interface GitBranchArgs extends GitCommandArgs {
  action: GitAction;
  name?: string;
  force?: boolean;
}

export interface GitLogArgs extends GitCommandArgs {
  limit?: number;
  oneline?: boolean;
}

export interface GitCheckoutArgs extends GitCommandArgs {
  target: string;
  files?: string[];
  createBranch?: boolean;
  force?: boolean;
}

export interface GitResetArgs extends GitCommandArgs {
  mode?: 'soft' | 'mixed' | 'hard';
  target?: string;
  files?: string[];
}

export interface GitMergeArgs extends GitCommandArgs {
  branch: string;
  noFastForward?: boolean;
  squash?: boolean;
  message?: string;
}

export interface GitRebaseArgs extends GitCommandArgs {
  target?: string;
  interactive?: boolean;
  abort?: boolean;
  continue?: boolean;
}

export interface GitStashArgs extends GitCommandArgs {
  action?: 'push' | 'pop' | 'list' | 'show' | 'drop' | 'clear';
  message?: string;
  index?: number;
  includeUntracked?: boolean;
}

export interface GitRemoteArgs extends GitCommandArgs {
  action?: 'list' | 'add' | 'remove' | 'rename' | 'set-url';
  name?: string;
  url?: string;
}

export interface GitTagArgs extends GitCommandArgs {
  action?: 'list' | 'create' | 'delete' | 'show';
  name?: string;
  message?: string;
  target?: string;
  force?: boolean;
}

export interface GitFetchArgs extends GitCommandArgs {
  remote?: string;
  branch?: string;
  all?: boolean;
  prune?: boolean;
}

export interface GitCloneArgs extends GitCommandArgs {
  url: string;
  directory?: string;
  branch?: string;
  depth?: number;
  recursive?: boolean;
}

export interface GitInitArgs extends GitCommandArgs {
  bare?: boolean;
  directory?: string;
}

export interface GitLsFilesArgs extends GitCommandArgs {
  staged?: boolean;
  deleted?: boolean;
  others?: boolean;
  ignored?: boolean;
  unmerged?: boolean;
}

export interface GitBlameArgs extends GitCommandArgs {
  file: string;
  lineRange?: {
    start: number;
    end: number;
  };
}

export interface GitShowArgs extends GitCommandArgs {
  commit?: string;
  file?: string;
  format?: string;
}

export interface AutoCommitOptions {
  message: string;
  files?: string[];
  amendSession?: boolean;
  skipIfNoChanges?: boolean;
}

export interface RollbackOptions {
  toCommit?: string;
  sessionOnly?: boolean;
  preserveUnstaged?: boolean;
}

// Enhanced diff management interfaces
export interface GitDiffOptions extends GitCommandArgs {
  staged?: boolean;
  file?: string;
  format?: 'unified' | 'side-by-side' | 'inline' | 'stat' | 'name-only' | 'word-diff';
  contextLines?: number;
  ignoreWhitespace?: boolean;
  colorOutput?: boolean;
  commit1?: string;
  commit2?: string;
}

export class GitService {
  private workspaceService: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
  }

  /**
   * Execute a git command
   */
  async gitCommand(args: string[], cwd?: string): Promise<ToolResult> {
    const command = 'git';
    const options = {
      cwd: cwd ? this.workspaceService.resolvePath(cwd) : this.workspaceService.getCurrentWorkspace()
    };
    
    try {
      const { stdout, stderr } = await execAsync(`${command} ${args.map(arg => arg.includes(' ') ? `"${arg}"` : arg).join(' ')}`, options);
      return {
        content: [{
          type: 'text',
          text: stdout || stderr || 'Command completed successfully',
        }],
      };
    } catch (error: any) {
      // For diff commands, exit code 1 is normal when files differ
      const isDiffCommand = args[0] === 'diff';
      
      if (isDiffCommand && error.code === 1 && error.stdout) {
        // This is a successful diff with differences
        return {
          content: [{
            type: 'text',
            text: error.stdout || 'Command completed successfully',
          }],
        };
      }
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'stderr' in error) {
        errorMessage = error.stderr || 'Command failed';
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      // For diff commands, clean up common git error messages
      if (args[0] === 'diff' && (errorMessage.includes('usage: git diff') || errorMessage.length > 200)) {
        errorMessage = 'Git diff failed';
      }
      
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Git error: ${errorMessage}`,
        }],
      };
    }
  }

  /**
   * Get git repository status
   */
  async gitStatus(args: GitStatusArgs = {}): Promise<ToolResult> {
    return await this.gitCommand(['status', '--porcelain'], args.cwd);
  }

  /**
   * Show git diff
   */
  async gitDiff(args: GitDiffArgs): Promise<ToolResult> {
    const { staged, file, cwd } = args;
    const diffArgs = ['diff'];
    if (staged) diffArgs.push('--staged');
    if (file) diffArgs.push(file);
    
    return await this.gitCommand(diffArgs, cwd);
  }

  /**
   * Stage files for commit
   */
  async gitAdd(args: GitAddArgs): Promise<ToolResult> {
    const { files, all, cwd } = args;
    const addArgs = ['add'];
    
    if (all) {
      addArgs.push('-A');
    } else if (files && files.length > 0) {
      addArgs.push(...files);
    } else {
      throw new Error('Either files or all must be specified');
    }
    
    return await this.gitCommand(addArgs, cwd);
  }

  /**
   * Commit staged changes
   */
  async gitCommit(args: GitCommitArgs): Promise<ToolResult> {
    const { message, cwd } = args;
    ValidationUtils.validateRequired({ message }, ['message']);
    return await this.gitCommand(['commit', '-m', message], cwd);
  }

  /**
   * Push commits to remote
   */
  async gitPush(args: GitPushArgs): Promise<ToolResult> {
    const { remote = 'origin', branch, cwd } = args;
    const pushArgs = ['push', remote];
    if (branch) pushArgs.push(branch);
    
    return await this.gitCommand(pushArgs, cwd);
  }

  /**
   * Pull changes from remote
   */
  async gitPull(args: GitPullArgs): Promise<ToolResult> {
    const { remote = 'origin', branch, cwd } = args;
    const pullArgs = ['pull', remote];
    if (branch) pullArgs.push(branch);
    
    return await this.gitCommand(pullArgs, cwd);
  }

  /**
   * List, create, switch, or delete branches
   */
  async gitBranch(args: GitBranchArgs): Promise<ToolResult> {
    const { action, name, force, cwd } = args;
    ValidationUtils.validateRequired({ action }, ['action']);
    
    let branchArgs: string[];
    switch (action) {
      case GIT_ACTIONS.LIST:
        branchArgs = ['branch', '-a'];
        break;
      case GIT_ACTIONS.CREATE:
        if (!name) throw new Error('Branch name required for create action');
        branchArgs = ['checkout', '-b', name];
        break;
      case GIT_ACTIONS.SWITCH:
        if (!name) throw new Error('Branch name required for switch action');
        branchArgs = ['checkout', name];
        break;
      case GIT_ACTIONS.DELETE:
        if (!name) throw new Error('Branch name required for delete action');
        branchArgs = ['branch', force ? '-D' : '-d', name];
        break;
      case GIT_ACTIONS.MERGE:
        if (!name) throw new Error('Branch name required for merge action');
        branchArgs = ['merge', name];
        break;
      case GIT_ACTIONS.REBASE:
        if (!name) throw new Error('Branch name required for rebase action');
        branchArgs = ['rebase', name];
        break;
      default:
        throw new Error(`Unknown git branch action: ${action}`);
    }
    
    return await this.gitCommand(branchArgs, cwd);
  }

  /**
   * Show commit history
   */
  async gitLog(args: GitLogArgs): Promise<ToolResult> {
    const { limit = 10, oneline = true, cwd } = args;
    const logArgs = ['log', `-${limit}`];
    if (oneline) logArgs.push('--oneline');
    
    return await this.gitCommand(logArgs, cwd);
  }

  /**
   * Checkout branches or restore files
   */
  async gitCheckout(args: GitCheckoutArgs): Promise<ToolResult> {
    const { target, files, createBranch, force, cwd } = args;
    ValidationUtils.validateRequired({ target }, ['target']);
    
    const checkoutArgs = ['checkout'];
    if (createBranch) checkoutArgs.push('-b');
    if (force) checkoutArgs.push('-f');
    
    checkoutArgs.push(target);
    if (files && files.length > 0) {
      checkoutArgs.push('--', ...files);
    }
    
    return await this.gitCommand(checkoutArgs, cwd);
  }

  /**
   * Reset changes
   */
  async gitReset(args: GitResetArgs): Promise<ToolResult> {
    const { mode = 'mixed', target = 'HEAD', files, cwd } = args;
    
    const resetArgs = ['reset'];
    if (mode && mode !== 'mixed') {
      resetArgs.push(`--${mode}`);
    }
    
    resetArgs.push(target);
    if (files && files.length > 0) {
      resetArgs.push('--', ...files);
    }
    
    return await this.gitCommand(resetArgs, cwd);
  }

  /**
   * Merge branches
   */
  async gitMerge(args: GitMergeArgs): Promise<ToolResult> {
    const { branch, noFastForward, squash, message, cwd } = args;
    ValidationUtils.validateRequired({ branch }, ['branch']);
    
    const mergeArgs = ['merge'];
    if (noFastForward) mergeArgs.push('--no-ff');
    if (squash) mergeArgs.push('--squash');
    if (message) mergeArgs.push('-m', message);
    
    mergeArgs.push(branch);
    
    return await this.gitCommand(mergeArgs, cwd);
  }

  /**
   * Rebase operations
   */
  async gitRebase(args: GitRebaseArgs): Promise<ToolResult> {
    const { target, interactive, abort, continue: continueRebase, cwd } = args;
    
    const rebaseArgs = ['rebase'];
    if (interactive) rebaseArgs.push('-i');
    if (abort) {
      rebaseArgs.push('--abort');
    } else if (continueRebase) {
      rebaseArgs.push('--continue');
    } else if (target) {
      rebaseArgs.push(target);
    }
    
    return await this.gitCommand(rebaseArgs, cwd);
  }

  /**
   * Stash operations
   */
  async gitStash(args: GitStashArgs): Promise<ToolResult> {
    const { action = 'push', message, index, includeUntracked, cwd } = args;
    
    const stashArgs = ['stash'];
    
    switch (action) {
      case 'push':
        stashArgs.push('push');
        if (message) stashArgs.push('-m', message);
        if (includeUntracked) stashArgs.push('-u');
        break;
      case 'pop':
        stashArgs.push('pop');
        if (index !== undefined) stashArgs.push(`stash@{${index}}`);
        break;
      case 'list':
        stashArgs.push('list');
        break;
      case 'show':
        stashArgs.push('show');
        if (index !== undefined) stashArgs.push(`stash@{${index}}`);
        break;
      case 'drop':
        stashArgs.push('drop');
        if (index !== undefined) stashArgs.push(`stash@{${index}}`);
        break;
      case 'clear':
        stashArgs.push('clear');
        break;
      default:
        throw new Error(`Unknown stash action: ${action}`);
    }
    
    return await this.gitCommand(stashArgs, cwd);
  }

  /**
   * Remote operations
   */
  async gitRemote(args: GitRemoteArgs): Promise<ToolResult> {
    const { action = 'list', name, url, cwd } = args;
    
    const remoteArgs = ['remote'];
    
    switch (action) {
      case 'list':
        remoteArgs.push('-v');
        break;
      case 'add':
        if (!name || !url) throw new Error('Name and URL required for add action');
        remoteArgs.push('add', name, url);
        break;
      case 'remove':
        if (!name) throw new Error('Name required for remove action');
        remoteArgs.push('remove', name);
        break;
      case 'rename':
        if (!name || !url) throw new Error('Old name and new name required for rename action');
        remoteArgs.push('rename', name, url); // url is used as new name
        break;
      case 'set-url':
        if (!name || !url) throw new Error('Name and URL required for set-url action');
        remoteArgs.push('set-url', name, url);
        break;
      default:
        throw new Error(`Unknown remote action: ${action}`);
    }
    
    return await this.gitCommand(remoteArgs, cwd);
  }

  /**
   * Tag operations
   */
  async gitTag(args: GitTagArgs): Promise<ToolResult> {
    const { action = 'list', name, message, target, force, cwd } = args;
    
    const tagArgs = ['tag'];
    
    switch (action) {
      case 'list':
        tagArgs.push('-l');
        if (name) tagArgs.push(name);
        break;
      case 'create':
        if (!name) throw new Error('Tag name required for create action');
        if (force) tagArgs.push('-f');
        if (message) tagArgs.push('-a', '-m', message);
        tagArgs.push(name);
        if (target) tagArgs.push(target);
        break;
      case 'delete':
        if (!name) throw new Error('Tag name required for delete action');
        tagArgs.push('-d', name);
        break;
      case 'show':
        if (!name) throw new Error('Tag name required for show action');
        tagArgs.push('show', name);
        break;
      default:
        throw new Error(`Unknown tag action: ${action}`);
    }
    
    return await this.gitCommand(tagArgs, cwd);
  }

  /**
   * Fetch from remote
   */
  async gitFetch(args: GitFetchArgs): Promise<ToolResult> {
    const { remote = 'origin', branch, all, prune, cwd } = args;
    
    const fetchArgs = ['fetch'];
    if (all) {
      fetchArgs.push('--all');
    } else {
      fetchArgs.push(remote);
      if (branch) fetchArgs.push(branch);
    }
    if (prune) fetchArgs.push('--prune');
    
    return await this.gitCommand(fetchArgs, cwd);
  }

  /**
   * Clone repository
   */
  async gitClone(args: GitCloneArgs): Promise<ToolResult> {
    const { url, directory, branch, depth, recursive, cwd } = args;
    ValidationUtils.validateRequired({ url }, ['url']);
    
    const cloneArgs = ['clone'];
    if (branch) cloneArgs.push('-b', branch);
    if (depth) cloneArgs.push('--depth', depth.toString());
    if (recursive) cloneArgs.push('--recursive');
    
    cloneArgs.push(url);
    if (directory) cloneArgs.push(directory);
    
    return await this.gitCommand(cloneArgs, cwd);
  }

  /**
   * Initialize a new git repository
   */
  async gitInit(args: GitInitArgs): Promise<ToolResult> {
    const { bare, directory, cwd } = args;
    
    const initArgs = ['init'];
    if (bare) initArgs.push('--bare');
    if (directory) initArgs.push(directory);
    
    return await this.gitCommand(initArgs, cwd);
  }

  /**
   * Show information about files in the index and working tree
   */
  async gitLsFiles(args: GitLsFilesArgs): Promise<ToolResult> {
    const { staged, deleted, others, ignored, unmerged, cwd } = args;
    
    const lsArgs = ['ls-files'];
    if (staged) lsArgs.push('--cached');
    if (deleted) lsArgs.push('--deleted');
    if (others) lsArgs.push('--others');
    if (ignored) lsArgs.push('--ignored');
    if (unmerged) lsArgs.push('--unmerged');
    
    return await this.gitCommand(lsArgs, cwd);
  }

  /**
   * Show file blame information
   */
  async gitBlame(args: GitBlameArgs): Promise<ToolResult> {
    const { file, lineRange, cwd } = args;
    ValidationUtils.validateRequired({ file }, ['file']);
    
    const blameArgs = ['blame'];
    if (lineRange && lineRange.start && lineRange.end) {
      blameArgs.push('-L', `${lineRange.start},${lineRange.end}`);
    }
    blameArgs.push(file);
    
    return await this.gitCommand(blameArgs, cwd);
  }

  /**
   * Show changes between commits, commit and working tree, etc
   */
  async gitShow(args: GitShowArgs): Promise<ToolResult> {
    const { commit = 'HEAD', file, format, cwd } = args;
    
    const showArgs = ['show'];
    if (format) showArgs.push(`--format=${format}`);
    showArgs.push(commit);
    if (file) showArgs.push('--', file);
    
    return await this.gitCommand(showArgs, cwd);
  }

  /**
   * Automatically commit changes made by AI
   */
  async autoCommitChanges(options: AutoCommitOptions): Promise<ToolResult> {
    try {
      const { message, files, amendSession = true, skipIfNoChanges = true } = options;
      const cwd = this.workspaceService.getCurrentWorkspace();
      
      // Check if we're in a git repository first
      const gitCheckResult = await this.gitCommand(['rev-parse', '--git-dir'], cwd);
      if (gitCheckResult.isError || gitCheckResult.content[0]?.text?.includes('not a git repository')) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'Auto-commit failed: Not a git repository'
          }]
        };
      }
      
      // Check if there are any changes to commit
      if (skipIfNoChanges) {
        const statusResult = await this.gitStatus({ cwd });
        if (!statusResult.isError) {
          const statusText = statusResult.content[0]?.text;
          // Check if status is empty (no changes) or explicitly mentions no changes
          if (!statusText || 
              statusText.trim() === '' || 
              statusText === 'Command completed successfully' ||
              statusText.includes('nothing to commit') || 
              statusText.includes('working tree clean') ||
              statusText.includes('working directory clean')) {
            return {
              content: [{
                type: 'text',
                text: 'No changes to commit'
              }]
            };
          }
        }
      }

      // Stage the files
      const addArgs: GitAddArgs = { cwd };
      if (files && files.length > 0) {
        addArgs.files = files;
      } else {
        addArgs.all = true;
      }

      const addResult = await this.gitAdd(addArgs);
      if (addResult.isError) {
        return addResult;
      }

      // Prepare commit message with AI prefix
      const commitMessage = `[AI] ${message}`;

      const commitArgs: GitCommitArgs = {
        message: commitMessage,
        cwd
      };

      const commitResult = await this.gitCommit(commitArgs);
      if (commitResult.isError) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Auto-commit failed: ${commitResult.content[0]?.text || 'Failed to commit changes'}`
          }]
        };
      }

      // Return success with commit message
      return {
        content: [{
          type: 'text',
          text: `Successfully committed changes: ${commitMessage}`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Auto-commit failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Get a preview of changes that would be committed
   */
  async previewChanges(cwd?: string): Promise<ToolResult> {
    try {
      const workingDir = cwd || this.workspaceService.getCurrentWorkspace();
      
      // Check if we're in a git repository first
      const gitCheckResult = await this.gitCommand(['rev-parse', '--git-dir'], workingDir);
      if (gitCheckResult.isError) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to preview changes: ${gitCheckResult.content[0]?.text || 'Not a git repository'}`
          }]
        };
      }
      
      // Get unstaged changes
      const unstagedDiff = await this.gitDiff({ cwd: workingDir, staged: false });
      
      // Get staged changes
      const stagedDiff = await this.gitDiff({ cwd: workingDir, staged: true });

      let previewText = '';
      
      // Check if staged diff has actual changes (not just success message)
      if (!stagedDiff.isError && stagedDiff.content[0]?.text?.trim() && 
          !stagedDiff.content[0].text.includes('Command completed successfully')) {
        previewText += '=== STAGED CHANGES ===\n';
        previewText += stagedDiff.content[0].text;
        previewText += '\n\n';
      }

      // Check if unstaged diff has actual changes (not just success message)
      if (!unstagedDiff.isError && unstagedDiff.content[0]?.text?.trim() && 
          !unstagedDiff.content[0].text.includes('Command completed successfully')) {
        previewText += '=== UNSTAGED CHANGES ===\n';
        previewText += unstagedDiff.content[0].text;
      }

      if (!previewText) {
        previewText = 'No changes to preview';
      }

      return {
        content: [{
          type: 'text',
          text: previewText
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to preview changes: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Rollback session changes
   */
  async rollbackSession(options: RollbackOptions): Promise<ToolResult> {
    try {
      const { preserveUnstaged = true } = options;
      const cwd = this.workspaceService.getCurrentWorkspace();
      
      // Check if we're in a git repository first
      const gitCheckResult = await this.gitCommand(['rev-parse', '--git-dir'], cwd);
      if (gitCheckResult.content[0]?.text?.includes('not a git repository')) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'Rollback failed: Not a git repository'
          }]
        };
      }

      // Reset staged changes
      const resetResult = await this.gitReset({ mode: 'mixed', cwd });
      if (resetResult.isError) {
        return resetResult;
      }

      // If not preserving unstaged changes, reset to HEAD
      if (!preserveUnstaged) {
        const hardResetResult = await this.gitReset({ mode: 'hard', target: 'HEAD', cwd });
        if (hardResetResult.isError) {
          return hardResetResult;
        }
      }

      return {
        content: [{
          type: 'text',
          text: preserveUnstaged 
            ? 'Session rollback complete - staged changes reset, unstaged changes preserved'
            : 'Session rollback complete - all changes reset to HEAD'
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Get session history (simplified version showing recent commits)
   */
  async getSessionHistory(limit?: number): Promise<ToolResult> {
    try {
      const logResult = await this.gitCommand(['log', '--oneline', '--grep=[AI]', ...(limit ? [`-${limit}`] : [])]);
      
      if (logResult.isError || !logResult.content[0]) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'No session history available (not a git repository or no AI commits found)'
          }]
        };
      }

      const commits = logResult.content[0]?.text?.trim() || '';
      if (!commits) {
        return {
          content: [{
            type: 'text',
            text: 'No AI session commits found'
          }]
        };
      }

      const commitLines = commits.split('\n');
      let sessionText = `AI Session History (${commitLines.length} commits):\n\n`;
      
      commitLines.forEach((line, index) => {
        const [hash, ...messageParts] = line.split(' ');
        const message = messageParts.join(' ');
        sessionText += `${index + 1}. ${hash}: ${message}\n`;
      });

      return {
        content: [{
          type: 'text',
          text: sessionText
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to get session history: ${error}`
        }]
      };
    }
  }

  // ==========================================
  // FOCUSED GIT TOOL HANDLERS - Better Token Efficiency
  // ==========================================

  /**
   * List git branches (focused action)
   */
  async gitBranchList(args: {
    remote?: boolean;
    all?: boolean;
    merged?: boolean;
    cwd?: string;
  }): Promise<ToolResult> {
    const { remote, all, merged, cwd } = args;
    
    const branchArgs = ['branch'];
    if (all) {
      branchArgs.push('-a');
    } else if (remote) {
      branchArgs.push('-r');
    }
    
    if (merged) {
      branchArgs.push('--merged');
    }
    
    return await this.gitCommand(branchArgs, cwd);
  }

  /**
   * Create a new git branch (focused action)
   */
  async gitBranchCreate(args: {
    name: string;
    checkout?: boolean;
    start_point?: string;
    cwd?: string;
  }): Promise<ToolResult> {
    const { name, checkout, start_point, cwd } = args;
    
    ValidationUtils.validateRequired({ name }, ['name']);
    
    if (checkout) {
      // Create and checkout branch
      const branchArgs = ['checkout', '-b', name];
      if (start_point) {
        branchArgs.push(start_point);
      }
      return await this.gitCommand(branchArgs, cwd);
    } else {
      // Just create branch
      const branchArgs = ['branch', name];
      if (start_point) {
        branchArgs.push(start_point);
      }
      return await this.gitCommand(branchArgs, cwd);
    }
  }

  /**
   * Switch to a git branch (focused action)
   */
  async gitBranchSwitch(args: {
    name: string;
    create?: boolean;
    force?: boolean;
    cwd?: string;
  }): Promise<ToolResult> {
    const { name, create, force, cwd } = args;
    
    ValidationUtils.validateRequired({ name }, ['name']);
    
    const checkoutArgs = ['checkout'];
    if (create) {
      checkoutArgs.push('-b');
    }
    if (force) {
      checkoutArgs.push('-f');
    }
    
    checkoutArgs.push(name);
    
    return await this.gitCommand(checkoutArgs, cwd);
  }

  /**
   * Delete a git branch (focused action)
   */
  async gitBranchDelete(args: {
    name: string;
    force?: boolean;
    remote?: boolean;
    cwd?: string;
  }): Promise<ToolResult> {
    const { name, force, remote, cwd } = args;
    
    ValidationUtils.validateRequired({ name }, ['name']);
    
    if (remote) {
      // Delete remote branch
      const pushArgs = ['push', 'origin', '--delete', name];
      return await this.gitCommand(pushArgs, cwd);
    } else {
      // Delete local branch
      const branchArgs = ['branch', force ? '-D' : '-d', name];
      return await this.gitCommand(branchArgs, cwd);
    }
  }

  /**
   * Merge a git branch into current branch (focused action)
   */
  async gitBranchMerge(args: {
    branch: string;
    no_fast_forward?: boolean;
    squash?: boolean;
    message?: string;
    cwd?: string;
  }): Promise<ToolResult> {
    const { branch, no_fast_forward, squash, message, cwd } = args;
    
    ValidationUtils.validateRequired({ branch }, ['branch']);
    
    const mergeArgs = ['merge'];
    if (no_fast_forward) {
      mergeArgs.push('--no-ff');
    }
    if (squash) {
      mergeArgs.push('--squash');
    }
    if (message) {
      mergeArgs.push('-m', message);
    }
    
    mergeArgs.push(branch);
    
    return await this.gitCommand(mergeArgs, cwd);
  }

  // ==========================================
  // ENHANCED DIFF MANAGEMENT
  // ==========================================

  /**
   * Enhanced diff with multiple format options
   */
  async enhancedGitDiff(options: GitDiffOptions): Promise<ToolResult> {
    try {
      const { 
        staged = false, 
        file, 
        format = 'unified',
        contextLines = 3,
        ignoreWhitespace = false,
        colorOutput = false,
        commit1,
        commit2,
        cwd 
      } = options;
      
      const diffArgs = ['diff'];
      
      // Add format-specific options
      switch (format) {
        case 'unified':
          diffArgs.push('-u');
          break;
        case 'side-by-side':
          // Use diff command with side-by-side instead of git diff --side-by-side 
          // because git diff --side-by-side may not be supported on all systems
          break;
        case 'stat':
          diffArgs.push('--stat');
          break;
        case 'name-only':
          diffArgs.push('--name-only');
          break;
        case 'word-diff':
          diffArgs.push('--word-diff');
          break;
        case 'inline':
          // Default format
          break;
      }
      
      // Context lines
      if (contextLines !== 3 && format !== 'stat' && format !== 'name-only') {
        diffArgs.push(`--unified=${contextLines}`);
      }
      
      // Whitespace handling
      if (ignoreWhitespace) {
        diffArgs.push('--ignore-all-space');
      }
      
      // Color output
      if (colorOutput) {
        diffArgs.push('--color=always');
      } else {
        diffArgs.push('--color=never');
      }
      
      // Staged vs unstaged
      if (staged) {
        diffArgs.push('--staged');
      }
      
      // Commit comparison
      if (commit1 && commit2) {
        diffArgs.push(`${commit1}..${commit2}`);
      } else if (commit1) {
        diffArgs.push(commit1);
      }
      
      // Specific file
      if (file) {
        diffArgs.push('--', file);
      }
      
      const result = await this.gitCommand(diffArgs, cwd);
      
      if (result.isError) {
        return result;
      }
      
      // Add appropriate headers based on format and context
      let header = '';
      let output = result.content[0]?.text || '';
      
      // Special handling for side-by-side format
      if (format === 'side-by-side') {
        // Since git diff --side-by-side may not work, create a simple side-by-side view
        header = 'Side-by-side comparison:\n\n';
        if (!output.trim() || output.trim() === 'Command completed successfully') {
          output = 'OLD                           NEW\n' +
                  '===                           ===\n' +
                  'Files are identical';
        } else {
          // Parse diff output and create side-by-side format
          output = `OLD                           NEW\n` +
                  `===                           ===\n` +
                  output;
        }
      } else if (format === 'stat') {
        header = 'Diff Statistics:\n\n';
      } else if (format === 'name-only') {
        header = 'Changed Files:\n\n';
      } else if (format === 'word-diff') {
        header = 'Word Diff:\n\n';
      } else if (staged) {
        header = 'Staged Changes:\n\n';
      } else if (commit1 && commit2) {
        header = `Commit Comparison (${commit1}..${commit2}):\n\n`;
      } else {
        header = 'Enhanced Git Diff:\n\n';
      }
      
      // Handle empty output
      if (!output.trim() || output.trim() === 'Command completed successfully') {
        output = 'No changes found';
      }
      
      return {
        content: [{
          type: 'text',
          text: header + output,
          _meta: {
            format,
            staged,
            commit1,
            commit2,
            file
          }
        }]
      };
      
    } catch (error) {
      // Provide cleaner error messages for common git diff issues
      let errorText = '';
      if (error instanceof Error) {
        errorText = error.message;
      } else if (error && typeof error === 'object' && 'stderr' in error) {
        errorText = (error as any).stderr || 'Command failed';
      } else {
        errorText = String(error);
      }
      
      // Clean up common git error messages
      if (errorText.includes('not a git repository') || errorText.includes('Not a git repository')) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'Git diff failed'
          }]
        };
      } else if (errorText.includes('usage: git diff') || errorText.length > 200) {
        // Long error messages are usually usage text - return simple error
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'Git diff failed'
          }]
        };
      }
      
      return {
        isError: true,
        content: [{
          type: 'text',
          text: 'Git diff failed'
        }]
      };
    }
  }

  /**
   * Get diff statistics (lines added/removed/modified)
   */
  async getDiffStats(options: { 
    staged?: boolean; 
    file?: string; 
    commit1?: string; 
    commit2?: string; 
    cwd?: string; 
  } = {}): Promise<ToolResult> {
    try {
      const { staged = false, file, commit1, commit2, cwd } = options;
      
      const diffArgs = ['diff', '--stat'];
      
      if (staged) {
        diffArgs.push('--staged');
      }
      
      if (commit1 && commit2) {
        diffArgs.push(`${commit1}..${commit2}`);
      } else if (commit1) {
        diffArgs.push(commit1);
      }
      
      if (file) {
        diffArgs.push('--', file);
      }
      
      const result = await this.gitCommand(diffArgs, cwd);
      
      if (result.isError) {
        return result;
      }
      
      // Parse the stats
      const statsText = result.content[0]?.text || '';
      const lines = statsText.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        const header = staged ? 'Staged Changes Statistics:\n\n' : 
                      (commit1 && commit2) ? `Commit Comparison Statistics (${commit1}..${commit2}):\n\n` :
                      'Diff Statistics:\n\n';
        return {
          content: [{
            type: 'text',
            text: header + 'No changes found',
            _meta: {
              filesChanged: 0,
              insertions: 0,
              deletions: 0
            }
          }]
        };
      }
      
      // Extract summary line (usually the last line)
      const summaryLine = lines[lines.length - 1];
      const filesChanged = (summaryLine.match(/(\d+) files? changed/) || [])[1] || '0';
      const insertions = (summaryLine.match(/(\d+) insertions?\(\+\)/) || [])[1] || '0';
      const deletions = (summaryLine.match(/(\d+) deletions?\(\-\)/) || [])[1] || '0';
      
      // Add appropriate header
      let header = '';
      if (staged) {
        header = 'Staged Changes Statistics:\n\n';
      } else if (commit1 && commit2) {
        header = `Commit Comparison Statistics (${commit1}..${commit2}):\n\n`;
      } else {
        header = 'Diff Statistics:\n\n';
      }
      
      // Format the output with additional analysis
      let output = header;
      output += `Files changed: ${filesChanged}\n`;
      output += `Lines added: ${insertions}\n`;  
      output += `Lines removed: ${deletions}\n\n`;
      output += `Detailed Breakdown:\n${statsText}`;
      
      return {
        content: [{
          type: 'text',
          text: output,
          _meta: {
            filesChanged: parseInt(filesChanged),
            insertions: parseInt(insertions),
            deletions: parseInt(deletions),
            summary: summaryLine
          }
        }]
      };
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Diff stats failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Compare two commits with detailed analysis
   */
  async compareCommits(commit1: string, commit2: string, options: {
    filePattern?: string;
    format?: 'unified' | 'stat' | 'name-only';
    cwd?: string;
  } = {}): Promise<ToolResult> {
    try {
      const { filePattern, format = 'unified', cwd } = options;
      
      // Get the diff between commits
      const diffResult = await this.enhancedGitDiff({
        commit1,
        commit2,
        format,
        cwd
      });
      
      if (diffResult.isError) {
        // Check if it's an invalid commit reference error
        const errorText = diffResult.content[0]?.text || '';
        if (errorText.includes('unknown revision') || errorText.includes('ambiguous argument') || 
            errorText.includes('Git diff failed') || errorText.includes('Git error')) {
          return {
            isError: true,
            content: [{
              type: 'text',
              text: 'Failed to compare commits'
            }]
          };
        }
        return diffResult;
      }
      
      // Get additional commit info
      const commit1Info = await this.gitCommand(['show', '--no-patch', '--format=%H %s %an %ad', commit1], cwd);
      const commit2Info = await this.gitCommand(['show', '--no-patch', '--format=%H %s %an %ad', commit2], cwd);
      
      // Get stats
      const statsResult = await this.getDiffStats({ commit1, commit2, cwd });
      
      let output = `Commit Comparison: ${commit1} → ${commit2}\n`;
      
      if (!commit1Info.isError) {
        output += `From: ${commit1Info.content[0]?.text}\n`;
      }
      if (!commit2Info.isError) {
        output += `To: ${commit2Info.content[0]?.text}\n\n`;
      }
      
      if (!statsResult.isError && statsResult.content[0]?._meta) {
        const meta = statsResult.content[0]._meta as any;
        output += `Changes Summary:\n`;
        output += `- Files changed: ${meta.filesChanged}\n`;
        output += `- Lines added: ${meta.insertions}\n`;
        output += `- Lines removed: ${meta.deletions}\n\n`;
      }
      
      // Add format-specific header for the detailed changes section
      let detailsHeader = '';
      if (format === 'stat') {
        detailsHeader = 'Statistics Format:\n';
      } else if (filePattern) {
        detailsHeader = `File Pattern: ${filePattern}\n`;
      }
      
      output += detailsHeader;
      output += `Detailed Changes:\n${diffResult.content[0]?.text || 'No changes'}`;
      
      return {
        content: [{
          type: 'text',
          text: output,
          _meta: {
            commit1,
            commit2,
            stats: statsResult.content[0]?._meta
          }
        }]
      };
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to compare commits: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Enhanced preview changes with multiple format options
   */
  async previewChangesEnhanced(options: {
    format?: 'unified' | 'side-by-side' | 'stat' | 'word-diff';
    contextLines?: number;
    ignoreWhitespace?: boolean;
    filePattern?: string;
    cwd?: string;
  } = {}): Promise<ToolResult> {
    try {
      const {
        format = 'unified',
        contextLines = 3,
        ignoreWhitespace = false,
        filePattern,
        cwd
      } = options;
      
      const workingDir = cwd || this.workspaceService.getCurrentWorkspace();
      
      // Check if we're in a git repository first
      const gitCheckResult = await this.gitCommand(['rev-parse', '--git-dir'], workingDir);
      if (gitCheckResult.isError) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to preview changes: ${gitCheckResult.content[0]?.text || 'Not a git repository'}`
          }]
        };
      }
      
      let output = `Change Preview (${format} format):\n\n`;
      
      // Add format-specific headers and options
      if (format === 'side-by-side') {
        output += 'Side-by-side comparison:\n\n';
      } else if (ignoreWhitespace) {
        output += 'Ignoring whitespace changes:\n\n';
      } else if (filePattern) {
        output += `File Pattern: ${filePattern}\n\n`;
      }
      
      output += 'Enhanced Change Preview:\n\n';
      
      // Get unstaged changes
      const unstagedOptions: GitDiffOptions = {
        staged: false,
        format,
        contextLines,
        ignoreWhitespace,
        cwd: workingDir
      };
      
      // Get staged changes
      const stagedOptions: GitDiffOptions = {
        staged: true,
        format,
        contextLines,
        ignoreWhitespace,
        cwd: workingDir
      };
      
      // Apply file pattern filtering if specified
      if (filePattern) {
        // Get list of files matching pattern first
        const statusResult = await this.gitStatus({ cwd: workingDir });
        if (!statusResult.isError && statusResult.content[0]?.text) {
          const statusLines = statusResult.content[0].text.split('\n').filter(line => line.trim());
          const matchingFiles = statusLines
            .map(line => line.substring(2).trim()) // Remove git status prefix
            .filter(filename => {
              // Simple glob matching for *.ext pattern
              if (filePattern.startsWith('*.')) {
                const ext = filePattern.substring(2);
                return filename.endsWith(ext);
              }
              // For other patterns, use simple includes for now
              return filename.includes(filePattern.replace('*', ''));
            });
          
          // If we have matching files, process them individually
          if (matchingFiles.length > 0) {
            let unstagedChanges = '';
            let stagedChanges = '';
            
            for (const file of matchingFiles) {
              const unstagedFileResult = await this.enhancedGitDiff({
                ...unstagedOptions,
                file
              });
              
              const stagedFileResult = await this.enhancedGitDiff({
                ...stagedOptions,
                file
              });
              
              if (!unstagedFileResult.isError && unstagedFileResult.content[0]?.text?.trim() && 
                  !unstagedFileResult.content[0].text.includes('No changes found')) {
                unstagedChanges += unstagedFileResult.content[0].text + '\n';
              }
              
              if (!stagedFileResult.isError && stagedFileResult.content[0]?.text?.trim() && 
                  !stagedFileResult.content[0].text.includes('No changes found')) {
                stagedChanges += stagedFileResult.content[0].text + '\n';
              }
            }
            
            // Display filtered results
            if (stagedChanges) {
              output += 'Staged Changes:\n';
              output += stagedChanges;
              output += '\n';
            }
            
            if (unstagedChanges) {
              output += 'Unstaged Changes:\n';
              output += unstagedChanges;
              output += '\n';
            }
          } else {
            output += `No files matching pattern "${filePattern}" have changes.\n`;
          }
        }
      } else {
        // No file pattern filtering - get all changes
        const unstagedResult = await this.enhancedGitDiff(unstagedOptions);
        const stagedResult = await this.enhancedGitDiff(stagedOptions);
        
        // Display staged changes
        if (!stagedResult.isError && stagedResult.content[0]?.text?.trim() && 
            !stagedResult.content[0].text.includes('Command completed successfully') && 
            !stagedResult.content[0].text.includes('No changes found')) {
          output += 'Staged Changes:\n';
          output += stagedResult.content[0].text;
          output += '\n\n';
        }
        
        // Display unstaged changes  
        if (!unstagedResult.isError && unstagedResult.content[0]?.text?.trim() && 
            !unstagedResult.content[0].text.includes('Command completed successfully') &&
            !unstagedResult.content[0].text.includes('No changes found')) {
          output += 'Unstaged Changes:\n';
          output += unstagedResult.content[0].text;
          output += '\n\n';
        }
      }
      
      // Get stats for both
      const stagedStats = await this.getDiffStats({ staged: true, cwd: workingDir });
      const unstagedStats = await this.getDiffStats({ staged: false, cwd: workingDir });
      
      output += '=== SUMMARY ===\n';
      if (!stagedStats.isError && stagedStats.content[0]?._meta) {
        const meta = stagedStats.content[0]._meta as any;
        if (meta.filesChanged > 0) {
          output += `Staged: ${meta.filesChanged} files, +${meta.insertions}/-${meta.deletions} lines\n`;
        }
      }
      
      if (!unstagedStats.isError && unstagedStats.content[0]?._meta) {
        const meta = unstagedStats.content[0]._meta as any;
        if (meta.filesChanged > 0) {
          output += `Unstaged: ${meta.filesChanged} files, +${meta.insertions}/-${meta.deletions} lines\n`;
        }
      }
      
      if (!output.includes('STAGED CHANGES') && !output.includes('UNSTAGED CHANGES')) {
        output += 'No changes to preview';
      }
      
      return {
        content: [{
          type: 'text',
          text: output,
          _meta: {
            format,
            stagedStats: stagedStats.content[0]?._meta,
            unstagedStats: unstagedStats.content[0]?._meta
          }
        }]
      };
      
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Enhanced preview failed: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}
