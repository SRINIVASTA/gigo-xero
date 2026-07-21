// ==========================================
// AUTOMATED ML BOOKKEEPING ANALYTICS ENGINE
// ==========================================
const codeEmbeddedTransactions = [
  { id: 0, sms: "22-01-2019 14:02 Account *****535 has been created for you.", category: "Administrative Notification" },
  { id: 1, sms: "22-01-2019 14:03 Dear Customer, thank you for opening a new AED account with ADIB.", category: "Administrative Notification" },
  { id: 2, sms: "22-01-2019 15:29 Dear Customer, thank you for requesting a new chequebook for your account.", category: "Administrative Notification" },
  { id: 3, sms: "05-03-2019 09:26 Dear Customer, AED 25806.50 was credited to your account ****0535.", category: "Direct Cash Bank Credits" },
  { id: 4, sms: "06-03-2019 22:52 Dear Customer, AED 12800.00 was debited from your account ****0535.", category: "Direct Cash Bank Debits" },
  { id: 5, sms: "08-03-2019 10:02 Trx. of AED 50.00 on your a/c ****0535 at ABU DHABI NATIONAL OIL.", category: "Merchant Vendor Spending" },
  { id: 6, sms: "10-03-2019 18:49 Trx. of AED 78.75 on your a/c ****0535 at ART HOUSE CAFE ABU DHABI AE.", category: "Merchant Vendor Spending" },
  { id: 7, sms: "10-03-2019 20:49 Dear Customer, ATM Cash Withdrawal for AED 100.00 was debited from account.", category: "ATM Cash Withdrawals" },
  { id: 8, sms: "10-03-2019 22:01 Dear Customer, ATM Cash Withdrawal for AED 12000.00 was debited from account.", category: "ATM Cash Withdrawals" },
  { id: 9, sms: "11-03-2019 10:11 Trx. of AED 40.00 on your a/c ****0535 at ZOMATO ORDER DUBAI AE.", category: "Merchant Vendor Spending" },
  { id: 10, sms: "12-03-2019 17:56 Trx. of AED 50.00 on your a/c ****0535 at ABU DHABI NATIONAL OIL.", category: "Merchant Vendor Spending" },
  { id: 11, sms: "13-03-2019 18:11 Trx. of AED 87.75 on your a/c ****0535 at FLAKES HUB RESTURANT.", category: "Merchant Vendor Spending" },
  { id: 12, sms: "14-03-2019 09:15 Dear Customer, AED 3500.00 was credited to your account ****0535.", category: "Direct Cash Bank Credits" },
  { id: 13, sms: "15-03-2019 14:22 Trx. of AED 120.00 on your a/c ****0535 at CARREFOUR SUPERMARKET.", category: "Merchant Vendor Spending" },
  { id: 14, sms: "16-03-2019 16:45 Dear Customer, ATM Cash Withdrawal for AED 500.00 was debited.", category: "ATM Cash Withdrawals" },
  { id: 15, sms: "17-03-2019 21:10 Trx. of AED 15.00 on your a/c ****0535 at ://apple.com ONLINE.", category: "Merchant Vendor Spending" },
  { id: 16, sms: "18-03-2019 11:30 Dear Customer, thank you for requesting a new chequebook.", category: "Administrative Notification" },
  { id: 17, sms: "19-03-2019 13:40 Trx. of AED 65.25 on your a/c ****0535 at VOX CINEMAS DUBAI.", category: "Merchant Vendor Spending" },
  { id: 18, sms: "20-03-2019 19:02 Dear Customer, AED 450.00 was debited from your account ****0535.", category: "Direct Cash Bank Debits" },
  { id: 19, sms: "21-03-2019 08:55 Trx. of AED 22.00 on your a/c ****0535 at COSTA COFFEE DUBAI AE.", category: "Merchant Vendor Spending" }
];

// Global holder for working data pool and sheet processing instance
let currentActiveDataPool = [...codeEmbeddedTransactions];
let activeWorkbookInstance = null;

// 1. Process calculations based on whatever data pool is currently active
function processWebLedger() {
  const calculations = {};
  
  currentActiveDataPool.forEach(item => {
    // Gracefully handle strings or alternative property variations from file uploads
    const smsText = item.sms || item.SMS || "";
    const categoryText = item.category || item.assigned_accounting_category || "Uncategorized";

    const valueMatch = smsText.match(/AED\s([\d.]+)/);
    const amountNum = valueMatch ? parseFloat(valueMatch[1]) : 0.0;

    if (!calculations[categoryText]) {
      calculations[categoryText] = { counts: 0, cashVolume: 0 };
    }
    calculations[categoryText].counts += 1;
    calculations[categoryText].cashVolume += amountNum;
  });

  injectToHTML(calculations);
}

// 2. Clear out and rewrite matching DOM table structures
function injectToHTML(calculatedData) {
  const metricsBody = document.getElementById("metrics-table-body");
  const explorerBody = document.getElementById("explorer-table-body");

  if (metricsBody) {
    metricsBody.innerHTML = Object.keys(calculatedData).map((cat, idx) => `
      <tr>
        <td>${idx}</td>
        <td><strong>${cat}</strong></td>
        <td>${calculatedData[cat].counts}</td>
        <td>AED ${calculatedData[cat].cashVolume.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
      </tr>`).join('');
  }

  if (explorerBody) {
    explorerBody.innerHTML = currentActiveDataPool.map((item, index) => `
      <tr>
        <td>${item.id !== undefined ? item.id : index}</td>
        <td>574063879905315000</td>
        <td>${item.sms || item.SMS || ""}</td>
        <td>${item.category || item.assigned_accounting_category || "Uncategorized"}</td>
        <td><span style="color: green; font-weight: bold;">${item.pipeline_status || 'CLUSTER_CONFIRMED'}</span></td>
      </tr>`).join('');
  }
}

// 3. Handle visual toggle variations between modes
function toggleDataUploader() {
  const selectedOption = document.querySelector('input[name="dataSource"]:checked').value;
  const container = document.getElementById("uploader-container");
  const statusBanner = document.getElementById("upload-status");

  if (selectedOption === "option2") {
    container.style.display = "block";
    statusBanner.innerHTML = '<span style="color: orange;">Waiting for file upload...</span>';
  } else {
    container.style.display = "none";
    statusBanner.innerHTML = "";
    // Reset back to code-embedded array structure
    currentActiveDataPool = [...codeEmbeddedTransactions];
    processWebLedger();
  }
}

// 4. File input parser for incoming files
function parseIncomingFile(event) {
  const file = event.target.files[0];
  const statusBanner = document.getElementById("upload-status");
  const sheetWrapper = document.getElementById("sheet-picker-wrapper");
  
  if (!file) return;
  sheetWrapper.style.display = "none";

  const reader = new FileReader();

  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      activeWorkbookInstance = XLSX.read(data, { type: 'array' });
      
      const sheetNames = activeWorkbookInstance.SheetNames;
      const selector = document.getElementById("sheet-selector");
      
      selector.innerHTML = sheetNames.map(name => `<option value="${name}">${name}</option>`).join('');
      sheetWrapper.style.display = "block";
      
      loadSelectedExcelSheet();
    };
    reader.readAsArrayBuffer(file);
    
  } else if (file.name.endsWith('.csv')) {
    reader.onload = function(e) {
      const text = e.target.result;
      // Convert flat CSV text content lines straight into Javascript Objects
      const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
      const headers = lines[0].split(",");
      
      currentActiveDataPool = lines.slice(1).map((line, idx) => {
        const columns = line.split(",");
        return {
          id: idx,
          sms: columns[headers.indexOf("SMS")] || columns[1] || "",
          category: columns[headers.indexOf("assigned_accounting_category")] || columns[2] || "Uncategorized"
        };
      });

      statusBanner.innerHTML = `<span style="color: green;">✅ Loaded CSV: ${file.name}</span>`;
      processWebLedger();
    };
    reader.readAsText(file);
  }
}

// 5. Read selected tab index variations from dropdown box configurations
function loadSelectedExcelSheet() {
  const selectedSheetName = document.getElementById("sheet-selector").value;
  const statusBanner = document.getElementById("upload-status");
  
  if (!activeWorkbookInstance) return;

  const worksheet = activeWorkbookInstance.Sheets[selectedSheetName];
  // Parse rows out into standard dynamic array entries
  currentActiveDataPool = XLSX.utils.sheet_to_json(worksheet);

  statusBanner.innerHTML = `<span style="color: green;">✅ Active: Sheet '${selectedSheetName}' (${currentActiveDataPool.length} rows)</span>`;
  processWebLedger();
}

// Attach lifecycle runtime listeners to view windows
document.addEventListener("DOMContentLoaded", () => {
  processWebLedger();
  
  const fileInput = document.getElementById("file-uploader");
  if (fileInput) fileInput.addEventListener("change", parseIncomingFile);
  
  const sheetSelect = document.getElementById("sheet-selector");
  if (sheetSelect) sheetSelect.addEventListener("change", loadSelectedExcelSheet);
});
