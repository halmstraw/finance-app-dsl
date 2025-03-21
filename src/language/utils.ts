/**
 * Utility functions for working with Langium
 */
import { LangiumDocument } from 'langium';

/**
 * Extract the main AST node from a Langium document
 * 
 * @param document The Langium document
 * @returns The AST node or undefined if not found
 */
export function extractAstNode<T>(document: LangiumDocument): T | undefined {
    if (!document.parseResult) {
        return undefined;
    }
    
    return document.parseResult.value as T;
} 