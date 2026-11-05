# ONEFORGE SLEDGE — API & MCP REFERENCE

**Product:** OneForge Sledge  
**Version:** 1.0.0  

---

## 1. REST API Endpoints

Base URL: `http://localhost:3456`

### 1.1 `GET /api/catalog`
Returns catalog summary, system counts, and category statistics.

**Response:**
```json
{
  "product": "OneForge Sledge",
  "version": "1.0.0",
  "totalBrands": 168,
  "totalCustom": 0,
  "categories": [
    { "name": "AI", "count": 14 },
    { "name": "Developer tools", "count": 37 }
  ]
}
```

---

### 1.2 `GET /api/search`
Query design systems using multi-criteria faceted filtering.

**Query Parameters:**
- `q`: Search string matching brand name, host, or font.
- `category`: Filter by category (e.g., `Fintech and payments`).
- `theme`: Filter by theme (`light`, `dark`, `all`).
- `color`: Hex color (e.g., `#533AFD`) for perceptual $\Delta E$ similarity matching.
- `limit`: Maximum results to return (default: 50).
- `offset`: Pagination offset (default: 0).

**Response:**
```json
{
  "total": 1,
  "offset": 0,
  "limit": 50,
  "results": [
    {
      "name": "Stripe",
      "host": "stripe.com",
      "category": "Fintech and payments",
      "theme": "light",
      "fonts": ["sohne-var"],
      "colors": ["#FFFFFF", "#061B31", "#533AFD"],
      "relevanceScore": 50.0,
      "colorDistance": null
    }
  ]
}
```

---

### 1.3 `GET /api/brands/:host`
Retrieves the complete structured DesignSystem object for a given host.

**Path Parameter:**
- `host`: Domain name (e.g., `stripe.com`, `linear.app`).

**Response:**
```json
{
  "id": "stripe.com",
  "name": "Stripe",
  "host": "stripe.com",
  "theme": "light",
  "category": "Fintech and payments",
  "tokens": {
    "colors": { "background": "#FFFFFF", "primary": "#533AFD" },
    "typography": { "headline-display": { "fontFamily": "sohne-var", "fontSize": "48px" } },
    "spacing": { "xs": "4px", "sm": "8px", "md": "16px" },
    "rounded": { "sm": "4px", "md": "6px" }
  },
  "confidence": { "overall": 0.95 },
  "provenance": { "sourceUrl": "https://stripe.com" }
}
```

---

### 1.4 `POST /api/analyze`
Extracts and synthesizes design intelligence from a live URL.

**Request Body:**
```json
{
  "url": "https://example.com",
  "skipRobots": false
}
```

---

### 1.5 `POST /api/compare`
Performs side-by-side differential analysis between two systems.

**Request Body:**
```json
{
  "systemA": "stripe.com",
  "systemB": "linear.app"
}
```

**Response:**
```json
{
  "systemA": { "name": "Stripe", "host": "stripe.com" },
  "systemB": { "name": "Linear", "host": "linear.app" },
  "similarityPercentage": 46,
  "color": {
    "primaryDeltaE": 18.42,
    "paletteOverlapPct": 33,
    "isVisuallyClose": false
  },
  "typography": {
    "sharedFonts": []
  }
}
```

---

### 1.6 `POST /api/export`
Exports design tokens into developer formats.

**Request Body:**
```json
{
  "host": "stripe.com",
  "format": "css"
}
```
*Formats:* `css`, `tailwind`, `dtcg`, `scss`.

---

## 2. Model Context Protocol (MCP) JSON-RPC 2.0

Endpoint: `POST /mcp` or `stdio` (`sledge mcp`).

### Protocol Methods Supported:
- `initialize`: Handshake returning protocol version and tools capability.
- `tools/list`: Lists 6 tools: `sledge_search_library`, `sledge_get_design_system`, `sledge_analyze_website`, `sledge_generate_design_md`, `sledge_compare_design_systems`, `sledge_export_tokens`.
- `tools/call`: Executes specified tool with input arguments.
- `ping`: Connectivity heartbeat.
