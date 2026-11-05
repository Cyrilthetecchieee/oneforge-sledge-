/**
 * OneForge Sledge — Developer Dashboard Client Logic
 */

let allBrands = [];
let allCategories = [];
let currentSystem = null;
let currentExportFormat = 'css';

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initTheme();
  await loadCatalogOverview();
  initLibraryFilters();
  initAnalyzer();
  initTokenExplorer();
  initComparisonStudio();
  initStudio();
  initExportCenter();
  initMcpTester();
  initCustomSystems();
});

/* Navigation Router */
function initNavigation() {
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  const btnQuickAnalyze = document.getElementById('btnQuickAnalyze');
  if (btnQuickAnalyze) {
    btnQuickAnalyze.addEventListener('click', () => switchTab('analyzer'));
  }

  const globalSearch = document.getElementById('globalSearchInput');
  if (globalSearch) {
    globalSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = globalSearch.value.trim();
        switchTab('library');
        const libSearch = document.getElementById('libSearchQuery');
        if (libSearch) {
          libSearch.value = q;
          runLibrarySearch();
        }
      }
    });
  }
}

function switchTab(tabId) {
  navItems.forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
  tabPanes.forEach((pane) => pane.classList.toggle('active', pane.id === `tab-${tabId}`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Dark / Light Theme */
function initTheme() {
  const saved = localStorage.getItem('sledge-theme') || 'dark';
  setTheme(saved);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sledge-theme', theme);
  if (theme === 'dark') {
    themeIcon.textContent = '☀️';
    themeLabel.textContent = 'Light Mode';
  } else {
    themeIcon.textContent = '🌙';
    themeLabel.textContent = 'Dark Mode';
  }
}

/* Load Catalog Overview */
async function loadCatalogOverview() {
  try {
    const res = await fetch('/api/catalog');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    allCategories = data.categories || [];
    document.getElementById('metricTotalBrands').textContent = data.totalBrands || '168';

    // Populate category chips in dashboard
    const chipsContainer = document.getElementById('categoryChips');
    chipsContainer.innerHTML = '';
    allCategories.forEach((cat) => {
      const chip = document.createElement('button');
      chip.className = 'category-chip';
      chip.textContent = `${cat.name} (${cat.count})`;
      chip.addEventListener('click', () => {
        switchTab('library');
        document.getElementById('libCategorySelect').value = cat.name;
        runLibrarySearch();
      });
      chipsContainer.appendChild(chip);
    });

    // Populate category dropdown in library
    const libCategorySelect = document.getElementById('libCategorySelect');
    allCategories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = `${cat.name} (${cat.count})`;
      libCategorySelect.appendChild(opt);
    });

    // Initial search load
    await runLibrarySearch();
    populateFeaturedBenchmarks();
    populateSelectDropdowns();
  } catch (err) {
    console.error('Failed to load catalog:', err);
  }
}

/* Featured Benchmarks */
function populateFeaturedBenchmarks() {
  const featuredGrid = document.getElementById('featuredGrid');
  featuredGrid.className = 'brand-cards-grid';
  featuredGrid.innerHTML = '';

  const benchmarkHosts = ['stripe.com', 'linear.app', 'vercel.com', 'cursor.com', 'anthropic.com', 'supabase.com'];
  const featured = allBrands.filter((b) => benchmarkHosts.includes(b.host));

  featured.forEach((b) => {
    featuredGrid.appendChild(createBrandCard(b));
  });
}

/* Library Filters & Grid */
function initLibraryFilters() {
  const searchInput = document.getElementById('libSearchQuery');
  const catSelect = document.getElementById('libCategorySelect');
  const themeSelect = document.getElementById('libThemeSelect');
  const colorPicker = document.getElementById('libColorPicker');
  const btnClearColor = document.getElementById('btnClearColor');

  let activeColor = '';

  const trigger = () => runLibrarySearch(activeColor);

  searchInput.addEventListener('input', debounce(trigger, 250));
  catSelect.addEventListener('change', trigger);
  themeSelect.addEventListener('change', trigger);

  colorPicker.addEventListener('change', (e) => {
    activeColor = e.target.value;
    trigger();
  });

  btnClearColor.addEventListener('click', () => {
    activeColor = '';
    trigger();
  });
}

async function runLibrarySearch(colorFilter = '') {
  const query = document.getElementById('libSearchQuery')?.value || '';
  const category = document.getElementById('libCategorySelect')?.value || '';
  const theme = document.getElementById('libThemeSelect')?.value || '';

  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category) params.append('category', category);
  if (theme) params.append('theme', theme);
  if (colorFilter) params.append('color', colorFilter);
  params.append('limit', '100');

  try {
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    allBrands = data.results || [];

    const stats = document.getElementById('libResultsCount');
    if (stats) stats.textContent = `Showing ${allBrands.length} of ${data.total} design systems`;

    const grid = document.getElementById('brandCardsGrid');
    if (grid) {
      grid.innerHTML = '';
      if (allBrands.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1;">No design systems match the selected filters.</p>';
      } else {
        allBrands.forEach((b) => grid.appendChild(createBrandCard(b)));
      }
    }
  } catch (err) {
    console.error('Search error:', err);
  }
}

function createBrandCard(brand) {
  const card = document.createElement('div');
  card.className = 'brand-card';

  const themeBadge = brand.theme === 'dark' ? '<span class="badge badge-dark">Dark</span>' : '<span class="badge badge-light">Light</span>';
  const colorSwatches = (brand.colors || [])
    .slice(0, 5)
    .map((c) => `<div class="color-chip" style="background-color: ${c};" title="${c}"></div>`)
    .join('');

  const fontLabel = brand.fonts && brand.fonts.length ? brand.fonts[0] : 'System UI';

  card.innerHTML = `
    <div class="brand-card-top">
      <div>
        <div class="brand-card-name">${escapeHtml(brand.name)}</div>
        <div class="brand-card-host">${escapeHtml(brand.host)}</div>
      </div>
      ${themeBadge}
    </div>
    <div class="brand-card-swatches">
      ${colorSwatches}
    </div>
    <div class="brand-card-footer">
      <span class="brand-card-font" title="${escapeHtml(fontLabel)}">🔤 ${escapeHtml(fontLabel)}</span>
      <button class="btn btn-sm btn-secondary btn-inspect" data-host="${brand.host}">Inspect</button>
    </div>
  `;

  card.querySelector('.btn-inspect').addEventListener('click', (e) => {
    e.stopPropagation();
    inspectBrand(brand.host);
  });

  card.addEventListener('click', () => inspectBrand(brand.host));

  return card;
}

async function inspectBrand(host) {
  try {
    const res = await fetch(`/api/brands/${host}`);
    if (!res.ok) throw new Error('Not found');
    currentSystem = await res.json();

    // Open Token Explorer
    switchTab('tokens');
    document.getElementById('tokenSystemSelect').value = host;
    renderTokenExplorer(currentSystem);
  } catch (err) {
    alert(`Could not load brand ${host}: ${err.message}`);
  }
}

/* Dropdown Population */
function populateSelectDropdowns() {
  const selects = [
    document.getElementById('tokenSystemSelect'),
    document.getElementById('compareSysA'),
    document.getElementById('compareSysB'),
    document.getElementById('studioSystemSelect'),
    document.getElementById('exportSystemSelect'),
  ];

  selects.forEach((sel) => {
    if (!sel) return;
    sel.innerHTML = '';
    allBrands.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.host;
      opt.textContent = `${b.name} (${b.host})`;
      sel.appendChild(opt);
    });
  });

  // Defaults
  if (document.getElementById('compareSysA')) document.getElementById('compareSysA').value = 'stripe.com';
  if (document.getElementById('compareSysB')) document.getElementById('compareSysB').value = 'linear.app';
}

/* Website Analyzer */
function initAnalyzer() {
  const btnRun = document.getElementById('btnRunAnalysis');
  const urlInput = document.getElementById('analyzerUrlInput');
  const chkSkip = document.getElementById('chkSkipRobots');
  const status = document.getElementById('analyzerStatus');
  const resultsDiv = document.getElementById('analyzerResults');

  btnRun.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;

    status.className = 'status-banner loading';
    status.textContent = `Inspecting and safely analyzing ${url}...`;
    status.classList.remove('hidden');
    resultsDiv.classList.add('hidden');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, skipRobots: chkSkip.checked }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      currentSystem = data;
      status.classList.add('hidden');
      renderAnalyzerResults(data);
    } catch (err) {
      status.className = 'status-banner error';
      status.textContent = `Analysis Failed: ${err.message}`;
    }
  });

  document.getElementById('btnSaveAnalyzedCustom')?.addEventListener('click', async () => {
    if (!currentSystem) return;
    try {
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: currentSystem }),
      });
      const genData = await genRes.json();
      await fetch('/api/custom-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: genData.markdown }),
      });
      alert('Design system successfully saved to Custom Systems!');
      switchTab('settings');
      loadCustomSystems();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  });

  document.getElementById('btnExportAnalyzedTokens')?.addEventListener('click', () => {
    switchTab('export');
    renderExportCode(currentSystem, currentExportFormat);
  });

  document.getElementById('btnViewAnalyzedDesignMd')?.addEventListener('click', async () => {
    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: currentSystem }),
    });
    const genData = await genRes.json();
    switchTab('generator');
    document.getElementById('studioMarkdownTextarea').value = genData.markdown;
  });
}

function renderAnalyzerResults(system) {
  const resultsDiv = document.getElementById('analyzerResults');
  resultsDiv.classList.remove('hidden');

  document.getElementById('anaConfOverall').textContent = `${Math.round(system.confidence.overall * 100)}%`;
  document.getElementById('anaConfElements').textContent = `Sampled ${system.confidence.sampleElementCount} elements`;
  document.getElementById('anaTheme').textContent = system.theme.charAt(0).toUpperCase() + system.theme.slice(1);

  const typography = system.tokens?.typography || {};
  const firstTypo = Object.values(typography)[0];
  document.getElementById('anaPrimaryFont').textContent = firstTypo?.fontFamily || 'system-ui';
  document.getElementById('anaSpacingGrid').textContent = `${system.tokens?.spacing?.xs || '4px'} base`;

  const colorRolesDiv = document.getElementById('anaColorRoles');
  colorRolesDiv.innerHTML = '';
  const colors = system.tokens?.colors || {};
  for (const [role, hex] of Object.entries(colors)) {
    const item = document.createElement('div');
    item.className = 'swatch-item';
    item.innerHTML = `
      <div class="swatch-color" style="background-color: ${hex};" title="${role}"></div>
      <span class="swatch-label">${role}</span>
      <span class="swatch-hex">${hex}</span>
    `;
    colorRolesDiv.appendChild(item);
  }
}

/* Token Explorer */
function initTokenExplorer() {
  const sel = document.getElementById('tokenSystemSelect');
  sel.addEventListener('change', async () => {
    inspectBrand(sel.value);
  });
}

function renderTokenExplorer(system) {
  document.getElementById('tokenExplorerTitle').textContent = `${system.name} Token Explorer`;
  document.getElementById('tokenExplorerSubtitle').textContent = `Domain: ${system.host} | Theme: ${system.theme} | Category: ${system.category}`;

  // Colors
  const colorBody = document.querySelector('#tokenColorTable tbody');
  colorBody.innerHTML = '';
  const colors = system.tokens?.colors || {};
  for (const [role, hex] of Object.entries(colors)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${role}</strong></td>
      <td><code>${hex}</code></td>
      <td><div class="color-chip" style="background-color: ${hex}; width: 36px; height: 24px;"></div></td>
      <td><button class="btn btn-sm btn-secondary btn-copy" data-val="${hex}">Copy</button></td>
    `;
    tr.querySelector('.btn-copy').addEventListener('click', () => copyToClipboard(hex));
    colorBody.appendChild(tr);
  }

  // Typography
  const typoBody = document.querySelector('#tokenTypoTable tbody');
  typoBody.innerHTML = '';
  const typography = system.tokens?.typography || {};
  for (const [role, rule] of Object.entries(typography)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${role}</strong></td>
      <td>${rule.fontFamily}</td>
      <td><code>${rule.fontSize}</code></td>
      <td><code>${rule.fontWeight || 400}</code></td>
      <td style="font-family: ${rule.fontFamily}; font-size: ${rule.fontSize}; line-height: 1.2;">Aa The quick brown fox</td>
    `;
    typoBody.appendChild(tr);
  }

  // Spacing
  const spacingRow = document.getElementById('tokenSpacingRow');
  spacingRow.innerHTML = '';
  const spacing = system.tokens?.spacing || {};
  for (const [step, val] of Object.entries(spacing)) {
    const div = document.createElement('div');
    div.className = 'metric-card';
    div.style.minWidth = '110px';
    div.innerHTML = `
      <div class="metric-title">${step}</div>
      <div class="metric-value" style="font-size: 20px;">${val}</div>
    `;
    spacingRow.appendChild(div);
  }
}

/* Comparison Studio */
function initComparisonStudio() {
  const btnRun = document.getElementById('btnRunCompare');
  btnRun.addEventListener('click', async () => {
    const sysA = document.getElementById('compareSysA').value;
    const sysB = document.getElementById('compareSysB').value;

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemA: sysA, systemB: sysB }),
      });
      const data = await res.json();
      renderComparisonResults(data);
    } catch (err) {
      alert(`Comparison failed: ${err.message}`);
    }
  });
}

function renderComparisonResults(data) {
  document.getElementById('compareResults').classList.remove('hidden');
  document.getElementById('cmpSimilarity').textContent = `${data.similarityPercentage}%`;
  document.getElementById('cmpDeltaE').textContent = data.color.primaryDeltaE;
  document.getElementById('cmpDeltaELabel').textContent = data.color.isVisuallyClose ? 'Barely Perceptible' : 'Noticeable Divergence';
  document.getElementById('cmpPaletteOverlap').textContent = `${data.color.paletteOverlapPct}%`;
  document.getElementById('cmpThemeMatch').textContent = data.general.themeMatch ? 'Yes' : 'Divergent';
  document.getElementById('cmpThemeDetail').textContent = `${data.general.systemA.theme} vs ${data.general.systemB.theme}`;

  // Card A
  document.getElementById('cmpNameA').textContent = `${data.systemA.name} (${data.systemA.host})`;
  document.getElementById('cmpDetailsA').innerHTML = `
    <p><strong>Theme:</strong> ${data.general.systemA.theme}</p>
    <p><strong>Primary Accent:</strong> <span style="display:inline-block; width:12px; height:12px; background:${data.color.systemA.primary}; border-radius:2px;"></span> <code>${data.color.systemA.primary}</code></p>
    <p><strong>Background:</strong> <code>${data.color.systemA.background}</code></p>
    <p><strong>Primary Font:</strong> ${data.typography.systemA.fonts.join(', ') || 'N/A'}</p>
    <p><strong>Base Spacing:</strong> ${data.spacing.systemA.xs}</p>
    <p><strong>Corner Radius:</strong> ${data.spacing.systemA.radiusSm}</p>
  `;

  // Card B
  document.getElementById('cmpNameB').textContent = `${data.systemB.name} (${data.systemB.host})`;
  document.getElementById('cmpDetailsB').innerHTML = `
    <p><strong>Theme:</strong> ${data.general.systemB.theme}</p>
    <p><strong>Primary Accent:</strong> <span style="display:inline-block; width:12px; height:12px; background:${data.color.systemB.primary}; border-radius:2px;"></span> <code>${data.color.systemB.primary}</code></p>
    <p><strong>Background:</strong> <code>${data.color.systemB.background}</code></p>
    <p><strong>Primary Font:</strong> ${data.typography.systemB.fonts.join(', ') || 'N/A'}</p>
    <p><strong>Base Spacing:</strong> ${data.spacing.systemB.xs}</p>
    <p><strong>Corner Radius:</strong> ${data.spacing.systemB.radiusSm}</p>
  `;
}

/* DESIGN.md Studio */
function initStudio() {
  const btnLoad = document.getElementById('btnStudioLoad');
  const sel = document.getElementById('studioSystemSelect');
  const textarea = document.getElementById('studioMarkdownTextarea');

  btnLoad.addEventListener('click', async () => {
    const host = sel.value;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host }),
      });
      const data = await res.json();
      textarea.value = data.markdown;
    } catch (err) {
      alert(`Could not load DESIGN.md: ${err.message}`);
    }
  });

  document.getElementById('btnDownloadDesignMd')?.addEventListener('click', () => {
    downloadFile('DESIGN.md', textarea.value, 'text/markdown');
  });

  document.getElementById('btnCopyDesignMd')?.addEventListener('click', () => {
    copyToClipboard(textarea.value);
  });
}

/* Export Center */
function initExportCenter() {
  const sel = document.getElementById('exportSystemSelect');
  const preview = document.getElementById('exportCodePreview');
  const fmtButtons = document.querySelectorAll('.export-fmt-btn');

  const update = async () => {
    const host = sel.value;
    if (!host) return;
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, format: currentExportFormat }),
      });
      const data = await res.json();
      preview.textContent = data.content;
    } catch (err) {
      preview.textContent = `Export failed: ${err.message}`;
    }
  };

  sel.addEventListener('change', update);

  fmtButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      fmtButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentExportFormat = btn.getAttribute('data-fmt');
      update();
    });
  });

  document.getElementById('btnDownloadExport')?.addEventListener('click', () => {
    const extensions = { css: 'tokens.css', tailwind: 'tailwind.config.js', dtcg: 'tokens.json', scss: '_tokens.scss' };
    downloadFile(extensions[currentExportFormat] || 'tokens.txt', preview.textContent, 'text/plain');
  });

  document.getElementById('btnCopyExport')?.addEventListener('click', () => {
    copyToClipboard(preview.textContent);
  });
}

function renderExportCode(system, format) {
  fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, format }),
  })
    .then((r) => r.json())
    .then((data) => {
      document.getElementById('exportCodePreview').textContent = data.content;
    });
}

/* MCP Live Tester */
function initMcpTester() {
  const btnExec = document.getElementById('btnExecuteMcpTool');
  const toolSelect = document.getElementById('mcpToolSelect');
  const argsInput = document.getElementById('mcpArgsInput');
  const output = document.getElementById('mcpResultOutput');

  toolSelect.addEventListener('change', () => {
    const defaults = {
      sledge_search_library: '{ "query": "Stripe" }',
      sledge_get_design_system: '{ "host": "linear.app" }',
      sledge_export_tokens: '{ "host": "stripe.com", "format": "css" }',
      sledge_compare_design_systems: '{ "systemA": "stripe.com", "systemB": "linear.app" }',
    };
    argsInput.value = defaults[toolSelect.value] || '{}';
  });

  btnExec.addEventListener('click', async () => {
    output.textContent = 'Executing MCP tool call...';
    try {
      const parsedArgs = JSON.parse(argsInput.value || '{}');
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolSelect.value,
          arguments: parsedArgs,
        },
      };

      const res = await fetch('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcpRequest),
      });

      const data = await res.json();
      output.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      output.textContent = `Error: ${err.message}`;
    }
  });
}

/* Custom Systems */
function initCustomSystems() {
  const btnSave = document.getElementById('btnSaveCustomSystem');
  const input = document.getElementById('customSystemInput');

  btnSave?.addEventListener('click', async () => {
    const content = input.value.trim();
    if (!content) return;
    try {
      const res = await fetch('/api/custom-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Save failed');
      alert('Custom design system saved successfully!');
      input.value = '';
      loadCustomSystems();
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  });

  loadCustomSystems();
}

async function loadCustomSystems() {
  const list = document.getElementById('customSystemsList');
  if (!list) return;
  try {
    const res = await fetch('/api/custom-systems');
    const systems = await res.json();
    if (!systems || systems.length === 0) {
      list.innerHTML = '<p class="text-muted">No custom systems created yet.</p>';
      return;
    }
    list.innerHTML = '';
    systems.forEach((s) => {
      const div = document.createElement('div');
      div.className = 'metric-card';
      div.style.marginBottom = '12px';
      div.innerHTML = `
        <strong>${s.name}</strong> (${s.host})
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Primary: ${s.tokens?.colors?.primary || 'N/A'} | Theme: ${s.theme}</div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error('Failed loading custom systems:', err);
  }
}

/* Helper Utilities */
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
