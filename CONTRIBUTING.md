# Contributing to Code MCP Server

Thank you for your interest in contributing to the Code MCP Server! We welcome contributions from the community and are excited to work with you.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ with ES Modules support
- **pnpm** 8+ (we use pnpm for package management)
- **Git** for version control
- **TypeScript** knowledge (our codebase is fully typed)
- **VS Code** (recommended for development)

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/code-mcp.git
   cd code-mcp
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Build the project**:
   ```bash
   pnpm run build
   ```

5. **Run tests** to ensure everything works:
   ```bash
   pnpm test
   ```

6. **Start development mode**:
   ```bash
   pnpm run dev  # Auto-rebuild on changes
   ```

## 📋 Development Guidelines

### Code Style

- **TypeScript**: All code must be written in TypeScript with strict typing
- **ES Modules**: Use modern ES module imports/exports
- **Formatting**: Code is automatically formatted with Prettier
- **Linting**: Follow ESLint rules (run `pnpm run lint` if available)

### Project Structure

```
src/
├── index.ts              # Main MCP server entry point
├── constants.ts          # Global constants and configuration
├── toolDefinitions.ts    # MCP tool definitions
├── types.ts             # TypeScript type definitions
├── utils.ts             # Utility functions
└── services/            # Service implementations
    ├── AnalysisService.ts       # Code analysis and intelligence
    ├── CodeExecutionService.ts  # Python/JavaScript execution
    ├── DockerService.ts         # Docker container management
    ├── FileService.ts           # File operations and management
    ├── GitService.ts            # Git version control
    ├── ProcessService.ts        # Process lifecycle management
    ├── ProjectConfigService.ts  # .vscode-mcp.toml configuration
    ├── ProjectService.ts        # Project scaffolding and templates
    ├── SecureCommandService.ts  # Secure command execution
    ├── VSCodeDetectionService.ts # VS Code workspace detection
    └── WorkspaceService.ts      # Workspace path management
```

### Writing Services

Services are the core building blocks. When creating a new service:

1. **Create the service file** in `src/services/`
2. **Follow the naming convention**: `ServiceName.ts`
3. **Export from index**: Add to `src/services/index.ts`
4. **Write comprehensive tests**: Create corresponding test file
5. **Add tools**: Define MCP tools in `toolDefinitions.ts`

Example service structure:
```typescript
import { ToolResult } from '../types.js';

export class ExampleService {
  static async performAction(param: string): Promise<ToolResult> {
    try {
      // Implementation here
      return {
        content: [{
          type: 'text',
          text: 'Success message'
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }
}
```

## 🧪 Testing Requirements

### Test Coverage

We maintain comprehensive test coverage across:
- **Unit tests**: Individual service methods
- **Integration tests**: Service interactions
- **End-to-end tests**: Complete MCP workflows
- **Error handling**: Edge cases and failure scenarios

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Run specific test suites
pnpm test -- --testPathPattern="services"
pnpm test -- --testPathPattern="integration"

# Run tests in watch mode during development
pnpm test -- --watch
```

### Writing Tests

1. **Test files** should be placed in `tests/services/` for service tests
2. **Follow naming**: `ServiceName.test.ts`
3. **Use Jest**: We use Jest with ES modules support
4. **Test both success and error cases**
5. **Mock external dependencies** when necessary

Example test structure:
```typescript
import { ExampleService } from '../../src/services/ExampleService.js';

describe('ExampleService', () => {
  describe('performAction', () => {
    it('should return success result for valid input', async () => {
      const result = await ExampleService.performAction('valid-input');
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Success');
    });

    it('should handle invalid input gracefully', async () => {
      const result = await ExampleService.performAction('');
      
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Error');
    });
  });
});
```

## 🔧 Adding New Tools

### Tool Definition Process

1. **Plan the tool**: Define what it does and its parameters
2. **Implement the logic**: Usually in a service class
3. **Define the tool**: Add to `toolDefinitions.ts`
4. **Add the handler**: Connect in `index.ts`
5. **Write tests**: Comprehensive test coverage
6. **Update documentation**: Update README if needed

### Tool Definition Template

```typescript
{
  name: 'tool_name',
  description: 'Clear description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of parameter'
      },
      param2: {
        type: 'boolean',
        description: 'Optional parameter',
        default: false
      }
    },
    required: ['param1']
  }
}
```

## 📝 Pull Request Process

### Before Submitting

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our guidelines

3. **Add or update tests** for your changes

4. **Run the full test suite**:
   ```bash
   pnpm test
   ```

5. **Build the project**:
   ```bash
   pnpm run build
   ```

6. **Commit your changes** with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add new tool for X functionality
   
   - Implement XService with Y capability
   - Add comprehensive tests covering edge cases
   - Update tool definitions and handlers
   
   Closes #123"
   ```

### Pull Request Guidelines

- **Title**: Use conventional commit format (`feat:`, `fix:`, `docs:`, etc.)
- **Description**: Clearly explain what your PR does and why
- **Scope**: Keep PRs focused - one feature or fix per PR
- **Testing**: Include test results and coverage information
- **Documentation**: Update README or other docs if needed

### PR Template

```markdown
## Description
Brief description of changes and motivation

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to not work)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally (`pnpm test`)
- [ ] New tests added for new functionality
- [ ] Test coverage maintained or improved

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated if needed
```

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Reproduce the bug** with minimal steps
3. **Test with latest version**

### Bug Report Template

```markdown
**Bug Description**
Clear description of what the bug is

**Steps to Reproduce**
1. Do this
2. Then this
3. See error

**Expected Behavior**
What you expected to happen

**Environment**
- OS: [e.g., macOS 14.0]
- Node.js version: [e.g., 18.17.0]
- Code MCP Server version: [e.g., 2.1.0]
- Claude Desktop version: [e.g., latest]

**Additional Context**
Any other context about the problem
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** first
2. **Describe the problem** your feature would solve
3. **Explain the proposed solution**
4. **Consider implementation complexity**
5. **Think about backward compatibility**

## 🔒 Security

### Security Policy

- **Report security issues** privately via GitHub Security
- **Don't create public issues** for security vulnerabilities
- **Follow responsible disclosure**

### Secure Coding

- **Validate all inputs** especially for file paths and commands
- **Use allowlist-based security** for command execution
- **Prevent path traversal** attacks
- **Sanitize user-provided data**

## 📚 Documentation

### Documentation Standards

- **Clear and concise**: Write for both beginners and experts
- **Examples included**: Show practical usage
- **Keep updated**: Update docs with code changes
- **Markdown format**: Use proper markdown formatting

### Types of Documentation

- **README.md**: Project overview and quick start
- **CONTRIBUTING.md**: This file
- **Code comments**: Inline documentation
- **Tool descriptions**: In `toolDefinitions.ts`
- **Type definitions**: In `types.ts`

## 🤝 Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Help others** learn and contribute
- **Give constructive feedback**
- **Credit others'** work appropriately

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions and discussions
- **Code Reviews**: Constructive feedback and suggestions

## 🏆 Recognition

Contributors are recognized through:
- **GitHub contributors list**
- **Changelog mentions** for significant contributions
- **Community acknowledgment**

## ❓ Questions?

If you have questions about contributing:

1. **Check existing issues** for similar questions
2. **Create a new issue** with the "question" label
3. **Be specific** about what you need help with

Thank you for contributing to Code MCP Server! 🎉
