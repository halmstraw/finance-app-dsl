/**
 * Web Generator implementation for generating React web apps
 */

import { App, Model, Screen } from '../../parser.js';
import { BaseGenerator } from '../base/index.js';
import * as fs from 'fs';
import * as path from 'path';

export interface GeneratedOutput {
  files: { [path: string]: string };
  messages: string[];
}

export class WebGenerator extends BaseGenerator {
  private messages: string[] = [];

  constructor(app: App) {
    super(app, 'web');
  }

  /**
   * Main generate method - implements the abstract method from BaseGenerator
   */
  async generate(): Promise<void> {
    const app = this.getApp();
    const appName = app.name || 'FinanceApp';
    this.addMessage(`Generating web application: ${appName}`);
    
    // Create base directory structure
    const webDir = path.join(this.getOutputDir(), 'web');
    fs.mkdirSync(webDir, { recursive: true });

    // Generate models
    await this.generateModels();
    
    // Generate screens
    await this.generateScreens();
    
    // Generate API client
    await this.generateApi();
    
    // Generate app code
    await this.generateApp();
  }

  private addMessage(message: string): void {
    console.log(`[web] ${message}`);
    this.messages.push(message);
  }

  private async writeFile(relativePath: string, content: string): Promise<void> {
    const filePath = path.join(this.getOutputDir(), 'web', relativePath);
    const dirname = path.dirname(filePath);
    fs.mkdirSync(dirname, { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  /**
   * Generate TypeScript model files
   */
  protected async generateModels(): Promise<void> {
    const app = this.getApp();

    for (const model of app.models) {
      this.addMessage(`Generating model: ${model.name}`);
      
      const modelContent = this.generateModelContent(model);
      await this.writeFile(`src/models/${model.name}.ts`, modelContent);
    }
    
    // Generate index file for models
    const indexContent = this.generateModelIndex(app.models);
    await this.writeFile('src/models/index.ts', indexContent);
  }

  private generateModelContent(model: Model): string {
    const typescriptContent = `/**
 * Model: ${model.name}
 * Generated automatically - do not modify manually
 */

export interface ${model.name} {
${model.properties.map(prop => 
  `  ${prop.name}: ${this.mapToTypeScriptType(prop.type)};`
).join('\n')}
}

/**
 * Default empty ${model.name}
 */
export const empty${model.name}: ${model.name} = {
${model.properties.map(prop => 
  `  ${prop.name}: ${this.getDefaultValueForType(prop.type)},`
).join('\n')}
};

/**
 * Validation function for ${model.name}
 */
export function is${model.name}Valid(model: ${model.name}): boolean {
  // Add custom validation logic here
  return true;
}
`;
    return typescriptContent;
  }

  private generateModelIndex(models: Model[]): string {
    return `/**
 * Models index file - exports all model types
 * Generated automatically - do not modify manually
 */

${models.map(model => 
  `export { ${model.name}, empty${model.name}, is${model.name}Valid } from './${model.name}';`
).join('\n')}
`;
  }

  private mapToTypeScriptType(modelType: string): string {
    switch (modelType.toLowerCase()) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'Date';
      case 'array':
        return 'any[]';
      case 'object':
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  private getDefaultValueForType(modelType: string): string {
    switch (modelType.toLowerCase()) {
      case 'string':
        return "''";
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      case 'date':
        return 'new Date()';
      case 'array':
        return '[]';
      case 'object':
        return '{}';
      default:
        return 'null';
    }
  }

  /**
   * Generate React component files for screens
   */
  protected async generateScreens(): Promise<void> {
    const app = this.getApp();
    
    for (const screen of app.screens) {
      this.addMessage(`Generating screen: ${screen.name}`);
      
      const componentName = `${screen.name}Screen`;
      const screenContent = this.generateScreenComponent(screen, componentName);
      await this.writeFile(`src/screens/${componentName}.tsx`, screenContent);
    }
    
    // Generate index file for screens
    const indexContent = this.generateScreenIndex(app.screens);
    await this.writeFile('src/screens/index.ts', indexContent);
  }

  private generateScreenComponent(screen: Screen, componentName: string): string {
    return `import React from 'react';
import { Box, Typography, Container } from '@mui/material';

/**
 * ${componentName} Component
 * Generated for screen: ${screen.name}
 */
export const ${componentName}: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ${screen.title || screen.name}
        </Typography>
        
        {/* Add screen content here */}
      </Box>
    </Container>
  );
};

export default ${componentName};
`;
  }

  private generateScreenIndex(screens: Screen[]): string {
    return `/**
 * Screens index file - exports all screen components
 * Generated automatically - do not modify manually
 */

${screens.map(screen => 
  `export { default as ${screen.name}Screen } from './${screen.name}Screen';`
).join('\n')}
`;
  }

  /**
   * Generate API client
   */
  protected async generateApi(): Promise<void> {
    const app = this.getApp();
    
    if (!app.api) {
      this.addMessage('No API configuration found, skipping API client generation');
      return;
    }
    
    this.addMessage('Generating API client');
    
    // Generate API client
    let apiContent = `/**
 * API Client
 * Generated automatically - do not modify manually
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URL from API configuration
const API_BASE_URL = '${app.api.baseUrl}';\n\n`;

    apiContent += `/**
 * Create API client instance
 */
export function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// API client singleton
export const apiClient = createApiClient();

// API request wrapper with error handling
async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}\n\n`;

    // Generate endpoint functions
    if (app.api.endpoints && app.api.endpoints.length > 0) {
      for (const endpoint of app.api.endpoints) {
        apiContent += this.generateEndpointFunction(endpoint);
      }
    }

    await this.writeFile('src/api/apiClient.ts', apiContent);
    
    // Generate index file
    const indexContent = `/**
 * API index file
 * Generated automatically - do not modify manually
 */

export { apiClient, createApiClient } from './apiClient';
`;
    
    await this.writeFile('src/api/index.ts', indexContent);
  }

  private generateEndpointFunction(endpoint: any): string {
    const method = endpoint.method?.toLowerCase() || 'get';
    const functionName = `${method}${endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1)}`;
    const path = endpoint.path || '/';
    
    // Extract path parameters
    const pathParams = this.extractPathParams(path);
    
    let paramsCode = '';
    if (pathParams.length > 0) {
      paramsCode = `
  // Replace path parameters
  let url = '${path}';
${pathParams.map(param => `  url = url.replace('{${param}}', params.${param});`).join('\n')}
`;
    }
    
    // Determine function parameters based on HTTP method
    let functionParams = '';
    let configParams = '';
    
    if (method === 'get' || method === 'delete') {
      functionParams = pathParams.length > 0 
        ? 'params: { ' + pathParams.map(p => `${p}: string`).join(', ') + ' }, queryParams?: any'
        : 'queryParams?: any';
      
      configParams = pathParams.length > 0
        ? `    url${pathParams.length > 0 ? ': url' : ''},
    method: '${method}',
    params: queryParams,`
        : `    url: '${path}',
    method: '${method}',
    params: queryParams,`;
    } else {
      functionParams = pathParams.length > 0
        ? 'data: any, params: { ' + pathParams.map(p => `${p}: string`).join(', ') + ' }'
        : 'data: any';
      
      configParams = pathParams.length > 0
        ? `    url${pathParams.length > 0 ? ': url' : ''},
    method: '${method}',
    data,`
        : `    url: '${path}',
    method: '${method}',
    data,`;
    }
    
    return `/**
 * ${endpoint.name} API endpoint
 */
export async function ${functionName}<T = any>(${functionParams}): Promise<T> {${paramsCode}
  return apiRequest<T>({
${configParams}
  });
}

`;
  }

  private extractPathParams(path: string): string[] {
    const params: string[] = [];
    const regex = /{([^}]+)}/g;
    let match;
    
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    
    return params;
  }

  /**
   * Generate main application code
   */
  protected async generateApp(): Promise<void> {
    const app = this.getApp();
    const appName = app.name || 'FinanceApp';
    
    this.addMessage('Generating main application code');
    
    // App component
    const appComponent = this.generateAppComponent();
    await this.writeFile('src/App.tsx', appComponent);
    
    // Index file
    const indexFile = this.generateIndexFile();
    await this.writeFile('src/index.tsx', indexFile);
    
    // Package.json
    const packageJson = this.generatePackageJson(appName);
    await this.writeFile('package.json', packageJson);
    
    // README
    const readme = this.generateReadme(appName);
    await this.writeFile('README.md', readme);
  }

  private generateAppComponent(): string {
    const app = this.getApp();
    
    let imports = `import React from 'react';\nimport { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';\n`;
    
    // Import screen components
    for (const screen of app.screens) {
      imports += `import { ${screen.name}Screen } from './screens';\n`;
    }
    
    let routes = '';
    for (const screen of app.screens) {
      routes += `        <Route path="/${screen.name.toLowerCase()}" element={<${screen.name}Screen />} />\n`;
    }
    
    // Determine the initial screen for redirect
    let initialRedirect = '';
    const firstScreen = app.screens[0];
    if (firstScreen) {
      initialRedirect = `        <Route path="/" element={<Navigate to="/${firstScreen.name.toLowerCase()}" />} />\n`;
    }
    
    return `${imports}
/**
 * Main App Component
 * Generated automatically - do not modify manually
 */
function App() {
  return (
    <Router>
      <Routes>
${routes}
${initialRedirect}      </Routes>
    </Router>
  );
}

export default App;
`;
  }

  private generateIndexFile(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
`;
  }

  private generatePackageJson(appName: string): string {
    return `{
  "name": "${appName.toLowerCase().replace(/\\s+/g, '-')}",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.9.0",
    "@emotion/styled": "^11.8.1",
    "@mui/icons-material": "^5.6.2",
    "@mui/material": "^5.6.2",
    "axios": "^0.26.1",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.3.0",
    "typescript": "^4.6.3",
    "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.1.1",
    "@testing-library/user-event": "^14.1.1",
    "@types/jest": "^27.4.1",
    "@types/node": "^17.0.25",
    "@types/react": "^18.0.5",
    "@types/react-dom": "^18.0.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
`;
  }

  private generateReadme(appName: string): string {
    return `# ${appName}

This is a generated React application for the ${appName} finance application.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in the development mode.\\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### \`npm test\`

Launches the test runner in the interactive watch mode.

### \`npm run build\`

Builds the app for production to the \`build\` folder.

## Generated Structure

- \`src/api\`: API client and endpoints
- \`src/models\`: Data models for the application
- \`src/screens\`: Screen components
- \`src/App.tsx\`: Main application component with routing
`;
  }
} 