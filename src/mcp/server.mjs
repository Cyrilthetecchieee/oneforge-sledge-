/**
 * OneForge Sledge — Model Context Protocol (MCP) Server
 * Full compliance with JSON-RPC 2.0 over Stdio and HTTP streaming transports.
 */

import readline from 'node:readline';
import { CONFIG } from '../config.mjs';
import {
  MCP_ERROR_CODES,
  formatErrorResponse,
  formatSuccessResponse,
  parseJsonRpcMessage,
} from './protocol.mjs';
import { MCP_TOOLS_MANIFEST, executeMcpTool } from './tools.mjs';

/**
 * Handles an incoming parsed JSON-RPC request and returns the response object.
 */
export async function handleMcpRequest(req) {
  if (!req || typeof req !== 'object') {
    return formatErrorResponse(null, MCP_ERROR_CODES.INVALID_REQUEST, 'Request is not an object.');
  }

  const { id, method, params } = req;

  // Handle standard MCP / JSON-RPC methods
  switch (method) {
    case 'initialize':
      return formatSuccessResponse(id, {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'oneforge-sledge-mcp',
          version: CONFIG.version,
          description: 'OneForge Sledge Design Intelligence & Design Tokens Platform',
        },
        capabilities: {
          tools: {},
        },
      });

    case 'notifications/initialized':
      // Notification without return
      return null;

    case 'ping':
      return formatSuccessResponse(id, {});

    case 'tools/list':
      return formatSuccessResponse(id, {
        tools: MCP_TOOLS_MANIFEST,
      });

    case 'tools/call': {
      if (!params || !params.name) {
        return formatErrorResponse(id, MCP_ERROR_CODES.INVALID_PARAMS, 'Missing "params.name" for tools/call');
      }
      try {
        const toolResult = await executeMcpTool(params.name, params.arguments || {});
        return formatSuccessResponse(id, toolResult);
      } catch (err) {
        return formatErrorResponse(id, MCP_ERROR_CODES.INTERNAL_ERROR, err.message);
      }
    }

    default:
      return formatErrorResponse(id, MCP_ERROR_CODES.METHOD_NOT_FOUND, `Method not found: "${method}"`);
  }
}

/**
 * Launches the MCP server on stdio for CLI / Agent integration (Claude Code, Cursor, Codex).
 */
export function startMcpStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const parseRes = parseJsonRpcMessage(trimmed);
    if (!parseRes.valid) {
      const errRes = formatErrorResponse(null, MCP_ERROR_CODES.PARSE_ERROR, parseRes.error);
      process.stdout.write(JSON.stringify(errRes) + '\n');
      return;
    }

    const response = await handleMcpRequest(parseRes.message);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  });

  process.stderr.write(`[OneForge Sledge MCP] Server running on stdio (v${CONFIG.version})\n`);
}
