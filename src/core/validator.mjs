/**
 * OneForge Sledge — Schema Validation and DESIGN.md Parsing Engine
 */

import { COLOR_ROLES, TYPOGRAPHY_ROLES, createDesignSystem } from './types.mjs';

/**
 * Validates a standard HTTP/HTTPS URL.
 */
export function validateUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Protocol must be http or https.' };
    }
    if (!parsed.hostname || parsed.hostname.includes(' ')) {
      return { valid: false, error: 'Invalid hostname.' };
    }
    return { valid: true, url: parsed.href, hostname: parsed.hostname };
  } catch (err) {
    return { valid: false, error: `Invalid URL format: ${err.message}` };
  }
}

/**
 * Lightweight, zero-dependency YAML-compatible frontmatter parser
 * Specifically designed for DESIGN.md frontmatter structures.
 */
export function parseFrontmatter(frontmatterText) {
  const result = {
    version: 'alpha',
    name: '',
    description: '',
    colors: {},
    typography: {},
    rounded: {},
    spacing: {},
    components: {},
  };

  const lines = frontmatterText.split(/\r?\n/);
  let currentSection = null;
  let currentSubKey = null;

  for (let rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith('#')) continue;

    const indent = rawLine.search(/\S|$/);

    // Top-level root keys
    if (indent === 0) {
      const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (match) {
        const [, key, val] = match;
        const cleanVal = cleanYamlValue(val);
        if (['colors', 'typography', 'rounded', 'spacing', 'components'].includes(key)) {
          currentSection = key;
          currentSubKey = null;
          if (!result[key]) result[key] = {};
        } else {
          currentSection = null;
          currentSubKey = null;
          result[key] = cleanVal;
        }
      }
      continue;
    }

    // Section children (indent > 0)
    if (currentSection) {
      if (currentSection === 'colors' || currentSection === 'rounded' || currentSection === 'spacing') {
        const match = line.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) {
          result[currentSection][match[1]] = cleanYamlValue(match[2]);
        }
      } else if (currentSection === 'typography' || currentSection === 'components') {
        // Can be a two-level nested object (e.g. headline-display: \n fontFamily: ...)
        if (indent === 2 || indent === 4) {
          const match = line.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
          if (match) {
            const [, key, val] = match;
            if (val === '') {
              // New sub-object
              currentSubKey = key;
              if (!result[currentSection][currentSubKey]) {
                result[currentSection][currentSubKey] = {};
              }
            } else if (currentSubKey) {
              result[currentSection][currentSubKey][key] = cleanYamlValue(val);
            } else {
              // Direct assignment
              result[currentSection][key] = cleanYamlValue(val);
            }
          }
        } else if (indent > 4 && currentSubKey) {
          const match = line.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
          if (match) {
            result[currentSection][currentSubKey][match[1]] = cleanYamlValue(match[2]);
          }
        }
      }
    }
  }

  return result;
}

function cleanYamlValue(val) {
  if (val === undefined || val === null) return '';
  const trimmed = String(val).trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (!isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);
  return trimmed;
}

/**
 * Parses full DESIGN.md file content into structured sections and metadata.
 */
export function parseDesignMd(fileContent) {
  if (!fileContent || typeof fileContent !== 'string') {
    throw new Error('DESIGN.md content must be a non-empty string.');
  }

  const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error('Missing valid YAML frontmatter delimiter (---) at top of DESIGN.md.');
  }

  const frontmatter = parseFrontmatter(frontmatterMatch[1]);
  const markdownBody = frontmatterMatch[2].trim();

  // Extract Do's and Don'ts from Markdown if present
  const dos = [];
  const donts = [];
  const dosMatch = markdownBody.match(/## Do's and Don'ts\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (dosMatch) {
    for (const line of dosMatch[1].split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- Do ')) dos.push(trimmed.replace(/^- Do\s+/i, ''));
      else if (trimmed.startsWith('- Don’t ') || trimmed.startsWith("- Don't ")) {
        donts.push(trimmed.replace(/^-\s*Don['’]t\s+/i, ''));
      }
    }
  }

  return createDesignSystem({
    id: frontmatter.name ? frontmatter.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'unnamed',
    name: frontmatter.name || 'Unnamed Design System',
    description: frontmatter.description || '',
    colors: frontmatter.colors || {},
    typography: frontmatter.typography || {},
    rounded: frontmatter.rounded || {},
    spacing: frontmatter.spacing || {},
    components: frontmatter.components || {},
    dos,
    donts,
    rawMarkdown: markdownBody,
  });
}

/**
 * Validates a DesignSystem model against standard DESIGN.md specifications.
 */
export function validateDesignSystem(system) {
  const errors = [];
  const warnings = [];

  if (!system) {
    return { valid: false, errors: ['System object is null or undefined.'], warnings };
  }

  if (!system.name || typeof system.name !== 'string' || !system.name.trim()) {
    errors.push('Design system must contain a non-empty "name".');
  }

  const tokens = system.tokens || {};
  const colors = tokens.colors || {};

  if (Object.keys(colors).length === 0) {
    errors.push('Design system must contain at least one color token.');
  } else {
    // Validate hex format for colors
    const hexPattern = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    for (const [key, val] of Object.entries(colors)) {
      if (typeof val === 'string' && !val.startsWith('{')) {
        if (!hexPattern.test(val)) {
          warnings.push(`Color token "${key}" has non-standard hex value: "${val}".`);
        }
      }
    }

    if (!colors.background && !colors.surface) {
      warnings.push('Recommended token "background" or "surface" is missing.');
    }
    if (!colors.primary) {
      warnings.push('Recommended token "primary" is missing.');
    }
  }

  const typography = tokens.typography || {};
  if (Object.keys(typography).length === 0) {
    warnings.push('No typography tokens defined.');
  }

  const spacing = tokens.spacing || {};
  if (Object.keys(spacing).length === 0) {
    warnings.push('No spacing tokens defined.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
