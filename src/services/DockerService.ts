/**
 * Docker service for comprehensive container management and operations
 * Provides robust Docker support with error handling, validation, and streaming
 */
import { spawn } from 'child_process';
import { ValidationUtils } from '../utils.js';
import { ToolResult } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface DockerBuildArgs {
  context?: string;
  dockerfile?: string;
  tag?: string;
  build_args?: Record<string, string>;
  target?: string;
  no_cache?: boolean;
  pull?: boolean;
  quiet?: boolean;
  squash?: boolean;
  platform?: string;
  progress?: 'auto' | 'plain' | 'tty';
  secret?: string[];
  ssh?: string;
  network?: string;
}

export interface DockerRunArgs {
  image: string;
  name?: string;
  command?: string;
  args?: string[];
  ports?: string[];
  volumes?: string[];
  env?: Record<string, string>;
  detach?: boolean;
  remove?: boolean;
  interactive?: boolean;
  tty?: boolean;
  network?: string;
  working_dir?: string;
  user?: string;
  memory?: string;
  cpus?: string;
  restart?: string;
  privileged?: boolean;
  read_only?: boolean;
  security_opt?: string[];
  tmpfs?: string[];
  ulimit?: string[];
  cap_add?: string[];
  cap_drop?: string[];
  device?: string[];
  entrypoint?: string;
  hostname?: string;
  init?: boolean;
  label?: Record<string, string>;
  log_driver?: string;
  log_opt?: Record<string, string>;
  mac_address?: string;
  shm_size?: string;
  stop_signal?: string;
  stop_timeout?: number;
}

export interface DockerComposeArgs {
  action: 'up' | 'down' | 'build' | 'logs' | 'ps' | 'exec' | 'restart' | 'stop' | 'start' | 'pull' | 'config' | 'kill' | 'pause' | 'unpause' | 'top';
  service?: string;
  file?: string;
  detach?: boolean;
  build?: boolean;
  force_recreate?: boolean;
  remove_orphans?: boolean;
  follow?: boolean;
  tail?: number;
  command?: string;
  scale?: Record<string, number>;
  profiles?: string[];
  env_file?: string;
  project_name?: string;
  timeout?: number;
  parallel?: number;
  no_deps?: boolean;
  abort_on_container_exit?: boolean;
  remove_volumes?: boolean;
}

export interface DockerImageArgs {
  action: 'list' | 'remove' | 'pull' | 'push' | 'tag' | 'inspect' | 'build' | 'prune' | 'history' | 'save' | 'load' | 'import';
  image?: string;
  tag?: string;
  repository?: string;
  file?: string;
  filter?: string;
  all?: boolean;
  force?: boolean;
  no_prune?: boolean;
  dangling?: boolean;
  until?: string;
}

export interface DockerContainerArgs {
  action: 'list' | 'start' | 'stop' | 'restart' | 'remove' | 'inspect' | 'logs' | 'exec' | 'stats' | 'kill' | 'pause' | 'unpause' | 'attach' | 'cp' | 'export' | 'port' | 'rename' | 'update' | 'wait' | 'prune';
  container?: string;
  command?: string;
  interactive?: boolean;
  tty?: boolean;
  user?: string;
  workdir?: string;
  env?: string[];
  follow?: boolean;
  tail?: number;
  since?: string;
  until?: string;
  timestamps?: boolean;
  details?: boolean;
  all?: boolean;
  filter?: string;
  force?: boolean;
  volumes?: boolean;
  signal?: string;
  time?: number;
  no_stream?: boolean;
  source?: string;
  destination?: string;
  archive?: boolean;
  new_name?: string;
  memory?: string;
  cpus?: string;
  restart?: string;
}

export interface DockerNetworkArgs {
  action: 'list' | 'create' | 'remove' | 'inspect' | 'connect' | 'disconnect' | 'prune';
  network?: string;
  container?: string;
  driver?: string;
  gateway?: string;
  subnet?: string;
  ip_range?: string;
  aux_address?: Record<string, string>;
  opt?: Record<string, string>;
  label?: Record<string, string>;
  internal?: boolean;
  attachable?: boolean;
  ingress?: boolean;
  ipv6?: boolean;
  alias?: string[];
  ip?: string;
  ip6?: string;
  link?: string[];
  link_local_ip?: string[];
  force?: boolean;
  filter?: string;
}

export interface DockerVolumeArgs {
  action: 'list' | 'create' | 'remove' | 'inspect' | 'prune';
  volume?: string;
  driver?: string;
  label?: Record<string, string>;
  opt?: Record<string, string>;
  force?: boolean;
  filter?: string;
  all?: boolean;
}

export interface DockerSystemArgs {
  action: 'info' | 'version' | 'events' | 'df' | 'prune';
  all?: boolean;
  volumes?: boolean;
  filter?: string;
  force?: boolean;
  since?: string;
  until?: string;
  format?: string;
}

export class DockerService {
  private workspaceService: WorkspaceService;
  private defaultTimeout: number = 60000; // 1 minute default
  private buildTimeout: number = 600000; // 10 minutes for builds
  private pullTimeout: number = 300000; // 5 minutes for pulls
  private runningContainers: Map<string, any> = new Map();

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
  }

  /**
   * Get current workspace path
   */
  private getCurrentWorkspace(): string {
    return this.workspaceService.getCurrentWorkspace();
  }

  /**
   * Quote path if it contains spaces
   */
  private quotePath(filePath: string): string {
    return filePath.includes(' ') ? `"${filePath}"` : filePath;
  }

  /**
   * Check if Docker is available
   */
  async checkDockerAvailability(): Promise<ToolResult> {
    try {
      const result = await this.executeDockerCommand('docker --version', {}, 10000);
      const dockerInfo = await this.executeDockerCommand('docker info --format "{{json .}}"', {}, 15000);
      
      return {
        content: [{
          type: 'text',
          text: `Docker is available:\n${result.content[0].text}\n\nDocker Info:\n${dockerInfo.content[0].text}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Docker is not available: ${error.message}\nPlease install Docker and ensure it's running.`);
    }
  }

  /**
   * Execute Docker command with streaming support
   */
  private async executeDockerCommand(
    command: string, 
    options: any = {}, 
    timeout: number = this.defaultTimeout
  ): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], {
        shell: true,
        cwd: options.cwd || this.getCurrentWorkspace(),
        env: options.env || process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            child.kill('SIGTERM');
            setTimeout(() => {
              if (!child.killed) {
                child.kill('SIGKILL');
              }
            }, 5000);
            reject(new Error(`Docker command timed out after ${timeout}ms: ${command}`));
          }
        }, timeout);
      }

      // Capture output with size limits
      child.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (stdout.length > 2 * 1024 * 1024) { // 2MB limit
          stdout = stdout.slice(-1024 * 1024) + '\n...[output truncated]...';
        }
      });

      child.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (stderr.length > 1024 * 1024) { // 1MB limit
          stderr = stderr.slice(-512 * 1024) + '\n...[error output truncated]...';
        }
      });

      child.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error(`Failed to execute Docker command: ${error.message}`));
        }
      });

      child.on('exit', (code, signal) => {
        if (!isResolved) {
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          
          if (code === 0 || (code === null && signal === 'SIGTERM')) {
            resolve({
              content: [{
                type: 'text',
                text: `${stdout}${stderr ? `\nWarnings/Errors:\n${stderr}` : ''}`.trim(),
              }],
            });
          } else {
            const errorMsg = stderr || stdout || `Process exited with code ${code}`;
            reject(new Error(`Docker command failed: ${command}\n${errorMsg}`));
          }
        }
      });
    });
  }

  /**
   * Build Docker image
   */
  async buildImage(args: DockerBuildArgs): Promise<ToolResult> {
    const { 
      context = '.', 
      dockerfile, 
      tag, 
      build_args, 
      target, 
      no_cache, 
      pull, 
      quiet,
      squash,
      platform,
      progress = 'auto',
      secret,
      ssh,
      network
    } = args;

    // Validate context exists
    const contextPath = this.workspaceService.resolvePath(context);
    try {
      await fs.access(contextPath);
    } catch {
      throw new Error(`Build context not found: ${contextPath}`);
    }

    let command = `docker build ${this.quotePath(contextPath)}`;
    
    if (dockerfile) command += ` -f ${this.quotePath(dockerfile)}`;
    if (tag) command += ` -t ${tag}`;
    if (target) command += ` --target ${target}`;
    if (no_cache) command += ' --no-cache';
    if (pull) command += ' --pull';
    if (quiet) command += ' --quiet';
    if (squash) command += ' --squash';
    if (platform) command += ` --platform ${platform}`;
    if (progress) command += ` --progress ${progress}`;
    if (network) command += ` --network ${network}`;
    
    if (build_args) {
      for (const [key, value] of Object.entries(build_args)) {
        command += ` --build-arg ${key}=${value}`;
      }
    }
    
    if (secret) {
      secret.forEach(s => command += ` --secret ${s}`);
    }
    
    if (ssh) command += ` --ssh ${ssh}`;

    try {
      return await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() }, this.buildTimeout);
    } catch (error: any) {
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  /**
   * Run Docker container
   */
  async runContainer(args: DockerRunArgs): Promise<ToolResult> {
    const { 
      image, 
      name, 
      command: cmd, 
      args: cmdArgs = [], 
      ports = [], 
      volumes = [], 
      env, 
      detach, 
      remove, 
      interactive, 
      tty, 
      network, 
      working_dir, 
      user,
      memory,
      cpus,
      restart,
      privileged,
      read_only,
      security_opt = [],
      tmpfs = [],
      ulimit = [],
      cap_add = [],
      cap_drop = [],
      device = [],
      entrypoint,
      hostname,
      init,
      label,
      log_driver,
      log_opt,
      mac_address,
      shm_size,
      stop_signal,
      stop_timeout
    } = args;

    ValidationUtils.validateRequired({ image }, ['image']);

    let command = 'docker run';
    
    if (detach) command += ' -d';
    if (remove) command += ' --rm';
    if (interactive) command += ' -i';
    if (tty) command += ' -t';
    if (name) command += ` --name ${name}`;
    if (network) command += ` --network ${network}`;
    if (working_dir) command += ` -w ${working_dir}`;
    if (user) command += ` -u ${user}`;
    if (memory) command += ` -m ${memory}`;
    if (cpus) command += ` --cpus ${cpus}`;
    if (restart) command += ` --restart ${restart}`;
    if (privileged) command += ' --privileged';
    if (read_only) command += ' --read-only';
    if (entrypoint) command += ` --entrypoint ${entrypoint}`;
    if (hostname) command += ` --hostname ${hostname}`;
    if (init) command += ' --init';
    if (mac_address) command += ` --mac-address ${mac_address}`;
    if (shm_size) command += ` --shm-size ${shm_size}`;
    if (stop_signal) command += ` --stop-signal ${stop_signal}`;
    if (stop_timeout) command += ` --stop-timeout ${stop_timeout}`;
    if (log_driver) command += ` --log-driver ${log_driver}`;

    // Add ports
    ports.forEach(port => command += ` -p ${port}`);
    
    // Add volumes
    volumes.forEach(volume => command += ` -v ${volume}`);
    
    // Add environment variables
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        command += ` -e ${key}=${value}`;
      }
    }

    // Add security options
    security_opt.forEach(opt => command += ` --security-opt ${opt}`);
    
    // Add tmpfs mounts
    tmpfs.forEach(mount => command += ` --tmpfs ${mount}`);
    
    // Add ulimits
    ulimit.forEach(limit => command += ` --ulimit ${limit}`);
    
    // Add capabilities
    cap_add.forEach(cap => command += ` --cap-add ${cap}`);
    cap_drop.forEach(cap => command += ` --cap-drop ${cap}`);
    
    // Add devices
    device.forEach(dev => command += ` --device ${dev}`);

    // Add labels
    if (label) {
      for (const [key, value] of Object.entries(label)) {
        command += ` --label ${key}=${value}`;
      }
    }

    // Add log options
    if (log_opt) {
      for (const [key, value] of Object.entries(log_opt)) {
        command += ` --log-opt ${key}=${value}`;
      }
    }

    command += ` ${image}`;
    
    if (cmd) command += ` ${cmd}`;
    if (cmdArgs.length > 0) command += ` ${cmdArgs.join(' ')}`;

    try {
      const result = await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() });
      
      // Track running containers if detached
      if (detach && name) {
        this.runningContainers.set(name, { image, started: new Date() });
      }
      
      return result;
    } catch (error: any) {
      throw new Error(`Docker run failed: ${error.message}`);
    }
  }

  /**
   * Manage Docker Compose
   */
  async dockerCompose(args: DockerComposeArgs): Promise<ToolResult> {
    const { 
      action, 
      service, 
      file, 
      detach, 
      build, 
      force_recreate, 
      remove_orphans, 
      follow, 
      tail, 
      command: cmd,
      scale,
      profiles = [],
      env_file,
      project_name,
      timeout,
      parallel,
      no_deps,
      abort_on_container_exit,
      remove_volumes
    } = args;

    ValidationUtils.validateRequired({ action }, ['action']);

    // Check if docker-compose.yml exists
    const composeFile = file || 'docker-compose.yml';
    const composePath = this.workspaceService.resolvePath(composeFile);
    
    try {
      await fs.access(composePath);
    } catch {
      if (!file) {
        throw new Error(`Docker Compose file not found: ${composePath}. Please create a docker-compose.yml file or specify a custom file.`);
      }
    }

    let command = 'docker-compose';
    
    if (file) command += ` -f ${this.quotePath(file)}`;
    if (project_name) command += ` -p ${project_name}`;
    if (env_file) command += ` --env-file ${env_file}`;
    
    profiles.forEach(profile => command += ` --profile ${profile}`);

    command += ` ${action}`;

    // Add service-specific arguments
    if (service) command += ` ${service}`;

    // Action-specific options
    switch (action) {
      case 'up':
        if (detach) command += ' -d';
        if (build) command += ' --build';
        if (force_recreate) command += ' --force-recreate';
        if (remove_orphans) command += ' --remove-orphans';
        if (no_deps) command += ' --no-deps';
        if (abort_on_container_exit) command += ' --abort-on-container-exit';
        if (timeout) command += ` --timeout ${timeout}`;
        if (scale) {
          for (const [svc, count] of Object.entries(scale)) {
            command += ` --scale ${svc}=${count}`;
          }
        }
        break;
        
      case 'down':
        if (remove_orphans) command += ' --remove-orphans';
        if (remove_volumes) command += ' -v';
        if (timeout) command += ` --timeout ${timeout}`;
        break;
        
      case 'build':
        if (no_deps) command += ' --no-deps';
        if (parallel) command += ` --parallel ${parallel}`;
        break;
        
      case 'logs':
        if (follow) command += ' -f';
        if (tail) command += ` --tail ${tail}`;
        break;
        
      case 'exec':
        if (cmd) command += ` ${cmd}`;
        break;
    }

    try {
      const execTimeout = action === 'build' ? this.buildTimeout : 
                         action === 'up' ? this.buildTimeout :
                         this.defaultTimeout;
      
      return await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() }, execTimeout);
    } catch (error: any) {
      throw new Error(`Docker Compose ${action} failed: ${error.message}`);
    }
  }

  /**
   * Manage Docker images
   */
  async manageImages(args: DockerImageArgs): Promise<ToolResult> {
    const { action, image, tag, repository, file, filter, all, force, no_prune, dangling, until } = args;
    
    ValidationUtils.validateRequired({ action }, ['action']);

    let command = 'docker image';

    switch (action) {
      case 'list':
        command = 'docker images';
        if (all) command += ' -a';
        if (filter) command += ` --filter ${filter}`;
        if (dangling) command += ' --filter dangling=true';
        break;
        
      case 'remove':
        if (!image) throw new Error('Image name/ID is required for remove action');
        command = `docker rmi ${image}`;
        if (force) command += ' -f';
        if (no_prune) command += ' --no-prune';
        break;
        
      case 'pull':
        if (!image) throw new Error('Image name is required for pull action');
        command = `docker pull ${image}`;
        break;
        
      case 'push':
        if (!image) throw new Error('Image name is required for push action');
        command = `docker push ${image}`;
        break;
        
      case 'tag':
        if (!image || !tag) throw new Error('Both source image and target tag are required');
        command = `docker tag ${image} ${tag}`;
        break;
        
      case 'inspect':
        if (!image) throw new Error('Image name/ID is required for inspect action');
        command = `docker image inspect ${image}`;
        break;
        
      case 'prune':
        command = 'docker image prune';
        if (all) command += ' -a';
        if (force) command += ' -f';
        if (filter) command += ` --filter ${filter}`;
        if (until) command += ` --filter until=${until}`;
        break;
        
      case 'history':
        if (!image) throw new Error('Image name/ID is required for history action');
        command = `docker history ${image}`;
        break;
        
      case 'save':
        if (!image || !file) throw new Error('Image name and output file are required for save action');
        command = `docker save -o ${file} ${image}`;
        break;
        
      case 'load':
        if (!file) throw new Error('Input file is required for load action');
        command = `docker load -i ${file}`;
        break;
        
      case 'import':
        if (!file) throw new Error('Input file is required for import action');
        command = `docker import ${file}`;
        if (repository) command += ` ${repository}`;
        if (tag) command += `:${tag}`;
        break;
        
      default:
        throw new Error(`Unsupported image action: ${action}`);
    }

    try {
      const execTimeout = ['pull', 'push', 'save', 'load'].includes(action) ? this.pullTimeout : this.defaultTimeout;
      return await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() }, execTimeout);
    } catch (error: any) {
      throw new Error(`Docker image ${action} failed: ${error.message}`);
    }
  }

  /**
   * Manage Docker containers
   */
  async manageContainers(args: DockerContainerArgs): Promise<ToolResult> {
    const { 
      action, 
      container, 
      command: cmd, 
      interactive, 
      tty, 
      user, 
      workdir, 
      env = [], 
      follow, 
      tail, 
      since, 
      until, 
      timestamps, 
      details, 
      all, 
      filter, 
      force, 
      volumes, 
      signal, 
      time, 
      no_stream,
      source,
      destination,
      archive,
      new_name,
      memory,
      cpus,
      restart
    } = args;

    ValidationUtils.validateRequired({ action }, ['action']);

    let command = 'docker';

    switch (action) {
      case 'list':
        command = 'docker ps';
        if (all) command += ' -a';
        if (filter) command += ` --filter ${filter}`;
        break;
        
      case 'start':
        if (!container) throw new Error('Container name/ID is required for start action');
        command = `docker start ${container}`;
        break;
        
      case 'stop':
        if (!container) throw new Error('Container name/ID is required for stop action');
        command = `docker stop ${container}`;
        if (time) command += ` -t ${time}`;
        break;
        
      case 'restart':
        if (!container) throw new Error('Container name/ID is required for restart action');
        command = `docker restart ${container}`;
        if (time) command += ` -t ${time}`;
        break;
        
      case 'remove':
        if (!container) throw new Error('Container name/ID is required for remove action');
        command = `docker rm ${container}`;
        if (force) command += ' -f';
        if (volumes) command += ' -v';
        break;
        
      case 'inspect':
        if (!container) throw new Error('Container name/ID is required for inspect action');
        command = `docker inspect ${container}`;
        break;
        
      case 'logs':
        if (!container) throw new Error('Container name/ID is required for logs action');
        command = `docker logs ${container}`;
        if (follow) command += ' -f';
        if (tail) command += ` --tail ${tail}`;
        if (since) command += ` --since ${since}`;
        if (until) command += ` --until ${until}`;
        if (timestamps) command += ' -t';
        if (details) command += ' --details';
        break;
        
      case 'exec':
        if (!container || !cmd) throw new Error('Container name/ID and command are required for exec action');
        command = `docker exec`;
        if (interactive) command += ' -i';
        if (tty) command += ' -t';
        if (user) command += ` -u ${user}`;
        if (workdir) command += ` -w ${workdir}`;
        env.forEach(e => command += ` -e ${e}`);
        command += ` ${container} ${cmd}`;
        break;
        
      case 'stats':
        command = 'docker stats';
        if (container) command += ` ${container}`;
        if (all) command += ' -a';
        if (no_stream) command += ' --no-stream';
        break;
        
      case 'kill':
        if (!container) throw new Error('Container name/ID is required for kill action');
        command = `docker kill ${container}`;
        if (signal) command += ` -s ${signal}`;
        break;
        
      case 'pause':
        if (!container) throw new Error('Container name/ID is required for pause action');
        command = `docker pause ${container}`;
        break;
        
      case 'unpause':
        if (!container) throw new Error('Container name/ID is required for unpause action');
        command = `docker unpause ${container}`;
        break;
        
      case 'cp':
        if (!container || !source || !destination) {
          throw new Error('Container, source, and destination are required for cp action');
        }
        command = `docker cp ${source} ${container}:${destination}`;
        if (archive) command += ' -a';
        break;
        
      case 'export':
        if (!container) throw new Error('Container name/ID is required for export action');
        command = `docker export ${container}`;
        break;
        
      case 'rename':
        if (!container || !new_name) throw new Error('Container name/ID and new name are required for rename action');
        command = `docker rename ${container} ${new_name}`;
        break;
        
      case 'update':
        if (!container) throw new Error('Container name/ID is required for update action');
        command = `docker update ${container}`;
        if (memory) command += ` --memory ${memory}`;
        if (cpus) command += ` --cpus ${cpus}`;
        if (restart) command += ` --restart ${restart}`;
        break;
        
      case 'wait':
        if (!container) throw new Error('Container name/ID is required for wait action');
        command = `docker wait ${container}`;
        break;
        
      case 'prune':
        command = 'docker container prune';
        if (force) command += ' -f';
        if (filter) command += ` --filter ${filter}`;
        break;
        
      default:
        throw new Error(`Unsupported container action: ${action}`);
    }

    try {
      return await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() });
    } catch (error: any) {
      throw new Error(`Docker container ${action} failed: ${error.message}`);
    }
  }

  /**
   * Manage Docker networks
   */
  async manageNetworks(args: DockerNetworkArgs): Promise<ToolResult> {
    const { 
      action, 
      network, 
      container, 
      driver, 
      gateway, 
      subnet, 
      ip_range, 
      aux_address, 
      opt, 
      label, 
      internal, 
      attachable, 
      ingress, 
      ipv6, 
      alias = [], 
      ip, 
      ip6, 
      link = [], 
      link_local_ip = [], 
      force, 
      filter 
    } = args;

    ValidationUtils.validateRequired({ action }, ['action']);

    let command = 'docker network';

    switch (action) {
      case 'list':
        command = 'docker network ls';
        if (filter) command += ` --filter ${filter}`;
        break;
        
      case 'create':
        if (!network) throw new Error('Network name is required for create action');
        command = `docker network create ${network}`;
        if (driver) command += ` --driver ${driver}`;
        if (gateway) command += ` --gateway ${gateway}`;
        if (subnet) command += ` --subnet ${subnet}`;
        if (ip_range) command += ` --ip-range ${ip_range}`;
        if (internal) command += ' --internal';
        if (attachable) command += ' --attachable';
        if (ingress) command += ' --ingress';
        if (ipv6) command += ' --ipv6';
        
        if (aux_address) {
          for (const [key, value] of Object.entries(aux_address)) {
            command += ` --aux-address ${key}=${value}`;
          }
        }
        
        if (opt) {
          for (const [key, value] of Object.entries(opt)) {
            command += ` --opt ${key}=${value}`;
          }
        }
        
        if (label) {
          for (const [key, value] of Object.entries(label)) {
            command += ` --label ${key}=${value}`;
          }
        }
        break;
        
      case 'remove':
        if (!network) throw new Error('Network name/ID is required for remove action');
        command = `docker network rm ${network}`;
        break;
        
      case 'inspect':
        if (!network) throw new Error('Network name/ID is required for inspect action');
        command = `docker network inspect ${network}`;
        break;
        
      case 'connect':
        if (!network || !container) throw new Error('Network and container are required for connect action');
        command = `docker network connect`;
        alias.forEach(a => command += ` --alias ${a}`);
        if (ip) command += ` --ip ${ip}`;
        if (ip6) command += ` --ip6 ${ip6}`;
        link.forEach(l => command += ` --link ${l}`);
        link_local_ip.forEach(lip => command += ` --link-local-ip ${lip}`);
        command += ` ${network} ${container}`;
        break;
        
      case 'disconnect':
        if (!network || !container) throw new Error('Network and container are required for disconnect action');
        command = `docker network disconnect`;
        if (force) command += ' -f';
        command += ` ${network} ${container}`;
        break;
        
      case 'prune':
        command = 'docker network prune';
        if (force) command += ' -f';
        if (filter) command += ` --filter ${filter}`;
        break;
        
      default:
        throw new Error(`Unsupported network action: ${action}`);
    }

    try {
      return await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() });
    } catch (error: any) {
      throw new Error(`Docker network ${action} failed: ${error.message}`);
    }
  }

  /**
   * Manage Docker volumes
   */
  async manageVolumes(args: DockerVolumeArgs): Promise<ToolResult> {
    const { action, volume, driver, label, opt, force, filter, all } = args;

    ValidationUtils.validateRequired({ action }, ['action']);

    let command = 'docker volume';

    switch (action) {
      case 'list':
        command = 'docker volume ls';
        if (filter) command += ` --filter ${filter}`;
        break;
        
      case 'create':
        if (!volume) throw new Error('Volume name is required for create action');
        command = `docker volume create ${volume}`;
        if (driver) command += ` --driver ${driver}`;
        
        if (label) {
          for (const [key, value] of Object.entries(label)) {
            command += ` --label ${key}=${value}`;
          }
        }
        
        if (opt) {
          for (const [key, value] of Object.entries(opt)) {
            command += ` --opt ${key}=${value}`;
          }
        }
        break;
        
      case 'remove':
        if (!volume) throw new Error('Volume name is required for remove action');
        command = `docker volume rm ${volume}`;
        if (force) command += ' -f';
        break;
        
      case 'inspect':
        if (!volume) throw new Error('Volume name is required for inspect action');
        command = `docker volume inspect ${volume}`;
        break;
        
      case 'prune':
        command = 'docker volume prune';
        if (force) command += ' -f';
        if (filter) command += ` --filter ${filter}`;
        if (all) command += ' -a';
        break;
        
      default:
        throw new Error(`Unsupported volume action: ${action}`);
    }

    try {
      return await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() });
    } catch (error: any) {
      throw new Error(`Docker volume ${action} failed: ${error.message}`);
    }
  }

  /**
   * Docker system operations
   */
  async systemOperations(args: DockerSystemArgs): Promise<ToolResult> {
    const { action, all, volumes, filter, force, since, until, format } = args;

    ValidationUtils.validateRequired({ action }, ['action']);

    let command = 'docker system';

    switch (action) {
      case 'info':
        command = 'docker system info';
        if (format) command += ` --format ${format}`;
        break;
        
      case 'version':
        command = 'docker version';
        if (format) command += ` --format ${format}`;
        break;
        
      case 'events':
        command = 'docker system events';
        if (since) command += ` --since ${since}`;
        if (until) command += ` --until ${until}`;
        if (filter) command += ` --filter ${filter}`;
        break;
        
      case 'df':
        command = 'docker system df';
        break;
        
      case 'prune':
        command = 'docker system prune';
        if (all) command += ' -a';
        if (volumes) command += ' --volumes';
        if (force) command += ' -f';
        if (filter) command += ` --filter ${filter}`;
        break;
        
      default:
        throw new Error(`Unsupported system action: ${action}`);
    }

    try {
      return await this.executeDockerCommand(command, { cwd: this.getCurrentWorkspace() });
    } catch (error: any) {
      throw new Error(`Docker system ${action} failed: ${error.message}`);
    }
  }

  /**
   * Get running containers tracked by this service
   */
  getTrackedContainers(): Map<string, any> {
    return new Map(this.runningContainers);
  }

  /**
   * Clean up tracked containers
   */
  async cleanupTrackedContainers(): Promise<ToolResult> {
    const results: string[] = [];
    
    for (const [name, info] of this.runningContainers) {
      try {
        await this.manageContainers({ action: 'stop', container: name });
        await this.manageContainers({ action: 'remove', container: name, force: true });
        this.runningContainers.delete(name);
        results.push(`✅ Cleaned up container: ${name}`);
      } catch (error: any) {
        results.push(`❌ Failed to cleanup container ${name}: ${error.message}`);
      }
    }

    return {
      content: [{
        type: 'text',
        text: results.join('\n') || 'No tracked containers to clean up',
      }],
    };
  }

  /**
   * Generate Dockerfile template
   */
  async generateDockerfile(language: string, framework?: string): Promise<ToolResult> {
    let dockerfileContent = '';

    switch (language.toLowerCase()) {
      case 'node':
      case 'nodejs':
      case 'javascript':
      case 'typescript':
        dockerfileContent = this.generateNodeDockerfile(framework);
        break;
        
      case 'python':
        dockerfileContent = this.generatePythonDockerfile(framework);
        break;
        
      case 'java':
        dockerfileContent = this.generateJavaDockerfile(framework);
        break;
        
      case 'go':
        dockerfileContent = this.generateGoDockerfile();
        break;
        
      case 'rust':
        dockerfileContent = this.generateRustDockerfile();
        break;
        
      default:
        throw new Error(`Unsupported language for Dockerfile generation: ${language}`);
    }

    const dockerfilePath = path.join(this.getCurrentWorkspace(), 'Dockerfile');
    
    try {
      await fs.writeFile(dockerfilePath, dockerfileContent);
      return {
        content: [{
          type: 'text',
          text: `Dockerfile generated successfully at: ${dockerfilePath}\n\nContent:\n${dockerfileContent}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Failed to write Dockerfile: ${error.message}`);
    }
  }

  /**
   * Generate Docker Compose template
   */
  async generateDockerCompose(services: string[], includeDatabase = false): Promise<ToolResult> {
    const composeContent = this.generateDockerComposeContent(services, includeDatabase);
    const composePath = path.join(this.getCurrentWorkspace(), 'docker-compose.yml');
    
    try {
      await fs.writeFile(composePath, composeContent);
      return {
        content: [{
          type: 'text',
          text: `Docker Compose file generated successfully at: ${composePath}\n\nContent:\n${composeContent}`,
        }],
      };
    } catch (error: any) {
      throw new Error(`Failed to write Docker Compose file: ${error.message}`);
    }
  }

  /**
   * Generate Node.js Dockerfile
   */
  private generateNodeDockerfile(framework?: string): string {
    const baseImage = framework === 'alpine' ? 'node:18-alpine' : 'node:18';
    
    return `# Generated Node.js Dockerfile
FROM ${baseImage}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm if using it
RUN npm install -g pnpm

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm ci; fi

# Copy source code
COPY . .

# Build the application
RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; else npm run build; fi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD if [ -f pnpm-lock.yaml ]; then pnpm start; else npm start; fi
`;
  }

  /**
   * Generate Python Dockerfile
   */
  private generatePythonDockerfile(framework?: string): string {
    const baseImage = framework === 'alpine' ? 'python:3.11-alpine' : 'python:3.11-slim';
    
    return `# Generated Python Dockerfile
FROM ${baseImage}

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install system dependencies
${framework === 'alpine' ? 
  'RUN apk add --no-cache gcc musl-dev' : 
  'RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*'
}

# Copy requirements and install Python dependencies
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Copy source code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["python", "app.py"]
`;
  }

  /**
   * Generate Java Dockerfile
   */
  private generateJavaDockerfile(framework?: string): string {
    return `# Generated Java Dockerfile
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy build files
COPY target/*.jar app.jar

# Create non-root user
RUN addgroup --system appgroup && adduser --system --group appuser
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
`;
  }

  /**
   * Generate Go Dockerfile
   */
  private generateGoDockerfile(): string {
    return `# Generated Go Dockerfile
FROM golang:1.21-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

# Install ca-certificates
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application
CMD ["./main"]
`;
  }

  /**
   * Generate Rust Dockerfile
   */
  private generateRustDockerfile(): string {
    return `# Generated Rust Dockerfile
FROM rust:1.70 AS builder

# Set working directory
WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Create dummy source to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source code
COPY src ./src

# Build the application
RUN touch src/main.rs && cargo build --release

# Final stage
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/app /usr/local/bin/app

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["app"]
`;
  }

  /**
   * Generate Docker Compose content
   */
  private generateDockerComposeContent(services: string[], includeDatabase: boolean): string {
    let content = `version: '3.8'

services:
`;

    // Add main application services
    services.forEach(service => {
      content += `  ${service}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
    networks:
      - app-network
    restart: unless-stopped

`;
    });

    // Add database if requested
    if (includeDatabase) {
      content += `  db:
    image: postgres:15
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: apppass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network
    restart: unless-stopped

`;
    }

    content += `networks:
  app-network:
    driver: bridge

`;

    if (includeDatabase) {
      content += `volumes:
  postgres_data:
`;
    }

    return content;
  }

  // ==========================================
  // FOCUSED DOCKER TOOL HANDLERS - Better Token Efficiency
  // ==========================================

  /**
   * Start Docker Compose services (focused action)
   */
  async dockerComposeUp(args: {
    file?: string;
    services?: string[];
    detach?: boolean;
    build?: boolean;
    project_name?: string;
  }): Promise<ToolResult> {
    const composeArgs: DockerComposeArgs = {
      action: 'up',
      file: args.file,
      service: args.services?.[0], // Docker Compose handles multiple services in the command
      detach: args.detach,
      build: args.build,
      project_name: args.project_name
    };
    return this.dockerCompose(composeArgs);
  }

  /**
   * Stop and remove Docker Compose services (focused action)
   */
  async dockerComposeDown(args: {
    file?: string;
    volumes?: boolean;
    remove_orphans?: boolean;
    project_name?: string;
  }): Promise<ToolResult> {
    const composeArgs: DockerComposeArgs = {
      action: 'down',
      file: args.file,
      remove_volumes: args.volumes,
      remove_orphans: args.remove_orphans,
      project_name: args.project_name
    };
    return this.dockerCompose(composeArgs);
  }

  /**
   * View Docker Compose service logs (focused action)
   */
  async dockerComposeLogs(args: {
    file?: string;
    services?: string[];
    follow?: boolean;
    tail?: number;
    project_name?: string;
  }): Promise<ToolResult> {
    const composeArgs: DockerComposeArgs = {
      action: 'logs',
      file: args.file,
      service: args.services?.[0],
      follow: args.follow,
      tail: args.tail,
      project_name: args.project_name
    };
    return this.dockerCompose(composeArgs);
  }

  /**
   * Restart Docker Compose services (focused action)
   */
  async dockerComposeRestart(args: {
    file?: string;
    services?: string[];
    project_name?: string;
  }): Promise<ToolResult> {
    const composeArgs: DockerComposeArgs = {
      action: 'restart',
      file: args.file,
      service: args.services?.[0],
      project_name: args.project_name
    };
    return this.dockerCompose(composeArgs);
  }

  /**
   * Start a Docker container (focused action)
   */
  async dockerContainerStart(args: { container: string }): Promise<ToolResult> {
    const containerArgs: DockerContainerArgs = {
      action: 'start',
      container: args.container
    };
    return this.manageContainers(containerArgs);
  }

  /**
   * Stop a Docker container (focused action)
   */
  async dockerContainerStop(args: { container: string; timeout?: number }): Promise<ToolResult> {
    const containerArgs: DockerContainerArgs = {
      action: 'stop',
      container: args.container,
      time: args.timeout
    };
    return this.manageContainers(containerArgs);
  }

  /**
   * Restart a Docker container (focused action)
   */
  async dockerContainerRestart(args: { container: string; timeout?: number }): Promise<ToolResult> {
    const containerArgs: DockerContainerArgs = {
      action: 'restart',
      container: args.container,
      time: args.timeout
    };
    return this.manageContainers(containerArgs);
  }

  /**
   * Remove a Docker container (focused action)
   */
  async dockerContainerRemove(args: { 
    container: string; 
    force?: boolean; 
    volumes?: boolean 
  }): Promise<ToolResult> {
    const containerArgs: DockerContainerArgs = {
      action: 'remove',
      container: args.container,
      force: args.force,
      volumes: args.volumes
    };
    return this.manageContainers(containerArgs);
  }

  /**
   * Get Docker container logs (focused action)
   */
  async dockerContainerLogs(args: {
    container: string;
    follow?: boolean;
    tail?: number;
    since?: string;
  }): Promise<ToolResult> {
    const containerArgs: DockerContainerArgs = {
      action: 'logs',
      container: args.container,
      follow: args.follow,
      tail: args.tail,
      since: args.since
    };
    return this.manageContainers(containerArgs);
  }

  /**
   * Execute command in running Docker container (focused action)
   */
  async dockerContainerExec(args: {
    container: string;
    command: string;
    interactive?: boolean;
    tty?: boolean;
  }): Promise<ToolResult> {
    const containerArgs: DockerContainerArgs = {
      action: 'exec',
      container: args.container,
      command: args.command,
      interactive: args.interactive,
      tty: args.tty
    };
    return this.manageContainers(containerArgs);
  }

  /**
   * Pull a Docker image from registry (focused action)
   */
  async dockerImagePull(args: { image: string; all_tags?: boolean }): Promise<ToolResult> {
    const imageArgs: DockerImageArgs = {
      action: 'pull',
      image: args.image,
      all: args.all_tags
    };
    return this.manageImages(imageArgs);
  }

  /**
   * Push a Docker image to registry (focused action)
   */
  async dockerImagePush(args: { image: string; all_tags?: boolean }): Promise<ToolResult> {
    const imageArgs: DockerImageArgs = {
      action: 'push',
      image: args.image,
      all: args.all_tags
    };
    return this.manageImages(imageArgs);
  }

  /**
   * Remove Docker image(s) (focused action)
   */
  async dockerImageRemove(args: {
    image: string;
    force?: boolean;
    no_prune?: boolean;
  }): Promise<ToolResult> {
    const imageArgs: DockerImageArgs = {
      action: 'remove',
      image: args.image,
      force: args.force,
      no_prune: args.no_prune
    };
    return this.manageImages(imageArgs);
  }

  /**
   * Build Docker image from Dockerfile (focused action)
   */
  async dockerImageBuild(args: {
    context?: string;
    dockerfile?: string;
    tag?: string;
    build_args?: Record<string, string>;
    no_cache?: boolean;
  }): Promise<ToolResult> {
    const buildArgs: DockerBuildArgs = {
      context: args.context,
      dockerfile: args.dockerfile,
      tag: args.tag,
      build_args: args.build_args,
      no_cache: args.no_cache
    };
    return this.buildImage(buildArgs);
  }

  /**
   * Tag a Docker image (focused action)
   */
  async dockerImageTag(args: { source: string; target: string }): Promise<ToolResult> {
    const imageArgs: DockerImageArgs = {
      action: 'tag',
      image: args.source,
      tag: args.target
    };
    return this.manageImages(imageArgs);
  }
}
