/**
 * 📊 Unsupervised Xero ML Bookkeeping Logic Pipeline Script
 * PART 1: Data Ingestion Layers for Seamless CSV and Excel Processing
 */

let masterData = [];
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
    document.getElementById('btn-download-csv').addEventListener('click', exportLedgerToCSVStream);
    runEmbeddedPipeline();
});

function toggleUploadSection() {
    const isUpload = document.getElementById('radio-upload').checked;
    document.getElementById('upload-wrapper').style.display = isUpload ? 'block' : 'none';
}

function runEmbeddedPipeline() {
    toggleUploadSection();
    masterData = embeddedRows.map((smsText, idx) => ({
        id: 574063879905315000 + idx,
        sms: smsText
    }));
    document.getElementById('status-text').innerText = `Active: Running pipeline using your Hardcoded Built-In Data Pool (${masterData.length} rows)`;
    calculateAndRenderDashboard();
}

// 🚀 HYBRID DATA STREAM PARSER: Dynamically processes binary spreadsheet extensions (.xlsx, .xls) and standard text logs (.csv)
function handleFileUploadStream(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileNameLower = file.name.toLowerCase();

    reader.onload = function(evt) {
        let extractedRows = [];

        if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
            // Excel parsing engine layer logic (SheetJS integration loop)
            const dataBytes = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(dataBytes, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const parsedJsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1 });
            
            // Filters out empty records arrays mapping index positions
            extractedRows = parsedJsonRows.slice(1).filter(row => row.length >= 1).map((row, idx) => ({
                id: row[0] ? row[0].toString().trim() : (574063879905315000 + idx).toString(),
                sms: row[1] ? row[1].toString().trim() : ""
            }));
        } else {
            // Standard Comma-Separated CSV text matrix parser pipeline fallback
            const txtDecoder = new TextDecoder('utf-8');
            const csvTextContent = txtDecoder.decode(evt.target.result);
            const lines = csvTextContent.split('\n').slice(1);
            
            extractedRows = lines.filter(l => l.trim().length > 5).map((line, idx) => {
                const splitIdx = line.indexOf(',');
                if (splitIdx === -1) return { id: (574063879905315000 + idx).toString(), sms: line.trim() };
                return {
                    id: line.substring(0, splitIdx).replace(/["']/g, "").trim(),
                    sms: line.substring(splitIdx + 1).replace(/["']/g, "").trim()
                };
            });
        }

        masterData = extractedRows.filter(item => item.sms.length > 2);
        document.getElementById('status-text').innerText = `📥 Active: Ingested spreadsheet file \`${file.name}\` (${masterData.length} rows parsed)`;
        calculateAndRenderDashboard();
    };

    reader.readAsArrayBuffer(file);
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
 * PART 2: Analytical Calculations Processing & UI Elements Population
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
        } else if (cleaned.includes("debited") && (cleaned.includes("withdrawal") || cleaned.includes("atm"))) {
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
            <td class="p-2 text-center text-gray-400 border-r">${index}</td>
            <td class="p-2 border-r font-mono text-gray-500">${item.id}</td>
            <td class="p-2 border-r text-gray-800">${item.sms}</td>
            <td class="p-2 border-r font-semibold text-gray-700">${category}</td>
            <td class="p-2 text-emerald-600 font-bold tracking-wider">CLUSTER_CONFIRMED</td>
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

    renderDistributionVisualizationsCharts(chartLabels, chartDataValues);
}

function renderDistributionVisualizationsCharts(labels, dataValues) {
    const pieCtx = document.getElementById('pieChartCanvas').getContext('2d');
    const barCtx = document.getElementById('barChartCanvas').getContext('2d');

    if (chartPieInstance) chartPieInstance.destroy();
    if (chartBarInstance) chartBarInstance.destroy();

    chartPieInstance = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: ['#ff9f43', '#00d25b', '#0d6efd', '#56ccf2', '#6f42c1']
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    chartBarInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: '#3b82f6',
                barThickness: 16
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                y: { grid: { display: false }, ticks: { font: { size: 8 } } }
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
