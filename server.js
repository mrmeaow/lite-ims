#!/usr/bin/env node
/**
 * Production server launcher
 * Runs the built API server from the project root
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import and run from project root where node_modules exists
const serverModule = await import('./dist/apps/api/index.js');

export default serverModule;
