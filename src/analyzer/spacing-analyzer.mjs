/**
 * OneForge Sledge — Spacing Grid & Shape Metrics Analyzer
 */

/**
 * Analyzes spacing and layout dimensions to synthesize a normalized grid scale.
 */
export function analyzeSpacingAndShapes(extractedSpacing, extractedShapes) {
  const spacingItems = extractedSpacing || [];
  const radiiItems = extractedShapes?.radii || [];

  // 1. Spacing Base Unit Detection (Base 4 vs Base 8)
  const numericSpacings = spacingItems
    .map((s) => s.pixels)
    .filter((p) => p > 0 && p <= 128)
    .sort((a, b) => a - b);

  let score4 = 0;
  let score8 = 0;
  for (const px of numericSpacings) {
    if (px % 4 === 0) score4 += 1;
    if (px % 8 === 0) score8 += 1;
  }

  const baseUnit = score8 >= score4 * 0.7 && score8 > 2 ? 8 : 4;
  const gridConfidence = numericSpacings.length > 0 ? (baseUnit === 8 ? score8 : score4) / numericSpacings.length : 0.8;

  // 2. Synthesize Standard Spacing Scale Tokens
  const getClosestSpacing = (targetPx) => {
    if (numericSpacings.length === 0) return `${targetPx}px`;
    const closest = numericSpacings.reduce((prev, curr) =>
      Math.abs(curr - targetPx) < Math.abs(prev - targetPx) ? curr : prev
    );
    return `${closest}px`;
  };

  const spacingTokens = {
    xs: getClosestSpacing(baseUnit),
    sm: getClosestSpacing(baseUnit * 2),
    md: getClosestSpacing(baseUnit * 4),
    lg: getClosestSpacing(baseUnit * 6),
    xl: getClosestSpacing(baseUnit * 12),
    gutter: getClosestSpacing(baseUnit * 2),
    margin: getClosestSpacing(baseUnit * 4),
  };

  // 3. Analyze Border Radii
  const sortedRadii = radiiItems.filter((r) => r.radius && r.radius !== '0px').sort((a, b) => b.count - a.count);

  const roundedTokens = {
    none: '0px',
    sm: sortedRadii.length > 0 ? sortedRadii[0].radius : '4px',
    md: sortedRadii.length > 1 ? sortedRadii[1].radius : '8px',
    full: '9999px',
  };

  return {
    baseUnit,
    gridConfidence: Number(Math.min(1.0, Math.max(0.4, gridConfidence)).toFixed(2)),
    spacing: spacingTokens,
    rounded: roundedTokens,
  };
}
