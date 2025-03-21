/**
 * Improved parser for the Finance App DSL
 */
import { App } from '../language/generated/ast.js';
import { NodeFileSystem } from 'langium/node';
import { URI } from 'langium';
import path from 'node:path';
import { createFinanceAppDslServices } from '../language/finance-app-dsl-module.js';

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

/**
 * Process a file directly and extract models and screens
 */
export async function processFinAppFile(filePath: string): Promise<{
    app: App,
    models: any[],
    screens: any[],
    api?: any
}> {
    // Create Langium services
    const services = createFinanceAppDslServices(NodeFileSystem).FinanceAppDsl;
    
    // Parse the document
    const absolutePath = path.resolve(filePath);
    const uri = URI.file(absolutePath);
    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(uri);
    
    // Build the document
    await services.shared.workspace.DocumentBuilder.build([document]);
    
    // Extract the App node
    if (!document.parseResult?.value) {
        throw new Error('Could not parse document');
    }
    
    const app = document.parseResult.value as App;
    
    // Debug the document
    console.log('App name from AST:', app.name);
    
    // Save the AST for debugging
    const fs = await import('node:fs');
    fs.writeFileSync(
        path.resolve('generated/app-debug.json'), 
        JSON.stringify(document.parseResult.value, (key, value) => 
            key.startsWith('$') && key !== '$type' ? undefined : value, 
        2)
    );
    console.log('App structure dumped to generated/app-debug.json');
    
    // Parse using direct text parsing
    const sourceText = document.textDocument.getText();
    const directModels = parseDirectModels(sourceText);
    const directScreens = parseDirectScreens(sourceText);
    const directApi = parseDirectApi(sourceText);
    
    console.log(`Extracted ${directModels.length} models and ${directScreens.length} screens from direct parsing`);
    if (directApi) {
        console.log('API configuration extracted successfully');
    }
    
    // Store document for use in generation
    const appWithDocument = app as any;
    appWithDocument.$document = document;
    
    // Add the parsed API to the app
    if (directApi) {
        appWithDocument.api = directApi;
    }
    
    // Return the data with directly parsed models and screens
    return { 
        app: appWithDocument as App,
        models: directModels, 
        screens: directScreens,
        api: directApi
    };
}

/**
 * Parse models directly from source text
 */
function parseDirectModels(sourceText: string): any[] {
    const modelMatches = findMatchesInSource(sourceText, /model\s+(\w+)\s*{([^}]*)}/g);
    const models: any[] = [];
    
    for (const match of modelMatches) {
        // Extract model name from the full match using regex
        const nameMatch = /model\s+(\w+)\s*{/.exec(match.text);
        if (!nameMatch) continue;
        
        const name = nameMatch[1];
        console.log(`Creating model: ${name}`);
        
        // Create a model object with required properties
        const model = {
            $type: 'Model',
            name: name,
            properties: [] as any[]
        };
        
        // Add properties
        const propertiesText = match.text.substring(match.text.indexOf('{') + 1, match.text.lastIndexOf('}'));
        
        // Parse properties
        const propertyLines = propertiesText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('//'));
        
        const properties: any[] = [];
        
        for (const line of propertyLines) {
            // Improved property parsing with regex to better capture attributes
            const propMatch = /(\w+)\s*:\s*(\w+)(.*)/.exec(line);
            if (!propMatch) continue;
            
            const propName = propMatch[1];
            const propType = propMatch[2];
            const attributes = propMatch[3].trim();
            
            // Extract enum values if present
            const enumMatch = /enum\s*:\s*\[(.*?)\]/.exec(attributes);
            const enumValues = enumMatch ? 
                enumMatch[1].split(',').map(v => v.trim().replace(/'/g, '').replace(/"/g, '')) : 
                [];
            
            // Extract default value if present
            const defaultMatch = /default\s*:\s*([^,\s]+)/.exec(attributes);
            const defaultValue = defaultMatch ? defaultMatch[1] : undefined;
            
            properties.push({
                $type: 'Property',
                name: propName,
                type: propType,
                isRequired: attributes.includes('required'),
                attributes: attributes,
                enumValues: enumValues.length > 0 ? enumValues : undefined,
                defaultValue: defaultValue
            });
        }
        
        // Set properties
        model.properties = properties;
        
        models.push(model);
    }
    
    return models;
}

/**
 * Parse screens directly from source text
 */
function parseDirectScreens(sourceText: string): any[] {
    const screenMatches = findMatchesInSource(sourceText, /screen\s+(\w+)\s*{([^]*?)}/g);
    const screens: any[] = [];
    
    for (const match of screenMatches) {
        // Extract screen name from the full match using regex
        const nameMatch = /screen\s+(\w+)\s*{/.exec(match.text);
        if (!nameMatch) continue;
        
        const name = nameMatch[1];
        console.log(`Creating screen: ${name}`);
        
        // Create a screen object with required properties
        const screen = {
            $type: 'Screen',
            name: name,
            isInitial: false,
            title: name,
            layout: {
                $type: 'Layout',
                type: 'stack',
                components: []
            }
        };
        
        // Add to screens array
        screens.push(screen);
    }
    
    return screens;
}

/**
 * Parse API configuration directly from source text
 */
function parseDirectApi(sourceText: string): any | undefined {
    // First, let's use a simple search to find the API section and base URL
    const apiSection = sourceText.match(/api\s*{[\s\S]*?baseUrl\s*:\s*"([^"]+)"[\s\S]*?}/);
    
    if (!apiSection || !apiSection[1]) {
        console.log('Could not extract API section or baseUrl');
        return undefined;
    }
    
    // Get the baseUrl directly from the regex match
    const baseUrl = apiSection[1];
    console.log('API Base URL:', baseUrl);
    
    // Find all endpoints using regex
    const endpointMatches = [];
    const endpointRegex = /endpoint\s+(\w+)\s*{[\s\S]*?path\s*:\s*"([^"]+)"[\s\S]*?method\s*:\s*(\w+)/g;
    
    let match;
    while ((match = endpointRegex.exec(sourceText)) !== null) {
        const endpointName = match[1];
        const path = match[2];
        const method = match[3];
        
        console.log(`Endpoint: ${endpointName}, Path: ${path}, Method: ${method}`);
        
        endpointMatches.push({
            id: endpointName,
            path,
            method
        });
    }
    
    // Return the API object
    return {
        baseUrl,
        endpoints: endpointMatches
    };
} 