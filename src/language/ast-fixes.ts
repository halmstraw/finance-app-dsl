/**
 * Helper functions for working with the AST
 */
import { AstNode } from 'langium';
import fs from 'node:fs';

/**
 * Safely get a property from an app object with different case variants
 */
export function getAppProperty(app: any, propertyName: string, defaultValue: any = undefined): any {
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
export function dumpAppStructure(app: AstNode, outputPath: string): void {
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