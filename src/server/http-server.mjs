/**
 * OneForge Sledge — Embedded HTTP Server
 * Serves the REST API, MCP endpoints, and Developer Dashboard Single-Page Application.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config.mjs';
import { dispatchApiRequest } from './api.mjs';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

/**
 * Creates and starts the OneForge Sledge HTTP Server.
 */
export function createHttpServer(options = {}) {
  const port = options.port || CONFIG.server.defaultPort;
  const host = options.host || CONFIG.server.defaultHost;

  const server = http.createServer(async (req, res) => {
    // Enable CORS for API consumers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Route 1: API and MCP Handlers
    if (pathname.startsWith('/api/') || pathname === '/mcp') {
      let body = null;
      if (req.method === 'POST') {
        try {
          body = await readJsonBody(req);
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Malformed JSON body: ${err.message}` }));
          return;
        }
      }

      const apiResult = await dispatchApiRequest(req, body);
      res.writeHead(apiResult.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(apiResult.data));
      return;
    }

    // Route 2: Static Asset Serving from src/web and assets/
    let filePath;
    if (pathname.startsWith('/assets/')) {
      filePath = path.join(CONFIG.paths.root, pathname);
    } else if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(CONFIG.paths.web, 'index.html');
    } else {
      const cleanPath = pathname.replace(/^\/+/, '');
      filePath = path.join(CONFIG.paths.web, cleanPath);
    }

    if (existsSync(filePath)) {
      try {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const fileContent = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Internal Server Error: ${err.message}`);
        return;
      }
    }

    // Default SPA fallback: serve index.html for client-side routing
    const fallbackIndex = path.join(CONFIG.paths.web, 'index.html');
    if (existsSync(fallbackIndex)) {
      const html = await readFile(fallbackIndex);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return {
    server,
    listen: () =>
      new Promise((resolve) => {
        server.listen(port, host, () => {
          resolve({ port, host, url: `http://${host}:${port}` });
        });
      }),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data.trim()) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
