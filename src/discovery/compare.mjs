/**
 * OneForge Sledge — Multi-System Design Comparison Engine
 * Side-by-side differential analysis, palette overlap, typography delta, and consistency scoring.
 */

import { deltaE } from './search.mjs';
import { getDesignSystemByHost } from './repository.mjs';

/**
 * Compares two design systems by their hostnames or loaded system objects.
 */
export async function compareDesignSystems(systemAInput, systemBInput) {
  const systemA = typeof systemAInput === 'string' ? await getDesignSystemByHost(systemAInput) : systemAInput;
  const systemB = typeof systemBInput === 'string' ? await getDesignSystemByHost(systemBInput) : systemBInput;

  if (!systemA) throw new Error(`Design system A could not be resolved: "${systemAInput}"`);
  if (!systemB) throw new Error(`Design system B could not be resolved: "${systemBInput}"`);

  // 1. General Comparison
  const general = {
    systemA: { name: systemA.name, host: systemA.host, category: systemA.category, theme: systemA.theme },
    systemB: { name: systemB.name, host: systemB.host, category: systemB.category, theme: systemB.theme },
    themeMatch: systemA.theme === systemB.theme,
  };

  // 2. Color Palette Analysis
  const colorsA = systemA.tokens?.colors || {};
  const colorsB = systemB.tokens?.colors || {};

  const primaryA = colorsA.primary || '#000000';
  const primaryB = colorsB.primary || '#000000';
  const primaryDeltaE = deltaE(primaryA, primaryB);

  // Measure palette overlap: colors in A that have a close match in B (DeltaE < 5.0)
  const hexListA = Object.values(colorsA).filter((c) => typeof c === 'string' && c.startsWith('#'));
  const hexListB = Object.values(colorsB).filter((c) => typeof c === 'string' && c.startsWith('#'));

  let sharedColorMatches = 0;
  for (const cA of hexListA) {
    if (hexListB.some((cB) => deltaE(cA, cB) < 6.0)) {
      sharedColorMatches++;
    }
  }

  const paletteOverlapPct =
    hexListA.length > 0 ? Math.round((sharedColorMatches / Math.max(hexListA.length, hexListB.length)) * 100) : 0;

  const colorComparison = {
    systemA: {
      primary: primaryA,
      background: colorsA.background || 'not defined',
      surface: colorsA.surface || 'not defined',
      count: hexListA.length,
    },
    systemB: {
      primary: primaryB,
      background: colorsB.background || 'not defined',
      surface: colorsB.surface || 'not defined',
      count: hexListB.length,
    },
    primaryDeltaE: Number(primaryDeltaE.toFixed(2)),
    paletteOverlapPct,
    isVisuallyClose: primaryDeltaE < 12.0,
  };

  // 3. Typography Comparison
  const typoA = systemA.tokens?.typography || {};
  const typoB = systemB.tokens?.typography || {};

  const fontsA = extractFontFamilies(typoA);
  const fontsB = extractFontFamilies(typoB);
  const sharedFonts = fontsA.filter((f) => fontsB.some((fb) => fb.toLowerCase() === f.toLowerCase()));

  const typographyComparison = {
    systemA: {
      fonts: fontsA,
      headlineLg: typoA['headline-lg']?.fontSize || typoA['headline-display']?.fontSize || 'N/A',
      bodyMd: typoA['body-md']?.fontSize || 'N/A',
    },
    systemB: {
      fonts: fontsB,
      headlineLg: typoB['headline-lg']?.fontSize || typoB['headline-display']?.fontSize || 'N/A',
      bodyMd: typoB['body-md']?.fontSize || 'N/A',
    },
    sharedFonts,
    fontMatch: sharedFonts.length > 0,
  };

  // 4. Spacing & Shapes Comparison
  const spacingA = systemA.tokens?.spacing || {};
  const spacingB = systemB.tokens?.spacing || {};
  const roundedA = systemA.tokens?.rounded || {};
  const roundedB = systemB.tokens?.rounded || {};

  const spacingComparison = {
    systemA: {
      xs: spacingA.xs || 'N/A',
      sm: spacingA.sm || 'N/A',
      md: spacingA.md || 'N/A',
      lg: spacingA.lg || 'N/A',
      radiusSm: roundedA.sm || 'N/A',
      radiusMd: roundedA.md || 'N/A',
    },
    systemB: {
      xs: spacingB.xs || 'N/A',
      sm: spacingB.sm || 'N/A',
      md: spacingB.md || 'N/A',
      lg: spacingB.lg || 'N/A',
      radiusSm: roundedB.sm || 'N/A',
      radiusMd: roundedB.md || 'N/A',
    },
    sameCornerRadius: roundedA.sm === roundedB.sm,
    sameBaseSpacing: spacingA.xs === spacingB.xs,
  };

  // 5. Component Comparison
  const compA = systemA.tokens?.components || {};
  const compB = systemB.tokens?.components || {};

  const componentComparison = {
    buttonPrimaryA: compA['button-primary'] || null,
    buttonPrimaryB: compB['button-primary'] || null,
  };

  // 6. Overall Similarity Calculation (0 - 100%)
  let similarityScore = 0;
  if (general.themeMatch) similarityScore += 20;
  similarityScore += Math.max(0, 30 - primaryDeltaE); // Up to 30 points for primary color
  similarityScore += paletteOverlapPct * 0.25; // Up to 25 points
  if (typographyComparison.fontMatch) similarityScore += 15;
  if (spacingComparison.sameCornerRadius) similarityScore += 5;
  if (spacingComparison.sameBaseSpacing) similarityScore += 5;

  const normalizedSimilarity = Math.min(100, Math.max(0, Math.round(similarityScore)));

  return {
    systemA: { name: systemA.name, host: systemA.host },
    systemB: { name: systemB.name, host: systemB.host },
    similarityPercentage: normalizedSimilarity,
    general,
    color: colorComparison,
    typography: typographyComparison,
    spacing: spacingComparison,
    components: componentComparison,
  };
}

function extractFontFamilies(typographyTokens) {
  const fonts = new Set();
  for (const rule of Object.values(typographyTokens)) {
    if (rule && rule.fontFamily) {
      // Split fallback stacks
      const primaryFont = rule.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      if (primaryFont) fonts.add(primaryFont);
    }
  }
  return Array.from(fonts);
}
