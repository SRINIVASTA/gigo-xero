import streamlit as st
import pandas as pd
import re
import matplotlib.pyplot as plt
from data_pipeline import run_unsupervised_accounting_pipeline

st.set_page_config(page_title="Xero ML Automated Bookkeeper", layout="wide")
st.title("📊 Unsupervised Xero ML Bookkeeping & Analytics Engine")
st.write("An anti-GIGO system designed to ingest, clean, and cluster unlabeled financial text notifications.")

# -------------------------------------------------------------
# 20 LIVE TRANSACTIONS HARDCODED DIRECTLY INSIDE THE SCRIPT
# -------------------------------------------------------------
embedded_20_transactions = {
    'ID': list(range(574063879905315000, 574063879905315020)),
    'SMS': [
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
    ]
}

# -------------------------------------------------------------
# TWO-OPTION ROUTING INTERFACE
# -------------------------------------------------------------
st.sidebar.header("📁 Data Source Selection")
data_option = st.sidebar.radio(
    "Choose how you want to load data:",
    ("Option 1: Use Code-Embedded Transactions (20 Live Rows)", "Option 2: Upload My Custom Excel/CSV File")
)

df_master = None

if data_option == "Option 1: Use Code-Embedded Transactions (20 Live Rows)":
    # Instantly build dataframe straight out of hardcoded dictionary vectors
    df_master = pd.DataFrame(embedded_20_transactions)
    st.success(f"✅ Active: Running pipeline using your **Hardcoded Built-In Data Pool** ({len(df_master)} rows)")
else:
    uploaded_file = st.sidebar.file_uploader("Upload your custom transaction spreadsheet", type=["xlsx", "xls", "csv"])
    if uploaded_file is not None:
        df_master = pd.read_csv(uploaded_file) if uploaded_file.name.endswith('.csv') else pd.read_excel(uploaded_file)
        st.success(f"📥 Active: Ingested browser custom file `{uploaded_file.name}` ({len(df_master)} rows)")

# Execute system operations only if data container pointer variable holds state
if df_master is not None:
    if not all(col in df_master.columns for col in ['ID', 'SMS']):
        st.error(f"❌ Schema Validation Failed! Column headers must match 'ID' and 'SMS' exactly. Found: {list(df_master.columns)}")
        st.stop()
        
    df_final = run_unsupervised_accounting_pipeline(df_master)
    
    # Financial Numeric Float Value Parser Node
    def extract_currency_float(text):
        match = re.search(r'(?:AED|aed)\s*([\d,]+\.?\d*)', str(text))
        return float(match.group(1).replace(',', '')) if match else 0.0

    df_confirmed = df_final[df_final['pipeline_status'] == 'CLUSTER_CONFIRMED'].copy()
    df_confirmed['parsed_amount'] = df_confirmed['SMS'].apply(extract_currency_float)
    
    # Build metrics frames
    pivot_summary = df_confirmed.groupby('assigned_accounting_category').agg(
        transaction_count=('ID', 'count'),
        total_volume_aed=('parsed_amount', 'sum'),
        average_ticket_aed=('parsed_amount', 'mean')
    ).reset_index()
    
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("General Ledger Metrics Summary")
        formatted_pivot = pivot_summary.copy()
        formatted_pivot['total_volume_aed'] = formatted_pivot['total_volume_aed'].map('AED {:,.2f}'.format)
        formatted_pivot['average_ticket_aed'] = formatted_pivot['average_ticket_aed'].map('AED {:,.2f}'.format)
        st.dataframe(formatted_pivot, use_container_width=True)
        
        csv_payload = df_final[['ID', 'SMS', 'assigned_accounting_category', 'pipeline_status']].to_csv(index=False)
        st.download_button("📥 Download Final Verified Ledger Spreadsheet", data=csv_payload, file_name="verified_general_ledger.csv", mime="text/csv")
        
    with col2:
        st.subheader("Data Analytics Distribution Visualizations")
        plot_df = pivot_summary[pivot_summary['total_volume_aed'] > 0].sort_values(by='total_volume_aed', ascending=False)
        
        if not plot_df.empty:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
            ax1.pie(plot_df['total_volume_aed'], labels=plot_df['assigned_accounting_category'], autopct='%1.1f%%', startangle=140, colors=['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'])
            ax1.set_title("Total Capital Allocation Share (%)", fontweight='bold')
            ax2.barh(plot_df['assigned_accounting_category'], plot_df['total_volume_aed'], color='#6366f1')
            ax2.set_title("Total Category Spending Volume (AED)", fontweight='bold')
            ax2.grid(axis='x', linestyle='--', alpha=0.5)
            st.pyplot(fig)
        else:
            st.warning("No numeric monetary values parsed to plot dashboard statistics.")
            
    st.subheader("📝 Live Spreadsheet View Explorer")
    st.dataframe(df_final[['ID', 'SMS', 'assigned_accounting_category', 'pipeline_status']], use_container_width=True)
