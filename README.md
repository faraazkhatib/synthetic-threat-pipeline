#  Automated Threat Intelligence & Synthetic Data Pipeline

An end-to-end, containerized cyber range designed to capture live, multi-vector network attacks and automatically engineer structured datasets for Machine Learning threat classification.

##  Project Overview
Most Machine Learning cybersecurity models rely on static, outdated datasets. This project solves that by engineering a live data generation pipeline. It utilizes an isolated Docker network of honeypots to attract attacks, a custom Python ETL script to parse unstructured logs, and a Random Forest classifier to detect anomalous network behavior.

##  Architecture & Core Components

This pipeline operates in four distinct phases:

### 1. Infrastructure (The Decoy Network)
Deployed via Docker, the network utilizes three distinct honeypots to capture specific attack vectors:
* **Cowrie:** Captures SSH Brute-Force and terminal interaction.
* **VSFTPD:** Captures unencrypted FTP login attacks.
* **DVWA (Damn Vulnerable Web App):** Captures SQL Injections (`admin' OR 1=1`) and web directory brute-forcing.

### 2. SIEM Integration (Wazuh)
A Wazuh Agent is deployed within the Docker environment with a custom 4-Vector XML routing configuration. Custom threat-detection rules (Level 12 Critical) were engineered to bypass standard web-traffic filters and detect URL-encoded SQL payloads in real-time.

### 3. Data Engineering (The ETL Pipeline)
* **`chaos.py`**: A multi-threaded automated attack simulator that generates high-fidelity malicious traffic across all three honeypot vectors.
* **`reader.py`**: A custom Python Master Parser. It reads unstructured logs (JSON, Apache, Syslog) across the network, decodes URL payloads, normalizes timestamps, and fuses the data into a single, structured CSV dataset.

### 4. Machine Learning (Threat Classification)
* **The Honeypot Paradox:** A script dynamically injects synthetic "normal" traffic into the 100% malicious dataset to provide a baseline for the AI.
* **Model:** A Random Forest Classifier trained to detect attacks based on network behavior. 
* **Target Leakage Mitigation:** Explicit system event codes were dropped during training to force the model into "Hard Mode," relying purely on IP frequencies and target service metrics rather than obvious log tags.

##  Quick Start & Usage

### Prerequisites
* Docker & Docker Compose
* Python 3.8+
* Wazuh Manager (Local or Cloud)

### Deployment Steps
1. **Boot the Cyber Range:**
   Execute the custom SOC deployment script to initialize the isolated network and Wazuh Manager.
   ```bash
   ./SOC_start.sh  # (Or whatever your exact command is!)