/**
 * OneForge Sledge — HTML & CSS Design Token Ingestion Parser
 * Extracts colors, typography, spacing, shapes, and component heuristics from markup and stylesheets.
 */

/**
 * Extracts raw design tokens and stylistic measurements from raw HTML and CSS.
 */
export function parseHtmlDesignTokens(html, pageUrl = '') {
  if (!html || typeof html !== 'string') {
    return createEmptyExtractionPayload(pageUrl);
  }

  // 1. Gather all CSS text: <style> tags and inline style="..." attributes
  const cssBlocks = [];

  // Style tags
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleTagRegex.exec(html)) !== null) {
    cssBlocks.push(match[1]);
  }

  // Inline styles
  const inlineStyleRegex = /style\s*=\s*["']([^"']+)["']/gi;
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    cssBlocks.push(match[1]);
  }

  // Google fonts and web font links
  const fontLinks = [];
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) fontLinks.push(hrefMatch[1]);
  }

  const combinedCss = cssBlocks.join('\n');

  // 2. Extract Colors
  const observedColors = extractColorsFromCss(combinedCss);

  // 3. Extract Typography
  const typography = extractTypography(combinedCss, fontLinks);

  // 4. Extract Spacing
  const spacing = extractSpacing(combinedCss);

  // 5. Extract Shapes & Depth
  const shapes = extractShapes(combinedCss);

  // 6. Extract Breakpoints
  const breakpoints = extractBreakpoints(combinedCss);

  // 7. Heuristic Component Extraction
  const components = extractComponentHeuristics(html, combinedCss);

  // 8. Detect Theme (Dark vs Light)
  const theme = detectTheme(html, combinedCss, observedColors);

  return {
    url: pageUrl,
    theme,
    observedColors,
    typography,
    spacing,
    shapes,
    breakpoints,
    components,
    elementCount: (html.match(/<[a-z0-9-]+/gi) || []).length,
  };
}

function extractColorsFromCss(css) {
  const colorMap = new Map();

  const addColor = (c, role) => {
    if (!c) return;
    const clean = c.trim();
    if (!clean || clean === 'none' || clean === 'transparent' || clean === 'inherit' || clean === 'currentColor') {
      return;
    }
    const current = colorMap.get(clean) || { value: clean, count: 0, roles: new Set() };
    current.count++;
    if (role) current.roles.add(role);
    colorMap.set(clean, current);
  };

  // Hex colors: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
  let hexMatch;
  while ((hexMatch = hexRegex.exec(css)) !== null) {
    addColor(hexMatch[0].toUpperCase(), 'generic');
  }

  // RGB and HSL colors
  const rgbHslRegex = /(?:rgba?|hsla?)\([^)]+\)/gi;
  let rgbMatch;
  while ((rgbMatch = rgbHslRegex.exec(css)) !== null) {
    addColor(rgbMatch[0], 'generic');
  }

  // Contextual extraction: background, color, border
  const bgRegex = /(?:background(?:-color)?)\s*:\s*([^;!]+)/gi;
  let bgMatch;
  while ((bgMatch = bgRegex.exec(css)) !== null) {
    extractColorValuesFromDeclaration(bgMatch[1], (c) => addColor(c, 'background'));
  }

  const textRegex = /(?:^|[^-])color\s*:\s*([^;!]+)/gi;
  let textMatch;
  while ((textMatch = textRegex.exec(css)) !== null) {
    extractColorValuesFromDeclaration(textMatch[1], (c) => addColor(c, 'text'));
  }

  return Array.from(colorMap.values())
    .map((item) => ({
      value: item.value,
      count: item.count,
      roles: Array.from(item.roles),
      provenance: 'observed',
    }))
    .sort((a, b) => b.count - a.count);
}

function extractColorValuesFromDeclaration(decl, callback) {
  const hex = decl.match(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g);
  if (hex) hex.forEach((h) => callback(h.toUpperCase()));

  const rgb = decl.match(/(?:rgba?|hsla?)\([^)]+\)/gi);
  if (rgb) rgb.forEach((r) => callback(r));
}

function extractTypography(css, fontLinks) {
  const fontFamilies = new Map();
  const fontSizes = new Map();
  const fontWeights = new Map();
  const lineHeights = new Map();

  // Parse font-family
  const familyRegex = /font-family\s*:\s*([^;!]+)/gi;
  let match;
  while ((match = familyRegex.exec(css)) !== null) {
    const rawVal = match[1].trim();
    const primary = rawVal.split(',')[0].replace(/['"]/g, '').trim();
    if (primary && !['inherit', 'initial', 'unset'].includes(primary.toLowerCase())) {
      fontFamilies.set(primary, (fontFamilies.get(primary) || 0) + 1);
    }
  }

  // Parse Google fonts link tags
  for (const link of fontLinks) {
    if (link.includes('fonts.googleapis.com/css')) {
      const familyParam = link.match(/family=([^&]+)/);
      if (familyParam) {
        const decoded = decodeURIComponent(familyParam[1]).replace(/\+/g, ' ');
        const name = decoded.split(':')[0];
        fontFamilies.set(name, (fontFamilies.get(name) || 0) + 5);
      }
    }
  }

  // Parse font-size
  const sizeRegex = /font-size\s*:\s*([^;!]+)/gi;
  while ((match = sizeRegex.exec(css)) !== null) {
    const size = match[1].trim();
    if (/^\d+(?:\.\d+)?(?:px|rem|em)$/.test(size)) {
      fontSizes.set(size, (fontSizes.get(size) || 0) + 1);
    }
  }

  // Parse font-weight
  const weightRegex = /font-weight\s*:\s*([^;!]+)/gi;
  while ((match = weightRegex.exec(css)) !== null) {
    const weight = match[1].trim();
    if (/^(?:100|200|300|400|500|600|700|800|900|bold|normal)$/.test(weight)) {
      fontWeights.set(weight, (fontWeights.get(weight) || 0) + 1);
    }
  }

  // Parse line-height
  const lhRegex = /line-height\s*:\s*([^;!]+)/gi;
  while ((match = lhRegex.exec(css)) !== null) {
    const lh = match[1].trim();
    if (/^\d+(?:\.\d+)?(?:px|rem|em)?$/.test(lh)) {
      lineHeights.set(lh, (lineHeights.get(lh) || 0) + 1);
    }
  }

  return {
    families: Array.from(fontFamilies.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    sizes: Array.from(fontSizes.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count),
    weights: Array.from(fontWeights.entries())
      .map(([weight, count]) => ({ weight, count }))
      .sort((a, b) => b.count - a.count),
    lineHeights: Array.from(lineHeights.entries())
      .map(([lineHeight, count]) => ({ lineHeight, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function extractSpacing(css) {
  const spacingMap = new Map();
  const spacingRegex = /(?:margin|padding|gap|row-gap|column-gap)\s*:\s*([^;!]+)/gi;
  let match;

  while ((match = spacingRegex.exec(css)) !== null) {
    const values = match[1].trim().split(/\s+/);
    for (const val of values) {
      if (/^\d+(?:\.\d+)?px$/.test(val)) {
        spacingMap.set(val, (spacingMap.get(val) || 0) + 1);
      }
    }
  }

  return Array.from(spacingMap.entries())
    .map(([unit, count]) => ({ unit, count, pixels: parseFloat(unit) }))
    .sort((a, b) => a.pixels - b.pixels);
}

function extractShapes(css) {
  const radiiMap = new Map();
  const radiusRegex = /border-radius\s*:\s*([^;!]+)/gi;
  let match;

  while ((match = radiusRegex.exec(css)) !== null) {
    const val = match[1].trim();
    if (/^\d+(?:\.\d+)?(?:px|%|rem)?$/.test(val)) {
      radiiMap.set(val, (radiiMap.get(val) || 0) + 1);
    }
  }

  const shadows = [];
  const shadowRegex = /box-shadow\s*:\s*([^;!]+)/gi;
  while ((match = shadowRegex.exec(css)) !== null) {
    const val = match[1].trim();
    if (val !== 'none') shadows.push(val);
  }

  return {
    radii: Array.from(radiiMap.entries())
      .map(([radius, count]) => ({ radius, count }))
      .sort((a, b) => b.count - a.count),
    shadows: Array.from(new Set(shadows)).slice(0, 5),
  };
}

function extractBreakpoints(css) {
  const breakpoints = new Set();
  const mediaRegex = /@media\s*\(\s*(?:min-width|max-width)\s*:\s*([^)]+)\)/gi;
  let match;

  while ((match = mediaRegex.exec(css)) !== null) {
    breakpoints.add(match[1].trim());
  }

  return Array.from(breakpoints);
}

function extractComponentHeuristics(html, css) {
  // Button heuristics
  const buttonMatches = html.match(/<(?:button|a)[^>]+class=["'][^"']*(?:btn|button)[^"']*["'][^>]*>/gi) || [];
  const inputMatches = html.match(/<input[^>]*>/gi) || [];
  const cardMatches = html.match(/<[a-z0-9-]+[^>]+class=["'][^"']*(?:card|panel|container)[^"']*["'][^>]*>/gi) || [];

  return {
    buttonsObserved: buttonMatches.length,
    inputsObserved: inputMatches.length,
    cardsObserved: cardMatches.length,
  };
}

function detectTheme(html, css, colors) {
  // Check for explicit dark theme classes
  if (/<(?:html|body)[^>]+class=["'][^"']*\bdark\b[^"']*["']/i.test(html)) {
    return 'dark';
  }
  if (/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/i.test(css)) {
    return 'dark';
  }

  // Inspect the top background colors
  const topBackgrounds = colors.filter((c) => c.roles.includes('background'));
  if (topBackgrounds.length > 0) {
    const topHex = topBackgrounds[0].value;
    if (topHex.startsWith('#') && topHex.length >= 7) {
      const r = parseInt(topHex.slice(1, 3), 16);
      const g = parseInt(topHex.slice(3, 5), 16);
      const b = parseInt(topHex.slice(5, 7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.4 ? 'dark' : 'light';
    }
  }

  return 'light';
}

function createEmptyExtractionPayload(url) {
  return {
    url,
    theme: 'light',
    observedColors: [],
    typography: { families: [], sizes: [], weights: [], lineHeights: [] },
    spacing: [],
    shapes: { radii: [], shadows: [] },
    breakpoints: [],
    components: { buttonsObserved: 0, inputsObserved: 0, cardsObserved: 0 },
    elementCount: 0,
  };
}
