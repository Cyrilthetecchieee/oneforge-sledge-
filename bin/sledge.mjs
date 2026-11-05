#!/usr/bin/env node

/**
 * OneForge Sledge — Command Line Interface
 * Unified CLI executable for design system discovery, extraction, analysis, generation, comparison, and export.
 */

import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../src/config.mjs';
import { searchDesignLibrary } from '../src/discovery/search.mjs';
import { getDesignSystemByHost } from '../src/discovery/repository.mjs';
import { compareDesignSystems } from '../src/discovery/compare.mjs';
import { extractWebsiteDesign } from '../src/extractor/pipeline.mjs';
import { synthesizeDesignSystem } from '../src/analyzer/intelligence.mjs';
import { generateDesignMd } from '../src/generator/markdown-generator.mjs';
import { exportTokens } from '../src/generator/exporters.mjs';
import { parseDesignMd, validateDesignSystem } from '../src/core/validator.mjs';
import { startMcpStdioServer } from '../src/mcp/server.mjs';
import { createHttpServer } from '../src/server/http-server.mjs';

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'help';

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const parts = arg.slice(2).split('=');
      flags[parts[0]] = parts.length > 1 ? parts.slice(1).join('=') : true;
    } else if (arg.startsWith('-') && arg.length === 2) {
      flags[arg[1]] = true;
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

const { flags, positional } = parseFlags(args.slice(1));

async function main() {
  switch (command) {
    case 'version':
    case '-v':
    case '--version': {
      console.log(`${CONFIG.productName} v${CONFIG.version} (${CONFIG.parentBrand})`);
      break;
    }

    case 'help':
    case '-h':
    case '--help': {
      printHelp();
      break;
    }

    case 'init': {
      const targetDir = positional[0] || '.';
      const targetPath = path.resolve(targetDir, 'DESIGN.md');
      if (existsSync(targetPath) && !flags.force) {
        console.error(`Error: DESIGN.md already exists at ${targetPath}. Use --force to overwrite.`);
        process.exitCode = 1;
        return;
      }
      const template = `---
version: alpha
name: Starter Design System
description: "Initial starter design system created with OneForge Sledge"
colors:
  background: "#FFFFFF"
  surface: "#F8FAFC"
  on-surface: "#0F172A"
  primary: "#38BDF8"
  on-primary: "#FFFFFF"
typography:
  headline-lg:
    fontFamily: system-ui, sans-serif
    fontSize: 32px
    fontWeight: 700
  body-md:
    fontFamily: system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
rounded:
  sm: 4px
  md: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
---

# Starter Design System

## Overview
This design system provides baseline design tokens for rapid frontend engineering.
`;
      await writeFile(targetPath, template, 'utf8');
      console.log(`Initialized starter DESIGN.md at: ${targetPath}`);
      break;
    }

    case 'search': {
      const query = positional[0] || '';
      const category = flags.category || '';
      const theme = flags.theme || '';
      const color = flags.color || '';
      const limit = parseInt(flags.limit || '15', 10);

      const results = await searchDesignLibrary({ query, category, theme, color, limit });
      if (flags.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(`Found ${results.total} design systems:`);
        console.log('--------------------------------------------------------------------------------');
        console.log(`| ${'Brand'.padEnd(20)} | ${'Category'.padEnd(24)} | ${'Theme'.padEnd(7)} | ${'Colors'.padEnd(20)} |`);
        console.log('--------------------------------------------------------------------------------');
        for (const item of results.results) {
          const colorList = (item.colors || []).slice(0, 3).join(' ');
          console.log(
            `| ${item.name.padEnd(20)} | ${item.category.padEnd(24)} | ${item.theme.padEnd(7)} | ${colorList.padEnd(20)} |`
          );
        }
        console.log('--------------------------------------------------------------------------------');
      }
      break;
    }

    case 'get': {
      const host = positional[0];
      if (!host) {
        console.error('Error: Please specify brand host (e.g., sledge get stripe.com)');
        process.exitCode = 1;
        return;
      }
      const system = await getDesignSystemByHost(host);
      if (!system) {
        console.error(`Error: Design system for "${host}" not found.`);
        process.exitCode = 1;
        return;
      }
      if (flags.json) {
        console.log(JSON.stringify(system, null, 2));
      } else {
        console.log(`\n=== ${system.name} (${system.host}) ===`);
        console.log(`Theme: ${system.theme}`);
        console.log(`Category: ${system.category}`);
        console.log(`Primary Color: ${system.tokens?.colors?.primary || 'N/A'}`);
        console.log(`Background: ${system.tokens?.colors?.background || 'N/A'}`);
        console.log(`Typeface: ${Object.values(system.tokens?.typography || {})[0]?.fontFamily || 'N/A'}`);
        console.log(`Corner Radius: ${system.tokens?.rounded?.sm || 'N/A'}`);
        console.log(`Confidence: ${Math.round((system.confidence?.overall || 0.8) * 100)}%\n`);
      }
      break;
    }

    case 'extract': {
      const url = positional[0];
      if (!url) {
        console.error('Error: Please specify website URL (e.g., sledge extract https://example.com)');
        process.exitCode = 1;
        return;
      }
      console.log(`Extracting design characteristics from: ${url}...`);
      const extraction = await extractWebsiteDesign(url, { skipRobots: Boolean(flags['skip-robots']) });
      if (!extraction.success) {
        console.error(`Extraction failed: ${extraction.error}`);
        process.exitCode = 1;
        return;
      }
      if (flags.json) {
        console.log(JSON.stringify(extraction, null, 2));
      } else {
        console.log(`\nSuccessfully extracted ${extraction.extractedData.elementCount} elements in ${extraction.durationMs}ms`);
        console.log(`Observed Colors: ${extraction.extractedData.observedColors.length}`);
        console.log(`Font Families: ${extraction.extractedData.typography.families.map((f) => f.name).join(', ')}`);
        console.log(`Detected Theme: ${extraction.extractedData.theme}`);
      }
      break;
    }

    case 'analyze': {
      const url = positional[0];
      if (!url) {
        console.error('Error: Please specify website URL (e.g., sledge analyze https://example.com)');
        process.exitCode = 1;
        return;
      }
      console.log(`Analyzing design intelligence for: ${url}...`);
      const extraction = await extractWebsiteDesign(url, { skipRobots: Boolean(flags['skip-robots']) });
      if (!extraction.success) {
        console.error(`Analysis failed: ${extraction.error}`);
        process.exitCode = 1;
        return;
      }
      const synthesized = synthesizeDesignSystem(extraction.extractedData, { url });
      if (flags.json) {
        console.log(JSON.stringify(synthesized, null, 2));
      } else {
        console.log(`\n=== OneForge Design Intelligence: ${synthesized.name} ===`);
        console.log(`Overall Confidence: ${Math.round(synthesized.confidence.overall * 100)}%`);
        console.log(`Theme: ${synthesized.theme}`);
        console.log(`Primary Accent: ${synthesized.tokens.colors.primary}`);
        console.log(`Surface Background: ${synthesized.tokens.colors.background}`);
        console.log(`Spacing Grid: ${synthesized.tokens.spacing.xs} base`);
        console.log(`Corner Radius: ${synthesized.tokens.rounded.sm}`);
        console.log(`\nDo's:`);
        synthesized.documentation.dos.forEach((d) => console.log(`  + ${d}`));
      }
      break;
    }

    case 'generate': {
      const target = positional[0];
      if (!target) {
        console.error('Error: Please specify URL or host to generate DESIGN.md');
        process.exitCode = 1;
        return;
      }
      let system;
      if (target.startsWith('http://') || target.startsWith('https://')) {
        console.log(`Extracting and synthesizing DESIGN.md for: ${target}...`);
        const extraction = await extractWebsiteDesign(target, { skipRobots: Boolean(flags['skip-robots']) });
        if (!extraction.success) {
          console.error(`Generation failed: ${extraction.error}`);
          process.exitCode = 1;
          return;
        }
        system = synthesizeDesignSystem(extraction.extractedData, { url: target });
      } else {
        system = await getDesignSystemByHost(target);
      }

      if (!system) {
        console.error(`Error: Could not resolve design system for: "${target}"`);
        process.exitCode = 1;
        return;
      }

      const markdown = generateDesignMd(system);
      const outputPath = flags.output || flags.o || 'DESIGN.md';
      await writeFile(path.resolve(outputPath), markdown, 'utf8');
      console.log(`Successfully generated DESIGN.md at: ${path.resolve(outputPath)}`);
      break;
    }

    case 'compare': {
      const sysA = positional[0];
      const sysB = positional[1];
      if (!sysA || !sysB) {
        console.error('Error: Please specify two system hosts (e.g., sledge compare stripe.com linear.app)');
        process.exitCode = 1;
        return;
      }
      const comparison = await compareDesignSystems(sysA, sysB);
      if (flags.json) {
        console.log(JSON.stringify(comparison, null, 2));
      } else {
        console.log(`\n=== Comparison: ${comparison.systemA.name} vs ${comparison.systemB.name} ===`);
        console.log(`Similarity Index: ${comparison.similarityPercentage}%`);
        console.log(`Theme Match: ${comparison.general.themeMatch ? 'Yes' : 'No (Light vs Dark)'}`);
        console.log(`Primary Accent DeltaE: ${comparison.color.primaryDeltaE} (${comparison.color.isVisuallyClose ? 'Close' : 'Divergent'})`);
        console.log(`Palette Overlap: ${comparison.color.paletteOverlapPct}%`);
        console.log(`Shared Fonts: ${comparison.typography.sharedFonts.join(', ') || 'None'}`);
      }
      break;
    }

    case 'export': {
      const host = positional[0];
      if (!host) {
        console.error('Error: Please specify brand host (e.g., sledge export stripe.com --format=css)');
        process.exitCode = 1;
        return;
      }
      const system = await getDesignSystemByHost(host);
      if (!system) {
        console.error(`Error: System "${host}" not found.`);
        process.exitCode = 1;
        return;
      }
      const format = flags.format || 'css';
      const result = exportTokens(system, format);
      if (flags.output || flags.o) {
        const outPath = path.resolve(flags.output || flags.o);
        await writeFile(outPath, result.content, 'utf8');
        console.log(`Exported tokens (${result.format}) to: ${outPath}`);
      } else {
        console.log(result.content);
      }
      break;
    }

    case 'validate': {
      const filePath = positional[0] || 'DESIGN.md';
      if (!existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exitCode = 1;
        return;
      }
      const content = await readFile(path.resolve(filePath), 'utf8');
      try {
        const parsed = parseDesignMd(content);
        const validation = validateDesignSystem(parsed);
        if (validation.valid) {
          console.log(`PASS: "${filePath}" is a valid specification-compliant DESIGN.md file.`);
          if (validation.warnings.length > 0) {
            console.log(`Warnings (${validation.warnings.length}):`);
            validation.warnings.forEach((w) => console.log(`  ! ${w}`));
          }
        } else {
          console.error(`FAIL: "${filePath}" has validation errors:`);
          validation.errors.forEach((e) => console.error(`  x ${e}`));
          process.exitCode = 1;
        }
      } catch (err) {
        console.error(`FAIL: Could not parse DESIGN.md: ${err.message}`);
        process.exitCode = 1;
      }
      break;
    }

    case 'mcp': {
      startMcpStdioServer();
      break;
    }

    case 'serve': {
      const port = parseInt(flags.port || String(CONFIG.server.defaultPort), 10);
      const app = createHttpServer({ port });
      const info = await app.listen();
      console.log(`\n=============================================================`);
      console.log(`  ONEFORGE SLEDGE — AI Design Intelligence Platform`);
      console.log(`  Dashboard running at: ${info.url}`);
      console.log(`  MCP Endpoint at:      ${info.url}/mcp`);
      console.log(`  REST API at:          ${info.url}/api/catalog`);
      console.log(`=============================================================\n`);
      break;
    }

    default: {
      console.error(`Unrecognized command: "${command}". Run "sledge help" for available commands.`);
      process.exitCode = 1;
    }
  }
}

function printHelp() {
  console.log(`
OneForge Sledge — AI-Powered Design Intelligence & Design Tokens Platform
Usage: sledge <command> [options]

Commands:
  init [dir]                     Initialize a new starter DESIGN.md file
  search <query>                 Search the design systems catalog (filters: --category, --theme, --color)
  get <host>                     Display structured design tokens for a brand
  extract <url>                  Safely extract raw styles and DOM heuristics from a website
  analyze <url>                  Extract, cluster, and synthesize design intelligence with confidence scores
  generate <url|host> [-o file]  Generate a complete, specification-compliant DESIGN.md document
  compare <sysA> <sysB>          Deep side-by-side comparison of two design systems
  export <host> --format=<fmt>   Export tokens to "css", "tailwind", "dtcg" (JSON), or "scss"
  validate [file]                Validate a DESIGN.md file against standard schema specifications
  mcp                            Start the Model Context Protocol (MCP) server on stdio
  serve [--port=3456]            Launch the Web Dashboard and REST API server
  version                        Display OneForge Sledge version
  help                           Show this command reference

Flags:
  --json                         Output result formatted as JSON
  --skip-robots                  Bypass robots.txt directive check for extraction
  --output, -o <path>            Target output file path for generation and export
  --format=<css|tailwind|dtcg|scss> Format to export tokens into
`);
}

main().catch((err) => {
  console.error(`Fatal Sledge Error: ${err.message}`);
  process.exitCode = 1;
});
