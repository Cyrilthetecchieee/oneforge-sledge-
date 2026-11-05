# ONEFORGE SLEDGE — IMPLEMENTATION ROADMAP

**Product:** OneForge Sledge  
**Brand:** OneForge  
**Category:** AI-Powered Design Intelligence and Design System Engineering Platform  
**Tracking Version:** 1.0.0  

---

## Roadmap Overview

This roadmap defines the progressive, disciplined transformation of the static data repository into the fully realized **OneForge Sledge** platform. Execution is organized into 11 verifiable milestones.

```
+--------------+     +--------------+     +--------------+     +--------------+
| Milestone 0  | --> | Milestone 1  | --> | Milestone 2  | --> | Milestone 3  |
| Audit & Plan |     | Brand Identity|    | Core Engine  |     | Design Lib   |
+--------------+     +--------------+     +--------------+     +--------------+
                                                                      |
+--------------+     +--------------+     +--------------+            |
| Milestone 6  | <-- | Milestone 5  | <-- | Milestone 4  |<-----------+
| Gen & Export |     | Intelligence |     | Extraction   |
+--------------+     +--------------+     +--------------+
       |
       v
+--------------+     +--------------+     +--------------+     +--------------+
| Milestone 7  | --> | Milestone 8  | --> | Milestone 9  | --> | Milestone 10 |
| Agent/MCP    |     | UI & CLI     |     | Security/QA  |     | Release Ready|
+--------------+     +--------------+     +--------------+     +--------------+
```

---

## Milestones & Status Tracking

### Milestone 0 — Repository and License Audit
- [x] Inspect complete filesystem, dependencies, workflows, assets, and scripts.
- [x] Analyze legal constraints (CC BY 4.0, attribution obligations, trademark notices).
- [x] Identify functional gaps (no UI, no CLI, no local parser, no MCP server, no build system).
- [x] Author `REPOSITORY_AUDIT.md`.
- [x] Author `ARCHITECTURE.md`.
- [x] Author `IMPLEMENTATION_ROADMAP.md`.
- [x] Author `FEATURE_MATRIX.md`.
*Exit Criteria:* Architecture and legal perimeter thoroughly documented; no blind overwrites.

---

### Milestone 1 — OneForge Identity & Legal Foundation
- [ ] Initialize `package.json` with `@oneforge/sledge` metadata, scripts, and dependencies.
- [ ] Establish `THIRD_PARTY_NOTICES.md` acknowledging CC BY 4.0 data sources and upstream attributions.
- [ ] Update `LICENSE` for OneForge Sledge proprietary/open engine code (Apache-2.0 or MIT) while isolating third-party data licenses.
- [ ] Replace upstream marketing assets and references with OneForge Sledge branding.
- [ ] Prepare Git repository configuration (`git init`, `.gitignore`, default branch `main`).
*Exit Criteria:* Project manifest active; legal compliance preserved; brand identity cleanly separated.

---

### Milestone 2 — Core Engine Foundation
- [ ] Implement core data types and schemas in `src/core/types.mjs`.
- [ ] Implement robust schema validation and DESIGN.md parser/validator in `src/core/validator.mjs`.
- [ ] Implement SSRF guard and network security module in `src/core/security.mjs`.
- [ ] Implement storage & repository accessor for curated brands in `src/discovery/repository.mjs`.
- [ ] Unit tests for core validation and security primitives (`tests/security.test.mjs`, `tests/validator.test.mjs`).
*Exit Criteria:* All core schemas typed, validated, and tested with automated checks.

---

### Milestone 3 — Design Library & Discovery Engine
- [ ] Build in-memory query and faceted search index (`src/discovery/search.mjs`).
- [ ] Implement color similarity search using CIELAB and DeltaE calculations.
- [ ] Implement multi-system comparison engine in `src/discovery/compare.mjs`.
- [ ] Add support for custom, user-managed design systems storage.
- [ ] Unit tests for search, filtering, and comparison logic (`tests/search.test.mjs`).
*Exit Criteria:* Fast indexed query performance across 168+ brands with faceted filters and color-matching.

---

### Milestone 4 — Website Extraction Engine
- [ ] Implement safe HTTP fetcher with SSRF guard, redirect loop limits, and timeout bounds (`src/extractor/http.mjs`).
- [ ] Implement robots.txt parser and policy checker (`src/extractor/robots.mjs`).
- [ ] Implement HTML & CSS style parser for colors, typography, spacing, borders, shadows, and components (`src/extractor/html-parser.mjs`).
- [ ] Assemble extraction pipeline orchestrator (`src/extractor/pipeline.mjs`).
- [ ] Unit tests for safe extraction, error handling, and mock site parsing (`tests/extractor.test.mjs`).
*Exit Criteria:* Extraction pipeline successfully inspects URLs, obeys security constraints, and outputs typed raw style payloads.

---

### Milestone 5 — Design Intelligence & Analysis Engine
- [ ] Implement color normalization, color space conversion, and role clustering (`src/analyzer/color-normalizer.mjs`).
- [ ] Implement typography modular scale detector and font hierarchy analysis (`src/analyzer/typography-analyzer.mjs`).
- [ ] Implement spacing base-unit deduction and layout grid analysis (`src/analyzer/spacing-analyzer.mjs`).
- [ ] Implement design intelligence synthesizer with confidence scoring and provenance tracking (`src/analyzer/intelligence.mjs`).
- [ ] Unit tests for color clustering, scale detection, and confidence calculation (`tests/analyzer.test.mjs`).
*Exit Criteria:* Raw style payloads are transformed into high-fidelity, normalized design systems with explicit confidence metrics.

---

### Milestone 6 — Generation & Multi-Format Export Engine
- [ ] Implement Stitch-compatible `DESIGN.md` generator with YAML frontmatter and documentation (`src/generator/markdown-generator.mjs`).
- [ ] Implement CSS Custom Properties exporter (`src/generator/exporters.mjs`).
- [ ] Implement Tailwind CSS theme exporter.
- [ ] Implement W3C DTCG Design Token JSON exporter.
- [ ] Implement SCSS variables exporter.
- [ ] Unit tests for all exporters and DESIGN.md round-trip validation (`tests/generator.test.mjs`).
*Exit Criteria:* Validated export to DESIGN.md, CSS, Tailwind, SCSS, and DTCG JSON formats.

---

### Milestone 7 — AI Coding Agent Ecosystem & MCP Server
- [ ] Implement JSON-RPC 2.0 protocol layer (`src/mcp/protocol.mjs`).
- [ ] Implement MCP tools:
  - `sledge_search_library`
  - `sledge_get_design_system`
  - `sledge_analyze_website`
  - `sledge_generate_design_md`
  - `sledge_compare_design_systems`
  - `sledge_export_tokens`
- [ ] Implement stdio and HTTP transports for Claude Code, Cursor, Codex, Windsurf, and Antigravity (`src/mcp/server.mjs`).
- [ ] Comprehensive MCP test suite (`tests/mcp.test.mjs`).
*Exit Criteria:* MCP server functional, passes protocol specifications, and executes tools synchronously.

---

### Milestone 8 — Product Interface & CLI Experience
- [ ] Implement executable OneForge Sledge CLI (`bin/sledge.mjs`) supporting:
  - `sledge init`, `sledge search`, `sledge get`, `sledge extract`, `sledge analyze`, `sledge generate`, `sledge compare`, `sledge export`, `sledge validate`, `sledge mcp`, `sledge serve`.
- [ ] Implement RESTful API server (`src/server/api.mjs`, `src/server/http-server.mjs`).
- [ ] Build high-density Developer Dashboard Single-Page Application (`src/web/index.html`, `styles.css`, `app.js`):
  1. Dashboard & Metrics Overview
  2. Design Library Explorer & Filters
  3. Live Website Analyzer
  4. Design System Detail & Token Inspector
  5. Design System Comparison Studio
  6. DESIGN.md Generator & Preview
  7. Token Export Center
  8. Agent & MCP Integration Center
  9. Settings & Custom Systems Manager
- [ ] CLI & Server integration tests (`tests/cli.test.mjs`).
*Exit Criteria:* Polished, functional SaaS interface without fake buttons or placeholder data; CLI executable across platforms.

---

### Milestone 9 — Security, Quality Engineering & Verification
- [ ] Perform security penetration tests against SSRF, directory traversal, malicious payloads, and regex denial of service.
- [ ] Run full test suite covering all modules.
- [ ] Verify zero credential leaks, zero unhandled promise rejections, and safe error boundaries.
*Exit Criteria:* 100% test pass rate across unit, integration, and security test suites.

---

### Milestone 10 — Release Readiness & Publication
- [ ] Author professional documentation: `README.md`, `DEVELOPMENT.md`, `DEPLOYMENT.md`, `API_REFERENCE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `ROADMAP.md`.
- [ ] Configure modern GitHub Actions workflows (`.github/workflows/ci.yml`).
- [ ] Prepare clean git repository with initial commit and publication commands for user approval.
*Exit Criteria:* Production-ready codebase, documented and packaged under OneForge ownership.
