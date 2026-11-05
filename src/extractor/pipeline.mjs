/**
 * OneForge Sledge — Extraction Pipeline Orchestrator
 * Coordinates SSRF defense, robots.txt compliance, safe network ingestion, and design token parsing.
 */

import { validateUrl } from '../core/validator.mjs';
import { safeFetch } from './http.mjs';
import { parseHtmlDesignTokens } from './html-parser.mjs';
import { checkRobotsPermission } from './robots.mjs';

/**
 * Extracts design characteristics from a live website.
 */
export async function extractWebsiteDesign(targetUrl, options = {}) {
  const startTime = Date.now();

  // 1. URL Structure Validation
  const urlValidation = validateUrl(targetUrl);
  if (!urlValidation.valid) {
    return {
      success: false,
      error: `Invalid URL: ${urlValidation.error}`,
      url: targetUrl,
      durationMs: Date.now() - startTime,
    };
  }

  // 2. Robots.txt Compliance Check
  if (!options.skipRobots) {
    const robotsCheck = await checkRobotsPermission(urlValidation.url);
    if (!robotsCheck.allowed) {
      return {
        success: false,
        error: `Extraction rejected: ${robotsCheck.reason}`,
        url: urlValidation.url,
        robotsDisallowed: true,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // 3. Safe HTTP Ingestion
  const fetchResult = await safeFetch(urlValidation.url, options);
  if (!fetchResult.ok) {
    return {
      success: false,
      error: fetchResult.error,
      status: fetchResult.status,
      url: fetchResult.url || urlValidation.url,
      durationMs: Date.now() - startTime,
    };
  }

  // 4. Parse Styles and Heuristics
  const parsedTokens = parseHtmlDesignTokens(fetchResult.body, fetchResult.url);

  return {
    success: true,
    url: fetchResult.url,
    hostname: urlValidation.hostname,
    contentType: fetchResult.contentType,
    byteLength: fetchResult.byteLength,
    durationMs: Date.now() - startTime,
    extractedData: parsedTokens,
    provenance: {
      sourceUrl: fetchResult.url,
      extractedAt: new Date().toISOString(),
      extractor: 'OneForge Sledge Engine v1.0',
      method: 'automated_computed_style',
    },
  };
}
