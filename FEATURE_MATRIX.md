# ONEFORGE SLEDGE — FEATURE & ARCHITECTURE MATRIX

**Document Version:** 1.0.0  
**Status:** Baseline & Target Feature Comparison  

---

## 1. Comparative Architecture Overview

| Dimension | Upstream Inherited State (`design-md`) | OneForge Sledge Target State | Delta / Upgrade Strategy |
| :--- | :--- | :--- | :--- |
| **Product Identity** | Marketing catalog for third-party service | Independent, professional AI design intelligence platform | Complete re-architecture, original branding & clean metadata |
| **Runtime Code** | 1 single sync script (`sync.mjs`) | Modular TypeScript/ESM multi-tier architecture | Comprehensive engine across CLI, API, UI, MCP, and Extractor |
| **Build & Manifest** | Missing (`package.json` absent) | Full `@oneforge/sledge` manifest, scripts & dependencies | Modern ESM architecture with Node 20+ native capabilities |
| **Website Extraction** | Delegated 100% to external server | Independent, local HTTP/CSS extraction pipeline | Safe client with SSRF guards, robots.txt, and computed style extraction |
| **Token Analysis** | None (pre-compiled files only) | Deep Design Intelligence Engine | Color clustering ($\Delta E$), type scale deduction, spacing grid analysis |
| **Generator** | None (mirrored static files) | In-engine Stitch-compliant DESIGN.md generator | Generates valid frontmatter & markdown with validation |
| **Token Exporters** | Markdown only | Multi-format: CSS Variables, Tailwind, DTCG JSON, SCSS | Standard-compliant token serializers |
| **AI Agent Support** | External third-party URL link | Built-in Model Context Protocol (MCP) server | Local JSON-RPC 2.0 stdio & HTTP MCP server with 6 tools |
| **CLI Tooling** | None | Unified `sledge` CLI executable | Full command suite for headless automation and pipelines |
| **User Interface** | None (Markdown files only) | High-density Web Application & Dashboard | Professional SaaS interface with zero mock or placeholder elements |
| **Quality & Tests** | 0 tests | Comprehensive automated test suite | Unit, integration, security, and schema regression tests |
| **Security Controls** | None | Anti-SSRF, DNS pinning, private IP blocks, safe I/O | Enterprise-grade defensive network and input sanitization |

---

## 2. Granular Feature Matrix

### A. Design System Discovery & Catalog
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| Search by Brand Name | Partial (Markdown table) | Full in-memory indexed multi-token search | Automated query tests |
| Search by Industry / Category | Partial (Markdown sections) | Faceted category filtering across 11 categories | Category filter tests |
| Search by Hex Color ($\Delta E$) | ❌ Not available | CIELAB Euclidean color distance search | Color matching accuracy tests |
| Filter by Light / Dark Theme | ❌ Static text only | Structured theme filter (`light`, `dark`, `all`) | Filter assertion tests |
| Filter by Typography Family | ❌ Static text only | Font-family indexed search | Typography query tests |
| Structured Token Summaries | ⚠️ Frontmatter only | High-density Token Explorer & Inspector | UI and JSON model validation |
| Custom Design System Libraries| ❌ Not available | User-managed local storage & custom additions | CRUD operation tests |

### B. Website Design Extraction Pipeline
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| Target URL Input & Verification| ❌ Not available | RFC-valid URL parser with domain sanitization | URL validator tests |
| Anti-SSRF & Private IP Blocking| ❌ Not available | Strict DNS pre-resolution & CIDR subnet blocker | Malicious IP rejection tests |
| Robots.txt Compliance | ❌ Not available | Automated robots.txt parser & directive checker | Disallow/Allow policy tests |
| Color Extraction | ❌ External only | DOM/CSS computed color extractor (inline + linked) | Mock HTML/CSS extraction tests |
| Typography Extraction | ❌ External only | `@font-face`, Google Fonts, computed styles parser | Font stack extraction tests |
| Spacing & Layout Metrics | ❌ External only | Margins, paddings, gap and layout width detection | Box model analysis tests |
| Radii & Shadow Extraction | ❌ External only | Border-radius and box-shadow pattern extractor | Radii pattern tests |
| Component Pattern Detection | ❌ External only | Heuristic identification of buttons, inputs, cards | Semantic element tests |
| Provenance & Confidence | ❌ Static footer | Explicit token tagging (`observed` vs `inferred`) | Provenance schema validation |

### C. Design Analysis & Intelligence Engine
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| Color Normalization | ❌ None | Standardize RGB, RGBA, HSL to Hex uppercase | Normalizer unit tests |
| CIELAB / Delta-E Clustering | ❌ None | Group visually indistinguishable shades ($\Delta E < 3.0$)| Clustering accuracy tests |
| Semantic Color Role Assignment | ❌ None | Auto-map to background, surface, text, primary | Role classifier tests |
| Modular Typography Scale | ❌ None | Ratio detection (Major Third, Perfect Fourth, etc.) | Ratio fit tests |
| Spacing Grid Deduction | ❌ None | Base-4 or Base-8 grid fitting with remainder score | Grid deduction tests |
| Inconsistency Detection | ❌ None | Identifies rogue off-grid colors and spacing values | Anomaly reporting tests |
| Quantitative Confidence Score | ❌ None | Composite score based on sample size & variance | Math verification tests |

### D. DESIGN.md Generator & Token Exporters
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| Stitch-Compliant DESIGN.md | ⚠️ Scraped only | Native deterministic generator from structured data | Spec compliance validator |
| CSS Custom Properties (`:root`)| ❌ None | Generates clean CSS variable stylesheets | CSS syntax check |
| Tailwind CSS Theme Config | ❌ None | Generates `tailwind.config.js` theme extensions | JS/JSON object validation |
| W3C DTCG Design Token JSON | ❌ None | Exports to standard Design Tokens Community Group | DTCG JSON schema check |
| SCSS Variable Sheet | ❌ None | Generates Sass-compatible variable definitions | SCSS syntax check |
| Frontmatter Round-Trip Validator| ❌ None | Validates generated files against schema | Automated parser test |

### E. Multi-System Comparison Studio
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| Side-by-Side System Comparison | ❌ None | Direct visual and metric comparison engine | Differential tests |
| Color Palette Overlap & Distance| ❌ None | Overlap percentage and average $\Delta E$ difference | Math verification tests |
| Typography Hierarchy Delta | ❌ None | Font stack and scale ratio divergence metrics | Type comparison tests |
| Spacing & Layout Comparison | ❌ None | Base unit and container width difference | Metric diff tests |
| Component Styling Delta | ❌ None | Primary button, input, and card styling diffs | Component diff tests |

### F. AI Agent Integration & MCP Ecosystem
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| Standards-Compliant MCP Server | ❌ External link only | Full local JSON-RPC 2.0 stdio & HTTP MCP server | Protocol handshake tests |
| `sledge_search_library` Tool | ❌ External | Native in-process tool for agent queries | Tool execution tests |
| `sledge_get_design_system` Tool | ❌ External | Native tool returning structured tokens & markdown | Tool execution tests |
| `sledge_analyze_website` Tool | ❌ External | Real-time live site extraction for agents | End-to-end tool tests |
| `sledge_generate_design_md` Tool| ❌ External | Agent-triggered DESIGN.md synthesis | Tool execution tests |
| `sledge_compare_design_systems` | ❌ None | Agent-triggered system comparison | Tool execution tests |
| `sledge_export_tokens` Tool | ❌ None | Multi-format export tool for agents | Tool execution tests |

### G. Developer Interfaces: CLI & Web Application
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| `sledge` CLI Command Binary | ❌ None | Node.js executable with comprehensive subcommands | CLI process execution tests |
| Scriptable JSON Output Mode | ❌ None | `--json` flag on all inspection/search commands | JSON stream tests |
| Interactive Web Dashboard | ❌ None | High-density developer SPA with dark/light themes | Web route and UI tests |
| Embedded RESTful API Server | ❌ None | Fast HTTP API supporting all core features | HTTP route tests |
| Zero Placeholder Guarantee | N/A | Every button, link, and tab is 100% functional | UI audit & click verification |

### H. Security & Defensive Engineering
| Feature | Upstream Status | OneForge Sledge Implementation | Validation Method |
| :--- | :---: | :--- | :--- |
| SSRF Mitigation | ❌ Critical gap | DNS pre-resolution + private CIDR blocking | Attack vector regression tests |
| Safe Host Sanitization | ⚠️ Basic regex | RFC-1123 hostname strict validation | Path traversal attack tests |
| Resource Limits & Timeouts | ⚠️ Basic timeout | Bounded memory (5 MB limit) & strict 15s timeout | Resource exhaustion tests |
| Licensing & Attribution Integrity| ⚠️ Unclear boundaries| Explicit separation: CC BY 4.0 data + OneForge engine| Legal audit & notice checks |
