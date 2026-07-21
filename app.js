/* ═══════════════════════════════════════════════════════════════
   XERO ML BOOKKEEPING ENGINE — app.js
   Unsupervised Rule-Based Transaction Classification Engine
   Handles: Built-in data, .xlsx uploads (SheetJS), .csv uploads (PapaParse)
   Charts: Plotly.js donut + horizontal bar
   Anti-GIGO: Row sanitisation + anomaly filtering
════════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   1. HARDCODED TRANSACTION DATA — 20 raw bank SMS rows
────────────────────────────────────────────────────────────── */
const BUILTIN_TRANSACTIONS = [
  { ID: '574063879905315001', SMS: 'Dear Customer, AED 25806.50 was credited to your account ****0535. Available balance: AED 30000.00.' },
  { ID: '574063879905315002', SMS: 'Trx. of AED 50.00 on your a/c ****0535 at ABU DHABI NATIONAL OIL. Date: 21/07/2026.' },
  { ID: '574063879905315003', SMS: 'Dear Customer, ATM Cash Withdrawal for AED 100.00 was debited from your account ****0535.' },
  { ID: '574063879905315004', SMS: 'AED 8500.00 credited to your a/c ****0535 via Salary Transfer from XYZ Corp.' },
  { ID: '574063879905315005', SMS: 'POS Purchase of AED 312.75 at CAFE BATEEL, Dubai Mall on 20/07/2026. Card ****0535.' },
  { ID: '574063879905315006', SMS: 'Dear Customer, AED 1200.00 has been debited from your account ****0535 for ETISALAT TELECOM Bill Payment.' },
  { ID: '574063879905315007', SMS: 'Cash Withdrawal of AED 500.00 from ATM at Downtown Dubai. Account ****0535.' },
  { ID: '574063879905315008', SMS: 'Your account ****0535 has been credited with AED 3300.00. Sender: FREELANCE PAYMENT REF#8821.' },
  { ID: '574063879905315009', SMS: 'Trx. of AED 89.50 on your a/c ****0535 at ENOC OIL STATION, Sharjah.' },
  { ID: '574063879905315010', SMS: 'AED 240.00 debited from ****0535 at COSTA COFFEE, Abu Dhabi. Date: 19/07/2026.' },
  { ID: '574063879905315011', SMS: 'ATM Withdrawal: AED 200.00 debited from your account ****0535 at Deira City Centre ATM.' },
  { ID: '574063879905315012', SMS: 'Dear Customer, AED 15000.00 was credited to your account ****0535 via International Wire Transfer.' },
  { ID: '574063879905315013', SMS: 'POS Debit of AED 455.20 at CARREFOUR HYPERMARKET on your card ****0535. Date 18/07/2026.' },
  { ID: '574063879905315014', SMS: 'Online Transfer credited to your a/c ****0535. Amount: AED 700.00. Ref: INVOICE-4431.' },
  { ID: '574063879905315015', SMS: 'Your DEWA (Dubai Electricity & Water Authority) bill payment of AED 380.00 was processed via ****0535.' },
  { ID: '574063879905315016', SMS: 'Cash withdrawal of AED 1000.00 debited from your a/c ****0535. Location: JBR Walk ATM.' },
  { ID: '574063879905315017', SMS: 'AED 2250.00 has been credited to ****0535 — Rental Income from PROPERTY MGMT LLC.' },
  { ID: '574063879905315018', SMS: 'Trx. of AED 175.00 at SHELL FUEL STATION on your a/c ****0535. Date 17/07/2026.' },
  { ID: '574063879905315019', SMS: 'Subscription charge: AED 55.00 debited from ****0535 for NETFLIX INTERNATIONAL SERVICES.' },
  { ID: '574063879905315020', SMS: 'POS debit of AED 920.00 at IKEA FESTIVAL CITY on your card ****0535. Date: 16/07/2026.' }
];

/* ──────────────────────────────────────────────────────────────
   2. CLASSIFICATION ENGINE — lightweight rule-based clusterer
────────────────────────────────────────────────────────────── */

/**
 * Category definitions in priority order.
 * Each rule has: label, color key, emoji, and a match predicate.
 */
const CATEGORY_RULES = [
  {
    label: 'Direct Cash Bank Credits',
    colorKey: 'blue',
    emoji: '💰',
    match: (s) => /credited|credit|wire transfer|salary transfer|freelance|rental income|online transfer credited/i.test(s)
  },
  {
    label: 'ATM Cash Withdrawals',
    colorKey: 'orange',
    emoji: '🏧',
    match: (s) => /atm|cash withdrawal|cash withdraw/i.test(s)
  },
  {
    label: 'Merchant Vendor Spending',
    colorKey: 'purple',
    emoji: '🛒',
    match: (s) => /oil|cafe|coffee|carrefour|hypermarket|ikea|shell|fuel|pos|purchase|pos debit|pos purchase/i.test(s)
  },
  {
    label: 'Utility & Telecom Bills',
    colorKey: 'cyan',
    emoji: '⚡',
    match: (s) => /etisalat|du telecom|dewa|electricity|water authority|bill payment|subscription/i.test(s)
  },
  {
    label: 'Unclassified Transactions',
    colorKey: 'red',
    emoji: '❓',
    match: () => true   // catch-all
  }
];

/** Color map for charts and category badges */
const COLOR_MAP = {
  blue:   '#3b82f6',
  green:  '#10b981',
  orange: '#f59e0b',
  purple: '#8b5cf6',
  cyan:   '#06b6d4',
  red:    '#ef4444'
};

/** CSS class map for ledger badges */
const BADGE_CLASS = {
  blue:   'cat-blue',
  green:  'cat-green',
  orange: 'cat-orange',
  purple: 'cat-purple',
  cyan:   'cat-cyan',
  red:    'cat-red'
};

/**
 * Classify a single SMS string → returns {label, colorKey, emoji}.
 */
function classifyTransaction(smsText) {
  const s = String(smsText || '');
  for (const rule of CATEGORY_RULES) {
    if (rule.match(s)) return { label: rule.label, colorKey: rule.colorKey, emoji: rule.emoji };
  }
  return { label: 'Unclassified Transactions', colorKey: 'red', emoji: '❓' };
}

/**
 * Extract AED amount from SMS string using Regex.
 * Returns the FIRST match as a float, or 0.
 */
function extractAmount(smsText) {
  const s = String(smsText || '');
  const match = s.match(/AED\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) return 0;
  // Remove commas before parsing
  return parseFloat(match[1].replace(/,/g, '')) || 0;
}

/* ──────────────────────────────────────────────────────────────
   3. ANTI-GIGO SANITISATION LAYER
────────────────────────────────────────────────────────────── */

/**
 * Sanitise an array of raw row objects to remove:
 * - Completely empty rows (all values null/undefined/'')
 * - Rows where both ID and SMS are empty/whitespace
 * - Duplicate IDs (keep first occurrence)
 * Returns cleaned array + a report { dropped, kept }.
 */
function sanitiseRows(rows) {
  const seen = new Set();
  const cleaned = [];
  let dropped = 0;

  for (const row of rows) {
    // Deep-clean: coerce all values to string, trim
    const id  = String(row.ID  ?? row.id  ?? row['Transaction ID'] ?? '').trim();
    const sms = String(row.SMS ?? row.sms ?? row['Message']        ?? row['SMS Message'] ?? '').trim();

    // Drop entirely empty rows
    const allEmpty = Object.values(row).every(
      (v) => v === null || v === undefined || String(v).trim() === ''
    );
    if (allEmpty) { dropped++; continue; }

    // Drop rows where BOTH ID and SMS are absent (trailing artifact rows)
    if (!id && !sms) { dropped++; continue; }

    // De-duplicate by ID
    if (id && seen.has(id)) { dropped++; continue; }
    if (id) seen.add(id);

    // Normalise to canonical shape
    cleaned.push({ ID: id || `AUTO-${cleaned.length + 1}`, SMS: sms || '' });
  }

  return { rows: cleaned, dropped, kept: cleaned.length };
}

/* ──────────────────────────────────────────────────────────────
   4. PIPELINE — run full classification + aggregation
────────────────────────────────────────────────────────────── */

/**
 * Run the full ML pipeline on a sanitised row array.
 * Returns { enriched, metrics, totalVolume, droppedCount }.
 */
function runPipeline(rawRows) {
  const { rows, dropped } = sanitiseRows(rawRows);

  // Enrich each row
  const enriched = rows.map((row) => {
    const classification = classifyTransaction(row.SMS);
    const amount = extractAmount(row.SMS);
    return {
      ...row,
      assigned_accounting_category: classification.label,
      colorKey: classification.colorKey,
      emoji: classification.emoji,
      amount_aed: amount,
      pipeline_status: 'Classified'
    };
  });

  // Aggregate by category
  const aggMap = {};
  let totalVolume = 0;
  for (const row of enriched) {
    const cat = row.assigned_accounting_category;
    if (!aggMap[cat]) {
      aggMap[cat] = { label: cat, colorKey: row.colorKey, emoji: row.emoji, count: 0, volume: 0 };
    }
    aggMap[cat].count++;
    aggMap[cat].volume += row.amount_aed;
    totalVolume += row.amount_aed;
  }

  const metrics = Object.values(aggMap).sort((a, b) => b.volume - a.volume);
  return { enriched, metrics, totalVolume, droppedCount: dropped };
}

/* ──────────────────────────────────────────────────────────────
   5. UI RENDERERS
────────────────────────────────────────────────────────────── */

/** Format number to AED string */
const fmtAED = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Update top-bar meta chips */
function updateMetaChips(enriched, metrics, totalVolume) {
  document.getElementById('rowCountVal').textContent  = enriched.length;
  document.getElementById('catCountVal').textContent  = metrics.length;
  document.getElementById('totalVolVal').textContent  = fmtAED(totalVolume);
}

/** Render the General Ledger Metrics Summary table */
function renderLedgerTable(metrics, totalVolume) {
  const tbody = document.getElementById('ledgerBody');
  const tfoot = document.getElementById('ledgerFoot');
  tbody.innerHTML = '';
  tfoot.innerHTML = '';

  metrics.forEach((m, idx) => {
    const pct    = totalVolume > 0 ? ((m.volume / totalVolume) * 100).toFixed(1) : '0.0';
    const tr     = document.createElement('tr');

    tr.innerHTML = `
      <td style="color:var(--text-muted);font-size:12px;">${idx + 1}</td>
      <td>
        <span class="cat-badge ${BADGE_CLASS[m.colorKey]}">
          ${m.emoji} ${m.label}
        </span>
      </td>
      <td style="font-weight:600;color:var(--text-primary);">${m.count}</td>
      <td class="amount-cell">AED ${fmtAED(m.volume)}</td>
      <td>
        <div class="share-cell">
          <div class="share-bar-bg">
            <div class="share-bar-fill" style="width:${pct}%;background:${COLOR_MAP[m.colorKey]};"></div>
          </div>
          <span class="share-pct">${pct}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Totals footer
  const totalCount = metrics.reduce((s, m) => s + m.count, 0);
  tfoot.innerHTML = `
    <tr>
      <td colspan="2" style="color:var(--text-secondary);font-weight:700;">TOTAL</td>
      <td style="font-weight:700;">${totalCount}</td>
      <td class="amount-cell">AED ${fmtAED(totalVolume)}</td>
      <td><span class="share-pct" style="color:var(--accent-green);">100%</span></td>
    </tr>
  `;
}

/** Render the Live Spreadsheet Grid */
function renderGrid(enriched, filterText = '') {
  const tbody   = document.getElementById('gridBody');
  const countEl = document.getElementById('gridCount');
  const filter  = filterText.toLowerCase();
  tbody.innerHTML = '';

  const filtered = filter
    ? enriched.filter(
        (r) =>
          String(r.ID).toLowerCase().includes(filter) ||
          String(r.SMS).toLowerCase().includes(filter) ||
          r.assigned_accounting_category.toLowerCase().includes(filter)
      )
    : enriched;

  countEl.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

  filtered.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="id-cell">${row.ID}</td>
      <td class="sms-cell">${escapeHtml(row.SMS)}</td>
      <td>
        <span class="cat-badge ${BADGE_CLASS[row.colorKey]}">
          ${row.emoji} ${row.assigned_accounting_category}
        </span>
      </td>
      <td class="amount-cell">${row.amount_aed > 0 ? 'AED ' + fmtAED(row.amount_aed) : '–'}</td>
      <td>
        <span class="status-pill pill-classified">● Classified</span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" style="text-align:center;padding:28px;color:var(--text-muted);">No records match your search.</td>`;
    tbody.appendChild(tr);
  }
}

/** Render Plotly charts */
function renderCharts(metrics, totalVolume) {
  const labels  = metrics.map((m) => m.label);
  const volumes = metrics.map((m) => m.volume);
  const pcts    = metrics.map((m) => totalVolume > 0 ? ((m.volume / totalVolume) * 100).toFixed(2) : '0.00');
  const colors  = metrics.map((m) => COLOR_MAP[m.colorKey]);

  const plotlyConfig = {
    responsive:  true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toImage']
  };

  const darkLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font:          { family: 'Inter, sans-serif', color: '#8b949e', size: 12 },
    margin:        { t: 20, b: 20, l: 20, r: 20 }
  };

  /* ── Donut Chart ── */
  Plotly.newPlot(
    'donutChart',
    [{
      type: 'pie',
      hole: 0.45,
      labels: labels,
      values: volumes,
      textinfo: 'percent',
      hovertemplate: '<b>%{label}</b><br>AED %{value:,.2f}<br>Share: %{percent}<extra></extra>',
      marker: {
        colors: colors,
        line: { color: '#0d1117', width: 2 }
      },
      textfont: { family: 'Inter, sans-serif', size: 11 }
    }],
    {
      ...darkLayout,
      showlegend: true,
      legend: {
        orientation: 'v',
        x: 1.02, y: 0.5,
        font: { size: 10.5, color: '#8b949e' },
        bgcolor: 'rgba(0,0,0,0)'
      },
      annotations: [{
        text: `<b>${metrics.length}</b><br>Categories`,
        x: 0.5, y: 0.5,
        xref: 'paper', yref: 'paper',
        showarrow: false,
        font: { size: 13, color: '#e6edf3', family: 'Inter, sans-serif' }
      }]
    },
    plotlyConfig
  );

  /* ── Horizontal Bar Chart ── */
  Plotly.newPlot(
    'barChart',
    [{
      type: 'bar',
      orientation: 'h',
      x: volumes,
      y: labels,
      text: volumes.map((v) => `AED ${fmtAED(v)}`),
      textposition: 'outside',
      textfont: { color: '#8b949e', size: 10.5 },
      hovertemplate: '<b>%{y}</b><br>AED %{x:,.2f}<extra></extra>',
      marker: {
        color: colors,
        opacity: 0.9,
        line: { color: colors.map((c) => c + 'cc'), width: 1.5 }
      }
    }],
    {
      ...darkLayout,
      showlegend: false,
      margin: { t: 20, b: 60, l: 200, r: 120 },
      xaxis: {
        gridcolor:    '#1f2d40',
        zerolinecolor:'#1f2d40',
        tickfont:     { size: 10, color: '#8b949e' },
        title:        { text: 'Volume (AED)', font: { size: 11, color: '#8b949e' } }
      },
      yaxis: {
        tickfont: { size: 10.5, color: '#c9d1d9' },
        automargin: true
      }
    },
    plotlyConfig
  );
}

/* ──────────────────────────────────────────────────────────────
   6. MASTER REFRESH — wire everything together
────────────────────────────────────────────────────────────── */
function refreshDashboard(rawRows, sourceLabel) {
  const { enriched, metrics, totalVolume, droppedCount } = runPipeline(rawRows);

  // Update status banner
  const banner  = document.getElementById('statusBanner');
  const statusT = document.getElementById('statusText');
  banner.className = 'status-banner';
  statusT.textContent = `✔ Active: ${sourceLabel}. Processed ${enriched.length} rows. ${droppedCount > 0 ? `(${droppedCount} anomaly row(s) filtered by Anti-GIGO pass)` : 'All rows clean.'}`;

  updateMetaChips(enriched, metrics, totalVolume);
  renderLedgerTable(metrics, totalVolume);
  renderCharts(metrics, totalVolume);

  // Store enriched data globally for search + export
  window._currentEnriched = enriched;
  window._currentMetrics  = metrics;

  renderGrid(enriched);
}

/* ──────────────────────────────────────────────────────────────
   7. FILE UPLOAD ENGINE
────────────────────────────────────────────────────────────── */
let _xlsxWorkbook = null;   // Cached workbook for sheet switching

function handleFileUpload(file) {
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  setLoading(true);

  if (ext === 'xlsx' || ext === 'xls') {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        _xlsxWorkbook = wb;

        // Populate sheet selector
        const sel = document.getElementById('sheetSelect');
        sel.innerHTML = '';
        wb.SheetNames.forEach((name, i) => {
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = name;
          sel.appendChild(opt);
        });
        document.getElementById('sheetSelector').style.display = 'block';

        // Load first sheet
        processXlsxSheet(wb, 0, file.name);
      } catch (err) {
        showBannerError(`Excel parse error: ${err.message}`);
      }
      setLoading(false);
    };
    reader.onerror = () => { showBannerError('Failed to read file.'); setLoading(false); };
    reader.readAsArrayBuffer(file);

  } else if (ext === 'csv') {
    document.getElementById('sheetSelector').style.display = 'none';
    _xlsxWorkbook = null;

    Papa.parse(file, {
      header:       true,
      skipEmptyLines: true,
      complete: (results) => {
        const normalised = normaliseUploadedRows(results.data);
        refreshDashboard(normalised, `Uploaded CSV "${file.name}"`);
        setLoading(false);
      },
      error: (err) => { showBannerError(`CSV parse error: ${err.message}`); setLoading(false); }
    });
  } else {
    showBannerError(`Unsupported file type ".${ext}". Please upload .xlsx or .csv`);
    setLoading(false);
  }
}

function processXlsxSheet(wb, sheetIndex, fileName) {
  const sheetName = wb.SheetNames[sheetIndex];
  const ws        = wb.Sheets[sheetName];
  const rows      = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const normalised = normaliseUploadedRows(rows);
  refreshDashboard(normalised, `Uploaded Excel "${fileName}" › Sheet: "${sheetName}"`);
}

/**
 * Normalise an uploaded row array to { ID, SMS } shape.
 * Handles various column name conventions.
 */
function normaliseUploadedRows(rows) {
  return rows.map((row) => {
    const id  =
      row['ID'] ??
      row['id'] ??
      row['Transaction ID'] ??
      row['TransactionID'] ??
      '';
    const sms =
      row['SMS'] ??
      row['sms'] ??
      row['SMS Message'] ??
      row['Message'] ??
      row['Description'] ??
      row['Narration'] ??
      row['Details'] ??
      // Fallback: concatenate all string values
      Object.values(row).filter((v) => typeof v === 'string' && v.length > 20).join(' | ') ??
      '';
    return { ID: String(id).trim(), SMS: String(sms).trim() };
  });
}

/* ──────────────────────────────────────────────────────────────
   8. EXPORT ENGINE — download ledger as CSV
────────────────────────────────────────────────────────────── */
function exportLedger() {
  const enriched = window._currentEnriched || [];
  if (enriched.length === 0) return;

  const headers = ['ID', 'SMS', 'Assigned Category', 'Amount (AED)', 'Pipeline Status'];
  const rows    = enriched.map((r) => [
    `"${r.ID}"`,
    `"${String(r.SMS).replace(/"/g, '""')}"`,
    `"${r.assigned_accounting_category}"`,
    r.amount_aed.toFixed(2),
    '"Classified"'
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `xero_verified_ledger_${formatDateForFile()}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}

/* ──────────────────────────────────────────────────────────────
   9. UTILITY HELPERS
────────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateForFile() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function showBannerError(msg) {
  const banner  = document.getElementById('statusBanner');
  const statusT = document.getElementById('statusText');
  banner.className = 'status-banner error';
  statusT.textContent = `✖ Error: ${msg}`;
}

function setLoading(active) {
  let ov = document.getElementById('loadingOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'loadingOverlay';
    ov.className = 'loading-overlay';
    ov.innerHTML = '<div class="spinner"></div><div class="loading-text">Processing data…</div>';
    document.body.appendChild(ov);
  }
  ov.classList.toggle('active', active);
}

/* ──────────────────────────────────────────────────────────────
   10. EVENT WIRING — DOMContentLoaded
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Timestamp ── */
  const ts = document.getElementById('dashTimestamp');
  if (ts) {
    const now = new Date();
    ts.textContent = `Generated: ${now.toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' })} ${now.toLocaleTimeString('en-US')}`;
  }

  /* ── Source Radio Toggle ── */
  const radioCards = [
    { card: document.getElementById('radioCard1'), ind: document.getElementById('radioInd1'), input: document.getElementById('opt1') },
    { card: document.getElementById('radioCard2'), ind: document.getElementById('radioInd2'), input: document.getElementById('opt2') }
  ];
  const uploadPanel = document.getElementById('uploadPanel');

  function selectSource(idx) {
    radioCards.forEach((r, i) => {
      r.card.classList.toggle('active', i === idx);
    });
    if (idx === 0) {
      // Built-in data
      uploadPanel.classList.remove('visible');
      refreshDashboard(BUILTIN_TRANSACTIONS, 'Running pipeline using your Hardcoded Built-In Data Pool (20 rows)');
    } else {
      // Upload mode
      uploadPanel.classList.add('visible');
      const banner  = document.getElementById('statusBanner');
      const statusT = document.getElementById('statusText');
      banner.className = 'status-banner warn';
      statusT.textContent = '⏳ Waiting: Please upload an Excel (.xlsx) or CSV (.csv) file to activate the pipeline.';
    }
  }

  radioCards[0].card.addEventListener('click', () => selectSource(0));
  radioCards[1].card.addEventListener('click', () => selectSource(1));

  /* ── File Picker ── */
  const filePicker = document.getElementById('filePicker');
  filePicker.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileUpload(e.target.files[0]);
  });

  /* ── Drag & Drop ── */
  const dropZone = document.getElementById('dropZone');
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  });

  /* ── Sheet Selector ── */
  document.getElementById('sheetSelect').addEventListener('change', (e) => {
    if (_xlsxWorkbook) {
      const idx = parseInt(e.target.value, 10);
      processXlsxSheet(_xlsxWorkbook, idx, 'uploaded file');
    }
  });

  /* ── Search Grid ── */
  document.getElementById('gridSearch').addEventListener('input', (e) => {
    renderGrid(window._currentEnriched || [], e.target.value);
  });

  /* ── Export Button ── */
  document.getElementById('exportBtn').addEventListener('click', exportLedger);

  /* ── Initial Load ── */
  refreshDashboard(BUILTIN_TRANSACTIONS, 'Running pipeline using your Hardcoded Built-In Data Pool (20 rows)');
});
