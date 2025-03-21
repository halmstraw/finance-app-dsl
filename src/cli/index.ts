import { processFinAppFile } from './parser.js';

/**
 * Generate code from a Finance App DSL file
 */
export async function generateFromFile(filePath: string, outputDir: string): Promise<string> {
    try {
        console.log('Processing file:', filePath);
        
        // Process the file using our improved parser
        const { app, models, screens } = await processFinAppFile(filePath);
        
        console.log(`Found ${models.length} models and ${screens.length} screens`);
        
        // Import generator
        const { generateFinanceApp } = await import('./generator.js');
        
        // Generate code using the extracted models and screens
        const outputPath = generateFinanceApp(app.$document!, outputDir, models, screens);
        
        return outputPath;
    } catch (error: any) {
        console.error('Error processing file:', error.message || String(error));
        throw error;
    }
}

/**
 * Main CLI function
 */
export function main(): void {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.error('Usage: finance-app <file> [output-dir]');
        process.exit(1);
    }
    
    const filePath = args[0];
    const outputDir = args[1] || 'generated';
    
    generateFromFile(filePath, outputDir)
        .then(result => {
            console.log(`Generated code at: ${result}`);
        })
        .catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
        });
} 