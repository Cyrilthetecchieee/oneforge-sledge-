/**
 * OneForge Sledge — Core Data Models and Types
 */

export const COLOR_ROLES = [
  'background',
  'surface',
  'on-surface',
  'on-background',
  'on-surface-strong',
  'on-surface-variant',
  'on-surface-muted',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'overlay',
  'outline',
  'outline-variant',
  'primary',
  'on-primary',
  'secondary',
  'tertiary',
];

export const TYPOGRAPHY_ROLES = [
  'headline-display',
  'headline-lg',
  'headline-md',
  'headline-sm',
  'body-lg',
  'body-md',
  'body-sm',
  'caption',
  'label-md',
  'label-sm',
];

export const SPACING_STEPS = ['xs', 'sm', 'md', 'lg', 'xl', 'gutter', 'margin'];

export const ROUNDED_STEPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'];

/**
 * Creates a normalized DesignSystem object.
 */
export function createDesignSystem({
  id = '',
  name = '',
  host = '',
  description = '',
  category = 'General',
  theme = 'light',
  colors = {},
  typography = {},
  rounded = {},
  spacing = {},
  components = {},
  dos = [],
  donts = [],
  motion = {},
  provenance = {},
  confidence = {},
  rawMarkdown = '',
} = {}) {
  return {
    id: id || host || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: name.trim(),
    host: host.toLowerCase().trim(),
    description: description.trim(),
    category: category.trim(),
    theme: theme.toLowerCase(),
    tokens: {
      colors: { ...colors },
      typography: { ...typography },
      rounded: { ...rounded },
      spacing: { ...spacing },
      components: { ...components },
    },
    documentation: {
      dos: Array.isArray(dos) ? [...dos] : [],
      donts: Array.isArray(donts) ? [...donts] : [],
      motion: { ...motion },
    },
    provenance: createProvenance(provenance),
    confidence: createConfidenceScores(confidence),
    rawMarkdown: rawMarkdown || '',
  };
}

/**
 * Creates a provenance tracking record.
 */
export function createProvenance({
  sourceUrl = '',
  extractedAt = new Date().toISOString(),
  verifiedAt = null,
  collector = 'OneForge Sledge Engine',
  version = '1.0.0',
  method = 'automated_computed_style', // 'automated_computed_style' | 'curated_benchmark' | 'manual_override'
  viewport = '1440x900',
  notes = '',
} = {}) {
  return {
    sourceUrl,
    extractedAt,
    verifiedAt,
    collector,
    version,
    method,
    viewport,
    notes,
  };
}

/**
 * Creates a quantitative confidence scores object.
 */
export function createConfidenceScores({
  overall = 0.85,
  colors = 0.9,
  typography = 0.85,
  spacing = 0.8,
  components = 0.75,
  sampleElementCount = 100,
} = {}) {
  return {
    overall: Math.min(1.0, Math.max(0.0, Number(overall.toFixed(2)))),
    colors: Math.min(1.0, Math.max(0.0, Number(colors.toFixed(2)))),
    typography: Math.min(1.0, Math.max(0.0, Number(typography.toFixed(2)))),
    spacing: Math.min(1.0, Math.max(0.0, Number(spacing.toFixed(2)))),
    components: Math.min(1.0, Math.max(0.0, Number(components.toFixed(2)))),
    sampleElementCount: Math.max(0, Math.floor(sampleElementCount)),
  };
}

/**
 * Creates a Typography rule definition.
 */
export function createTypographyRule({
  fontFamily = 'system-ui, sans-serif',
  fontSize = '16px',
  fontWeight = 400,
  lineHeight = 1.5,
  letterSpacing = 'normal',
} = {}) {
  return {
    fontFamily: String(fontFamily).trim(),
    fontSize: String(fontSize).trim(),
    fontWeight: Number(fontWeight) || 400,
    lineHeight: isNaN(Number(lineHeight)) ? String(lineHeight) : Number(lineHeight),
    letterSpacing: String(letterSpacing).trim(),
  };
}

/**
 * Creates a Component token definition.
 */
export function createComponentToken({
  backgroundColor = '',
  textColor = '',
  typography = '',
  rounded = '',
  padding = '',
  height = '',
  border = '',
} = {}) {
  return {
    backgroundColor,
    textColor,
    typography,
    rounded,
    padding,
    height,
    border,
  };
}
