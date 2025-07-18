# Contributing to VS Code Agent MCP Server

Thank you for your interest in contributing to the VS Code Agent MCP Server! This document provides comprehensive guidelines for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Code Style and Standards](#code-style-and-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Release Process](#release-process)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- **Be respectful** and inclusive in all interactions
- **Be collaborative** and helpful to other contributors
- **Be constructive** in feedback and discussions
- **Focus on the issue**, not the person
- **Welcome newcomers** and help them get started

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18.0+ | Runtime environment |
| **pnpm** | 8.0+ | Package management |
| **Git** | 2.0+ | Version control |
| **TypeScript** | 5.0+ | Development |
| **Docker** | 20.10+ | Container testing (optional) |
| **VS Code** | Latest | Recommended editor |

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/vscode-mcp.git
   cd vscode-mcp
   ```

2. **Set Up Remote**
   ```bash
   # Add upstream remote
   git remote add upstream https://github.com/agentics-ai/vscode-mcp.git
   
   # Verify remotes
   git remote -v
   ```

3. **Install Dependencies**
   ```bash
   # Install all dependencies
   pnpm install
   
   # Build the project
   pnpm run build
   ```

4. **Verify Setup**
   ```bash
   # Run all tests
   pnpm test
   
   # Check linting
   pnpm run lint
   
   # Verify build
   node dist/src/index.js --version
   ```

## 🏗️ Development Setup

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer"
  ]
}
```

### Environment Configuration

Create a `.env.local` file for development:

```bash
# Development environment variables
NODE_ENV=development
LOG_LEVEL=debug
WORKSPACE_PATH=/path/to/your/test/workspace
```

### Development Commands

```bash
# Start development mode with auto-rebuild
pnpm run dev

# Run tests in watch mode
pnpm run test:watch

# Generate test coverage
pnpm run test:coverage

# Lint and fix code
pnpm run lint:fix

# Type checking
pnpm run type-check
```

## 🏛️ Project Architecture

### Service-Oriented Architecture

The project follows a clean service-oriented architecture:

```
src/
├── index.ts                 # Main server entry point
├── constants.ts             # Application constants
├── toolDefinitions.ts       # MCP tool definitions
├── types.ts                 # TypeScript types
├── utils.ts                 # Utility functions
└── services/                # Core services
    ├── AnalysisService.ts       # Code analysis
    ├── CodeExecutionService.ts  # Code execution
    ├── DockerService.ts         # Docker operations
    ├── FileService.ts           # File operations
    ├── GitService.ts            # Git operations
    ├── ProcessService.ts        # Process management
    ├── ProjectService.ts        # Project scaffolding
    ├── VSCodeDetectionService.ts # Workspace detection
    └── WorkspaceService.ts      # Workspace management
```

### Key Principles

1. **Single Responsibility**: Each service handles one domain
2. **Dependency Injection**: Services depend on abstractions
3. **Error Handling**: Comprehensive error handling throughout
4. **Type Safety**: Strict TypeScript with full type coverage
5. **Testability**: All services are unit tested

### Adding New Services

When adding a new service:

1. **Create the service file** in `src/services/`
2. **Define interfaces** for all public methods
3. **Add comprehensive tests** in `tests/services/`
4. **Export from index.ts** in the services directory
5. **Register tools** in `toolDefinitions.ts`
6. **Update main server** in `index.ts`

## 🔄 Development Workflow

### Branch Strategy

We use **Git Flow** with these branch types:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes for production
- `release/*` - Release preparation

### Feature Development

1. **Create Feature Branch**
   ```bash
   # Update main branch
   git checkout main
   git pull upstream main
   
   # Create feature branch
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Test**
   ```bash
   # Make your changes
   # Add tests for new functionality
   
   # Run tests frequently
   pnpm test
   
   # Check linting
   pnpm run lint
   ```

3. **Commit Changes**
   ```bash
   # Stage changes
   git add .
   
   # Commit with conventional commit format
   git commit -m "feat: add new Docker network management tools"
   ```

4. **Push and Create PR**
   ```bash
   # Push feature branch
   git push origin feature/your-feature-name
   
   # Create pull request on GitHub
   ```

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build/tooling changes

**Examples:**
```bash
feat(docker): add container networking support
fix(git): resolve merge conflict in branch operations
docs: update API documentation for file service
test: add integration tests for workspace detection
```

## 🎨 Code Style and Standards

### TypeScript Guidelines

1. **Strict Mode**: All TypeScript strict flags enabled
2. **Type Annotations**: Explicit types for public APIs
3. **Interface Design**: Prefer interfaces over types
4. **Error Handling**: Use proper Error types
5. **Async/Await**: Prefer async/await over Promises

### Code Style Rules

```typescript
// ✅ Good: Explicit interface with proper typing
interface GitCommitArgs {
  message: string;
  files?: string[];
  amend?: boolean;
}

// ✅ Good: Proper error handling
async function commitChanges(args: GitCommitArgs): Promise<ToolResult> {
  try {
    ValidationUtils.validateRequired(args, ['message']);
    const result = await this.gitCommand(['commit', '-m', args.message]);
    return result;
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Commit failed: ${error.message}`);
  }
}

// ❌ Bad: Any type usage
function doSomething(data: any): any {
  return data.whatever;
}

// ❌ Bad: Missing error handling
async function unsafeOperation(): Promise<string> {
  return await riskyAsyncCall();
}
```

### File Organization

1. **Import Order**:
   ```typescript
   // Node.js built-ins
   import { spawn } from 'child_process';
   import * as path from 'path';
   
   // Third-party packages
   import { ValidationUtils } from '../utils.js';
   
   // Internal modules
   import { ToolResult } from '../types.js';
   import { WorkspaceService } from './WorkspaceService.js';
   ```

2. **Export Patterns**:
   ```typescript
   // Export interfaces and types
   export interface ServiceArgs { }
   export type ServiceResult = { };
   
   // Export main class as default
   export class MyService { }
   ```

### Documentation Standards

1. **Class Documentation**:
   ```typescript
   /**
    * Docker service for comprehensive container management
    * 
    * Provides robust Docker support with:
    * - Container lifecycle management
    * - Image building and registry operations
    * - Network and volume management
    * - Docker Compose orchestration
    */
   export class DockerService {
   ```

2. **Method Documentation**:
   ```typescript
   /**
    * Build a Docker image from a Dockerfile
    * 
    * @param args Build configuration including context, tag, and options
    * @returns Promise resolving to build result with image ID
    * @throws McpError if build fails or Docker is unavailable
    */
   async buildImage(args: DockerBuildArgs): Promise<ToolResult> {
   ```

## 🧪 Testing Guidelines

### Test Structure

We maintain comprehensive test coverage:

```
tests/
├── services/                    # Unit tests for services
│   ├── DockerService.test.ts
│   ├── GitService.test.ts
│   └── ...
├── integration.test.ts          # Integration tests
├── e2e.test.ts                 # End-to-end tests
└── VSCodeAgentServer.test.ts   # Server tests
```

### Writing Unit Tests

1. **Test Structure**:
   ```typescript
   describe('DockerService', () => {
     let dockerService: DockerService;
     let mockWorkspaceService: jest.Mocked<WorkspaceService>;
   
     beforeEach(() => {
       mockWorkspaceService = createMockWorkspaceService();
       dockerService = new DockerService(mockWorkspaceService);
     });
   
     describe('buildImage', () => {
       it('should build image with valid arguments', async () => {
         // Test implementation
       });
   
       it('should throw error with invalid arguments', async () => {
         // Test implementation
       });
     });
   });
   ```

2. **Test Coverage Requirements**:
   - **Unit Tests**: Minimum 90% coverage
   - **Integration Tests**: All service interactions
   - **E2E Tests**: Complete MCP workflows

3. **Test Commands**:
   ```bash
   # Run all tests
   pnpm test
   
   # Run specific test file
   pnpm test DockerService.test.ts
   
   # Run tests in watch mode
   pnpm run test:watch
   
   # Generate coverage report
   pnpm run test:coverage
   ```

### Mock Guidelines

1. **Service Mocking**:
   ```typescript
   const mockWorkspaceService = {
     getCurrentWorkspace: jest.fn().mockReturnValue('/test/workspace'),
     resolvePath: jest.fn().mockImplementation((path) => path),
   } as jest.Mocked<WorkspaceService>;
   ```

2. **External Dependencies**:
   ```typescript
   jest.mock('child_process', () => ({
     spawn: jest.fn().mockImplementation(() => mockChildProcess),
   }));
   ```

## 📚 Documentation

### Code Documentation

1. **JSDoc Comments**: All public methods must have JSDoc
2. **Type Annotations**: Explicit types for all public APIs
3. **README Updates**: Update README.md for new features
4. **Tool Definitions**: Document new tools in `toolDefinitions.ts`

### Documentation Standards

1. **API Documentation**:
   ```typescript
   /**
    * Execute a git command with proper error handling
    * 
    * @param args Command arguments array
    * @param cwd Working directory (optional)
    * @returns Promise with command output
    * @throws McpError for git command failures
    * 
    * @example
    * ```typescript
    * const result = await gitCommand(['status', '--porcelain']);
    * ```
    */
   ```

2. **Tool Documentation**:
   ```typescript
   {
     name: 'docker_build',
     description: 'Build a Docker image from a Dockerfile with comprehensive options',
     inputSchema: {
       type: 'object',
       properties: {
         context: {
           type: 'string',
           description: 'Build context directory path (default: current directory)'
         },
         // ... other properties
       }
     }
   }
   ```

## 🔄 Pull Request Process

### Before Submitting

1. **Code Quality Checklist**:
   - [ ] All tests pass (`pnpm test`)
   - [ ] Code follows style guidelines (`pnpm run lint`)
   - [ ] TypeScript compiles without errors (`pnpm run type-check`)
   - [ ] Documentation is updated
   - [ ] Test coverage is maintained

2. **Functional Testing**:
   - [ ] Feature works as expected
   - [ ] Error cases are handled
   - [ ] Integration with existing features verified

### PR Template

Use this template for pull requests:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How to Test
1. Step 1
2. Step 2
3. Step 3

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes.
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Reviewers will test functionality
4. **Documentation**: Verify documentation is complete

## 🐛 Issue Reporting

### Bug Reports

Use this template for bug reports:

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. macOS 12.0]
- Node.js version: [e.g. 18.17.0]
- Package manager: [e.g. pnpm 8.6.0]
- VS Code version: [e.g. 1.80.0]

**Additional Context**
Add any other context about the problem here.
```

### Security Issues

For security vulnerabilities:

1. **Do NOT** create a public issue
2. **Use GitHub Security Advisories** to report security vulnerabilities privately
3. **Include** detailed reproduction steps
4. **Wait** for confirmation before public disclosure

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Use Cases**
Describe specific use cases for this feature.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Implementation Discussion

1. **Create Issue**: Start with a feature request issue
2. **Discussion**: Community and maintainer discussion
3. **Design**: Technical design if approved
4. **Implementation**: Development work begins
5. **Review**: Code review and testing

## 🚀 Release Process

### Version Management

We follow [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Breaking changes
- **Minor** (1.X.0): New features, backward compatible
- **Patch** (1.0.X): Bug fixes, backward compatible

### Release Steps

1. **Prepare Release**:
   ```bash
   # Update version
   pnpm version minor
   
   # Update CHANGELOG.md
   # Update README.md if needed
   ```

2. **Testing**:
   ```bash
   # Full test suite
   pnpm test
   
   # Integration testing
   pnpm run test:integration
   
   # Build verification
   pnpm run build
   ```

3. **Create Release**:
   ```bash
   # Push changes and tags
   git push origin main --tags
   
   # Create GitHub release
   # Publish to npm (if applicable)
   ```

## 🙋‍♀️ Getting Help

### Community Support

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Discord/Slack**: For real-time chat (if available)

### Maintainer Contact

- **Technical Questions**: Create an issue with detailed context
- **Collaboration**: Reach out via GitHub discussions
- **Security**: Use private security reporting channels

---

Thank you for contributing to the VS Code Agent MCP Server! Your contributions help make this tool better for the entire AI development community. 🚀
