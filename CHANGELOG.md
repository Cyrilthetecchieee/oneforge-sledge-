# ONEFORGE SLEDGE — CHANGELOG

All notable changes to the OneForge Sledge project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-05

### Added
- **Core Architecture**:
  - Independent OneForge Sledge brand identity, manifest (`@oneforge/sledge`), and Apache-2.0 licensing.
  - Complete TypeScript/ESM architecture running natively on Node 20+ without external runtime dependencies.
- **Defensive Extraction Pipeline**:
  - Pre-request DNS resolution and CIDR range blocking against SSRF, private IPs, and cloud metadata tampering.
  - Automated `robots.txt` compliance parser.
  - Computed style parser extracting colors, font families, font sizes, weights, margins, paddings, border-radii, and shadows.
- **Design Intelligence Engine**:
  - Perceptual color clustering using CIELAB Euclidean distance ($\Delta E < 3.2$).
  - Automated semantic color role classifier (background, surface, on-surface, primary, on-primary, outline).
  - Modular typography scale ratio detector (Major Third, Perfect Fourth, Golden Ratio, etc.).
  - Spacing grid base-unit rhythm detection (Base 4px vs Base 8px).
  - Quantitative confidence scorer and provenance tracking.
- **Generation & Multi-Format Exporters**:
  - Deterministic Stitch-compatible `DESIGN.md` generator with YAML frontmatter.
  - CSS Custom Properties exporter (`:root { ... }`).
  - Tailwind CSS preset configuration exporter.
  - W3C Design Tokens Community Group (DTCG) standard JSON exporter.
  - SCSS variable exporter.
- **Multi-System Comparison Studio**:
  - Side-by-side differential comparison of two design systems.
  - Primary color $\Delta E$ distance, palette overlap percentage, typography overlap, and similarity index.
- **Model Context Protocol (MCP) Server**:
  - Standards-compliant JSON-RPC 2.0 server supporting `stdio` and HTTP transports.
  - Six MCP tools: `sledge_search_library`, `sledge_get_design_system`, `sledge_analyze_website`, `sledge_generate_design_md`, `sledge_compare_design_systems`, `sledge_export_tokens`.
- **User Interface & Tooling**:
  - Unified `sledge` CLI executable with subcommands: `init`, `search`, `get`, `extract`, `analyze`, `generate`, `compare`, `export`, `validate`, `mcp`, `serve`.
  - Modern, high-density Web Application & Developer Dashboard with light and dark themes.
  - Embedded RESTful HTTP API server.
- **Quality Assurance & Testing**:
  - 36 automated unit, integration, security, and CLI tests passing in under 1 second.
