import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createHttpServer } from '../src/server/http-server.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sledgeBin = path.resolve(__dirname, '..', 'bin', 'sledge.mjs');

test('CLI — version and help commands', async () => {
  const { stdout: versionOut } = await execFileAsync('node', [sledgeBin, 'version']);
  assert.ok(versionOut.includes('OneForge Sledge v1.0.0'));

  const { stdout: helpOut } = await execFileAsync('node', [sledgeBin, 'help']);
  assert.ok(helpOut.includes('Usage: sledge <command>'));
  assert.ok(helpOut.includes('analyze'));
  assert.ok(helpOut.includes('compare'));
});

test('CLI — search and get commands with JSON output', async () => {
  const { stdout: searchOut } = await execFileAsync('node', [sledgeBin, 'search', 'Linear', '--json']);
  const searchJson = JSON.parse(searchOut);
  assert.ok(searchJson.total >= 1);
  assert.equal(searchJson.results[0].name, 'Linear');

  const { stdout: getOut } = await execFileAsync('node', [sledgeBin, 'get', 'stripe.com', '--json']);
  const getJson = JSON.parse(getOut);
  assert.equal(getJson.name, 'Stripe');
  assert.equal(getJson.tokens.colors.primary, '#533AFD');
});

test('CLI — export command', async () => {
  const { stdout: cssOut } = await execFileAsync('node', [sledgeBin, 'export', 'stripe.com', '--format=css']);
  assert.ok(cssOut.includes(':root {'));
  assert.ok(cssOut.includes('--color-primary: #533AFD;'));
});

test('CLI — compare command with JSON output', async () => {
  const { stdout: cmpOut } = await execFileAsync('node', [
    sledgeBin,
    'compare',
    'stripe.com',
    'linear.app',
    '--json',
  ]);
  const cmpJson = JSON.parse(cmpOut);
  assert.equal(cmpJson.systemA.name, 'Stripe');
  assert.equal(cmpJson.systemB.name, 'Linear');
  assert.ok(cmpJson.similarityPercentage >= 0);
});

test('HTTP Server — REST API & Static Serving Integration', async () => {
  const port = 3498;
  const app = createHttpServer({ port });
  await app.listen();

  try {
    // 1. Catalog Endpoint
    const catRes = await fetch(`http://127.0.0.1:${port}/api/catalog`);
    assert.equal(catRes.status, 200);
    const catData = await catRes.json();
    assert.equal(catData.product, 'OneForge Sledge');
    assert.ok(catData.totalBrands >= 100);

    // 2. Search Endpoint
    const searchRes = await fetch(`http://127.0.0.1:${port}/api/search?q=Stripe`);
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.equal(searchData.results[0].name, 'Stripe');

    // 3. MCP JSON-RPC Endpoint
    const mcpRes = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    assert.equal(mcpRes.status, 200);
    const mcpData = await mcpRes.json();
    assert.equal(mcpData.result.tools.length, 6);

    // 4. Static HTML Endpoint
    const htmlRes = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(htmlRes.status, 200);
    const htmlText = await htmlRes.text();
    assert.ok(htmlText.includes('OneForge Sledge'));
  } finally {
    await app.close();
  }
});
