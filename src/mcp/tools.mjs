/**
 * OneForge Sledge — Model Context Protocol (MCP) Tool Registrations & Handlers
 */

import { searchDesignLibrary } from '../discovery/search.mjs';
import { getDesignSystemByHost } from '../discovery/repository.mjs';
import { compareDesignSystems } from '../discovery/compare.mjs';
import { extractWebsiteDesign } from '../extractor/pipeline.mjs';
import { synthesizeDesignSystem } from '../analyzer/intelligence.mjs';
import { generateDesignMd } from '../generator/markdown-generator.mjs';
import { exportTokens } from '../generator/exporters.mjs';

export const MCP_TOOLS_MANIFEST = [
  {
    name: 'sledge_search_library',
    description:
      'Search the OneForge Sledge design system catalog by brand name, industry category, theme, font, or hex color similarity.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Brand or keyword to search (e.g., "Stripe", "Linear", "SaaS")' },
        category: { type: 'string', description: 'Industry category filter (e.g., "Developer tools", "Fintech and payments")' },
        theme: { type: 'string', enum: ['light', 'dark', 'all'], description: 'Theme filter' },
        color: { type: 'string', description: 'Target hex color (e.g., "#533AFD") for perceptual similarity search' },
        limit: { type: 'number', description: 'Maximum number of results to return (default 10)' },
      },
    },
  },
  {
    name: 'sledge_get_design_system',
    description: 'Retrieve complete structured design tokens and DESIGN.md specification for a specific brand or host.',
    inputSchema: {
      type: 'object',
      required: ['host'],
      properties: {
        host: { type: 'string', description: 'Domain host of the brand (e.g., "stripe.com", "linear.app", "vercel.com")' },
      },
    },
  },
  {
    name: 'sledge_analyze_website',
    description:
      'Extract design characteristics from a live public website URL and synthesize normalized tokens with confidence scores.',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', description: 'Public HTTP or HTTPS website URL to analyze' },
        skipRobots: { type: 'boolean', description: 'Whether to skip robots.txt permission checks' },
      },
    },
  },
  {
    name: 'sledge_generate_design_md',
    description: 'Generate a complete, specification-compliant DESIGN.md document from a live website or token input.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Live URL to analyze and generate DESIGN.md for' },
        host: { type: 'string', description: 'Existing library host to re-generate DESIGN.md for' },
      },
    },
  },
  {
    name: 'sledge_compare_design_systems',
    description: 'Perform a deep side-by-side comparison between two design systems in the library.',
    inputSchema: {
      type: 'object',
      required: ['systemA', 'systemB'],
      properties: {
        systemA: { type: 'string', description: 'First brand host (e.g., "stripe.com")' },
        systemB: { type: 'string', description: 'Second brand host (e.g., "linear.app")' },
      },
    },
  },
  {
    name: 'sledge_export_tokens',
    description: 'Export design tokens for a brand into CSS variables, Tailwind config, W3C DTCG JSON, or SCSS.',
    inputSchema: {
      type: 'object',
      required: ['host', 'format'],
      properties: {
        host: { type: 'string', description: 'Brand host (e.g., "stripe.com")' },
        format: {
          type: 'string',
          enum: ['css', 'tailwind', 'dtcg', 'scss'],
          description: 'Export format: "css", "tailwind", "dtcg", or "scss"',
        },
      },
    },
  },
];

/**
 * Executes an MCP tool call by name and arguments.
 */
export async function executeMcpTool(name, args = {}) {
  switch (name) {
    case 'sledge_search_library': {
      const searchRes = await searchDesignLibrary({
        query: args.query || '',
        category: args.category || '',
        theme: args.theme || '',
        color: args.color || '',
        limit: args.limit || 10,
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(searchRes, null, 2),
          },
        ],
      };
    }

    case 'sledge_get_design_system': {
      if (!args.host) throw new Error('Missing required parameter: "host".');
      const system = await getDesignSystemByHost(args.host);
      if (!system) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Design system for "${args.host}" not found.` }],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(system, null, 2),
          },
        ],
      };
    }

    case 'sledge_analyze_website': {
      if (!args.url) throw new Error('Missing required parameter: "url".');
      const extraction = await extractWebsiteDesign(args.url, { skipRobots: Boolean(args.skipRobots) });
      if (!extraction.success) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Extraction failed: ${extraction.error}` }],
        };
      }
      const synthesized = synthesizeDesignSystem(extraction.extractedData, { url: args.url });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(synthesized, null, 2),
          },
        ],
      };
    }

    case 'sledge_generate_design_md': {
      let system;
      if (args.url) {
        const extraction = await extractWebsiteDesign(args.url);
        if (!extraction.success) {
          return { isError: true, content: [{ type: 'text', text: `Extraction failed: ${extraction.error}` }] };
        }
        system = synthesizeDesignSystem(extraction.extractedData, { url: args.url });
      } else if (args.host) {
        system = await getDesignSystemByHost(args.host);
      } else {
        throw new Error('Must provide either "url" or "host" to generate DESIGN.md.');
      }

      if (!system) {
        return { isError: true, content: [{ type: 'text', text: 'System could not be resolved.' }] };
      }

      const designMd = generateDesignMd(system);
      return {
        content: [{ type: 'text', text: designMd }],
      };
    }

    case 'sledge_compare_design_systems': {
      if (!args.systemA || !args.systemB) {
        throw new Error('Must provide both "systemA" and "systemB" hosts.');
      }
      const comparison = await compareDesignSystems(args.systemA, args.systemB);
      return {
        content: [{ type: 'text', text: JSON.stringify(comparison, null, 2) }],
      };
    }

    case 'sledge_export_tokens': {
      if (!args.host || !args.format) {
        throw new Error('Must provide both "host" and "format".');
      }
      const system = await getDesignSystemByHost(args.host);
      if (!system) {
        return { isError: true, content: [{ type: 'text', text: `Design system "${args.host}" not found.` }] };
      }
      const exported = exportTokens(system, args.format);
      return {
        content: [{ type: 'text', text: exported.content }],
      };
    }

    default:
      throw new Error(`Unrecognized tool: "${name}".`);
  }
}
