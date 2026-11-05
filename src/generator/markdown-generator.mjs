/**
 * OneForge Sledge — Stitch-Compatible DESIGN.md Generator
 * Deterministically synthesizes schema-compliant YAML frontmatter and structured design documentation.
 */

import { parseDesignMd, validateDesignSystem } from '../core/validator.mjs';

/**
 * Generates complete DESIGN.md content from a DesignSystem object.
 */
export function generateDesignMd(system) {
  const validation = validateDesignSystem(system);
  if (!validation.valid) {
    throw new Error(`Cannot generate DESIGN.md for invalid system: ${validation.errors.join(', ')}`);
  }

  const tokens = system.tokens || {};
  const colors = tokens.colors || {};
  const typography = tokens.typography || {};
  const rounded = tokens.rounded || {};
  const spacing = tokens.spacing || {};
  const components = tokens.components || {};

  // 1. Build Frontmatter YAML
  const frontmatterLines = [
    '---',
    'version: alpha',
    `name: ${escapeYamlString(system.name)}`,
    `description: ${escapeYamlString(system.description || `${system.name} Design System measured by OneForge Sledge`)}`,
    'colors:',
  ];

  for (const [key, val] of Object.entries(colors)) {
    frontmatterLines.push(`  ${key}: "${val}"`);
  }

  frontmatterLines.push('typography:');
  for (const [key, rule] of Object.entries(typography)) {
    frontmatterLines.push(`  ${key}:`);
    frontmatterLines.push(`    fontFamily: ${rule.fontFamily}`);
    frontmatterLines.push(`    fontSize: ${rule.fontSize}`);
    if (rule.fontWeight) frontmatterLines.push(`    fontWeight: ${rule.fontWeight}`);
    if (rule.lineHeight) frontmatterLines.push(`    lineHeight: ${rule.lineHeight}`);
    if (rule.letterSpacing && rule.letterSpacing !== 'normal') {
      frontmatterLines.push(`    letterSpacing: ${rule.letterSpacing}`);
    }
  }

  frontmatterLines.push('rounded:');
  for (const [key, val] of Object.entries(rounded)) {
    frontmatterLines.push(`  ${key}: ${val}`);
  }

  frontmatterLines.push('spacing:');
  for (const [key, val] of Object.entries(spacing)) {
    frontmatterLines.push(`  ${key}: ${val}`);
  }

  if (Object.keys(components).length > 0) {
    frontmatterLines.push('components:');
    for (const [key, comp] of Object.entries(components)) {
      frontmatterLines.push(`  ${key}:`);
      if (comp.backgroundColor) frontmatterLines.push(`    backgroundColor: "${comp.backgroundColor}"`);
      if (comp.textColor) frontmatterLines.push(`    textColor: "${comp.textColor}"`);
      if (comp.typography) frontmatterLines.push(`    typography: "${comp.typography}"`);
      if (comp.rounded) frontmatterLines.push(`    rounded: "${comp.rounded}"`);
      if (comp.padding) frontmatterLines.push(`    padding: ${comp.padding}`);
      if (comp.height) frontmatterLines.push(`    height: ${comp.height}`);
      if (comp.border) frontmatterLines.push(`    border: "${comp.border}"`);
    }
  }

  frontmatterLines.push('---');
  const frontmatter = frontmatterLines.join('\n');

  // 2. Build Markdown Body
  const dos = system.documentation?.dos || [];
  const donts = system.documentation?.donts || [];
  const primaryFont = Object.values(typography)[0]?.fontFamily || 'system-ui';
  const primaryColor = colors.primary || '#38BDF8';
  const bgColor = colors.background || '#FFFFFF';
  const textColor = colors['on-surface'] || '#0F172A';

  const bodySections = [
    `# ${system.name} Design System`,
    '',
    '## Overview',
    '',
    system.description ||
      `${system.name} is a modern, high-precision interface designed with a ${system.theme || 'light'} theme aesthetic. The palette is anchored on **${bgColor}** background surfaces with **${textColor}** high-contrast text and **${primaryColor}** as the primary interactive accent.`,
    '',
    '## Visual Identity',
    '',
    `- **Theme Aesthetic:** ${system.theme || 'light'}`,
    `- **Primary Brand Accent:** \`${primaryColor}\``,
    `- **Dominant Typeface:** \`${primaryFont}\``,
    `- **Corner Radius:** \`${rounded.sm || '4px'}\``,
    '',
    '## Colors',
    '',
    `The design system defines ${Object.keys(colors).length} core color tokens:`,
    '',
    ...Object.entries(colors).map(([key, val]) => `- **${formatTokenLabel(key)} (\`${val}\`):** Token \`${key}\`.`),
    '',
    '## Typography',
    '',
    `Primary typography is set in **${primaryFont}**.`,
    '',
    ...Object.entries(typography).map(
      ([key, rule]) =>
        `- **${key}:** ${rule.fontFamily} ${rule.fontSize} at weight ${rule.fontWeight || 400}${rule.lineHeight ? `, line-height ${rule.lineHeight}` : ''}.`
    ),
    '',
    '## Layout & Spacing',
    '',
    'Spacing follows a rigorous proportional rhythm across container layouts and component padding.',
    '',
    ...Object.entries(spacing).map(([key, val]) => `- **${key}:** \`${val}\``),
    '',
    '## Elevation & Depth',
    '',
    system.theme === 'dark'
      ? 'Depth is achieved primarily through layered tonal surfaces and subtle outline borders rather than heavy drop shadows.'
      : 'Depth is achieved through crisp 1px borders, subtle ambient drop shadows, and tonal background elevation steps.',
    '',
    '## Shapes',
    '',
    ...Object.entries(rounded).map(([key, val]) => `- **${key}:** \`${val}\``),
    '',
    '## Components',
    '',
    ...Object.entries(components).map(
      ([key, comp]) =>
        `- **${key}:** fill \`${comp.backgroundColor || 'none'}\`, text \`${comp.textColor || 'inherit'}\`, radius \`${comp.rounded || 'none'}\`, padding \`${comp.padding || '0'}\`.`
    ),
    '',
    "## Do's and Don'ts",
    '',
    ...dos.map((d) => `- Do ${d.replace(/^Do\s+/i, '')}`),
    ...donts.map((d) => `- Don't ${d.replace(/^Don'?t\s+/i, '')}`),
    '',
    '## Token Provenance',
    '',
    `Generated by **OneForge Sledge** (AI-Powered Design Intelligence Platform).`,
    `- **Source URL:** ${system.provenance?.sourceUrl || 'Curated Specification'}`,
    `- **Extraction Engine:** ${system.provenance?.version || 'v1.0.0'}`,
    `- **Confidence Score:** ${system.confidence?.overall ? `${Math.round(system.confidence.overall * 100)}%` : 'Verified'}`,
  ];

  const fullMarkdown = `${frontmatter}\n\n${bodySections.join('\n')}\n`;

  // 3. Round-trip validation check
  const roundTrip = parseDesignMd(fullMarkdown);
  const roundTripValidation = validateDesignSystem(roundTrip);
  if (!roundTripValidation.valid) {
    throw new Error(`Generated DESIGN.md failed validation: ${roundTripValidation.errors.join(', ')}`);
  }

  return fullMarkdown;
}

function escapeYamlString(str) {
  if (!str) return '""';
  if (str.includes('"') || str.includes('\n') || str.includes(':') || str.includes('#')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

function formatTokenLabel(tokenName) {
  return tokenName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
