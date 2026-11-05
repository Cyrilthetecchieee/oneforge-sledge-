import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMcpRequest } from '../src/mcp/server.mjs';
import { MCP_TOOLS_MANIFEST } from '../src/mcp/tools.mjs';

test('MCP — Initialize Handshake', async () => {
  const req = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {},
  };

  const res = await handleMcpRequest(req);
  assert.equal(res.jsonrpc, '2.0');
  assert.equal(res.id, 1);
  assert.equal(res.result.serverInfo.name, 'oneforge-sledge-mcp');
  assert.ok(res.result.capabilities.tools);
});

test('MCP — Tools Manifest Listing', async () => {
  const req = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
  };

  const res = await handleMcpRequest(req);
  assert.equal(res.id, 2);
  const tools = res.result.tools;
  assert.equal(tools.length, 6);

  const toolNames = tools.map((t) => t.name);
  assert.ok(toolNames.includes('sledge_search_library'));
  assert.ok(toolNames.includes('sledge_get_design_system'));
  assert.ok(toolNames.includes('sledge_analyze_website'));
  assert.ok(toolNames.includes('sledge_generate_design_md'));
  assert.ok(toolNames.includes('sledge_compare_design_systems'));
  assert.ok(toolNames.includes('sledge_export_tokens'));
});

test('MCP — Tool Call: sledge_search_library', async () => {
  const req = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'sledge_search_library',
      arguments: {
        query: 'Stripe',
      },
    },
  };

  const res = await handleMcpRequest(req);
  assert.equal(res.id, 3);
  const content = JSON.parse(res.result.content[0].text);
  assert.ok(content.total >= 1);
  assert.equal(content.results[0].name, 'Stripe');
});

test('MCP — Tool Call: sledge_get_design_system', async () => {
  const req = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'sledge_get_design_system',
      arguments: {
        host: 'linear.app',
      },
    },
  };

  const res = await handleMcpRequest(req);
  assert.equal(res.id, 4);
  const system = JSON.parse(res.result.content[0].text);
  assert.equal(system.name, 'Linear');
  assert.ok(system.tokens.colors.background);
});

test('MCP — Tool Call: sledge_export_tokens to CSS', async () => {
  const req = {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'sledge_export_tokens',
      arguments: {
        host: 'stripe.com',
        format: 'css',
      },
    },
  };

  const res = await handleMcpRequest(req);
  assert.equal(res.id, 5);
  const css = res.result.content[0].text;
  assert.ok(css.includes(':root {'));
  assert.ok(css.includes('--color-primary:'));
});

test('MCP — Error Handling for Unknown Method & Bad Params', async () => {
  const badMethod = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 99,
    method: 'nonexistent_method',
  });
  assert.ok(badMethod.error);
  assert.equal(badMethod.error.code, -32601);

  const missingParams = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 100,
    method: 'tools/call',
    params: {},
  });
  assert.ok(missingParams.error);
  assert.equal(missingParams.error.code, -32602);
});
