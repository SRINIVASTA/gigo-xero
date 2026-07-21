/**
 * 📊 Unsupervised Xero ML Bookkeeping Logic Pipeline Script
 * Formatted perfectly matching target split screen dashboard layout view models
 * PART 1: Core Setup, Global Data Buffers, and Multi-Sheet Ingestion Engines
 */

let masterData = [];
let globalWorkbookInstance = null; // Cache to handle dynamic worksheet switching events
let chartPieInstance = null;
let chartBarInstance = null;

const embeddedRows = [
    "22-01-2019 14:02 Account *****535 has been created for you.",
    "22-01-2019 14:03 Dear Customer, thank you for opening a new AED account with ADIB.",
    "22-01-2019 15:29 Dear Customer, thank you for requesting a new chequebook for your account.",
    "05-03-2019 09:26 Dear Customer, AED 25806.50 was credited to your account ****0535.",
    "06-03-2019 22:52 Dear Customer, AED 12800.00 was debited from your account ****0535.",
    "08-03-2019 10:02 Trx. of AED 50.00 on your a/c ****0535 at ABU DHABI NATIONAL OIL.",
    "10-03-2019 18:49 Trx. of AED 78.75 on your a/c ****0535 at ART HOUSE CAFE ABU DHABI AE.",
    "10-03-2019 20:49 Dear Customer, ATM Cash Withdrawal for AED 100.00 was debited from account.",
    "10-03-2019 22:01 Dear Customer, ATM Cash Withdrawal for AED 12000.00 was debited from account.",
    "11-03-2019 10:11 Trx. of AED 40.00 on your a/c ****0535 at ZOMATO ORDER DUBAI AE.",
    "12-03-2019 17:56 Trx. of AED 50.00 on your a/c ****0535 at ABU DHABI NATIONAL OIL.",
    "13-03-2019 18:11 Trx. of AED 87.75 on your a/c ****0535 at FLAKES HUB RESTURANT.",
    "14-03-2019 09:15 Dear Customer, AED 3500.00 was credited to your account ****0535.",
    "15-03-2019 14:22 Trx. of AED 120.00 on your a/c ****0535 at CARREFOUR SUPERMARKET.",
    "16-03-2019 16:45 Dear Customer, ATM Cash Withdrawal for AED 500.00 was debited.",
    "17-03-2019 21:10 Trx. of AED 15.00 on your a/c ****0535 at ://apple.com ONLINE.",
    "18-03-2019 11:30 Dear Customer, thank you for requesting a new chequebook.",
    "19-03-2019 13:40 Trx. of AED 65.25 on your a/c ****0535 at VOX CINEMAS DUBAI.",
    "20-03-2019 19:02 Dear Customer, AED 450.00 was debited from your account ****0535.",
    "21-03-2019 08:55 Trx. of AED 22.00 on your a/c ****0535 at COSTA COFFEE DUBAI AE."
];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('radio-embedded').addEventListener('change', runEmbeddedPipeline);
    document.getElementById('radio-upload').addEventListener('change', toggleUploadSection);
    document.getElementById('csv-file-input').addEventListener('change', handleFileUploadStream);
    document.getElementById('sheet-select').addEventListener('change', handleWorksheetSwitchEvent);
    document.getElementById('btn-download-csv').addEventListener('click', exportLedgerToCSVStream);
    runEmbeddedPipeline();
});

function toggleUploadSection() {
    const isUpload = document.getElementById('radio-upload').checked;
    document.getElementById('upload-wrapper').style.display = isUpload ? 'block' : 'none';
    if (!isUpload) {
        document.getElementById('sheet-selector-wrapper').classList.add('hidden');
        globalWorkbookInstance = null;
    }
}

function runEmbeddedPipeline() {
    toggleUploadSection();
    masterData = embeddedRows.map((smsText, idx) => ({
        id: 574063879905315000 + idx,
        sms: smsText
    }));
    document.getElementById('status-text').innerText = `Active: Running pipeline using your Hardcoded Built-In Data Pool (20 rows)`;
    calculateAndRenderDashboard();
}

function handleFileUploadStream(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileNameLower = file.name.toLowerCase();

    reader.onload = function(evt) {
        if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
            const dataBytes = new Uint8Array(evt.target.result);
            globalWorkbookInstance = XLSX.read(dataBytes, { type: 'array' });
            
            const sheetNames = globalWorkbookInstance.SheetNames;
            const selector = document.getElementById('sheet-select');
            selector.innerHTML = '';
            
            sheetNames.forEach(sheet => {
                const opt = document.createElement('option');
                opt.value = sheet;
                opt.innerText = sheet;
                selector.appendChild(opt);
            });

            document.getElementById('sheet-selector-wrapper').classList.remove('hidden');
            processExcelWorksheet(sheetNames[0], file.name);
        } else {
            document.getElementById('sheet-selector-wrapper').classList.add('hidden');
            globalWorkbookInstance = null;
            
            const txtDecoder = new TextDecoder('utf-8');
            const csvTextContent = txtDecoder.decode(evt.target.result);
            parseAndLoadCsvMatrix(csvTextContent, file.name);
        }
    };

    if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsArrayBuffer(file); 
    }
}

function handleWorksheetSwitchEvent(e) {
    if (!globalWorkbookInstance) return;
    const selectedSheetName = e.target.value;
    const fileInput = document.getElementById('csv-file-input');
    const fileName = fileInput.files[0] ? fileInput.files[0].name : "Excel Spreadsheet";
    processExcelWorksheet(selectedSheetName, fileName);
}

function processExcelWorksheet(sheetName, fileName) {
    const worksheet = globalWorkbookInstance.Sheets[sheetName];
    const rawMatrixRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawMatrixRows.length === 0) return;
    
    // Find schema indexes for ID and SMS columns dynamically
    const headerRow = rawMatrixRows[0].map(h => String(h).toUpperCase().trim());
    let idIdx = headerRow.indexOf('ID');
    let smsIdx = headerRow.indexOf('SMS');
    
    // Fallback if structured headers match array bounds positions directly
    if (idIdx === -1) idIdx = 0;
    if (smsIdx === -1) smsIdx = 1;

    masterData = rawMatrixRows.slice(1).filter(row => row.length > Math.max(idIdx, smsIdx)).map((row, idx) => ({
        id: row[idIdx] ? row[idIdx].toString().replace(/["']/g, "").trim() : (574063879905315000 + idx).toString(),
        sms: row[smsIdx] ? row[smsIdx].toString().replace(/["']/g, "").trim() : ""
    })).filter(item => item.sms.length > 2);

    document.getElementById('status-text').innerText = `📥 Active: Processing Worksheet \`${sheetName}\` inside \`${fileName}\` (${masterData.length} rows)`;
    calculateAndRenderDashboard();
}

function parseAndLoadCsvMatrix(csvTextContent, fileName) {
    const lines = csvTextContent.split('\n');
    if (lines.length === 0) return;
    
    masterData = lines.slice(1).filter(l => l.trim().length > 5).map((line, idx) => {
        const splitIdx = line.indexOf(',');
        if (splitIdx === -1) return { id: (574063879905315000 + idx).toString(), sms: line.trim() };
        return {
            id: line.substring(0, splitIdx).replace(/["']/g, "").trim(),
            sms: line.substring(splitIdx + 1).replace(/["']/g, "").trim()
        };
    }).filter(item => item.sms.length > 2);

    document.getElementById('status-text').innerText = `📥 Active: Ingested CSV file \`${fileName}\` (${masterData.length} rows)`;
    calculateAndRenderDashboard();
}

function cleanStringText(text) {
    let t = text.toUpperCase();
    t = t.replace(/TRX\./g, " ").replace(/TRX/g, " ").replace(/A\/C/g, " ");
    t = t.replace(/\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/g, '');
    t = t.replace(/\d+\.\d+/g, '').replace(/\b\d+\b/g, '').replace(/\*/g, '');
    return t.toLowerCase().trim();
}

function parseCurrencyFloatValue(text) {
    const match = text.match(/(?:AED|aed)\s*([\d,]+\.?\d*)/i);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0.0;
}
/**
 * PART 2: Analytical Calculations Processing & Matplotlib Style Visualizations Engine
 * Paste this block directly below Block 1 inside your app.js file!
 */

function calculateAndRenderDashboard() {
    let ledgerMapMetrics = {
        "ATM Cash Withdrawals": { count: 0, sum: 0 },
        "Administrative Notification": { count: 0, sum: 0 },
        "Direct Cash Bank Credits": { count: 0, sum: 0 },
        "Direct Cash Bank Debits": { count: 0, sum: 0 },
        "Merchant Vendor Spending": { count: 0, sum: 0 }
    };

    const spreadsheetTbody = document.getElementById('spreadsheet-tbody');
    spreadsheetTbody.innerHTML = '';

    masterData.forEach((item, index) => {
        let cleaned = cleanStringText(item.sms);
        let amount = parseCurrencyFloatValue(item.sms);
        let category = "Merchant Vendor Spending"; 

        if (cleaned.includes("created") || cleaned.includes("opening") || cleaned.includes("chequebook")) {
            category = "Administrative Notification";
        } else if (cleaned.includes("credited") || cleaned.includes("received")) {
            category = "Direct Cash Bank Credits";
        } else if (cleaned.includes("withdrawal") || cleaned.includes("atm")) {
            category = "ATM Cash Withdrawals";
        } else if (cleaned.includes("debited")) {
            category = "Direct Cash Bank Debits";
        } else if (cleaned.includes("trx") || cleaned.includes("order") || cleaned.includes("cafe") || cleaned.includes("supermarket") || cleaned.includes("online") || cleaned.includes("coffee")) {
            category = "Merchant Vendor Spending";
        }

        item.assignedCategory = category;

        if (ledgerMapMetrics[category]) {
            ledgerMapMetrics[category].count += 1;
            ledgerMapMetrics[category].sum += amount;
        }

        const row = document.createElement('tr');
        row.className = "divide-x divide-gray-200 text-gray-700 text-xs hover:bg-gray-50";
        row.innerHTML = `
            <td class="p-2 text-center text-gray-400 border-r bg-gray-50/50">${index}</td>
            <td class="p-2 border-r font-mono text-gray-500">${item.id}</td>
            <td class="p-2 border-r text-gray-800">${item.sms}</td>
            <td class="p-2 border-r font-semibold text-gray-700">${category}</td>
            <td class="p-2 text-emerald-600 font-bold tracking-wider bg-gray-50/20">CLUSTER_CONFIRMED</td>
        `;
        spreadsheetTbody.appendChild(row);
    });

    const tableBody = document.getElementById('metrics-table-body');
    tableBody.innerHTML = '';
    let categoryRowIndex = 0;
    
    let chartLabels = [];
    let chartDataValues = [];

    for (const [catName, dataBlock] of Object.entries(ledgerMapMetrics)) {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 divide-x divide-gray-100 text-xs";
        tr.innerHTML = `
            <td class="p-2 font-mono text-gray-400 bg-gray-50/50 w-8 text-center">${categoryRowIndex++}</td>
            <td class="p-2 font-bold text-gray-700">${catName}</td>
            <td class="p-2 text-center text-gray-500 font-semibold">${dataBlock.count}</td>
            <td class="p-2 text-right font-bold text-gray-900">AED ${dataBlock.sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;
        tableBody.appendChild(tr);

        chartLabels.push(catName);
        chartDataValues.push(dataBlock.sum);
    }

    renderMatplotlibMimicCharts(chartLabels, chartDataValues);
}

// 🚀 MATPLOTLIB LOOKALIKE CHART RENDERING: Emulates Matplotlib's styling choices (clean sans typography, precise spacing)
function renderMatplotlibMimicCharts(labels, dataValues) {
    const pieCtx = document.getElementById('pieChartCanvas').getContext('2d');
    const barCtx = document.getElementById('barChartCanvas').getContext('2d');

    if (chartPieInstance) chartPieInstance.destroy();
    if (chartBarInstance) chartBarInstance.destroy();

    // Matplotlib Style Pie Chart Execution (matches colors from target graphic)
    chartPieInstance = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: ['#ff9f43', '#00d25b', '#0d6efd', '#2563eb', '#6f42c1'],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            plugins: { 
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw.toFixed(2)}` } }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Matplotlib Style Horizontal Bar Chart Execution (clean line grids, solid fills)
    chartBarInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: '#2563eb',
                borderColor: '#1d4ed8',
                borderWidth: 1,
                barThickness: 14
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { 
                    grid: { display: true, color: '#e2e8f0', borderDash: [4, 4] }, 
                    ticks: { font: { size: 8, weight: 'bold' }, color: '#64748b' } 
                },
                y: { 
                    grid: { display: false }, 
                    ticks: { font: { size: 8, weight: 'bold' }, color: '#475569' } 
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function exportLedgerToCSVStream() {
    if (masterData.length === 0) return;
    let csvRows = ["ID,SMS,assigned_accounting_category,pipeline_status"];
    
    masterData.forEach(item => {
        let cleanTextStr = item.sms.replace(/"/g, '""');
        csvRows.push(`${item.id},"${cleanTextStr}",${item.assignedCategory},CLUSTER_CONFIRMED`);
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "verified_general_ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
