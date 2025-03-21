// src/cli/index.ts

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { NodeFileSystem } from 'langium/node';
import chalk from 'chalk';
import { createFinanceAppDSLServices } from '../language/finance-app-dsl-module';
import { App } from '../language/generated/ast';
import { extractAstNode } from 'langium';

// Create a CLI program
const program = new Command();

program
    .name('finance-app-dsl')
    .description('CLI for the Finance App DSL')
    .version('0.1.0');

// Create Langium services
const services = createFinanceAppDSLServices(NodeFileSystem).FinanceAppDSL;
const parser = services.parser;
const validator = services.validation.ValidationRegistry;

// Add analyze command
program
    .command('analyze')
    .description('Analyze a DSL file and report any issues')
    .argument('<file>', 'path to DSL file')
    .option('-v, --verbose', 'show detailed analysis information')
    .action(async (filePath, options) => {
        const fullPath = path.resolve(process.cwd(), filePath);
        
        try {
            // Check if the file exists
            if (!fs.existsSync(fullPath)) {
                console.error(chalk.red(`File not found: ${fullPath}`));
                process.exit(1);
            }
            
            console.log(chalk.blue(`Analyzing ${filePath}...`));
            
            // Read the file
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Parse the file
            const parseResult = await parser.parse(content);
            
            // Check for parse errors
            if (parseResult.parserErrors.length > 0) {
                console.error(chalk.red('Parse errors:'));
                parseResult.parserErrors.forEach(error => {
                    console.error(chalk.red(`  - ${error.message} at line ${error.range.start.line + 1}, column ${error.range.start.character + 1}`));
                });
                process.exit(1);
            }
            
            // Get the AST
            const ast = parseResult.value;
            
            // Validate the AST
            const validationResult = await validator.validate(ast);
            
            // Report validation issues
            if (validationResult.length > 0) {
                console.error(chalk.yellow('Validation issues:'));
                validationResult.forEach(issue => {
                    const prefix = issue.severity === 'error' ? chalk.red('ERROR') : chalk.yellow('WARN');
                    console.error(`  ${prefix}: ${issue.message} at line ${issue.range?.start.line + 1 || '?'}, column ${issue.range?.start.character + 1 || '?'}`);
                });
                
                // Exit with error code for errors
                if (validationResult.some(issue => issue.severity === 'error')) {
                    process.exit(1);
                }
            } else {
                console.log(chalk.green('No validation issues found.'));
            }
            
            // Extract the App node
            const app = extractAstNode<App>(ast);
            
            // Output basic information about the application
            console.log(chalk.blue('\nApplication Details:'));
            console.log(`  Name: ${app.displayName?.substring(1, app.displayName.length - 1)}`);
            console.log(`  ID: ${app.appId?.substring(1, app.appId.length - 1)}`);
            console.log(`  Version: ${app.version?.substring(1, app.version.length - 1)}`);
            console.log(`  Platforms: ${app.platforms?.map(p => p.name).join(', ')}`);
            
            // Output more detailed information if verbose flag is set
            if (options.verbose) {
                const modelCount = app.models?.length || 0;
                const screenCount = app.screens?.length || 0;
                const endpointCount = app.api?.endpoints?.length || 0;
                
                console.log(chalk.blue('\nStructure Summary:'));
                console.log(`  Models: ${modelCount}`);
                if (modelCount > 0) {
                    app.models?.forEach(model => {
                        console.log(`    - ${model.name} (${model.properties?.length || 0} properties)`);
                    });
                }
                
                console.log(`  Screens: ${screenCount}`);
                if (screenCount > 0) {
                    app.screens?.forEach(screen => {
                        const initialFlag = screen.isInitial ? ' (initial)' : '';
                        console.log(`    - ${screen.name}${initialFlag}`);
                    });
                }
                
                console.log(`  API Endpoints: ${endpointCount}`);
                if (endpointCount > 0) {
                    app.api?.endpoints?.forEach(endpoint => {
                        console.log(`    - ${endpoint.method.method} ${endpoint.path.substring(1, endpoint.path.length - 1)}`);
                    });
                }
                
                console.log(`  Navigation Type: ${app.navigation?.type.type}`);
                console.log(`  Navigation Items: ${app.navigation?.items?.length || 0}`);
                
                console.log(`  Mock Data: ${app.mockData ? 'Yes' : 'No'}`);
            }
            
            console.log(chalk.green('\nAnalysis completed successfully!'));
        } catch (error) {
            console.error(chalk.red(`Error analyzing file: ${error.message}`));
            process.exit(1);
        }
    });

// Add export command (stub for future implementation)
program
    .command('export')
    .description('Export a DSL file to target format')
    .argument('<file>', 'path to DSL file')
    .option('-o, --output <dir>', 'output directory')
    .option('-f, --format <format>', 'output format (json, yaml, etc.)', 'json')
    .action((filePath, options) => {
        console.log(chalk.yellow('Export functionality not yet implemented.'));
        console.log('Would export', filePath, 'to', options.format, 'format');
    });

// Add docs command to generate documentation from a DSL file
program
    .command('docs')
    .description('Generate documentation from a DSL file')
    .argument('<file>', 'path to DSL file')
    .option('-o, --output <dir>', 'output directory', './docs')
    .action(async (filePath, options) => {
        const fullPath = path.resolve(process.cwd(), filePath);
        const outputDir = path.resolve(process.cwd(), options.output);
        
        try {
            // Check if the file exists
            if (!fs.existsSync(fullPath)) {
                console.error(chalk.red(`File not found: ${fullPath}`));
                process.exit(1);
            }
            
            console.log(chalk.blue(`Generating documentation for ${filePath}...`));
            
            // Read the file
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Parse the file
            const parseResult = await parser.parse(content);
            
            // Check for parse errors
            if (parseResult.parserErrors.length > 0) {
                console.error(chalk.red('Parse errors:'));
                parseResult.parserErrors.forEach(error => {
                    console.error(chalk.red(`  - ${error.message} at line ${error.range.start.line + 1}, column ${error.range.start.character + 1}`));
                });
                process.exit(1);
            }
            
            // Get the AST
            const ast = parseResult.value;
            
            // Extract the App node
            const app = extractAstNode<App>(ast);
            
            // Create output directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Generate basic markdown documentation
            let markdown = `# ${app.displayName?.substring(1, app.displayName.length - 1)}\n\n`;
            markdown += `**App ID:** ${app.appId?.substring(1, app.appId.length - 1)}\n`;
            markdown += `**Version:** ${app.version?.substring(1, app.version.length - 1)}\n`;
            markdown += `**Platforms:** ${app.platforms?.map(p => p.name).join(', ')}\n\n`;
            
            // Models
            markdown += `## Data Models\n\n`;
            if (app.models && app.models.length > 0) {
                app.models.forEach(model => {
                    markdown += `### ${model.name}\n\n`;
                    markdown += `| Property | Type | Required | Default | Notes |\n`;
                    markdown += `|----------|------|----------|---------|-------|\n`;
                    
                    model.properties?.forEach(property => {
                        const required = property.features?.some(f => f.$type === 'RequiredFeature') ? '✓' : '';
                        
                        // Extract default value if present
                        let defaultValue = '';
                        const defaultFeature = property.features?.find(f => f.$type === 'DefaultValueFeature');
                        if (defaultFeature) {
                            const df = defaultFeature as any;
                            if (df.value) {
                                if (df.value.$type === 'StringValue') {
                                    defaultValue = df.value.value.substring(1, df.value.value.length - 1);
                                } else if (df.value.$type === 'NumberValue') {
                                    defaultValue = df.value.value;
                                } else if (df.value.$type === 'BooleanValue') {
                                    defaultValue = df.value.value;
                                }
                            }
                        }
                        
                        // Extract enum values if present
                        let notes = '';
                        const enumFeature = property.features?.find(f => f.$type === 'EnumValuesFeature');
                        if (enumFeature) {
                            const ef = enumFeature as any;
                            if (ef.values) {
                                const enumValues = ef.values.map((v: any) => {
                                    if (v.value.startsWith('"') || v.value.startsWith("'")) {
                                        return v.value.substring(1, v.value.length - 1);
                                    }
                                    return v.value;
                                }).join(', ');
                                notes = `Enum: [${enumValues}]`;
                            }
                        }
                        
                        markdown += `| ${property.name} | ${property.type.name}${property.type.isArray ? '[]' : ''} | ${required} | ${defaultValue} | ${notes} |\n`;
                    });
                    
                    markdown += '\n';
                });
            } else {
                markdown += 'No models defined.\n\n';
            }
            
            // Screens
            markdown += `## Screens\n\n`;
            if (app.screens && app.screens.length > 0) {
                app.screens.forEach(screen => {
                    const initialFlag = screen.isInitial ? ' (Initial Screen)' : '';
                    markdown += `### ${screen.name}${initialFlag}\n\n`;
                    markdown += `**Title:** ${screen.title.substring(1, screen.title.length - 1)}\n`;
                    markdown += `**Layout Type:** ${screen.layout.type.type}\n\n`;
                    
                    // Parameters
                    if (screen.params && screen.params.parameters.length > 0) {
                        markdown += `#### Parameters\n\n`;
                        markdown += `| Name | Type | Required |\n`;
                        markdown += `|------|------|----------|\n`;
                        
                        screen.params.parameters.forEach(param => {
                            markdown += `| ${param.name} | ${param.type.name} | ${param.isRequired ? '✓' : ''} |\n`;
                        });
                        
                        markdown += '\n';
                    }
                    
                    markdown += '\n';
                });
            } else {
                markdown += 'No screens defined.\n\n';
            }
            
            // API
            markdown += `## API Endpoints\n\n`;
            if (app.api && app.api.endpoints.length > 0) {
                markdown += `**Base URL:** ${app.api.baseUrl.substring(1, app.api.baseUrl.length - 1)}\n\n`;
                
                app.api.endpoints.forEach(endpoint => {
                    markdown += `### ${endpoint.id}\n\n`;
                    markdown += `**Method:** ${endpoint.method.method}\n`;
                    markdown += `**Path:** ${endpoint.path.substring(1, endpoint.path.length - 1)}\n\n`;
                    
                    // Parameters
                    if (endpoint.params && endpoint.params.parameters.length > 0) {
                        markdown += `#### Parameters\n\n`;
                        markdown += `| Name | Type | Required |\n`;
                        markdown += `|------|------|----------|\n`;
                        
                        endpoint.params.parameters.forEach(param => {
                            markdown += `| ${param.name} | ${param.type.name} | ${param.isRequired ? '✓' : ''} |\n`;
                        });
                        
                        markdown += '\n';
                    }
                    
                    // Request Body
                    if (endpoint.body) {
                        markdown += `#### Request Body\n\n`;
                        markdown += `Model: ${endpoint.body.modelRef.ref?.name || endpoint.body.modelRef.$refText}\n\n`;
                    }
                    
                    // Response
                    markdown += `#### Response\n\n`;
                    markdown += `Type: ${endpoint.response.type}${endpoint.response.isArray ? '[]' : ''}\n\n`;
                    
                    markdown += '\n';
                });
            } else {
                markdown += 'No API endpoints defined.\n\n';
            }
            
            // Save the markdown file
            const mdPath = path.join(outputDir, 'app-documentation.md');
            fs.writeFileSync(mdPath, markdown);
            
            console.log(chalk.green(`Documentation generated successfully: ${mdPath}`));
        } catch (error) {
            console.error(chalk.red(`Error generating documentation: ${error.message}`));
            process.exit(1);
        }
    });

// Parse the command line arguments
program.parse(process.argv);
