/**
 * OneForge Sledge — Programmatic SDK Entrypoint
 * Exporting core modules for programmatic design intelligence and token automation.
 */

export { CONFIG } from './config.mjs';

// Core
export {
  createDesignSystem,
  createTypographyRule,
  createComponentToken,
  createProvenance,
  createConfidenceScores,
  COLOR_ROLES,
  TYPOGRAPHY_ROLES,
  SPACING_STEPS,
  ROUNDED_STEPS,
} from './core/types.mjs';

export {
  parseFrontmatter,
  parseDesignMd,
  validateDesignSystem,
  validateUrl,
} from './core/validator.mjs';

export {
  isPrivateOrReservedIp,
  validateSafeUrlForFetch,
  sanitizeHostForPath,
  escapeHtml,
} from './core/security.mjs';

// Discovery & Comparison
export {
  loadCatalogIndex,
  listBrands,
  listCategories,
  getDesignSystemByHost,
  saveCustomDesignSystem,
  listCustomDesignSystems,
} from './discovery/repository.mjs';

export {
  searchDesignLibrary,
  deltaE,
  hexToRgb,
  rgbToXyz,
  xyzToLab,
} from './discovery/search.mjs';

export { compareDesignSystems } from './discovery/compare.mjs';

// Extraction
export { extractWebsiteDesign } from './extractor/pipeline.mjs';
export { safeFetch } from './extractor/http.mjs';
export { parseHtmlDesignTokens } from './extractor/html-parser.mjs';
export { checkRobotsPermission, isPathAllowed } from './extractor/robots.mjs';

// Intelligence & Analysis
export { synthesizeDesignSystem } from './analyzer/intelligence.mjs';
export {
  clusterSimilarColors,
  assignSemanticRoles,
  normalizeColorToHex,
  getRelativeLuminance,
  getContrastRatio,
} from './analyzer/color-normalizer.mjs';
export { analyzeTypographyTokens } from './analyzer/typography-analyzer.mjs';
export { analyzeSpacingAndShapes } from './analyzer/spacing-analyzer.mjs';

// Generation & Exporters
export { generateDesignMd } from './generator/markdown-generator.mjs';
export {
  exportToCssVariables,
  exportToTailwind,
  exportToDtcgJson,
  exportToScss,
  exportTokens,
} from './generator/exporters.mjs';

// MCP
export { handleMcpRequest, startMcpStdioServer } from './mcp/server.mjs';
export { MCP_TOOLS_MANIFEST, executeMcpTool } from './mcp/tools.mjs';

// HTTP Server
export { createHttpServer } from './server/http-server.mjs';
export { dispatchApiRequest } from './server/api.mjs';
