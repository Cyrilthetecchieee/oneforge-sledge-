# ONEFORGE SLEDGE — SYSTEM ARCHITECTURE SPECIFICATION

**Product:** OneForge Sledge  
**Parent Brand:** OneForge  
**Product Category:** AI-Powered Design Intelligence and Design System Engineering Platform  
**Document Version:** 1.0.0  
**Status:** Approved Architectural Standard  

---

## 1. System Overview & Architectural Principles

**OneForge Sledge** is an independent, developer-grade design intelligence platform engineered to bridge the gap between web design systems, human frontend engineers, and autonomous AI coding agents (such as Claude Code, Cursor, Codex, Windsurf, and Antigravity).

```
                      +------------------------------------------+
                      |               USER CLIENTS               |
                      |  Developers * Designers * AI Coding Bots |
                      +------------------------------------------+
                                    |              |
           +------------------------+              +-----------------------+
           | CLI Commands (sledge)                 | Web Browser (UI/UX)   |
           v                                       v
+-----------------------+               +----------------------------------+
|   OneForge CLI Core   |               |   OneForge Sledge Web Server     |
|   (bin/sledge.mjs)    |               |   - RESTful API (/api/*)         |
+-----------------------+               |   - Static SPA Dashboard         |
           |                            +----------------------------------+
           |                                       |
           +-------------------+-------------------+
                               |
                               v
+--------------------------------------------------------------------------+
|                  ONEFORGE SLEDGE SERVICE ENGINE                          |
|                                                                          |
|  +---------------------+  +---------------------+  +------------------+  |
|  | Discovery & Search  |  | Extraction Pipeline |  | Intelligence &   |  |
|  | - Index query       |  | - Safe HTTP / SSRF  |  |   Analysis       |  |
|  | - DeltaE similarity |  | - Robots.txt check  |  | - Color clusters |  |
|  | - Theme/Style filter|  | - DOM/CSS parser    |  | - Type scale     |  |
|  +---------------------+  +---------------------+  | - Spacing grid   |  |
|                                                    +------------------+  |
|  +---------------------+  +---------------------+                        |
|  | Comparison Studio   |  | Generation & Export |  +------------------+  |
|  | - Diff engine       |  | - DESIGN.md builder |  | Model Context    |  |
|  | - Palette overlap   |  | - CSS/Tailwind/DTCG |  | Protocol (MCP)   |  |
|  | - Typography audit  |  | - SCSS variables    |  | JSON-RPC 2.0     |  |
|  +---------------------+  +---------------------+  +------------------+  |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  | Security & Sandboxing: SSRF Protection / Safe File I/O / Validator |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------------------+
|                         STORAGE & DATA LAYER                             |
|  - Curated Design Systems Archive (CC BY 4.0 Adapted Datasets)           |
|  - OneForge Custom Design System Store (User-managed JSON Libraries)     |
|  - Search Index & Cached Extraction Cache                                |
+--------------------------------------------------------------------------+
```

### Core Design Principles
1. **Zero Black-Box Guarantees**: Every token must be tagged with explicit provenance (e.g. `observed_computed_style`, `inferred_contrast`, `user_defined`) and a quantitative confidence score (0.0 to 1.0).
2. **Defensive Security First**: All network ingestion must pass strict SSRF guards, blocking loopback, link-local, RFC-1918 private networks, and cloud metadata endpoints.
3. **Multi-Modal Ergonomics**: Complete parity across three consumption surfaces:
   - **Terminal**: Headless, scriptable CLI (`sledge`) with clean JSON and tabular outputs.
   - **Agent Interface**: High-performance JSON-RPC 2.0 Model Context Protocol (MCP) server.
   - **Web Interface**: Modern, technical, high-density SaaS dashboard.
4. **Standard Compatibility**: Full compliance with the `DESIGN.md` specification, W3C Design Tokens Community Group (DTCG) formats, and modern CSS/Tailwind standards.

---

## 2. Component Subsystems

### 2.1 The Extraction Pipeline (`src/extractor/`)
The extraction pipeline accepts a target URL and processes it safely:
- **SSRF & DNS Guard**: Validates hostname and resolved IP address. Rejects `localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` (AWS/GCP/Azure metadata), and IPv6 link-local equivalents.
- **Robots.txt Evaluator**: Fetches and respects site robots directives.
- **HTTP Fetcher**: Executes with bounded timeouts (default 15s), max redirect depth (max 3), strict content-type verification (`text/html`), and streaming byte limits (max 5 MB).
- **CSS & HTML Parser**: Extracts inline styles, linked stylesheets, computed color definitions, Google Fonts / `@font-face` declarations, element dimensions, margins/paddings, and semantic structure.
- **Output**: Typed `RawExtractionPayload`.

### 2.2 The Design Intelligence & Analysis Engine (`src/analyzer/`)
Transforms raw DOM/CSS observations into an organized design system:
- **Color Normalization & Deduplication**: Converts RGB, RGBA, HSL, HSLA, named colors, and hex values into standardized 6-digit or 8-digit uppercase Hex strings.
- **CIELAB & DeltaE Clustering**: Groups colors within visual threshold ($\Delta E < 3.0$) to identify primary brand color, background surfaces, on-surface text, borders, and accent highlights.
- **Typography Analysis**: Identifies loaded font families, normalizes font stacks, maps observed font-size distributions to modular scales (e.g., Major Third 1.25, Perfect Fourth 1.333), and identifies headline/body hierarchy.
- **Spacing Grid Detection**: Analyzes margins, paddings, and flex/grid gaps to detect base spacing steps ($4\text{px}$, $8\text{px}$, etc.).
- **Confidence Scorer**: Calculates confidence levels based on element count, frequency of occurrence, and styling consistency.

### 2.3 Generation & Export Engine (`src/generator/`)
Translates structured design system models into consumer-ready artifacts:
- **DESIGN.md Builder**: Formats frontmatter YAML followed by structured Markdown documentation according to the official spec.
- **CSS Variables Exporter**: Generates `:root { --color-primary: #...; --font-body: ...; }`.
- **Tailwind Config Exporter**: Generates `module.exports = { theme: { extend: { colors: {...}, fontFamily: {...} } } }`.
- **DTCG JSON Exporter**: Exports to the W3C Design Token specification (`{ "color": { "primary": { "$value": "#...", "$type": "color" } } }`).
- **SCSS Exporter**: Generates `$color-primary: #...;` variables.

### 2.4 Model Context Protocol (MCP) Server (`src/mcp/`)
Exposes standardized tools for AI coding agents over JSON-RPC 2.0 (stdio and HTTP streaming transports):
- `sledge_search_library`: Search design systems by name, keyword, category, or hex color similarity.
- `sledge_get_design_system`: Retrieve complete token specs and DESIGN.md markdown for a brand.
- `sledge_analyze_website`: Extract and analyze live URL styling in real time.
- `sledge_generate_design_md`: Synthesize custom token specs into a validated DESIGN.md file.
- `sledge_compare_design_systems`: Perform deep comparison between two design systems.
- `sledge_export_tokens`: Export design tokens into CSS, Tailwind, DTCG JSON, or SCSS.

### 2.5 Discovery & Comparison Engine (`src/discovery/`)
- **Query Engine**: Fast in-memory indexed search supporting multi-field filtering (category, theme, fonts, colors).
- **Color Search**: Hex color search using Euclidean distance in Lab color space.
- **Comparison Studio**: Differential engine computing color palette intersection/distance, typography overlap, spacing grid divergence, and component consistency index.

### 2.6 Sledge CLI (`bin/sledge.mjs`)
Command-line interface with subcommands:
- `sledge init`: Initialize a new DESIGN.md in the current directory.
- `sledge search <query>`: Search the design systems library.
- `sledge get <brand>`: Fetch and display or save a design system.
- `sledge extract <url>`: Extract raw design styles from a website.
- `sledge analyze <url>`: Extract, analyze, and output structured intelligence.
- `sledge generate <url>`: Produce a complete DESIGN.md from a live site.
- `sledge compare <sysA> <sysB>`: Compare two design systems side-by-side.
- `sledge export <brand> --format=<css|tailwind|dtcg|scss>`: Export tokens.
- `sledge validate <file>`: Validate a DESIGN.md against the schema.
- `sledge mcp`: Launch the MCP server over stdio.
- `sledge serve [--port 3000]`: Launch the Web Dashboard & API server.

### 2.7 Web Dashboard & Server (`src/server/` & `src/web/`)
A responsive, high-density developer dashboard:
- Embedded HTTP API server providing REST endpoints: `/api/search`, `/api/brands/:host`, `/api/extract`, `/api/analyze`, `/api/generate`, `/api/compare`, `/api/export`, `/api/custom-systems`.
- Single-page application frontend built with modern vanilla web standards (responsive grid, reactive state store, zero bloated runtime frameworks).

---

## 3. Directory & Module Structure

```
design-md-main/
├── bin/
│   └── sledge.mjs                   # Executable CLI entrypoint
├── src/
│   ├── index.mjs                    # Programmatic library exports
│   ├── config.mjs                   # Global configuration & environment options
│   ├── core/
│   │   ├── types.mjs                # Data structures, schemas, and token models
│   │   ├── validator.mjs            # Schema validation & error reporting
│   │   └── security.mjs             # SSRF protection, IP sanitization, path safety
│   ├── discovery/
│   │   ├── repository.mjs           # Design system index loader & disk access
│   │   ├── search.mjs               # Faceted query engine & color distance
│   │   └── compare.mjs              # System comparison & differential calculations
│   ├── extractor/
│   │   ├── http.mjs                 # Safe HTTP client with timeout & SSRF checks
│   │   ├── robots.mjs               # Robots.txt compliance parser
│   │   ├── html-parser.mjs          # DOM extraction & stylesheet resolution
│   │   └── pipeline.mjs             # Extraction pipeline coordinator
│   ├── analyzer/
│   │   ├── color-normalizer.mjs     # Color spaces, hex conversions, CIELAB delta
│   │   ├── typography-analyzer.mjs  # Modular scale detection & font hierarchy
│   │   ├── spacing-analyzer.mjs     # Base unit detection & layout metrics
│   │   └── intelligence.mjs         # Master token synthesis & confidence scoring
│   ├── generator/
│   │   ├── markdown-generator.mjs   # DESIGN.md text & frontmatter generator
│   │   └── exporters.mjs            # CSS, Tailwind, DTCG JSON, SCSS exporters
│   ├── mcp/
│   │   ├── protocol.mjs             # JSON-RPC 2.0 protocol handler
│   │   ├── tools.mjs                # Tool registrations & execution handlers
│   │   └── server.mjs               # Stdio & HTTP transport bindings
│   ├── server/
│   │   ├── api.mjs                  # REST API route handlers
│   │   └── http-server.mjs          # HTTP server & static asset host
│   └── web/                         # Developer Dashboard SPA
│       ├── index.html               # Main dashboard UI
│       ├── styles.css               # OneForge Sledge high-density dark/light theme
│       └── app.js                   # Client-side reactivity, router & visualizers
├── tests/                           # Comprehensive test suite
│   ├── security.test.mjs            # SSRF and input security tests
│   ├── validator.test.mjs           # Schema and DESIGN.md validation tests
│   ├── extractor.test.mjs           # Extraction pipeline tests
│   ├── analyzer.test.mjs            # Intelligence, color clustering & type scale tests
│   ├── generator.test.mjs           # DESIGN.md and exporter tests
│   ├── search.test.mjs              # Search and comparison tests
│   ├── mcp.test.mjs                 # MCP JSON-RPC protocol tests
│   └── cli.test.mjs                 # CLI command integration tests
├── design-md/                       # Curated dataset (CC BY 4.0 Adapted)
│   └── <host>/                      # 168 existing brand directories
├── index.json                       # Catalog index of curated brands
├── package.json                     # Project manifest and scripts
├── THIRD_PARTY_NOTICES.md           # Legal attributions for third-party assets
├── LICENSE                          # OneForge Sledge primary license
└── README.md                        # Master product documentation
```

---

## 4. Data Models & Schemas

### 4.1 Token Specification (`DESIGN.md` Frontmatter)
```yaml
version: alpha
name: string
description: string
colors:
  background: "#HEX"
  surface: "#HEX"
  on-surface: "#HEX"
  on-background: "#HEX"
  on-surface-strong: "#HEX"
  on-surface-variant: "#HEX"
  on-surface-muted: "#HEX"
  primary: "#HEX"
  on-primary: "#HEX"
  secondary: "#HEX"
  tertiary: "#HEX"
  outline: "#HEX"
typography:
  headline-display: { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing? }
  headline-lg: { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing? }
  body-md: { fontFamily, fontSize, fontWeight, lineHeight }
  body-sm: { fontFamily, fontSize, fontWeight, lineHeight }
rounded:
  sm: string
  md: string
spacing:
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
components:
  button-primary: { backgroundColor, textColor, typography, rounded, padding, height }
  input-field: { textColor, typography, rounded, padding }
```

### 4.2 System Metadata with Provenance & Confidence
```typescript
interface OneForgeDesignSystem {
  id: string;
  name: string;
  host: string;
  category: string;
  theme: 'light' | 'dark' | 'auto';
  tokens: {
    colors: Record<string, string>;
    typography: Record<string, TypographyRule>;
    rounded: Record<string, string>;
    spacing: Record<string, string>;
    components: Record<string, ComponentRule>;
  };
  provenance: {
    sourceUrl: string;
    extractedAt: string;
    extractorVersion: string;
    verifiedAt?: string;
    method: 'automated_computed_style' | 'curated_benchmark' | 'manual_override';
  };
  confidence: {
    overall: number; // 0.0 - 1.0
    colors: number;
    typography: number;
    spacing: number;
    components: number;
    observedElementCount: number;
  };
  documentation: {
    overview: string;
    dos: string[];
    donts: string[];
  };
}
```

---

## 5. Security & Isolation Architecture

1. **Anti-SSRF Subsystem**:
   - Every target URL hostname is resolved using `dns.lookup()`.
   - The resolved IP is inspected against CIDR masks for `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.0.0.0/24`, `192.168.0.0/16`, `198.18.0.0/15`, and IPv6 `::1`, `fc00::/7`, `fe80::/10`.
   - If the IP resolves to any private, link-local, loopback, or cloud-metadata range, the request is blocked prior to TCP connection initiation.
   - Redirect chains are pinned and re-validated at each hop.
2. **Resource Exhaustion Defense**:
   - Maximum download size: 5 MB.
   - Strict 15-second wall clock timeout.
   - Concurrency limits for batch extraction jobs.
3. **Safe File Handling**:
   - Strict sanitization of brand hosts to prevent directory traversal (`..` or separator injections). Only valid RFC-1123 domain names are permitted.
4. **Secret Management**:
   - No hardcoded tokens, API keys, or credentials.
