import fs from 'node:fs';
import path from 'node:path';
import { App } from '../language/generated/ast.js';
import { extractAstNode } from '../language/utils.js';
import { LangiumDocument } from 'langium';

/**
 * Safely get a property from an app object with different case variants
 */
function getAppProperty(app: any, propertyName: string, defaultValue: any = undefined): any {
    if (!app) return defaultValue;
    
    // Check for direct property access
    if (app[propertyName] !== undefined) {
        return app[propertyName];
    }
    
    // Try different case variants
    const variants = [
        propertyName,
        propertyName.toLowerCase(),
        propertyName.toUpperCase(),
        propertyName.charAt(0).toUpperCase() + propertyName.slice(1)
    ];
    
    for (const variant of variants) {
        if (app[variant] !== undefined) {
            return app[variant];
        }
    }
    
    return defaultValue;
}

/**
 * Dump the structure of an AST node to a file for debugging
 */
function dumpAppStructure(app: any, outputPath: string): void {
    const cache = new Set();
    const appJson = JSON.stringify(app, (key, value) => {
        if (key.startsWith('$') && key !== '$type') return undefined;
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
        }
        return value;
    }, 2);
    
    fs.writeFileSync(outputPath, appJson);
}

/**
 * Generate code for a Finance App DSL file.
 * 
 * @param document The document containing the parsed and validated model
 * @param outputDir The directory where the code should be generated
 * @param models Optional array of models to use
 * @param screens Optional array of screens to use
 * @returns The path to the generated file
 */
export function generateFinanceApp(document: LangiumDocument, outputDir: string, 
    models?: any[], screens?: any[]): string {
    // Extract the App node from the document
    const app = extractAstNode<App>(document);
    
    if (!app) {
        throw new Error('Could not extract App node from document');
    }
    
    // Debug: Dump the full app structure to a file
    dumpAppStructure(app, path.join(outputDir, 'app-debug.json'));
    
    console.log(`Found ${models?.length || 0} models and ${screens?.length || 0} screens`);
    
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate the code using the models and screens
    const code = generateAppCode(app, models || [], screens || []);
    
    // Write the code to a file
    const outputFilePath = path.join(outputDir, 'app.js');
    fs.writeFileSync(outputFilePath, code);
    
    return outputFilePath;
}

/**
 * Generate JavaScript code from an App node.
 * 
 * @param app The App node to generate code from
 * @param models The data models to generate code for
 * @param screens The screens to generate code for
 * @returns The generated code as a string
 */
function generateAppCode(app: App, models: any[], screens: any[]): string {
    const appDetails = {
        name: getAppProperty(app, 'name', 'Unnamed App'),
        id: getAppProperty(app, 'appId', 'unknown.id'),
        version: getAppProperty(app, 'version', '1.0.0'),
        platforms: Array.isArray(app.platforms) 
            ? app.platforms.map(p => p.name).join(', ') 
            : 'none'
    };
    
    const modelCode = generateModels(models);
    const screenCode = generateScreens(screens);
    const apiCode = generateApi(app);
    
    return `// Generated code for ${appDetails.name}
// Version: ${appDetails.version}
// App ID: ${appDetails.id}
// Platforms: ${appDetails.platforms}

${modelCode}

${screenCode}

${apiCode}

// App initialization
console.log("Initializing ${appDetails.name}");
`;
}

/**
 * Generate code for data models.
 * 
 * @param models The data models to generate code for
 * @returns The generated code as a string
 */
function generateModels(models: any[]): string {
    if (!models || models.length === 0) {
        return '// No models defined';
    }
    
    let result = '// Models';
    // Add validation utility functions
    result += `
// Validation utility functions
const validators = {
    isString(value) {
        return typeof value === 'string';
    },
    isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    },
    isBoolean(value) {
        return typeof value === 'boolean';
    },
    isDate(value) {
        return value instanceof Date && !isNaN(value.getTime());
    },
    isEmail(value) {
        return typeof value === 'string' && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
    },
    isPhoneNumber(value) {
        return typeof value === 'string' && /^\\+?[\\d\\s-()]{7,}$/.test(value);
    },
    isDecimal(value) {
        return (typeof value === 'number' && !isNaN(value)) || 
               (typeof value === 'string' && /^-?\\d+(\\.\\d+)?$/.test(value));
    },
    isInEnum(value, enumValues) {
        return enumValues.includes(value);
    }
};`;
    
    for (const model of models) {
        if (!model.name) continue;
        
        result += `\nclass ${model.name} {`;
        result += `\n    constructor(data = {}) {`;
        
        const properties = model.properties || [];
        for (const prop of properties) {
            if (!prop.name) continue;
            
            // Add default value handling
            let defaultValue = 'undefined';
            const propAttributes = prop.attributes || '';
            const defaultMatch = /default:\s*([^,\s]+)/.exec(propAttributes);
            
            if (defaultMatch) {
                defaultValue = defaultMatch[1];
                // Handle string defaults
                if (defaultValue.startsWith('"') || defaultValue.startsWith("'")) {
                    // Keep as is
                } else if (defaultValue === 'true' || defaultValue === 'false') {
                    // Boolean default
                } else if (!isNaN(Number(defaultValue))) {
                    // Numeric default
                } else {
                    defaultValue = `"${defaultValue}"`;
                }
            }
            
            result += `\n        this.${prop.name} = data.${prop.name} !== undefined ? data.${prop.name} : ${defaultValue};`;
        }
        
        result += '\n    }';
        
        if (properties.length > 0) {
            result += '\n\n    validate() {';
            result += '\n        const errors = [];';
            for (const prop of properties) {
                if (!prop.name) continue;
                
                // Check if property is required
                if (prop.isRequired) {
                    result += `\n        if (this.${prop.name} === undefined || this.${prop.name} === null) {`;
                    result += `\n            errors.push("${prop.name} is required");`;
                    result += '\n        }';
                }
                
                // Only do type validation if the property has a value
                result += `\n        if (this.${prop.name} !== undefined && this.${prop.name} !== null) {`;
                
                // Type validation based on property type
                switch (prop.type) {
                    case 'string':
                        result += `\n            if (!validators.isString(this.${prop.name})) {`;
                        result += `\n                errors.push("${prop.name} must be a string");`;
                        result += '\n            }';
                        break;
                        
                    case 'number':
                    case 'decimal':
                        result += `\n            if (!validators.isDecimal(this.${prop.name})) {`;
                        result += `\n                errors.push("${prop.name} must be a number");`;
                        result += '\n            }';
                        break;
                        
                    case 'boolean':
                        result += `\n            if (!validators.isBoolean(this.${prop.name})) {`;
                        result += `\n                errors.push("${prop.name} must be a boolean");`;
                        result += '\n            }';
                        break;
                        
                    case 'date':
                        result += `\n            if (!validators.isDate(this.${prop.name})) {`;
                        result += `\n                errors.push("${prop.name} must be a valid date");`;
                        result += '\n            }';
                        break;
                }
                
                // Check for enum validation
                const enumMatch = /enum:\s*\[(.*?)\]/.exec(prop.attributes || '');
                if (enumMatch) {
                    const enumValues = enumMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
                    result += `\n            const validEnumValues = [${enumValues.map(v => `"${v}"`).join(', ')}];`;
                    result += `\n            if (!validators.isInEnum(this.${prop.name}, validEnumValues)) {`;
                    result += `\n                errors.push("${prop.name} must be one of: ${enumValues.join(', ')}");`;
                    result += '\n            }';
                }
                
                // Special format validations
                if (prop.name.includes('email')) {
                    result += `\n            if (!validators.isEmail(this.${prop.name})) {`;
                    result += `\n                errors.push("${prop.name} must be a valid email address");`;
                    result += '\n            }';
                } else if (prop.name.includes('phone')) {
                    result += `\n            if (!validators.isPhoneNumber(this.${prop.name})) {`;
                    result += `\n                errors.push("${prop.name} must be a valid phone number");`;
                    result += '\n            }';
                }
                
                result += '\n        }';
            }
            result += '\n        return errors;';
            result += '\n    }';
        }
        
        result += '\n}\n';
    }
    
    return result;
}

/**
 * Generate code for screens.
 * 
 * @param screens The screens to generate code for
 * @returns The generated code as a string
 */
function generateScreens(screens: any[]): string {
    if (!screens || screens.length === 0) {
        return '// No screens defined';
    }
    
    let result = '// Screens';
    
    for (const screen of screens) {
        if (!screen.name) continue;
        
        const screenTitle = screen.title || screen.name;
        
        result += `\nfunction render${screen.name}(params = {}) {`;
        result += `\n    console.log("Rendering screen: ${screenTitle}");`;
        
        if (screen.layout) {
            const layoutType = screen.layout.type || 'unknown';
            result += `\n    // Layout type: ${layoutType}`;
        }
        
        result += '\n    return { screen: "' + screen.name + '" };';
        result += '\n}\n';
    }
    
    return result;
}

/**
 * Generate code for API endpoints.
 * 
 * @param app The App node containing the API
 * @returns The generated code as a string
 */
function generateApi(app: App): string {
    if (!app.api) {
        return '// No API defined';
    }
    
    // Get the base URL if available
    const baseUrl = getAppProperty(app.api, 'baseUrl', '');
    
    let result = '// API';
    result += `\nconst API_BASE_URL = "${baseUrl}";`;
    
    // Extract endpoints if available
    const endpoints = app.api.endpoints || [];
    
    if (endpoints.length > 0) {
        // Loop through each endpoint
        for (const endpoint of endpoints) {
            if (!endpoint.id) continue;
            
            const method = getAppProperty(endpoint, 'method', 'GET');
            const path = getAppProperty(endpoint, 'path', '/');
            
            result += `\n\n// Endpoint: ${endpoint.id}`;
            result += `\nasync function api${endpoint.id}(params = {}) {`;
            
            // Handle path parameters with template literals for dynamic substitution
            const hasPathParams = path.includes('{') && path.includes('}');
            if (hasPathParams) {
                result += `\n    // Replace path parameters with values from params`;
                result += `\n    let endpointPath = "${path}";`;
                result += `\n    const pathParams = endpointPath.match(/\\{([^}]+)\\}/g) || [];`;
                result += `\n    pathParams.forEach(param => {`;
                result += `\n        const paramName = param.slice(1, -1); // Remove { and }`;
                result += `\n        if (params[paramName] !== undefined) {`;
                result += `\n            endpointPath = endpointPath.replace(param, params[paramName]);`;
                result += `\n        }`;
                result += `\n    });`;
                result += `\n    const url = \`\${API_BASE_URL}\${endpointPath}\`;`;
            } else {
                result += `\n    const url = \`\${API_BASE_URL}${path}\`;`;
            }
            
            result += `\n    const options = { method: "${method}" };`;
            
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                result += '\n    options.headers = { "Content-Type": "application/json" };';
                result += '\n    options.body = JSON.stringify(params);';
            }
            
            result += '\n    try {';
            result += '\n        const response = await fetch(url, options);';
            result += '\n        return await response.json();';
            result += '\n    } catch (error) {';
            result += '\n        console.error("API error:", error);';
            result += '\n        throw error;';
            result += '\n    }';
            result += '\n}';
        }
    } else {
        result += '\n// No endpoints defined';
    }
    
    return result;
} 