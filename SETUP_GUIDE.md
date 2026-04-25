1\. System Requirements
-----------------------

### Hardware Infrastructure

To ensure stable execution of the local SIEM alongside multiple containerized honeypot servers, the host machine requires adequate resource allocation:

*   **CPU:** 4+ Cores (Intel i5/AMD Ryzen 5 architecture or higher recommended)
    
*   **RAM:** 16 GB recommended (8 GB absolute minimum for stable Docker execution)
    
*   **Storage:** 20 GB of available space (SSD highly recommended to prevent I/O bottlenecks during high-volume log generation)
    

### Software Prerequisites

*   **Docker Desktop** (with WSL2 backend enabled if deploying on Windows)
    
*   **Python 3.8+** (Configured in System PATH)
    
*   **Git** 
    

⚙️ 2. Environment Configuration
-------------------------------

### Phase A: Repository Initialization

Clone the repository to the target host machine:

Bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   git clone https://github.com/FaraazKhatib/Synthetic-Threat-Pipeline.git  cd Synthetic-Threat-Pipeline`

### Phase B: Python Dependencies

The data fuser and machine learning pipeline rely on specific data science libraries.

Bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   pip install pandas scikit-learn matplotlib   `

### Phase C: Infrastructure Boot-Up

Initialize the Docker containers to pull the honeypot images (Cowrie, VSFTPD, DVWA) and establish the isolated local network.

Bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`# Execute the master deployment script  .\Start-SOC.ps1`  

_Note: Allow 3–5 minutes for the containers to fully initialize and for the Wazuh Agent to complete its required system integrity scan._


🧪 3. Pipeline Execution
------------------------

Once the infrastructure is actively listening, the data generation and classification pipeline can be executed sequentially:

1.  Bashpython chaos.py_Expected Output: Real-time Level 12 Critical Alerts populated on the local Wazuh Dashboard._
    
2.  Bashpython reader.py
    
3.  Bashpython train\_model.py
    

**Troubleshooting Note:** If the SIEM dashboard fails to display web-based SQL injection alerts during testing, verify that the dashboard time-filter is set to UTC, or restart the Wazuh manager to ensure the URL-encoded custom XML rules have been fully applied.