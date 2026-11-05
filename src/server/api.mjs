/**
 * OneForge Sledge — RESTful API Routing Engine
 */

import { CONFIG } from '../config.mjs';
import { handleMcpRequest } from '../mcp/server.mjs';
import { listBrands, listCategories, getDesignSystemByHost, listCustomDesignSystems, saveCustomDesignSystem } from '../discovery/repository.mjs';
import { searchDesignLibrary } from '../discovery/search.mjs';
import { compareDesignSystems } from '../discovery/compare.mjs';
import { extractWebsiteDesign } from '../extractor/pipeline.mjs';
import { synthesizeDesignSystem } from '../analyzer/intelligence.mjs';
import { generateDesignMd } from '../generator/markdown-generator.mjs';
import { exportTokens } from '../generator/exporters.mjs';
import { parseDesignMd, validateDesignSystem } from '../core/validator.mjs';

/**
 * Dispatches API requests based on method and pathname.
 */
export async function dispatchApiRequest(req, body = null) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  try {
    // 1. Health / Catalog overview
    if (method === 'GET' && pathname === '/api/catalog') {
      const brands = await listBrands();
      const categories = await listCategories();
      const custom = await listCustomDesignSystems();
      return {
        status: 200,
        data: {
          product: CONFIG.productName,
          version: CONFIG.version,
          totalBrands: brands.length,
          totalCustom: custom.length,
          categories,
        },
      };
    }

    // 2. Search
    if (method === 'GET' && pathname === '/api/search') {
      const query = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category') || '';
      const theme = url.searchParams.get('theme') || '';
      const color = url.searchParams.get('color') || '';
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      const results = await searchDesignLibrary({ query, category, theme, color, limit, offset });
      return { status: 200, data: results };
    }

    // 3. Get brand by host
    if (method === 'GET' && pathname.startsWith('/api/brands/')) {
      const host = pathname.replace('/api/brands/', '').trim();
      const system = await getDesignSystemByHost(host);
      if (!system) {
        return { status: 404, data: { error: `Design system for "${host}" not found.` } };
      }
      return { status: 200, data: system };
    }

    // 4. Safe website extraction
    if (method === 'POST' && pathname === '/api/extract') {
      if (!body || !body.url) {
        return { status: 400, data: { error: 'Missing required field: "url"' } };
      }
      const extraction = await extractWebsiteDesign(body.url, { skipRobots: Boolean(body.skipRobots) });
      return { status: extraction.success ? 200 : 422, data: extraction };
    }

    // 5. Website analysis and synthesis
    if (method === 'POST' && pathname === '/api/analyze') {
      if (!body || !body.url) {
        return { status: 400, data: { error: 'Missing required field: "url"' } };
      }
      const extraction = await extractWebsiteDesign(body.url, { skipRobots: Boolean(body.skipRobots) });
      if (!extraction.success) {
        return { status: 422, data: { error: extraction.error } };
      }
      const synthesized = synthesizeDesignSystem(extraction.extractedData, { url: body.url });
      return { status: 200, data: synthesized };
    }

    // 6. Generate DESIGN.md
    if (method === 'POST' && pathname === '/api/generate') {
      let system;
      if (body?.system) {
        system = body.system;
      } else if (body?.url) {
        const extraction = await extractWebsiteDesign(body.url);
        if (!extraction.success) return { status: 422, data: { error: extraction.error } };
        system = synthesizeDesignSystem(extraction.extractedData, { url: body.url });
      } else if (body?.host) {
        system = await getDesignSystemByHost(body.host);
      } else {
        return { status: 400, data: { error: 'Must provide "url", "host", or "system" payload.' } };
      }

      if (!system) return { status: 404, data: { error: 'Could not resolve system.' } };
      const markdown = generateDesignMd(system);
      return { status: 200, data: { markdown, system } };
    }

    // 7. Compare systems
    if (method === 'POST' && pathname === '/api/compare') {
      if (!body || !body.systemA || !body.systemB) {
        return { status: 400, data: { error: 'Must provide "systemA" and "systemB" hosts.' } };
      }
      const comparison = await compareDesignSystems(body.systemA, body.systemB);
      return { status: 200, data: comparison };
    }

    // 8. Export tokens
    if (method === 'POST' && pathname === '/api/export') {
      let system = body?.system;
      if (!system && body?.host) {
        system = await getDesignSystemByHost(body.host);
      }
      if (!system) {
        return { status: 404, data: { error: 'Must provide valid "host" or "system" object.' } };
      }
      const format = body?.format || 'css';
      const result = exportTokens(system, format);
      return { status: 200, data: result };
    }

    // 9. Custom design systems
    if (method === 'GET' && pathname === '/api/custom-systems') {
      const custom = await listCustomDesignSystems();
      return { status: 200, data: custom };
    }

    if (method === 'POST' && pathname === '/api/custom-systems') {
      if (!body || !body.content) {
        return { status: 400, data: { error: 'Missing DESIGN.md content string.' } };
      }
      const parsed = parseDesignMd(body.content);
      const saved = await saveCustomDesignSystem(parsed, body.content);
      return { status: 200, data: saved };
    }

    // 10. MCP JSON-RPC Gateway
    if (method === 'POST' && pathname === '/mcp') {
      const mcpResponse = await handleMcpRequest(body);
      return { status: 200, data: mcpResponse };
    }

    return { status: 404, data: { error: `Endpoint not found: ${method} ${pathname}` } };
  } catch (err) {
    return { status: 500, data: { error: `Server error: ${err.message}` } };
  }
}
