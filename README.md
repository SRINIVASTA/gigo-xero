# 📊 Unsupervised Xero ML Bookkeeping & Analytics Engine

A production-grade **Anti-GIGO (Garbage In, Garbage Out)** financial data pipeline built with **Streamlit** and **Scikit-Learn**. This application automatically cleans, tokenizes, clusters, and parses unclassified bank SMS notification logs into clean, audit-ready bookkeeping spreadsheets ready for general ledger systems like Xero.

---
✒️ **Created by Srinivasta**  
*Automated Bookkeeping & Machine Learning Data Solutions*
---

## 🚀 Key Architectural Features

* **Insulated Anti-GIGO Protection Layers:** Instantly drops empty trailing cells, formatting gunk, and unparseable system errors, keeping garbage inputs completely isolated from machine learning weights.
* **Dual-Option Data Ingestion Engine:** Contains an out-of-the-box hardcoded testing dataset (20 Live Rows) embedded directly inside the codebase, while providing seamless support for direct user browser drag-and-drop spreadsheets.
* **Dynamic Multi-Sheet Excel Selector:** Automatically scans uploaded Excel files with multiple worksheets and exposes an active dropdown selection grid in your interface.
* **Unsupervised Text Clustering Engine:** Vectorizes messy string syntax using TF-IDF bigrams and applies a 5-cluster K-Means topology routine to organically isolate spending trends.
* **Deterministic Post-Cluster Rules Engine:** Automatically cross-references mathematical cluster weights against token filters to fix indexing shuffle drift and resolve structural collisions (e.g., separating ATM Cash Withdrawals from standard Merchant Vendor Spending).
* **Regex Currency Extractor & Dashboard Plots:** Parses monetary integers straight out of unstructured text matrices and calculates analytics pivot summary tables alongside visual matplotlib charts.

---

## 📂 Project Repository Folder Layout

To deploy this framework seamlessly to Streamlit Cloud, structure your files inside your GitHub repository folder path exactly like this:

```text
📂 your-financial-app-repo/
├── 📄 app.py                           # Master front-end Streamlit application
├── 📄 data_pipeline.py                 # Backend mathematical processing core
├── 📄 requirements.txt                 # Manifest file tracking software package versions
└── 📄 README.md                        # This project structural blueprint manual
```

---

## 💾 Production Test Dataset Source

For full-scale volume stress testing (1,894+ transactions), download the live bank messaging data profile used to develop this application directly from Kaggle. 

📥 **Official Dataset Link:** [Kaggle Bank Transactions SMS Datasets](https://kaggle.com)

> 💡 **Multi-Sheet Architecture Note:** This dataset file natively features **7 distinct sheet variations** (e.g., `debit535 1896`, etc.). When uploaded to the interface, the app dynamically generates a sidebar dropdown selection grid, allowing you to instantly isolate and process any individual statement feed while automatically removing hidden trailing cell noise artifact boundaries.

---

## 🛠️ Step-by-Step Installation & Running Locally

Follow these commands to test your application workspace on your desktop machine:

1. **Clone your repository:**
   ```bash
   git clone https://github.com
   cd your-repository-name
   ```

2. **Set up a virtual environment & install requirements:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Launch the Streamlit web app interface window:**
   ```bash
   streamlit run app.py
   ```

---

## ☁️ How to Deploy Securely to Streamlit Cloud

1. Commit and push your code files (`app.py`, `data_pipeline.py`, and `requirements.txt`) up to your public **GitHub repository**.
2. Visit [share.streamlit.io](https://gigo-xero-zxeczpkv4wbafsntchzm72.streamlit.app/) and link your developer profile.
3. Click the **"New app"** indicator button panel.
4. Select your newly created bookkeeping code repository name, set the production branch to `main`, and type **`app.py`** in your main file path row.
5. Click **"Deploy!"** 🚀

---

## 📝 Required Input Spreadsheet Layout Schema

To bypass validation errors during custom document file parsing, your uploaded spreadsheet columns must match these layout headers precisely:

| ID | SMS |
| :--- | :--- |
| `574063879905315001` | `Dear Customer, AED 25806.50 was credited to your account ****0535.` |
| `574063879905315002` | `Trx. of AED 50.00 on your a/c ****0535 at ABU DHABI NATIONAL OIL.` |
| `574063879905315003` | `Dear Customer, ATM Cash Withdrawal for AED 100.00 was debited.` |

*Note: Any blank rows trailing below your data grids inside sheet ranges are automatically detected, filtered out, and logged as system-rejected anomaly rows.*
> ⚠️ **IMPORTANT COPYRIGHT NOTICE**
> 
> **All Rights Reserved © 2026 T A Srinivas.**
> This repository is strictly for portfolio viewing purposes. **DO NOT COPY, CLONE, OR REDISTRIBUTE** this code. Stolen copies or unauthorized forks will be reported immediately for a GitHub copyright takedown.

* **Lead Architect & Developer:** [Srinivasta](https://github.com/SRINIVASTA)

### 🌐 Let’s Connect

- [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/srinivas-t-a-557637119/)  
- [![Kaggle](https://img.shields.io/badge/Kaggle-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white)](https://www.kaggle.com/srinivasta)  
- [![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:tasrinivass@gmail.com)  
- [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/srinivasta)
- [![Website](https://img.shields.io/badge/Website-000000?style=for-the-badge&logo=website&logoColor=white)](https://srinivasta/github.io)
