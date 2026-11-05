/**
 * OneForge Sledge — Model Context Protocol (MCP) JSON-RPC 2.0 Protocol Engine
 */

export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

export function formatSuccessResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id: id !== undefined ? id : null,
    result,
  };
}

export function formatErrorResponse(id, code, message, data = null) {
  const errorObj = { code, message };
  if (data !== null) errorObj.data = data;
  return {
    jsonrpc: '2.0',
    id: id !== undefined ? id : null,
    error: errorObj,
  };
}

export function parseJsonRpcMessage(rawString) {
  try {
    const parsed = JSON.parse(rawString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Payload is not a valid JSON object' };
    }
    return { valid: true, message: parsed };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}
