/**
 * Improved parser for the Finance App DSL
 */
import { App as AstApp } from '../language/generated/ast.js';
import { NodeFileSystem } from 'langium/node';
import { URI } from 'langium';
import path from 'node:path';
import { createFinanceAppDslServices } from '../language/finance-app-dsl-module.js';

// Export our own App type that includes our models, screens and API
export interface App {
  name: string;
  models: Model[];
  screens: Screen[];
  api?: API;
}

export interface Property {
  name: string;
  type: string;
}

export interface Model {
  name: string;
  properties: Property[];
}

export interface Screen {
  name: string;
  isInitial: boolean;
  title: string;
}

export interface API {
  baseUrl: string;
  endpoints: Array<{
    name: string;
    path: string;
    method: string;
  }>;
}

/**
 * Find all matches of a pattern in source text
 */
function findMatchesInSource(sourceText: string, pattern: RegExp): Array<{start: number, end: number, text: string}> {
    const matches: Array<{start: number, end: number, text: string}> = [];
    let match;
    
    // Use regex to find declarations
    while ((match = pattern.exec(sourceText)) !== null) {
        const text = match[0];
        const start = match.index;
        const end = start + text.length;
        
        // Add to the matches array
        matches.push({ start, end, text });
        
        // Avoid infinite loops for zero-length matches
        if (match.index === pattern.lastIndex) {
            pattern.lastIndex++;
        }
    }
    
    return matches;
}

export async function processFinAppFile(filePath: string): Promise<{
    app: App,
    models: Model[],
    screens: Screen[],
    api?: API
}> {
    // Create Langium services
    const services = createFinanceAppDslServices(NodeFileSystem);
    
    // Read the file
    const fileUri = URI.file(path.resolve(filePath));
    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(fileUri);
    
    // Build the document
    await services.shared.workspace.DocumentBuilder.build([document]);
    
    // Get the AST
    const ast = document.parseResult?.value as AstApp;
    
    if (!ast) {
        throw new Error('Failed to parse the document');
    }
    
    // Extract models, screens, and API using direct parsing
    const sourceText = document.textDocument.getText();
    const models = parseDirectModels(sourceText);
    const screens = parseDirectScreens(sourceText);
    const api = parseDirectApi(sourceText);
    
    // Create our own app object
    const app: App = {
        name: ast.name,
        models,
        screens,
        api
    };
    
    return {
        app,
        models,
        screens,
        api
    };
}

/**
 * Parse models directly from source text
 */
function parseDirectModels(sourceText: string): Model[] {
    const modelMatches = findMatchesInSource(sourceText, /model\s+(\w+)\s*{([^}]*)}/g);
    const models: Model[] = [];
    
    for (const match of modelMatches) {
        const name = match.text.match(/model\s+(\w+)/)?.[1];
        if (!name) continue;
        
        const propertiesText = match.text.match(/{([^}]*)}/)?.[1];
        if (!propertiesText) continue;
        
        const propertyLines = propertiesText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('//'));
        
        const properties: Property[] = [];
        
        for (const line of propertyLines) {
            const [propName, propType] = line.split(':').map(s => s.trim());
            if (!propName || !propType) continue;
            
            properties.push({
                name: propName,
                type: propType
            });
        }
        
        models.push({
            name,
            properties
        });
    }
    
    return models;
}

/**
 * Parse screens directly from source text
 */
function parseDirectScreens(sourceText: string): Screen[] {
    const screenMatches = findMatchesInSource(sourceText, /screen\s+(\w+)\s*{([^]*?)}/g);
    const screens: Screen[] = [];
    
    for (const match of screenMatches) {
        const name = match.text.match(/screen\s+(\w+)/)?.[1];
        if (!name) continue;
        
        const isInitial = match.text.includes('initial');
        const title = match.text.match(/title\s*:\s*"([^"]+)"/)?.[1] || name;
        
        screens.push({
            name,
            isInitial,
            title
        });
    }
    
    return screens;
}

/**
 * Parse API configuration directly from source text
 */
function parseDirectApi(sourceText: string): API | undefined {
    // First, let's use a simple search to find the API section and base URL
    const apiSection = sourceText.match(/api\s*{[\s\S]*?baseUrl\s*:\s*"([^"]+)"[\s\S]*?}/);
    if (!apiSection) return undefined;
    
    const baseUrl = apiSection[1];
    
    // Now let's find all endpoints
    const endpointMatches = findMatchesInSource(sourceText, /endpoint\s+(\w+)\s*{([^}]*)}/g);
    const endpoints = endpointMatches.map(match => {
        const name = match.text.match(/endpoint\s+(\w+)/)?.[1] || '';
        const path = match.text.match(/path\s*:\s*"([^"]+)"/)?.[1] || '';
        const method = match.text.match(/method\s*:\s*(\w+)/)?.[1] || 'GET';
        
        return { name, path, method };
    });
    
    return {
        baseUrl,
        endpoints
    };
} 