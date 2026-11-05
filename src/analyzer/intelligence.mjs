/**
 * OneForge Sledge — Design Intelligence & Token Synthesis Engine
 * Transforms raw computed styles into structured, normalized, and validated DesignSystem entities.
 */

import { createComponentToken, createConfidenceScores, createDesignSystem, createProvenance } from '../core/types.mjs';
import { assignSemanticRoles, clusterSimilarColors } from './color-normalizer.mjs';
import { analyzeSpacingAndShapes } from './spacing-analyzer.mjs';
import { analyzeTypographyTokens } from './typography-analyzer.mjs';

/**
 * Synthesizes a structured OneForge DesignSystem from raw extracted webpage data.
 */
export function synthesizeDesignSystem(extractedPayload, metadata = {}) {
  const url = extractedPayload.url || metadata.url || 'https://example.com';
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = metadata.host || 'unknown';
  }

  const detectedTheme = extractedPayload.theme || 'light';
  const observedColors = extractedPayload.observedColors || [];
  const rawTypography = extractedPayload.typography || {};
  const rawSpacing = extractedPayload.spacing || [];
  const rawShapes = extractedPayload.shapes || {};
  const rawComponents = extractedPayload.components || {};

  // 1. Color Clustering & Role Assignment
  const colorClusters = clusterSimilarColors(observedColors);
  const colorRoles = assignSemanticRoles(colorClusters, detectedTheme);

  // 2. Typography Hierarchy & Scale Detection
  const typographyResult = analyzeTypographyTokens(rawTypography);

  // 3. Spacing Grid & Shapes Analysis
  const spacingResult = analyzeSpacingAndShapes(rawSpacing, rawShapes);

  // 4. Component Synthesis
  const componentTokens = {
    'button-primary': createComponentToken({
      backgroundColor: '{colors.primary}',
      textColor: '{colors.on-primary}',
      typography: '{typography.body-sm}',
      rounded: '{rounded.sm}',
      padding: '10px 20px',
      height: '40px',
    }),
    'button-outline': createComponentToken({
      backgroundColor: 'transparent',
      textColor: '{colors.primary}',
      typography: '{typography.label-md}',
      rounded: '{rounded.sm}',
      padding: '10px 20px',
      border: '1px solid {colors.primary}',
      height: '40px',
    }),
    'input-field': createComponentToken({
      textColor: '{colors.on-surface}',
      typography: '{typography.body-md}',
      rounded: '{rounded.sm}',
      padding: '8px 14px',
      border: '1px solid {colors.outline}',
      height: '40px',
    }),
  };

  // 5. Quantitative Confidence Scoring
  const sampleElementCount = extractedPayload.elementCount || 50;
  const colorsConfidence = colorClusters.length >= 3 ? Math.min(0.95, 0.6 + colorClusters.length * 0.05) : 0.6;
  const typoConfidence = typographyResult.detectedScale.confidence;
  const spacingConfidence = spacingResult.gridConfidence;
  const compConfidence = rawComponents.buttonsObserved > 0 ? 0.85 : 0.7;

  const overallConfidence = Number(
    (colorsConfidence * 0.35 + typoConfidence * 0.3 + spacingConfidence * 0.2 + compConfidence * 0.15).toFixed(2)
  );

  const confidence = createConfidenceScores({
    overall: overallConfidence,
    colors: colorsConfidence,
    typography: typoConfidence,
    spacing: spacingConfidence,
    components: compConfidence,
    sampleElementCount,
  });

  // 6. Descriptive Rules (Do's and Don'ts)
  const dos = [
    `Do use ${colorRoles.background} for backgrounds and ${colorRoles['on-surface']} for high-contrast typography.`,
    `Do set primary actions in ${colorRoles.primary} with ${colorRoles['on-primary']} text.`,
    `Do align layout spacing to the detected ${spacingResult.baseUnit}px base grid scale.`,
    `Do maintain ${spacingResult.rounded.sm} corner radii across interactive controls.`,
  ];

  const donts = [
    `Don't use saturated primary colors for large full-width background areas.`,
    `Don't mix unapproved font families beyond ${typographyResult.primaryFamily}.`,
    `Don't use non-grid spacing values outside of the ${spacingResult.baseUnit}px rhythm.`,
  ];

  const brandName = metadata.name || hostname.replace(/^www\./, '').split('.')[0];
  const capitalizedName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  return createDesignSystem({
    id: hostname,
    name: capitalizedName,
    host: hostname,
    description: `${detectedTheme.charAt(0).toUpperCase() + detectedTheme.slice(1)} interface measured from ${hostname} with ${typographyResult.primaryFamily} typography and ${spacingResult.rounded.sm} corners.`,
    category: metadata.category || 'General',
    theme: detectedTheme,
    colors: colorRoles,
    typography: typographyResult.tokens,
    rounded: spacingResult.rounded,
    spacing: spacingResult.spacing,
    components: componentTokens,
    dos,
    donts,
    provenance: createProvenance({
      sourceUrl: url,
      collector: 'OneForge Sledge Engine',
      method: 'automated_computed_style',
      viewport: '1440x900',
    }),
    confidence,
  });
}
