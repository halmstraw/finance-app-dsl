#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Paths
const outDir = path.join(rootDir, 'out');
const cliSourcePath = path.join(outDir, 'main.js');
const cliDestPath = path.join(__dirname, 'cli.js');

// Create the CLI launcher script
const cliLauncher = `#!/usr/bin/env node

import { main } from '../out/cli/index.js';

main();
`;

console.log('Building CLI...');

// Create bin directory if it doesn't exist
if (!fs.existsSync(__dirname)) {
    fs.mkdirSync(__dirname, { recursive: true });
}

// Write the CLI launcher
fs.writeFileSync(cliDestPath, cliLauncher);
fs.chmodSync(cliDestPath, '755');

console.log(`CLI script written to ${cliDestPath}`);
console.log('CLI build complete! You can now run the CLI with "finance-app"'); 