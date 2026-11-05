import assert from 'node:assert/strict';
import test from 'node:test';
import { generateDesignMd } from '../src/generator/markdown-generator.mjs';
import {
  exportToCssVariables,
  exportToDtcgJson,
  exportToScss,
  exportToTailwind,
  exportTokens,
} from '../src/generator/exporters.mjs';
import { parseDesignMd, validateDesignSystem } from '../src/core/validator.mjs';
import { createDesignSystem, createTypographyRule } from '../src/core/types.mjs';

function createSampleSystem() {
  return createDesignSystem({
    id: 'acme.corp',
    name: 'Acme',
    host: 'acme.corp',
    description: 'Precision technical design system for Acme Corp',
    category: 'Developer tools',
    theme: 'dark',
    colors: {
      background: '#090D16',
      surface: '#0F172A',
      'on-surface': '#F8FAFC',
      primary: '#38BDF8',
      'on-primary': '#090D16',
    },
    typography: {
      'headline-lg': createTypographyRule({
        fontFamily: 'Geist Sans, sans-serif',
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: 1.2,
      }),
      'body-md': createTypographyRule({
        fontFamily: 'Geist Sans, sans-serif',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5,
      }),
    },
    rounded: {
      sm: '4px',
      md: '8px',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
    },
    components: {
      'button-primary': {
        backgroundColor: '{colors.primary}',
        textColor: '{colors.on-primary}',
        rounded: '{rounded.sm}',
        padding: '10px 20px',
      },
    },
    dos: ['Do use 4px grid rhythm.', 'Do preserve high contrast text.'],
    donts: ['Don’t use saturated backgrounds.'],
  });
}

test('Generator — Stitch-Compatible DESIGN.md Generation & Round-Trip', () => {
  const system = createSampleSystem();
  const markdown = generateDesignMd(system);

  // Validate markdown structure
  assert.ok(markdown.startsWith('---\nversion: alpha\n'));
  assert.ok(markdown.includes('name: Acme'));
  assert.ok(markdown.includes('# Acme Design System'));
  assert.ok(markdown.includes('## Overview'));
  assert.ok(markdown.includes('## Colors'));
  assert.ok(markdown.includes('## Typography'));
  assert.ok(markdown.includes('## Do\'s and Don\'ts'));
  assert.ok(markdown.includes('## Token Provenance'));

  // Round-trip parse back to system
  const parsed = parseDesignMd(markdown);
  assert.equal(parsed.name, 'Acme');
  assert.equal(parsed.tokens.colors.primary, '#38BDF8');
  assert.equal(parsed.tokens.colors.background, '#090D16');
  assert.equal(parsed.tokens.typography['body-md'].fontSize, '16px');
  assert.equal(parsed.documentation.dos.length, 2);

  const validation = validateDesignSystem(parsed);
  assert.equal(validation.valid, true);
});

test('Generator — CSS Custom Properties Export', () => {
  const system = createSampleSystem();
  const css = exportToCssVariables(system);

  assert.ok(css.includes(':root {'));
  assert.ok(css.includes('--color-primary: #38BDF8;'));
  assert.ok(css.includes('--color-background: #090D16;'));
  assert.ok(css.includes('--spacing-md: 16px;'));
  assert.ok(css.includes('--radius-sm: 4px;'));
});

test('Generator — Tailwind CSS Theme Export', () => {
  const system = createSampleSystem();
  const js = exportToTailwind(system);

  assert.ok(js.includes('module.exports = {'));
  assert.ok(js.includes('"primary": "#38BDF8"'));
  assert.ok(js.includes('"md": "16px"'));
});

test('Generator — W3C DTCG Design Token JSON Export', () => {
  const system = createSampleSystem();
  const jsonStr = exportToDtcgJson(system);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.$name, 'Acme');
  assert.equal(parsed.color.primary.$value, '#38BDF8');
  assert.equal(parsed.color.primary.$type, 'color');
  assert.equal(parsed.spacing.md.$value, '16px');
});

test('Generator — SCSS Variables Export', () => {
  const system = createSampleSystem();
  const scss = exportToScss(system);

  assert.ok(scss.includes('$color-primary: #38BDF8;'));
  assert.ok(scss.includes('$spacing-md: 16px;'));
  assert.ok(scss.includes('$radius-sm: 4px;'));
});

test('Generator — Universal Dispatcher', () => {
  const system = createSampleSystem();
  const css = exportTokens(system, 'css');
  assert.equal(css.format, 'css');
  assert.equal(css.mimeType, 'text/css');

  const dtcg = exportTokens(system, 'dtcg');
  assert.equal(dtcg.format, 'dtcg-json');

  assert.throws(() => exportTokens(system, 'unsupported-format'), /Unsupported export format/);
});
