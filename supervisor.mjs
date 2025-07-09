#!/usr/bin/env node

import 'dotenv/config';
import pathMod from 'path';
import { mcpServer } from '@purinton/mcp-server';
import { fs, log, path, registerHandlers, registerSignals } from '@purinton/common';
import mime from 'mime-types';

registerHandlers({ log });
registerSignals({ log });

const packagePath = path(import.meta, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const name = packageJson.name || 'supervisor';
const version = packageJson.version || '1.0.0';

const port = parseInt(process.env.MCP_PORT || '1234', 10);
const token = process.env.MCP_TOKEN;
if (!token) {
    log.error('MCP_TOKEN environment variable is required.');
    process.exit(1);
}

const toolsDir = path(import.meta, 'tools');
if (!fs.existsSync(toolsDir)) {
    log.error(`Tools directory not found: ${toolsDir}`);
    process.exit(1);
}

const authCallback = (bearerToken) => {
    return bearerToken === token;
};

try {
    const { app, httpInstance, transport } = await mcpServer({
        name, version, port, token, toolsDir, log, authCallback
    });

    app._router.stack = app._router.stack.filter(
        layer => !(layer.route && layer.route.path === '/' && layer.route.methods.get)
    );

    const publicDir = path(import.meta, 'public');
    app.get('/', (req, res) => {
        const indexPath = path(publicDir, 'index.html');
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
            res.sendFile(indexPath);
        } else {
            res.status(404).send('index.html not found');
        }
    });

    // Serve all other static files in public
    app.use((req, res, next) => {
        if (!['GET', 'HEAD'].includes(req.method)) return next();
        const safePath = pathMod.normalize(req.path).replace(/^([/\\])+/, '');
        if (!safePath) return next();
        const filePath = path(publicDir, ...safePath.split(/[\\/]/));
        if (!filePath.startsWith(publicDir)) {
            res.status(403).send('Forbidden');
            return;
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const mimeType = mime.lookup(filePath) || 'application/octet-stream';
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.sendFile(filePath);
        } else {
            next();
        }
    });

    registerSignals({ shutdownHook: () => httpInstance.close() });
    registerSignals({ shutdownHook: () => transport.close() });
    log.info('Ready', { name, version, port });
} catch (err) {
    log.error('Failed to start MCP server', { error: err });
    process.exit(1);
}