import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHtmlDesignTokens } from '../src/extractor/html-parser.mjs';
import { isPathAllowed } from '../src/extractor/robots.mjs';
import { extractWebsiteDesign } from '../src/extractor/pipeline.mjs';

test('Extractor — HTML and CSS Design Token Parsing', () => {
  const sampleHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body {
      background-color: #FFFFFF;
      color: #061B31;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      line-height: 1.5;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #061B31;
      margin-bottom: 24px;
    }
    .btn-primary {
      background: #533AFD;
      color: #FFFFFF;
      border-radius: 4px;
      padding: 12px 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card {
      padding: 16px;
      margin: 8px;
      border-radius: 8px;
    }
    @media (min-width: 768px) {
      h1 { font-size: 48px; }
    }
  </style>
</head>
<body>
  <h1>Welcome to Sledge</h1>
  <button class="btn-primary">Get Started</button>
  <div class="card">Content</div>
</body>
</html>
`;

  const tokens = parseHtmlDesignTokens(sampleHtml, 'https://example.com');

  assert.equal(tokens.theme, 'light');
  assert.ok(tokens.observedColors.some((c) => c.value === '#FFFFFF'));
  assert.ok(tokens.observedColors.some((c) => c.value === '#061B31'));
  assert.ok(tokens.observedColors.some((c) => c.value === '#533AFD'));

  // Typography
  assert.ok(tokens.typography.families.some((f) => f.name === 'Inter'));
  assert.ok(tokens.typography.sizes.some((s) => s.size === '16px'));
  assert.ok(tokens.typography.sizes.some((s) => s.size === '32px'));

  // Spacing & Shapes
  assert.ok(tokens.spacing.some((s) => s.unit === '8px'));
  assert.ok(tokens.spacing.some((s) => s.unit === '16px'));
  assert.ok(tokens.spacing.some((s) => s.unit === '24px'));
  assert.ok(tokens.shapes.radii.some((r) => r.radius === '4px'));
  assert.ok(tokens.shapes.radii.some((r) => r.radius === '8px'));
  assert.ok(tokens.shapes.shadows.length > 0);

  // Breakpoints
  assert.ok(tokens.breakpoints.includes('768px'));

  // Components
  assert.ok(tokens.components.buttonsObserved >= 1);
  assert.ok(tokens.components.cardsObserved >= 1);
});

test('Extractor — Robots.txt Directives Evaluation', () => {
  const robotsTxt = `
User-agent: *
Disallow: /admin
Disallow: /private/
Allow: /public/

User-agent: BadBot
Disallow: /
`;

  assert.equal(isPathAllowed(robotsTxt, '/', 'OneForge-Sledge'), true);
  assert.equal(isPathAllowed(robotsTxt, '/index.html', 'OneForge-Sledge'), true);
  assert.equal(isPathAllowed(robotsTxt, '/public/page', 'OneForge-Sledge'), true);
  assert.equal(isPathAllowed(robotsTxt, '/admin/settings', 'OneForge-Sledge'), false);
  assert.equal(isPathAllowed(robotsTxt, '/private/data', 'OneForge-Sledge'), false);
});

test('Extractor — SSRF Rejection in Extraction Pipeline', async () => {
  const res = await extractWebsiteDesign('http://127.0.0.1:8080/test');
  assert.equal(res.success, false);
  assert.match(res.error, /private|loopback|metadata|SSRF/i);
});

test('Extractor — Malformed URL Rejection', async () => {
  const res = await extractWebsiteDesign('not-a-valid-url');
  assert.equal(res.success, false);
  assert.match(res.error, /Invalid URL/);
});
