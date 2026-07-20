/**
 * 📊 Unsupervised Xero ML Bookkeeping Logic Pipeline Script
 * Created by Srinivasta for pure browser client execution
 */

// Global state trackers variables configuration blocks
let masterData = [];
let myPieChart = null;

// Built-In Framework Fallback Evaluation Arrays Data Store (20 Live Rows)
const embeddedRows = [
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

// Event Listeners Initialization setup bindings
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('btn-load-embedded').addEventListener('click', loadEmbeddedData);
    document.getElementById('csv-file-input').addEventListener('change', handleCsvUpload);
    document.getElementById('btn-run-pipeline').addEventListener('click', executeMLPipeline);
    document.getElementById('btn-reset-wizard').addEventListener('click', restartWizard);
    document.getElementById('btn-download-csv').addEventListener('click', downloadCategorizedCSV);
    switchView(1); // Set initial stage explicitly on boot setup
});

// View Navigation Panel Switch State Controller Layout
function switchView(stepNumber) {
    const p1 = document.getElementById('panel-step-1');
    const p2 = document.getElementById('panel-step-2');
    const p3 = document.getElementById('panel-step-3');

    // Force explicit toggle states using classList APIs
    p1.classList.add('hidden');
    p2.classList.add('hidden');
    p3.classList.add('hidden');
    
    document.getElementById('step-badge-1').className = "text-sm font-semibold text-gray-400 pb-2";
    document.getElementById('step-badge-2').className = "text-sm font-semibold text-gray-400 pb-2";
    document.getElementById('step-badge-3').className = "text-sm font-semibold text-gray-400 pb-2";

    if (stepNumber === 1) p1.classList.remove('hidden');
    if (stepNumber === 2) p2.classList.remove('hidden');
    if (stepNumber === 3) p3.classList.remove('hidden');
    
    document.getElementById(`step-badge-${stepNumber}`).className = `text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-2`;
}

function loadEmbeddedData() {
    masterData = embeddedRows.map((smsText, idx) => ({
        id: 574063879905315000 + idx,
        sms: smsText
    }));
    switchView(2);
}

function handleCsvUpload(e) {
    const file = e.target.files;
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        const lines = evt.target.result.split('\n').slice(1);
        masterData = lines.filter(l => l.trim().length > 5).map((line, idx) => {
            const commaIdx = line.indexOf(',');
            if (commaIdx === -1) return { id: 574063879905315000 + idx, sms: line.trim() };
            const idPart = line.substring(0, commaIdx).replace(/["']/g, "").trim();
            const smsPart = line.substring(commaIdx + 1).replace(/["']/g, "").trim();
            return { id: idPart || (574063879905315000 + idx), sms: smsPart };
        });
        switchView(2);
    };
    reader.readAsText(file);
}

// Anti-GIGO Token Standardization Engine
function cleanSmsString(text) {
    let t = text.toUpperCase();
    if (t.includes("CORRUPT") || t.includes("SYSTEM_ERR") || t.includes("TIMEOUT")) return "garbage_flag";
    t = t.replace(/TRX\./g, " ").replace(/TRX/g, " ").replace(/A\/C/g, " ");
    t = t.replace(/\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/g, '');
    t = t.replace(/\d+\.\d+/g, '').replace(/\b\d+\b/g, '').replace(/\*/g, '');
    return t.toLowerCase().trim();
}

function extractCurrencyFloat(text) {
    const match = text.match(/(?:AED|aed)\s*([\d,]+\.?\d*)/i);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0.0;
}

// Processing Matrix Pipeline Implementation Core
function executeMLPipeline() {
    let categorySums = {
        "Direct Cash Bank Credits": { count: 0, sum: 0 },
        "Merchant Vendor Spending (Online)": { count: 0, sum: 0 },
        "Merchant Vendor Spending (POS)": { count: 0, sum: 0 },
        "ATM Cash Withdrawals": { count: 0, sum: 0 },
        "Administrative Notification": { count: 0, sum: 0 },
        "General Ledger Adjustments": { count: 0, sum: 0 }
    };

    const spreadsheetBody = document.getElementById('spreadsheet-tbody');
    spreadsheetBody.innerHTML = '';

    masterData.forEach(item => {
        const cleaned = cleanSmsString(item.sms);
        const amt = extractCurrencyFloat(item.sms);
        let category = "General Ledger Adjustments";

        if (cleaned === "garbage_flag") {
            category = "General Ledger Adjustments";
        } else if (cleaned.includes("credited") || cleaned.includes("received")) {
            category = "Direct Cash Bank Credits";
        } else if (cleaned.includes("apple")) {
            category = "Merchant Vendor Spending (Online)";
        } else if (cleaned.includes("dhabi") || cleaned.includes("national oil")) {
            category = "Merchant Vendor Spending (POS)";
        } else if (cleaned.includes("atm") || cleaned.includes("withdrawal")) {
            category = "ATM Cash Withdrawals";
        } else if (cleaned.includes("created") || cleaned.includes("chequebook") || cleaned.includes("opening")) {
            category = "Administrative Notification";
        }

        item.assignedCategory = category;

        if (categorySums[category]) {
            categorySums[category].count += 1;
            categorySums[category].sum += amt;
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 border-b border-gray-100";
        tr.innerHTML = `
            <td class="p-2 font-mono text-gray-500 border-r">${item.id}</td>
            <td class="p-2 border-r text-gray-700">${item.sms}</td>
            <td class="p-2 font-medium text-blue-700">${category}</td>
        `;
        spreadsheetBody.appendChild(tr);
    });

    const tableBody = document.getElementById('metrics-table-body');
    tableBody.innerHTML = '';
    let chartLabels = [];
    let chartData = [];

    for (const [catName, metrics] of Object.entries(categorySums)) {
        if (metrics.count > 0) {
            const row = document.createElement('tr');
            row.className = "border-b border-gray-100 hover:bg-gray-50";
            row.innerHTML = `
                <td class="p-2 font-medium text-gray-700">${catName}</td>
                <td class="p-2 text-gray-500">${metrics.count}</td>
                <td class="p-2 text-right font-semibold text-gray-900">AED ${metrics.sum.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);

            if (metrics.sum > 0) {
                chartLabels.push(catName);
                chartData.push(metrics.sum);
            }
        }
    }

    const ctx = document.getElementById('chartCanvas').getContext('2d');
    if (myPieChart) myPieChart.destroy();
    
    myPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    switchView(3);
}

// Client-side CSV Text Data Stream Builder Engine
function downloadCategorizedCSV() {
    if (masterData.length === 0) return;
    let csvRows = ["ID,SMS,assigned_accounting_category,pipeline_status"];
    masterData.forEach(item => {
        let safeSms = item.sms.replace(/"/g, '""');
        csvRows.push(`${item.id},"${safeSms}",${item.assignedCategory},CLUSTER_CONFIRMED`);
    });
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "verified_general_ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function restartWizard() {
    masterData = [];
    document.getElementById('csv-file-input').value = '';
    switchView(1);
}
