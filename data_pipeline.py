import pandas as pd
import numpy as np
import re
import streamlit as st
from sklearn.feature_extraction.text import TfidfVectorizer  # 🚀 FIXED: Added missing import
from sklearn.cluster import KMeans                           # 🚀 FIXED: Added missing import

def clean_production_sms(text: str) -> str:
    """Standardizes text string formatting and protects ATM and TRX keywords."""
    if not text or pd.isna(text): return ""
    text = str(text).upper().strip()
    
    # Safely falls back to defaults if secrets are loading or missing
    garbage_flags = st.secrets["ML_CONFIG"].get("GARBAGE_FLAGS", ["CORRUPT", "SYSTEM_ERR", "TIMEOUT"])
    if any(err in text for err in garbage_flags):
        return "garbage_error_string_flag"
        
    text = text.replace("TRX.", " TRANSACTION_TOKEN ").replace("TRX", " TRANSACTION_TOKEN ").replace("A/C", " ACCOUNT_TOKEN ")
    text = re.sub(r'\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}', '', text) 
    text = re.sub(r'\d+\.\d+', '', text)                       
    text = re.sub(r'\b\d+\b', '', text)                        
    text = re.sub(r'[\*]+', '', text)                          
    return re.sub(r'\s+', ' ', text).lower().strip()

def run_unsupervised_accounting_pipeline(df_input: pd.DataFrame) -> pd.DataFrame:
    """Ingests raw text strings and clusters them unsupervised into accounting structures."""
    df_working = df_input.copy()
    df_working['cleaned_tokens'] = df_working['SMS'].apply(clean_production_sms)
    
    df_working['pipeline_status'] = np.where(
        (df_working['cleaned_tokens'].str.len() < 3) | (df_working['cleaned_tokens'] == "garbage_error_string_flag"),
        'REJECTED', 'PENDING_UNSUPERVISED'
    )
    
    valid_mask = df_working['pipeline_status'] == 'PENDING_UNSUPERVISED'
    if valid_mask.sum() < 3:
        df_working['assigned_accounting_category'] = "General Ledger Adjustments"
        return df_working
        
    custom_stop_words = ['dear', 'customer', 'account', 'avl', 'bal', 'your', 'has', 'been', 'for', 'you', 'with', 'is']
    
    # Replaced the broken undefined '_c' variable with 'custom_stop_words'
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words=custom_stop_words)
    X_matrix = vectorizer.fit_transform(df_working.loc[valid_mask, 'cleaned_tokens'])
    
    num_clusters = min(4, valid_mask.sum())
    kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
    df_working.loc[valid_mask, 'discovered_cluster_id'] = kmeans.fit_predict(X_matrix)
    df_working['discovered_cluster_id'] = df_working['discovered_cluster_id'].fillna(-1).astype(int)
    
    feature_names = np.array(vectorizer.get_feature_names_out())
    cluster_centers = kmeans.cluster_centers_
    base_cluster_map = {}
    
    # Extracted mapping arrays securely from your custom [ML_CONFIG] secrets block
    credit_tokens = st.secrets["ML_CONFIG"]["CREDIT_TOKENS"]
    apple_tokens = st.secrets["ML_CONFIG"]["APPLE_TOKENS"]
    dhabi_tokens = st.secrets["ML_CONFIG"]["DHABI_TOKENS"]
    
    for cluster_id in range(num_clusters):
        top_indices = cluster_centers[cluster_id].argsort()[-12:]
        top_tokens = " ".join(list(feature_names[top_indices])).lower()
        
        # Now checks lists dynamically against your configuration block arrays
        if any(tok in top_tokens for tok in credit_tokens):
            base_cluster_map[cluster_id] = "Direct Cash Bank Credits"
        elif any(tok in top_tokens for tok in apple_tokens):
            base_cluster_map[cluster_id] = "Merchant Vendor Spending (Online)"
        elif any(tok in top_tokens for tok in dhabi_tokens):
            base_cluster_map[cluster_id] = "Merchant Vendor Spending (POS)"
        else:
            base_cluster_map[cluster_id] = "Generic Token Stream"
            
    df_working['assigned_accounting_category'] = "System Excluded / Anomaly Noise"
    df_working.loc[valid_mask, 'pipeline_status'] = 'CLUSTER_CONFIRMED'
    df_working.loc[valid_mask, 'assigned_accounting_category'] = df_working.loc[valid_mask, 'discovered_cluster_id'].map(base_cluster_map)
    
    def evaluate_accounting_labels(row):
        if row['pipeline_status'] == 'REJECTED': return "System Excluded / Anomaly Noise"
        raw_text_upper = str(row['SMS']).upper()
        current_label = row['assigned_accounting_category']

        # Safely links your nested [SUB_CLASSIFICATION] rules dictionary 
        rules = st.secrets["SUB_CLASSIFICATION"]
        
        if current_label == "Generic Token Stream" or pd.isna(current_label):
            if any(tok in raw_text_upper for tok in rules["ATM"]): return "ATM Cash Withdrawals"
            elif any(tok in raw_text_upper for tok in rules["ADMIN"]): return "Administrative Notification"
            elif any(tok in raw_text_upper for tok in rules["MERCHANT"]): return "Merchant Vendor Spending"
            elif any(tok in raw_text_upper for tok in rules["DEBIT"]): return "Direct Cash Bank Debits"
            else: return "General Ledger Adjustments"
        return current_label

    df_working['assigned_accounting_category'] = df_working.apply(evaluate_accounting_labels, axis=1)
    return df_working
