#  System Configuration & Deployment Guide

**Project:** Automated Threat Intelligence & Synthetic Data Pipeline
**Purpose:** Outlines the hardware specifications, software prerequisites, and step-by-step configuration required to deploy the synthetic cyber range and data engineering pipeline.

---

##  1. System Requirements

### Hardware Infrastructure
To ensure stable execution of the local SIEM alongside multiple containerized honeypot servers, the host machine requires adequate resource allocation:
* **CPU:** 4+ Cores (Intel i5/AMD Ryzen 5 architecture or higher recommended)
* **RAM:** 16 GB recommended (8 GB absolute minimum for stable Docker execution)
* **Storage:** 20 GB of available space (SSD highly recommended to prevent I/O bottlenecks during high-volume log generation)

### Software Prerequisites
* **Docker Desktop** (with WSL2 backend enabled if deploying on Windows)
* **Python 3.8+** (Configured in System PATH)
* **Git** ---

##  2. Environment Configuration

### Phase A: Repository Initialization
Clone the repository to the target host machine:
```bash
git clone [https://github.com/FaraazKhatib/Synthetic-Threat-Pipeline](https://github.com/FaraazKhatib/Synthetic-Threat-Pipeline)
cd Synthetic-Threat-Pipeline
