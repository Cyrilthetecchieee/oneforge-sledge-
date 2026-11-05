# ONEFORGE SLEDGE — REPOSITORY AUDIT & GAP ANALYSIS

**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** Principal Software Architect, OneForge Engineering  
**Subject:** Upstream Repository Inspection (`Josephbadigar/design-md`) -> Transformation to **OneForge Sledge**

---

## 1. Executive Summary

A comprehensive, forensic audit of the supplied repository was executed prior to undertaking any destructive modifications. 

The original repository was ostensibly described as a "DESIGN.md library for AI coding agents." However, technical inspection reveals that the repository contains **no software application, no build system, no user interface, no extraction engine, no analyzer, and no local agent integration**. 

Instead, the codebase is a **pure static data archive** of 168 pre-scraped design documents and an automated synchronization script (`scripts/sync.mjs`) scheduled via GitHub Actions (`.github/workflows/sync.yml`) to poll and mirror markdown files from an external commercial service (`sitepeel.dev`).

### Key Inventory Metrics
| Item | Observed Quantity | Details |
| :--- | :--- | :--- |
| **Source Code Files** | 1 file | `scripts/sync.mjs` (423 lines, Node.js ESM) |
| **Workflow Files** | 1 file | `.github/workflows/sync.yml` (40 lines) |
| **Static Data Files** | 1 index + 336 brand files | `index.json` (111 KB, 168 brands) + 168 `DESIGN.md` + 168 `README.md` |
| **Asset Files** | 4 image files | `assets/*.png` (Sitepeel marketing banners and promotional screenshots) |
| **Legal / Attribution** | 2 files | `LICENSE` (CC BY 4.0), `NOTICE` (Sitepeel credit requirement) |
| **Documentation** | 1 root file | `README.md` (55.7 KB auto-generated catalog) |
| **Application Runtime** | **0** | No CLI, no server, no frontend, no tests, no `package.json` |

---

## 2. Granular Inventory & File-by-File Analysis

### 2.1 Configuration & Metadata
- **`.gitattributes`**: Defines line endings (`* text=auto eol=lf`) and binary image markers (`*.png`, `*.jpg`).
- **`.git/`**: **Absent**. The supplied directory is an unversioned filesystem dump.
- **`package.json`**: **Absent**. No Node.js manifest exists. The scripts rely on raw Node 20+ runtime APIs (`fetch`, `fs/promises`).

### 2.2 Automation & Tooling
- **`scripts/sync.mjs`**:
  - Connects to `https://sitepeel.dev/design-md/examples/index.md` via `fetch`.
  - Parses category headings and brand bullet points using regular expressions (`ENTRY_RE`, `HOST_RE`).
  - Fetches individual `DESIGN.md` files from `sitepeel.dev/design-md/<host>/DESIGN.md`.
  - Performs validation: aborts if fewer than 90% of existing brands are returned, or if HTTP responses contain HTML challenge pages.
  - Rewrites local directories: creates `design-md/<host>/DESIGN.md` and generates brand-level `README.md` containing marketing backlinks to `sitepeel.dev`.
  - Generates the root `README.md` containing markdown tables and shields badges referencing `Josephbadigar/design-md`.
  - Generates `index.json`.
- **`.github/workflows/sync.yml`**:
  - Scheduled cron (`23 4 * * *`) and `workflow_dispatch`.
  - Checks out repo, configures Node 24, runs `node scripts/sync.mjs`, commits with `github-actions[bot]`, and pushes to `origin`.

### 2.3 The Dataset (`design-md/`)
- Contains 168 directory subtrees, named by internet hostname (e.g., `stripe.com`, `linear.app`, `anthropic.com`, `cursor.com`).
- Each folder contains two files:
  1. `DESIGN.md`: YAML frontmatter (schema containing `version: alpha`, `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, `components`) followed by human-readable Markdown analysis (Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts, Motion).
  2. `README.md`: Auto-generated summary file with links back to the original author's commercial website.

### 2.4 Index and Visual Assets
- **`index.json`**: JSON representation of the 168 brands across 11 categories: *AI, Developer tools, UI and animation libraries, SaaS and productivity, Fintech and payments, Marketing and analytics, Design tools and site builders, Inspiration, E-commerce and brands, Media and consumer apps, Security and privacy*.
- **`assets/`**:
  - `any-site.png` (Promoting Sitepeel generator)
  - `banner.png` (Sitepeel banner)
  - `how-to-use.png` (Diagram referencing Sitepeel)
  - `sitepeel-tools.png` (Screenshot of Sitepeel tool suite)

---

## 3. The Eight Architectural Categories Assessment

### 3.1 What Already Works
- **Static Dataset Format**: The 168 `DESIGN.md` files possess a structured YAML frontmatter schema that provides valid color, typography, spacing, and component definitions.
- **Index Data**: `index.json` provides structured metadata including brand name, domain, primary category, theme (light/dark), extracted font families, hex color palettes, and accent color.
- **Sync Logic Integrity**: The script `scripts/sync.mjs` demonstrates robust transactional safety patterns (verifies all files before disk write; enforces 90% safety threshold; rejects HTML challenge pages).

### 3.2 What Partially Works
- **Synchronization**: `scripts/sync.mjs` executes and can parse the external sitepeel index, but it is tightly coupled to proprietary upstream endpoints (`sitepeel.dev`), uses hardcoded GitHub URLs (`Josephbadigar/design-md`), and fails if Cloudflare challenge pages or network firewalls block the crawler.

### 3.3 What is Only Documentation or Static Data
- **The Entire System Today**: The repository is essentially a curated dataset. 
- There is no interactive UI, no local API, no CLI commands, and no local tool integration.
- The root `README.md` and brand `README.md` files serve primarily as landing pages and marketing funnels for third-party commercial services.

### 3.4 What Depends on External Services
- Extraction of new websites depends 100% on `sitepeel.dev` proprietary servers.
- The repo has no local DOM parser, no local Puppeteer/Playwright or HTTP CSS extractor, and no local token analysis algorithm.
- Screenshots are hosted externally on `https://sitepeel.dev/design-md/<host>/screenshot.jpg`.

### 3.5 What is Missing
- **Executable Package Manifest**: No `package.json`, no scripts, no dependency manager.
- **OneForge Sledge CLI (`sledge`)**: Missing entirely (`sledge init`, `sledge analyze`, `sledge extract`, `sledge generate`, `sledge search`, `sledge compare`, `sledge export`, `sledge validate`).
- **Independent Extraction Engine**: No local crawler or CSS/HTML computed style extraction pipeline with SSRF/private IP protection.
- **Design Intelligence & Analysis Engine**: No color clustering, typography scale calculation, spacing grid detection, or confidence scoring algorithms.
- **Model Context Protocol (MCP) Server**: No local MCP server implementing `get_design_system`, `search_design_library`, `analyze_website`, etc., for AI coding agents.
- **Interactive Web Application**: No local web interface or dashboard to browse, compare, analyze, inspect tokens, and export design specifications.
- **Token Export Pipeline**: No converters to Tailwind CSS, CSS Custom Properties, SCSS, or DTCG JSON.
- **Quality Assurance**: Zero unit tests, zero integration tests, zero linting or typechecking configurations.

### 3.6 What Needs to be Replaced
- **Branding & Marketing Backlinks**: All promotional references to external commercial entities, badges pointing to third-party GitHub repos, and external screenshots must be replaced with OneForge Sledge product architecture.
- **Hardcoded Upstream GitHub URLs**: Replace all `Josephbadigar/design-md` URLs with the configurable repository origin.
- **Upstream Marketing Images**: Replace third-party asset images with OneForge Sledge technical diagrams and original vector assets.

### 3.7 What Can be Legally Reused
- **The Design System Dataset (`design-md/`)**: Licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
  - The dataset can be shared, adapted, transformed, and built upon for any purpose, including commercial products.
  - *Legal Obligation*: Appropriate credit must be provided ("Sitepeel (sitepeel.dev)" with a link to `https://sitepeel.dev`), a copy of or link to the CC BY 4.0 license must be included, and any modifications must be indicated.
  - *Notice Maintenance*: We must preserve attribution in `THIRD_PARTY_NOTICES.md` and retain accurate legal provenance.

### 3.8 What Should be Independently Implemented
- The complete **OneForge Sledge** core architecture:
  1. TypeScript/Node.js ESM architecture with rigorous schema definitions.
  2. Local, zero-dependency or lightweight Extraction & Computed Style Engine with SSRF safety.
  3. Design Intelligence Engine (color grouping, modular scale analysis, spacing grid deduction, confidence scoring).
  4. DESIGN.md Generator & Token Exporters (CSS, Tailwind, DTCG JSON, SCSS).
  5. Multi-system Comparison Studio.
  6. Standard Model Context Protocol (MCP) JSON-RPC 2.0 server.
  7. CLI executable (`sledge`).
  8. Full-stack Developer Interface (Modern dashboard, visual token explorer, interactive generator).
  9. Comprehensive test suite and security audit.

---

## 4. Technical Debt & Vulnerability Profile

1. **Security Vulnerability in Remote Scraping**: The existing `sync.mjs` accepts arbitrary URLs if adapted, lacking SSRF (Server-Side Request Forgery) protection, private IP address blocking (e.g. `127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`), or redirect hop limits.
2. **Brittle Regex Index Parsing**: Index parsing relies on strict whitespace and markdown formatting (`ENTRY_RE`), making it fragile against structural changes.
3. **No Fallback or Offline Mode**: If upstream network requests fail or Cloudflare mitigation triggers, the script terminates with fatal errors.
4. **Single-Source Dependency**: Total dependence on a single closed-source third-party API for fresh data.

---

## 5. Architectural Recommendation

Proceed immediately with the transformation of the repository into the unified **OneForge Sledge** platform. Retain the CC BY 4.0 dataset in an isolated, credited directory structure, and engineer a state-of-the-art, standalone application framework encompassing CLI, MCP server, local extraction, design intelligence, and a developer-grade web interface.
