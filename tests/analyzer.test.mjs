import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clusterSimilarColors,
  getContrastRatio,
  normalizeColorToHex,
} from '../src/analyzer/color-normalizer.mjs';
import { analyzeTypographyTokens } from '../src/analyzer/typography-analyzer.mjs';
import { analyzeSpacingAndShapes } from '../src/analyzer/spacing-analyzer.mjs';
import { synthesizeDesignSystem } from '../src/analyzer/intelligence.mjs';
import { validateDesignSystem } from '../src/core/validator.mjs';

test('Analyzer — Color Normalization and Contrast', () => {
  assert.equal(normalizeColorToHex('#fff'), '#FFFFFF');
  assert.equal(normalizeColorToHex('#38bdf8'), '#38BDF8');
  assert.equal(normalizeColorToHex('rgb(83, 58, 253)'), '#533AFD');
  assert.equal(normalizeColorToHex('rgba(255, 255, 255, 1)'), '#FFFFFF');

  // Contrast
  const bwContrast = getContrastRatio('#FFFFFF', '#000000');
  assert.equal(Number(bwContrast.toFixed(1)), 21.0);

  const lowContrast = getContrastRatio('#FFFFFF', '#F8FAFC');
  assert.ok(lowContrast < 1.2);
});

test('Analyzer — Color Clustering by DeltaE', () => {
  const colors = [
    { value: '#533AFD', count: 10, roles: ['primary'] },
    { value: '#543CFE', count: 5, roles: ['primary'] }, // Visually identical to #533AFD
    { value: '#FFFFFF', count: 20, roles: ['background'] },
    { value: '#061B31', count: 15, roles: ['text'] },
  ];

  const clusters = clusterSimilarColors(colors);
  // #533AFD and #543CFE should be merged into one cluster
  assert.equal(clusters.length, 3, 'Should merge close shades into 3 distinct clusters');
  const primaryCluster = clusters.find((c) => c.representative === '#533AFD' || c.representative === '#543CFE');
  assert.equal(primaryCluster.count, 15);
});

test('Analyzer — Typography Scale and Hierarchy Analysis', () => {
  const rawTypography = {
    families: [{ name: 'Inter', count: 12 }],
    sizes: [
      { size: '48px', count: 1 },
      { size: '32px', count: 2 },
      { size: '24px', count: 4 },
      { size: '16px', count: 15 },
      { size: '14px', count: 8 },
      { size: '12px', count: 3 },
    ],
    weights: [{ weight: '700', count: 5 }, { weight: '400', count: 20 }],
  };

  const result = analyzeTypographyTokens(rawTypography);
  assert.equal(result.primaryFamily, 'Inter');
  assert.ok(result.detectedScale.ratio > 1.0);
  assert.ok(result.tokens['headline-display']);
  assert.equal(result.tokens['body-md'].fontSize, '16px');
});

test('Analyzer — Spacing Base Unit Detection', () => {
  const spacingList = [
    { unit: '8px', pixels: 8, count: 10 },
    { unit: '16px', pixels: 16, count: 15 },
    { unit: '24px', pixels: 24, count: 8 },
    { unit: '32px', pixels: 32, count: 4 },
  ];

  const shapes = {
    radii: [{ radius: '6px', count: 12 }, { radius: '12px', count: 4 }],
  };

  const result = analyzeSpacingAndShapes(spacingList, shapes);
  assert.equal(result.baseUnit, 8, 'Multiples of 8 should be identified as 8px base grid');
  assert.equal(result.rounded.sm, '6px');
  assert.equal(result.rounded.md, '12px');
});

test('Analyzer — Full System Synthesis & Validation', () => {
  const mockPayload = {
    url: 'https://mysaas.io',
    theme: 'dark',
    elementCount: 120,
    observedColors: [
      { value: '#0A0A0A', count: 30, roles: ['background'] },
      { value: '#141414', count: 10, roles: ['background'] },
      { value: '#EDEDED', count: 25, roles: ['text'] },
      { value: '#38BDF8', count: 8, roles: ['primary'] },
    ],
    typography: {
      families: [{ name: 'Geist', count: 20 }],
      sizes: [{ size: '32px', count: 3 }, { size: '16px', count: 18 }],
    },
    spacing: [
      { unit: '8px', pixels: 8, count: 5 },
      { unit: '16px', pixels: 16, count: 10 },
    ],
    shapes: {
      radii: [{ radius: '8px', count: 15 }],
    },
    components: {
      buttonsObserved: 3,
    },
  };

  const system = synthesizeDesignSystem(mockPayload);
  assert.equal(system.theme, 'dark');
  assert.equal(system.name, 'Mysaas');
  assert.equal(system.tokens.colors.background, '#0A0A0A');
  assert.equal(system.tokens.colors.primary, '#38BDF8');
  assert.ok(system.confidence.overall > 0.7);
  assert.equal(system.provenance.sourceUrl, 'https://mysaas.io');

  const validation = validateDesignSystem(system);
  assert.equal(validation.valid, true);
});
