import { processFinAppFile } from './parser.js';
import { Platform, generateCode } from './generator/index.js';
import fs from 'node:fs';

/**
 * Main CLI function
 */
export function main(): void {
    // Parse command-line arguments
    const args = process.argv.slice(2);
    
    // Check if we're using the new format with flags
    const useFlags = args.some(arg => arg.startsWith('-'));
    
    if (useFlags) {
        handleFlagFormat(args);
    } else {
        handlePositionalFormat(args);
    }
}

/**
 * Handle flag-based command format (new style)
 * Example: finance-app generate -f file.fin -o output -p web,ios
 */
function handleFlagFormat(args: string[]): void {
    const command = args[0];
    if (command !== 'generate') {
        console.error('Unknown command. Currently only "generate" is supported.');
        printUsage();
        process.exit(1);
    }
    
    let filePath = '';
    let outputDir = 'generated';
    let platformsArg = 'web';
    
    // Parse flags
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '-f' || arg === '--file') {
            filePath = args[++i] || '';
        } else if (arg === '-o' || arg === '--output') {
            outputDir = args[++i] || 'generated';
        } else if (arg === '-p' || arg === '--platforms') {
            platformsArg = args[++i] || 'web';
        } else if (arg === '-h' || arg === '--help') {
            printUsage();
            process.exit(0);
        }
    }
    
    if (!filePath) {
        console.error('Error: No input file specified.');
        printUsage();
        process.exit(1);
    }
    
    // Parse platforms
    const platformStrings = platformsArg.split(',').map(p => p.trim().toLowerCase());
    const platforms: Platform[] = platformStrings.filter(
        p => p === 'web' || p === 'android' || p === 'ios'
    ) as Platform[];
    
    // Generate code
    generateFromFile(filePath, outputDir, platforms);
}

/**
 * Handle positional argument format (old style)
 * Example: finance-app file.fin output web,ios
 */
function handlePositionalFormat(args: string[]): void {
    if (args.length < 1) {
        printUsage();
        process.exit(1);
    }
    
    const filePath = args[0];
    const outputDir = args[1] || 'generated';
    
    // Parse platforms
    const platformArg = args[2] || 'web';
    const platformStrings = platformArg.split(',').map(p => p.trim().toLowerCase());
    const platforms: Platform[] = platformStrings.filter(
        p => p === 'web' || p === 'android' || p === 'ios'
    ) as Platform[];
    
    // Generate code
    generateFromFile(filePath, outputDir, platforms);
}

/**
 * Print CLI usage instructions
 */
function printUsage(): void {
    console.log('Finance App DSL - Code Generator');
    console.log('\nUsage:');
    console.log('  finance-app generate -f <file> [-o <output-dir>] [-p <platforms>]');
    console.log('\nOptions:');
    console.log('  -f, --file        Input .fin file path');
    console.log('  -o, --output      Output directory (default: "generated")');
    console.log('  -p, --platforms   Target platforms: web,ios,android (comma-separated)');
    console.log('  -h, --help        Show this help message');
    console.log('\nExample:');
    console.log('  finance-app generate -f banking-app.fin -o generated -p web,ios,android');
}

/**
 * Generate code from a Finance App DSL file
 */
async function generateFromFile(filePath: string, outputDir: string, platforms: Platform[] = ['web']): Promise<void> {
    try {
        console.log('Processing file:', filePath);
        
        // Process the file using our improved parser
        const { app, models, screens, api } = await processFinAppFile(filePath);
        
        console.log(`Found ${models.length} models and ${screens.length} screens`);
        if (api) {
            console.log('API configuration found');
        }
        
        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Generate code for each requested platform
        await generateCode(app, platforms);
        
        console.log(`Generated code in: ${outputDir}`);
    } catch (error: any) {
        console.error('Error processing file:', error.message || String(error));
        process.exit(1);
    }
} 