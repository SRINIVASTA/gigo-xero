# Security Policy

## Supported Versions

Only the latest commits on the `main` branch of this repository are actively supported with security updates and data sanitization adjustments.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

## Reporting a Vulnerability

Because `gigo-xero` processes raw bank messaging text notifications, data privacy and payload safety are critically important.

### Do Not Open Public Issues for Vulnerabilities
If you discover a security flaw—such as regex injection vulnerabilities, unsafe string evaluations, or local file exposure risks via file upload components:
1. Please contact the maintainer directly via their linked profile or opening an encrypted communication channel.
2. Provide a detailed description of the exploit path along with a safely masked data log example.

### Data Privacy Best Practice
**Crucial Reminder:** When using this engine for data pipelines, ensure that your bank SMS texts or input spreadsheets do not contain explicit PII (Personally Identifiable Information) such as full account numbers, routing codes, passphrases, or personal phone metrics. Always mask details down to trailing card/account identifiers (e.g., `****0535`) before streaming payloads through the pipeline interface.
