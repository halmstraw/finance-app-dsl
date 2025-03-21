import { AstNode, LangiumDocument } from 'langium';
import { URI } from 'langium';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

/**
 * Extract the AST node from a document
 */
export function extractAstNode<T extends AstNode>(document: LangiumDocument): T {
    const ast = document.parseResult?.value;
    if (!ast) {
        throw new Error('Could not parse document');
    }
    return ast as T;
}

/**
 * Create a file at the given path with the given content
 */
export async function writeToFile(filePath: string, content: string): Promise<string> {
    const dirPath = path.dirname(filePath);
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (e) {
        console.warn(`Failed to create directory ${dirPath}`, e);
    }
    await fs.writeFile(filePath, content);
    return filePath;
}

/**
 * Extracts a document from the given file path
 */
export function extractDocument(fileName: string): URI {
    const absolutePath = path.resolve(process.cwd(), fileName);
    console.log('Absolute path:', absolutePath);
    return URI.file(absolutePath);
} 