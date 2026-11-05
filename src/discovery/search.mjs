/**
 * OneForge Sledge — Design Library Discovery & Search Engine
 * Multi-criteria faceted search, typography indexing, and CIELAB color distance calculation.
 */

import { listBrands, loadCatalogIndex } from './repository.mjs';

/**
 * Converts a 3, 4, 6, or 8 character hex color into an [R, G, B] tuple.
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3 || clean.length === 4) {
    clean = clean
      .split('')
      .slice(0, 3)
      .map((c) => c + c)
      .join('');
  } else if (clean.length >= 6) {
    clean = clean.slice(0, 6);
  } else {
    return [0, 0, 0];
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts sRGB [0..255] to CIE XYZ.
 */
export function rgbToXyz([r, g, b]) {
  let rLin = r / 255;
  let gLin = g / 255;
  let bLin = b / 255;

  rLin = rLin > 0.04045 ? Math.pow((rLin + 0.055) / 1.055, 2.4) : rLin / 12.92;
  gLin = gLin > 0.04045 ? Math.pow((gLin + 0.055) / 1.055, 2.4) : gLin / 12.92;
  bLin = bLin > 0.04045 ? Math.pow((bLin + 0.055) / 1.055, 2.4) : bLin / 12.92;

  // D65 standard illuminant
  const x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  const y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.072175;
  const z = rLin * 0.0193339 + gLin * 0.119192 + bLin * 0.9503041;

  return [x * 100, y * 100, z * 100];
}

/**
 * Converts CIE XYZ to CIE L*a*b*.
 */
export function xyzToLab([x, y, z]) {
  // D65 reference white
  const xRef = 95.047;
  const yRef = 100.0;
  const zRef = 108.883;

  const f = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);

  const fx = f(x / xRef);
  const fy = f(y / yRef);
  const fz = f(z / zRef);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [l, a, b];
}

/**
 * Computes CIELAB DeltaE (perceptual color distance).
 * Values < 2.3 are typically barely perceptible to human vision.
 */
export function deltaE(hex1, hex2) {
  const lab1 = xyzToLab(rgbToXyz(hexToRgb(hex1)));
  const lab2 = xyzToLab(rgbToXyz(hexToRgb(hex2)));

  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];

  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Queries the design system catalog using multi-criteria filtering.
 */
export async function searchDesignLibrary({
  query = '',
  category = '',
  theme = '',
  font = '',
  color = '',
  limit = 50,
  offset = 0,
} = {}) {
  const brands = await listBrands();
  const q = query.trim().toLowerCase();
  const cat = category.trim().toLowerCase();
  const th = theme.trim().toLowerCase();
  const fnt = font.trim().toLowerCase();
  const targetColor = color.trim().startsWith('#') ? color.trim() : color.trim() ? `#${color.trim()}` : '';

  let results = brands.map((b) => {
    let score = 0;
    let matchReasons = [];

    // Query match (brand name, host, fonts)
    if (q) {
      if (b.name.toLowerCase().includes(q)) {
        score += 50;
        matchReasons.push('name');
      } else if (b.host.toLowerCase().includes(q)) {
        score += 40;
        matchReasons.push('host');
      } else if (b.category.toLowerCase().includes(q)) {
        score += 20;
        matchReasons.push('category');
      } else if (b.fonts && b.fonts.some((f) => f.toLowerCase().includes(q))) {
        score += 25;
        matchReasons.push('font');
      }
    } else {
      score = 10; // Default baseline score
    }

    // Category filter
    let categoryMatch = true;
    if (cat && cat !== 'all') {
      categoryMatch = b.category.toLowerCase() === cat;
    }

    // Theme filter
    let themeMatch = true;
    if (th && th !== 'all') {
      themeMatch = b.theme.toLowerCase() === th;
    }

    // Font filter
    let fontMatch = true;
    if (fnt) {
      fontMatch = b.fonts && b.fonts.some((f) => f.toLowerCase().includes(fnt));
    }

    // Color proximity match
    let minColorDistance = Infinity;
    if (targetColor) {
      const allBrandColors = [...(b.colors || [])];
      if (b.accent) allBrandColors.push(b.accent);

      for (const c of allBrandColors) {
        const dist = deltaE(targetColor, c);
        if (dist < minColorDistance) {
          minColorDistance = dist;
        }
      }

      // Add score inversely proportional to DeltaE distance
      if (minColorDistance < 40) {
        score += Math.max(0, 40 - minColorDistance) * 2;
        matchReasons.push(`color_deltaE_${minColorDistance.toFixed(1)}`);
      }
    }

    return {
      brand: b,
      score,
      categoryMatch,
      themeMatch,
      fontMatch,
      minColorDistance,
      matchReasons,
    };
  });

  // Filter out non-matching criteria
  let filtered = results.filter((r) => {
    if (q && r.score < 20) return false;
    if (!r.categoryMatch) return false;
    if (!r.themeMatch) return false;
    if (!r.fontMatch) return false;
    if (targetColor && r.minColorDistance > 45) return false;
    return true;
  });

  // Sort by score descending, or by minColorDistance if color-searching
  if (targetColor) {
    filtered.sort((a, b) => a.minColorDistance - b.minColorDistance || b.score - a.score);
  } else {
    filtered.sort((a, b) => b.score - a.score || a.brand.name.localeCompare(b.brand.name));
  }

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit).map((r) => ({
    ...r.brand,
    relevanceScore: Number(r.score.toFixed(1)),
    colorDistance: r.minColorDistance !== Infinity ? Number(r.minColorDistance.toFixed(2)) : null,
  }));

  return {
    total,
    offset,
    limit,
    results: paged,
  };
}
