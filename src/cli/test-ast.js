// Test script to analyze AST structure
import fs from 'node:fs';
import path from 'node:path';
import { createServices } from '../language/finance-app-dsl-module.js';
import { NodeFileSystem } from 'langium/node';

async function main() {
    const services = createServices(NodeFileSystem).FinanceAppDslServices;
    const modelService = services.FinanceAppDsl.DocumentBuilder;
    
    // Path to the example file (replace with actual path if needed)
    const examplePath = path.resolve(process.cwd(), 'examples/finance-app.finapp');
    const fileContent = fs.readFileSync(examplePath, 'utf8');
    
    // Parse the document
    const document = await modelService.build([{ uri: examplePath, content: fileContent }]);
    const diagnostic = document.documents[0].diagnostics;
    
    if (diagnostic && diagnostic.length > 0) {
        console.log('Diagnostic issues:', diagnostic);
    }
    
    // Extract the AST root
    const model = document.documents[0].parseResult.value;
    
    // Print relevant structure
    console.log('Root type:', model.$type);
    
    if (model.elements && model.elements.length > 0) {
        console.log('Elements count:', model.elements.length);
        
        // Log app info
        const app = model.elements.find(e => e.$type === 'App');
        if (app) {
            console.log('App found:', {
                name: app.name,
                id: app.id,
                version: app.version
            });
        }
        
        // Log models
        const models = model.elements.filter(e => e.$type === 'Model');
        console.log('Models found:', models.length);
        models.forEach((model, i) => {
            console.log(`Model ${i+1}:`, {
                name: model.name,
                propertiesCount: model.properties?.length || 0
            });
        });
        
        // Log screens
        const screens = model.elements.filter(e => e.$type === 'Screen');
        console.log('Screens found:', screens.length);
        screens.forEach((screen, i) => {
            console.log(`Screen ${i+1}:`, {
                name: screen.name,
                title: screen.title
            });
        });
    }
}

main().catch(console.error); 