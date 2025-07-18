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

export class GitService {
  private workspaceService: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
  }

  /**
   * Execute a git command
   */
  async gitCommand(args: string[], cwd?: string): Promise<ToolResult> {
    const command = `git ${args.join(' ')}`;
    const options = {
      cwd: cwd ? this.workspaceService.resolvePath(cwd) : this.workspaceService.getCurrentWorkspace()
    };
    
    try {
      const { stdout, stderr } = await execAsync(command, options);
      return {
        content: [{
          type: 'text',
          text: stdout || stderr || 'Command completed successfully',
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Git error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
}
