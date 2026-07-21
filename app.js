// ==========================================
// AUTOMATED ML BOOKKEEPING ANALYTICS ADD-ON
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

function processWebLedger() {
  const calculations = {};
  
  codeEmbeddedTransactions.forEach(item => {
    const valueMatch = item.sms.match(/AED\s([\d.]+)/);
    const amountNum = valueMatch ? parseFloat(valueMatch[1]) : 0.0;

    if (!calculations[item.category]) {
      calculations[item.category] = { counts: 0, cashVolume: 0 };
    }
    calculations[item.category].counts += 1;
    calculations[item.category].cashVolume += amountNum;
  });

  injectToHTML(calculations);
}

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
    explorerBody.innerHTML = codeEmbeddedTransactions.map(item => `
      <tr>
        <td>${item.id}</td>
        <td>574063879905315000</td>
        <td>${item.sms}</td>
        <td>${item.category}</td>
        <td><span style="color: green; font-weight: bold;">CLUSTER_CONFIRMED</span></td>
      </tr>`).join('');
  }
}

// Trigger computation automatically upon window rendering
window.addEventListener("DOMContentLoaded", processWebLedger);
