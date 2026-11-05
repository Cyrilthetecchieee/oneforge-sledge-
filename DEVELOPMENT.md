# ONEFORGE SLEDGE — DEVELOPER GUIDE

**Product:** OneForge Sledge  
**Parent Brand:** OneForge  
**Version:** 1.0.0  

This guide provides instructions for developers setting up, developing, testing, and debugging **OneForge Sledge**.

---

## 1. Prerequisites

- **Node.js**: Version 20.0.0 or newer (tested on Node 20, 22, 24).
- **Git**: Version 2.30+
- **Operating Systems**: macOS, Linux, Windows (PowerShell/CMD).

No external database or package compilation dependencies are required. The entire engine runs natively on modern Node.js standards (ES modules, `node:test`, `fetch`, `node:crypto`).

---

## 2. Workspace Setup

```bash
# Clone repository
git clone https://github.com/MY_GITHUB_USERNAME/oneforge-sledge.git
cd oneforge-sledge

# Verify installation by running test suite
npm test
```

---

## 3. Directory Layout

```
.
├── bin/
│   └── sledge.mjs                   # Executable CLI entrypoint
├── src/
│   ├── index.mjs                    # Primary SDK programmatic export
│   ├── config.mjs                   # System paths and HTTP defaults
│   ├── core/                        # Types, schema validator, SSRF guard
│   ├── discovery/                   # Search index, DeltaE color distance, compare
│   ├── extractor/                   # Safe HTTP fetcher, robots.txt, HTML/CSS parser
│   ├── analyzer/                    # Color clustering, type scales, spacing grid
│   ├── generator/                   # DESIGN.md builder and multi-format exporters
│   ├── mcp/                         # Model Context Protocol JSON-RPC server & tools
│   ├── server/                      # Embedded HTTP server and REST API dispatcher
│   └── web/                         # Developer Dashboard SPA (HTML, CSS, JS)
├── tests/                           # Unit, integration, security tests
├── design-md/                       # 168+ Curated DESIGN.md files (CC BY 4.0 Adapted)
├── index.json                       # Catalog index of curated brands
└── package.json                     # Manifest and scripts
```

---

## 4. Development Commands

| Command | Action |
| :--- | :--- |
| `npm test` | Runs all 36 unit and integration tests via `node:test` |
| `npm start` | Launches the local Developer Dashboard at `http://localhost:3456` |
| `npm run cli -- <args>` | Executes the Sledge CLI locally |
| `npm run mcp` | Starts the MCP server on stdio for agent debugging |
| `npm run validate` | Validates root `DESIGN.md` if present |

---

## 5. Running the Developer Web Server

```bash
node bin/sledge.mjs serve --port=3456
```

Open `http://localhost:3456` to access:
- **Dashboard**: High-level platform statistics and benchmarks.
- **Design Library**: Interactive filterable catalog.
- **Website Analyzer**: Real-time URL style extraction.
- **Token Explorer**: Detailed token tables with color swatches.
- **Comparison Studio**: Side-by-side system differential analyzer.
- **DESIGN.md Studio**: Live spec editor and validator.
- **Export Center**: Multi-format code compiler.
- **AI Agent Hub**: Live in-browser MCP tool tester.

---

## 6. Writing Tests

All tests live in `tests/*.test.mjs` and use the built-in Node test runner:

```javascript
import assert from 'node:assert/strict';
import test from 'node:test';

test('My new feature', () => {
  assert.equal(1 + 1, 2);
});
```

Run tests with verbose output:
```bash
node --test tests/*.test.mjs
```
