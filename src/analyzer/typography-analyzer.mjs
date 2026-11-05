/**
 * OneForge Sledge — Typography Modular Scale & Hierarchy Analyzer
 */

import { createTypographyRule } from '../core/types.mjs';

const MODULAR_SCALES = [
  { name: 'Major Second', ratio: 1.125 },
  { name: 'Minor Third', ratio: 1.2 },
  { name: 'Major Third', ratio: 1.25 },
  { name: 'Perfect Fourth', ratio: 1.333 },
  { name: 'Augmented Fourth', ratio: 1.414 },
  { name: 'Perfect Fifth', ratio: 1.5 },
  { name: 'Golden Ratio', ratio: 1.618 },
];

/**
 * Analyzes observed font families, sizes, and weights to synthesize a coherent typography token set.
 */
export function analyzeTypographyTokens(extractedTypography) {
  const families = extractedTypography?.families || [];
  const sizes = extractedTypography?.sizes || [];
  const weights = extractedTypography?.weights || [];

  // 1. Determine Primary and Secondary Font Families
  const primaryFamily = families.length > 0 ? families[0].name : 'system-ui, sans-serif';

  // 2. Parse and Sort Numeric Font Sizes (in px)
  const numericSizes = sizes
    .map((s) => ({
      raw: s.size,
      px: parseToPx(s.size),
      count: s.count,
    }))
    .filter((s) => s.px >= 10 && s.px <= 96)
    .sort((a, b) => b.px - a.px);

  // 3. Detect Modular Scale Ratio
  const detectedScale = detectBestFittingScale(numericSizes);

  // 4. Assign Hierarchy Roles
  const sizeMap = mapSizesToRoles(numericSizes, primaryFamily);

  return {
    primaryFamily,
    detectedScale,
    tokens: sizeMap,
  };
}

function parseToPx(val) {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 16;
  const clean = val.trim();
  if (clean.endsWith('rem') || clean.endsWith('em')) {
    return Math.round(parseFloat(clean) * 16);
  }
  return Math.round(parseFloat(clean)) || 16;
}

function detectBestFittingScale(sizes) {
  if (sizes.length < 3) {
    return { name: 'Major Third', ratio: 1.25, confidence: 0.6 };
  }

  const baseSize = 16;
  const sortedUniquePx = Array.from(new Set(sizes.map((s) => s.px))).sort((a, b) => a - b);

  let bestFit = MODULAR_SCALES[2]; // Default: Major Third
  let lowestError = Infinity;

  for (const scale of MODULAR_SCALES) {
    let totalError = 0;
    // Generate scale steps: -2, -1, 0, 1, 2, 3, 4, 5
    const steps = [-2, -1, 0, 1, 2, 3, 4, 5].map((step) => Math.round(baseSize * Math.pow(scale.ratio, step)));

    for (const actual of sortedUniquePx) {
      // Find closest hypothetical step
      const closestStep = steps.reduce((prev, curr) =>
        Math.abs(curr - actual) < Math.abs(prev - actual) ? curr : prev
      );
      totalError += Math.abs(closestStep - actual);
    }

    const avgError = totalError / sortedUniquePx.length;
    if (avgError < lowestError) {
      lowestError = avgError;
      bestFit = scale;
    }
  }

  const confidence = Math.max(0.4, Math.min(0.95, 1.0 - lowestError / 12));

  return {
    name: bestFit.name,
    ratio: bestFit.ratio,
    confidence: Number(confidence.toFixed(2)),
  };
}

function mapSizesToRoles(sortedSizes, family) {
  const getClosest = (targetPx, defaultVal) => {
    if (sortedSizes.length === 0) return `${defaultVal}px`;
    const closest = sortedSizes.reduce((prev, curr) =>
      Math.abs(curr.px - targetPx) < Math.abs(prev.px - targetPx) ? curr : prev
    );
    return `${closest.px}px`;
  };

  return {
    'headline-display': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(48, 48),
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: '-0.02em',
    }),
    'headline-lg': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(32, 32),
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    }),
    'headline-md': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(24, 24),
      fontWeight: 600,
      lineHeight: 1.25,
    }),
    'headline-sm': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(20, 20),
      fontWeight: 600,
      lineHeight: 1.3,
    }),
    'body-lg': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(18, 18),
      fontWeight: 400,
      lineHeight: 1.5,
    }),
    'body-md': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(16, 16),
      fontWeight: 400,
      lineHeight: 1.5,
    }),
    'body-sm': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(14, 14),
      fontWeight: 400,
      lineHeight: 1.4,
    }),
    caption: createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(12, 12),
      fontWeight: 400,
      lineHeight: 1.4,
    }),
    'label-md': createTypographyRule({
      fontFamily: family,
      fontSize: getClosest(14, 14),
      fontWeight: 500,
      lineHeight: 1.2,
    }),
  };
}
