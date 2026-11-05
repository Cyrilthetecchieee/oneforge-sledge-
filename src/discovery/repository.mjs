/**
 * OneForge Sledge — Design System Repository & Storage Layer
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG } from '../config.mjs';
import { sanitizeHostForPath } from '../core/security.mjs';
import { parseDesignMd, validateDesignSystem } from '../core/validator.mjs';

let cachedIndex = null;
let lastIndexLoad = 0;
const CACHE_TTL_MS = 60_000;

/**
 * Loads the curated catalog index.
 */
export async function loadCatalogIndex(forceReload = false) {
  const now = Date.now();
  if (cachedIndex && !forceReload && now - lastIndexLoad < CACHE_TTL_MS) {
    return cachedIndex;
  }

  if (!existsSync(CONFIG.paths.index)) {
    throw new Error(`Catalog index not found at: ${CONFIG.paths.index}`);
  }

  const raw = await readFile(CONFIG.paths.index, 'utf8');
  const parsed = JSON.parse(raw);
  cachedIndex = parsed;
  lastIndexLoad = now;
  return parsed;
}

/**
 * Lists all categories with their brand counts.
 */
export async function listCategories() {
  const catalog = await loadCatalogIndex();
  return catalog.categories || [];
}

/**
 * Lists all curated brands in the catalog.
 */
export async function listBrands() {
  const catalog = await loadCatalogIndex();
  return catalog.brands || [];
}

/**
 * Retrieves a single design system by host.
 * Loads the DESIGN.md from disk and parses it into a full DesignSystem entity.
 */
export async function getDesignSystemByHost(host) {
  const { cleanHost, safePath } = sanitizeHostForPath(host, CONFIG.paths.data);
  const designMdPath = path.join(safePath, 'DESIGN.md');

  if (!existsSync(designMdPath)) {
    // Check if it exists in custom libraries
    const customPath = path.join(CONFIG.paths.custom, cleanHost, 'DESIGN.md');
    if (existsSync(customPath)) {
      const content = await readFile(customPath, 'utf8');
      const system = parseDesignMd(content);
      system.host = cleanHost;
      system.provenance.method = 'user_custom';
      return system;
    }
    return null;
  }

  const content = await readFile(designMdPath, 'utf8');
  const system = parseDesignMd(content);
  system.host = cleanHost;

  // Augment with index metadata if available
  try {
    const catalog = await loadCatalogIndex();
    const entry = catalog.brands.find((b) => b.host === cleanHost);
    if (entry) {
      system.category = entry.category || system.category;
      system.theme = entry.theme || system.theme;
      if (entry.sitepeel) system.provenance.sourceUrl = entry.sitepeel;
    }
  } catch {}

  return system;
}

/**
 * Saves a custom design system into the user-managed custom storage.
 */
export async function saveCustomDesignSystem(system, markdownContent) {
  const validation = validateDesignSystem(system);
  if (!validation.valid) {
    throw new Error(`Invalid design system: ${validation.errors.join(', ')}`);
  }

  const host = system.host || system.id;
  const { cleanHost, safePath } = sanitizeHostForPath(host, CONFIG.paths.custom);

  await mkdir(safePath, { recursive: true });
  const targetFile = path.join(safePath, 'DESIGN.md');
  await writeFile(targetFile, markdownContent, 'utf8');

  return { success: true, host: cleanHost, path: targetFile };
}

/**
 * Lists all custom design systems in custom storage.
 */
export async function listCustomDesignSystems() {
  if (!existsSync(CONFIG.paths.custom)) {
    return [];
  }

  const entries = await readdir(CONFIG.paths.custom, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const designMd = path.join(CONFIG.paths.custom, entry.name, 'DESIGN.md');
      if (existsSync(designMd)) {
        try {
          const content = await readFile(designMd, 'utf8');
          const system = parseDesignMd(content);
          system.host = entry.name;
          results.push(system);
        } catch {}
      }
    }
  }

  return results;
}
