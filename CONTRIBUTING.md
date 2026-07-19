# Contributing to gigo-xero

First off, thank you for taking the time to contribute! We welcome contributions to improve the machine learning pipeline, text vectorization rules, and the Streamlit dashboard layout.

## How Can I Contribute?

### Reporting Bugs
* Check the existing GitHub Issues tab to ensure the bug hasn't been reported yet.
* Open a new issue with a clear description, steps to reproduce, and sample (anonymized) SMS string logs that caused the failure.

### Suggesting Enhancements
* Open an issue explaining the feature capability or preprocessing layer you would like added.
* Explain why this enhancement would be useful for automated bookkeeping workflows.

### Pull Requests (PRs)
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. Ensure any new parsing logic accounts for the "Anti-GIGO" boundary layers—unstructured data must not pollute cluster weights.
3. Verify your Streamlit frontend layout functions locally:
   ```bash
   streamlit run app.py
   ```
4. Commit your changes with clear messages and submit a Pull Request.

## Code Style & Standards
* All script structures must remain 100% Python.
* Keep core backend mathematical processes decoupled inside `data_pipeline.py`.
* Ensure UI layout items remain inside `app.py`.
* Update `requirements.txt` if you introduce any third-party data processing libraries.
