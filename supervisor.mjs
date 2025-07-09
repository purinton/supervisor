#!/usr/bin/env node

import 'dotenv/config';
import { path as pathMod } from 'path';
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


    const publicDir = path(import.meta, 'public');
    app.use((req, res, next) => {
        if (!['GET', 'HEAD'].includes(req.method)) return next();
        let reqPath = req.path;
        if (reqPath === '/') reqPath = '/index.html';
        const safePath = pathMod.normalize(reqPath).replace(/^([/\\])+/, '');
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