/**
 * Project creation and management service
 */
import fs from 'fs/promises';
import path from 'path';
import { ValidationUtils } from '../utils.js';
import { PROJECT_TYPES, ProjectType } from '../constants.js';
import { ToolResult } from '../types.js';
import { WorkspaceService } from './WorkspaceService.js';

export interface CreateProjectArgs {
  name: string;
  type: ProjectType;
  path?: string;
}

export class ProjectService {
  private workspaceService: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
  }

  /**
   * Create a new project with boilerplate
   */
  async createProject(args: CreateProjectArgs): Promise<ToolResult> {
    const { name, type, path: projectPath } = args;
    ValidationUtils.validateRequired({ name, type }, ['name', 'type']);
    ValidationUtils.validateProjectType(type, Object.values(PROJECT_TYPES));
    
    const basePath = projectPath ? this.workspaceService.resolvePath(projectPath) : this.workspaceService.getCurrentWorkspace();
    const fullProjectPath = path.join(basePath, name);
    
    try {
      // Create project directory
      await fs.mkdir(fullProjectPath, { recursive: true });
      
      // Generate project structure based on type
      await this.generateProjectStructure(type, fullProjectPath, name);
      
      return {
        content: [{
          type: 'text',
          text: `Project "${name}" created successfully at ${fullProjectPath}\nType: ${type}`,
        }],
      };
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate project structure based on type
   */
  private async generateProjectStructure(type: ProjectType, projectPath: string, name: string): Promise<void> {
    const template = this.getProjectTemplate(name, type);
    
    // Create all files from template
    for (const [filePath, content] of Object.entries(template)) {
      const fullPath = path.join(projectPath, filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, content);
    }
  }

  /**
   * Create Python project structure
   */
  private async createPythonProject(projectPath: string, name: string): Promise<void> {
    // Create directories
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });
    
    // Create main module
    const mainPy = `#!/usr/bin/env python3
"""
${name} - Main module
"""

def main():
    """Main function"""
    print("Hello from ${name}!")

if __name__ == "__main__":
    main()
`;
    await fs.writeFile(path.join(projectPath, 'src', 'main.py'), mainPy);
    
    // Create __init__.py files
    await fs.writeFile(path.join(projectPath, 'src', '__init__.py'), '');
    await fs.writeFile(path.join(projectPath, 'tests', '__init__.py'), '');
    
    // Create test file
    const testPy = `import unittest
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import main

class TestMain(unittest.TestCase):
    def test_main(self):
        """Test main function"""
        # Add your tests here
        pass

if __name__ == '__main__':
    unittest.main()
`;
    await fs.writeFile(path.join(projectPath, 'tests', 'test_main.py'), testPy);
    
    // Create requirements.txt
    const requirements = `# Add your dependencies here
pytest>=6.0.0
`;
    await fs.writeFile(path.join(projectPath, 'requirements.txt'), requirements);
    
    // Create README.md
    const readme = `# ${name}

A Python project created with VS Code MCP Agent.

## Setup

1. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Run the application:
   \`\`\`bash
   python src/main.py
   \`\`\`

4. Run tests:
   \`\`\`bash
   pytest tests/
   \`\`\`
`;
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  /**
   * Create Node.js project structure
   */
  private async createNodeProject(projectPath: string, name: string): Promise<void> {
    // Create directories
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });
    
    // Create package.json
    const packageJson = {
      name,
      version: '1.0.0',
      description: `A Node.js project created with VS Code MCP Server`,
      main: 'src/index.js',
      type: 'module',
      scripts: {
        start: 'node src/index.js',
        test: 'jest',
        dev: 'node --watch src/index.js'
      },
      keywords: [],
      author: '',
      license: 'MIT',
      devDependencies: {
        jest: '^29.0.0'
      }
    };
    await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create main file
    const indexJs = `/**
 * ${name} - Main application
 */

function greet(name) {
    return \`Hello from \${name}!\`;
}

function main() {
    console.log(greet('${name}'));
}

main();
`;
    await fs.writeFile(path.join(projectPath, 'src', 'index.js'), indexJs);
    
    // Create test file
    const testJs = `/**
 * Tests for ${name}
 */

describe('${name}', () => {
    test('should work', () => {
        expect(true).toBe(true);
    });
});
`;
    await fs.writeFile(path.join(projectPath, 'tests', 'index.test.js'), testJs);
    
    // Create README.md
    const readme = `# ${name}

A Node.js project created with VS Code MCP Server.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the application:
   \`\`\`bash
   npm start
   \`\`\`

3. Run in development mode:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Run tests:
   \`\`\`bash
   npm test
   \`\`\`
`;
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  /**
   * Create React project structure
   */
  private async createReactProject(projectPath: string, name: string): Promise<void> {
    // Create directories
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'public'), { recursive: true });
    
    // Create package.json
    const packageJson = {
      name,
      version: '1.0.0',
      description: `A React project created with VS Code MCP Server`,
      type: 'module',
      scripts: {
        start: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        test: 'jest'
      },
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.0.0',
        vite: '^4.0.0',
        jest: '^29.0.0'
      }
    };
    await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create vite.config.js
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`;
    await fs.writeFile(path.join(projectPath, 'vite.config.js'), viteConfig);
    
    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
    await fs.writeFile(path.join(projectPath, 'index.html'), indexHtml);
    
    // Create main.jsx
    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
    await fs.writeFile(path.join(projectPath, 'src', 'main.jsx'), mainJsx);
    
    // Create App.jsx
    const appJsx = `import React from 'react'

function App() {
  return (
    <div>
      <h1>Welcome to ${name}!</h1>
      <p>A React project created with VS Code MCP Server.</p>
    </div>
  )
}

export default App
`;
    await fs.writeFile(path.join(projectPath, 'src', 'App.jsx'), appJsx);
    
    // Create README.md
    const readme = `# ${name}

A React project created with VS Code MCP Server.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm start
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

4. Preview production build:
   \`\`\`bash
   npm run preview
   \`\`\`
`;
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  /**
   * Create Express.js project structure
   */
  private async createExpressProject(projectPath: string, name: string): Promise<void> {
    // Create directories
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'src', 'routes'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });
    
    // Create package.json
    const packageJson = {
      name,
      version: '1.0.0',
      description: `An Express.js project created with VS Code MCP Server`,
      main: 'src/server.js',
      type: 'module',
      scripts: {
        start: 'node src/server.js',
        dev: 'node --watch src/server.js',
        test: 'jest'
      },
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.5',
        helmet: '^7.0.0'
      },
      devDependencies: {
        jest: '^29.0.0',
        supertest: '^6.3.0'
      }
    };
    await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create server.js
    const serverJs = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${name}!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export default app;
`;
    await fs.writeFile(path.join(projectPath, 'src', 'server.js'), serverJs);
    
    // Create test file
    const testJs = `import request from 'supertest';
import app from '../src/server.js';

describe('${name} API', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Welcome to ${name}!');
  });

  test('GET /health should return status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});
`;
    await fs.writeFile(path.join(projectPath, 'tests', 'server.test.js'), testJs);
    
    // Create README.md
    const readme = `# ${name}

An Express.js API project created with VS Code MCP Server.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

3. Start in development mode:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check
`;
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  /**
   * Get project template based on type and name
   */
  getProjectTemplate(name: string, type: string): Record<string, string> {
    switch (type) {
      case 'python':
        return this.getPythonTemplate(name);
      case 'node':
        return this.getNodeTemplate(name);
      case 'react':
        return this.getReactTemplate(name);
      case 'express':
        return this.getExpressTemplate(name);
      default:
        throw new Error(`Unknown project type: ${type}`);
    }
  }

  /**
   * Get Python project template structure
   */
  getPythonTemplate(name: string): Record<string, string> {
    return {
      'README.md': `# ${name}

A Python project created with VS Code MCP Agent.

## Setup

1. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Run the application:
   \`\`\`bash
   python src/main.py
   \`\`\`

4. Run tests:
   \`\`\`bash
   pytest tests/
   \`\`\`
`,
      'requirements.txt': `# Add your dependencies here
pytest>=6.0.0
requests>=2.28.0
`,
      '.gitignore': `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/
.pytest_cache/
`,
      'src/__init__.py': '',
      'src/main.py': `#!/usr/bin/env python3
"""
${name} - Main module
"""

def main():
    """Main function"""
    print("Hello from ${name}!")

if __name__ == "__main__":
    main()
`,
      'tests/__init__.py': '',
      'tests/test_main.py': `import unittest
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import main

class TestMain(unittest.TestCase):
    def test_main(self):
        """Test main function"""
        # Add your tests here
        pass

if __name__ == '__main__':
    unittest.main()
`
    };
  }

  /**
   * Get Node.js project template structure
   */
  getNodeTemplate(name: string): Record<string, string> {
    const packageJson = {
      name: name,
      version: '1.0.0',
      description: `A Node.js project created with VS Code MCP Server`,
      main: 'src/index.js',
      type: 'module',
      scripts: {
        start: 'node src/index.js',
        test: 'jest',
        dev: 'node --watch src/index.js'
      },
      keywords: [],
      author: '',
      license: 'MIT',
      devDependencies: {
        jest: '^29.0.0'
      }
    };

    return {
      'package.json': JSON.stringify(packageJson, null, 2),
      'README.md': `# ${name}

A Node.js project created with VS Code MCP Server.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the application:
   \`\`\`bash
   npm start
   \`\`\`

3. Run in development mode:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Run tests:
   \`\`\`bash
   npm test
   \`\`\`
`,
      '.gitignore': `node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store
.vscode/
.idea/
dist/
build/
`,
      'src/index.js': `/**
 * ${name} - Main application
 */

function greet(name) {
    return \`Hello from \${name}!\`;
}

function main() {
    console.log(greet('${name}'));
}

main();
`,
      'tests/index.test.js': `/**
 * Tests for ${name}
 */

describe('${name}', () => {
    test('should work', () => {
        expect(true).toBe(true);
    });
});
`
    };
  }

  /**
   * Get React project template structure
   */
  getReactTemplate(name: string): Record<string, string> {
    const packageJson = {
      name: name,
      version: '1.0.0',
      description: `A React project created with VS Code MCP Server`,
      type: 'module',
      scripts: {
        start: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        test: 'jest'
      },
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.0.0',
        vite: '^4.0.0',
        jest: '^29.0.0'
      }
    };

    return {
      'package.json': JSON.stringify(packageJson, null, 2),
      'README.md': `# ${name}

A React project created with VS Code MCP Server.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm start
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

4. Preview production build:
   \`\`\`bash
   npm run preview
   \`\`\`
`,
      '.gitignore': `node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store
.vscode/
.idea/
dist/
build/
`,
      'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
      'src/index.js': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
      'src/App.js': `import React from 'react'

function App() {
  return (
    <div>
      <h1>Welcome to ${name}!</h1>
      <p>A React project created with VS Code MCP Server.</p>
    </div>
  )
}

export default App
`,
      'src/App.css': `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}
`,
      'src/index.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`,
      'src/reportWebVitals.js': `const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
`
    };
  }

  /**
   * Get Express project template structure
   */
  getExpressTemplate(name: string): Record<string, string> {
    const packageJson = {
      name: name,
      version: '1.0.0',
      description: `An Express.js project created with VS Code MCP Server`,
      main: 'src/server.js',
      type: 'module',
      scripts: {
        start: 'node src/server.js',
        dev: 'node --watch src/server.js',
        test: 'jest'
      },
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.5',
        helmet: '^7.0.0'
      },
      devDependencies: {
        jest: '^29.0.0',
        supertest: '^6.3.0'
      }
    };

    return {
      'package.json': JSON.stringify(packageJson, null, 2),
      'README.md': `# ${name}

An Express.js API project created with VS Code MCP Server.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

3. Start in development mode:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check
`,
      '.gitignore': `node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store
.vscode/
.idea/
dist/
build/
`,
      '.env.example': `PORT=3000
NODE_ENV=development
`,
      'src/server.js': `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${name}!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;
`,
      'tests/server.test.js': `import request from 'supertest';
import app from '../src/server.js';

describe('${name} API', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Welcome to ${name}!');
  });

  test('GET /health should return status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});
`
    };
  }

  /**
   * Get next steps for a project type
   */
  getNextSteps(type: string): string[] {
    switch (type) {
      case 'python':
        return [
          'Create a virtual environment: python -m venv venv',
          'Activate the virtual environment: source venv/bin/activate (or venv\\Scripts\\activate on Windows)',
          'Install dependencies: pip install -r requirements.txt',
          'Run the application: python src/main.py',
          'Run tests: pytest tests/'
        ];
      case 'node':
        return [
          'Install dependencies: npm install',
          'Run the application: npm start',
          'Run in development mode: npm run dev',
          'Run tests: npm test'
        ];
      case 'react':
        return [
          'Install dependencies: npm install',
          'Start development server: npm start',
          'Build for production: npm run build',
          'Preview production build: npm run preview',
          'Run tests: npm test'
        ];
      case 'express':
        return [
          'Install dependencies: npm install',
          'Start the server: npm start',
          'Start in development mode: npm run dev',
          'Run tests: npm test'
        ];
      default:
        return [];
    }
  }
}