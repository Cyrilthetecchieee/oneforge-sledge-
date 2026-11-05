/**
 * OneForge Sledge — Color Normalization, WCAG Contrast & Clustering Engine
 */

import { deltaE, hexToRgb } from '../discovery/search.mjs';

/**
 * Normalizes any CSS color declaration (hex, rgb, rgba, hsl, hsla) into standard #RRGGBB or #RRGGBBAA.
 */
export function normalizeColorToHex(raw) {
  if (!raw || typeof raw !== 'string') return '#000000';
  const clean = raw.trim();

  // Already Hex
  if (clean.startsWith('#')) {
    const withoutHash = clean.slice(1);
    if (withoutHash.length === 3) {
      return (
        '#' +
        withoutHash
          .split('')
          .map((c) => c + c)
          .join('')
          .toUpperCase()
      );
    }
    if (withoutHash.length === 4) {
      return (
        '#' +
        withoutHash
          .split('')
          .map((c) => c + c)
          .join('')
          .toUpperCase()
      );
    }
    if (withoutHash.length === 6 || withoutHash.length === 8) {
      return clean.toUpperCase();
    }
  }

  // RGB / RGBA
  const rgbMatch = clean.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgbMatch) {
    const r = clampByte(parseInt(rgbMatch[1], 10));
    const g = clampByte(parseInt(rgbMatch[2], 10));
    const b = clampByte(parseInt(rgbMatch[3], 10));
    if (rgbMatch[4] !== undefined) {
      const alphaVal = parseFloat(rgbMatch[4]);
      if (alphaVal < 1.0) {
        const alpha = Math.round(alphaVal * 255);
        return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHex2(alpha)}`.toUpperCase();
      }
    }
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`.toUpperCase();
  }

  // Fallback defaults for common named tokens
  const named = {
    white: '#FFFFFF',
    black: '#000000',
    transparent: '#00000000',
  };
  if (named[clean.toLowerCase()]) return named[clean.toLowerCase()];

  return clean;
}

function clampByte(val) {
  return Math.max(0, Math.min(255, val || 0));
}

function toHex2(val) {
  return val.toString(16).padStart(2, '0');
}

/**
 * Calculates WCAG 2.1 relative luminance (0.0 = darkest black, 1.0 = lightest white).
 */
export function getRelativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors (1.0 to 21.0).
 */
export function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Clusters extracted raw colors into unique visual groups using CIELAB DeltaE.
 */
export function clusterSimilarColors(extractedColors, deltaThreshold = 3.2) {
  const clusters = [];

  for (const item of extractedColors) {
    const normalizedHex = normalizeColorToHex(item.value);
    if (!normalizedHex.startsWith('#') || normalizedHex.length < 7) continue;

    let matchedCluster = null;
    for (const cluster of clusters) {
      if (deltaE(normalizedHex, cluster.representative) < deltaThreshold) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.count += item.count || 1;
      matchedCluster.members.push(normalizedHex);
      if (item.roles) item.roles.forEach((r) => matchedCluster.roles.add(r));
    } else {
      clusters.push({
        representative: normalizedHex,
        count: item.count || 1,
        members: [normalizedHex],
        roles: new Set(item.roles || []),
        luminance: getRelativeLuminance(normalizedHex),
      });
    }
  }

  // Sort clusters by frequency
  clusters.sort((a, b) => b.count - a.count);
  return clusters;
}

/**
 * Derives semantic color roles based on frequency, luminance, and contrast.
 */
export function assignSemanticRoles(clusters, detectedTheme = 'light') {
  const roles = {
    background: detectedTheme === 'dark' ? '#0A0A0A' : '#FFFFFF',
    surface: detectedTheme === 'dark' ? '#141414' : '#F8FAFC',
    'on-surface': detectedTheme === 'dark' ? '#EDEDED' : '#0F172A',
    'on-background': detectedTheme === 'dark' ? '#EDEDED' : '#0F172A',
    primary: '#38BDF8',
    'on-primary': '#FFFFFF',
    outline: detectedTheme === 'dark' ? '#27272A' : '#E2E8F0',
  };

  if (clusters.length === 0) return roles;

  // 1. Identify Background (High frequency matching detected theme luminance)
  const bgCandidates = clusters.filter((c) =>
    detectedTheme === 'dark' ? c.luminance < 0.2 : c.luminance > 0.8
  );
  if (bgCandidates.length > 0) {
    roles.background = bgCandidates[0].representative;
    if (bgCandidates.length > 1) {
      roles.surface = bgCandidates[1].representative;
    } else {
      roles.surface = roles.background;
    }
  }

  // 2. Identify Text / On-Surface (Highest contrast against selected background)
  const textCandidates = clusters
    .map((c) => ({
      hex: c.representative,
      contrast: getContrastRatio(roles.background, c.representative),
      count: c.count,
    }))
    .filter((c) => c.contrast >= 4.5)
    .sort((a, b) => b.contrast - a.contrast || b.count - a.count);

  if (textCandidates.length > 0) {
    roles['on-surface'] = textCandidates[0].hex;
    roles['on-background'] = textCandidates[0].hex;
  }

  // 3. Identify Primary Accent (Highest saturation / chromatic contrast)
  const accentCandidates = clusters.filter((c) => {
    const isBg = c.representative === roles.background || c.representative === roles.surface;
    const isText = c.representative === roles['on-surface'];
    const [r, g, b] = hexToRgb(c.representative);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return !isBg && !isText && saturation > 0.25;
  });

  if (accentCandidates.length > 0) {
    roles.primary = accentCandidates[0].representative;
    // Ensure on-primary has sufficient contrast
    const lightContrast = getContrastRatio(roles.primary, '#FFFFFF');
    const darkContrast = getContrastRatio(roles.primary, '#000000');
    roles['on-primary'] = lightContrast > darkContrast ? '#FFFFFF' : '#000000';
  }

  return roles;
}
