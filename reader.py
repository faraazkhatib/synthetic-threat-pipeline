import pandas as pd
import json
import re
import os
import urllib.parse

print("""
========================================
   [*] INITIATING MASTER PARSER [*]
========================================
""")

# The root directory of your logs
base_log_dir = r"C:\Users\Faraaz Khatib\Downloads\Honeynet-main\Honeynet-main\G2 Honeynet Deploy\logs"

parsed_data = []

# ==========================================
# 1. PARSE COWRIE (SSH - JSON Format)
# ==========================================
cowrie_path = os.path.join(base_log_dir, "cowrie", "cowrie.json")
if os.path.exists(cowrie_path):
    print("[+] Parsing Cowrie (SSH) Logs...")
    with open(cowrie_path, 'r') as file:
        for line in file:
            try:
                log = json.loads(line.strip())
                parsed_data.append({
                    "timestamp": log.get("timestamp"),
                    "target_service": "SSH",
                    "event_type": log.get("eventid"),
                    "source_ip": log.get("src_ip"),
                    "username": log.get("username", "N/A"),
                    "password": log.get("password", "N/A"),
                    "payload_or_command": log.get("input", "N/A")
                })
            except:
                continue

# ==========================================
# 2. PARSE VSFTPD (FTP - Syslog Format)
# ==========================================
ftp_path = os.path.join(base_log_dir, "vsftpd", "vsftpd.log")
if os.path.exists(ftp_path):
    print("[+] Parsing VSFTPD (FTP) Logs...")
    # FTP logs look like: Thu Apr 22 20:45:10 2026 [pid 2] [admin] FAIL LOGIN: Client "172.18.0.1"
    ftp_regex = re.compile(r'(?P<time>[A-Z][a-z]{2} [A-Z][a-z]{2}\s+\d+\s+\d+:\d+:\d+\s+\d+)\s+\[pid \d+\]\s+\[(?P<user>[^\]]+)\]\s+(?P<event>.*?(?:LOGIN|CONNECT)).*?(?:Client|::ffff:)"(?P<ip>[^"]+)"')
    
    with open(ftp_path, 'r') as file:
        for line in file:
            match = ftp_regex.search(line)
            if match:
                parsed_data.append({
                    "timestamp": match.group("time"),
                    "target_service": "FTP",
                    "event_type": "ftp.login.failed" if "FAIL" in match.group("event") else "ftp.connection",
                    "source_ip": match.group("ip"),
                    "username": match.group("user"),
                    "password": "N/A", # VSFTPD doesn't log passwords in plain text for security
                    "payload_or_command": "N/A"
                })

# ==========================================
# 3. PARSE DVWA (Web - Apache Format)
# ==========================================
dvwa_path = os.path.join(base_log_dir, "dvwa", "access.log")
if os.path.exists(dvwa_path):
    print("[+] Parsing DVWA (Web) Logs...")
    # Apache logs look like: 172.18.0.1 - - [22/Apr/2026:20:45:10 +0000] "GET /login.php?username=admin' OR 1=1...
    apache_regex = re.compile(r'(?P<ip>\S+)\s+\S+\s+\S+\s+\[(?P<time>.*?)\]\s+"(?P<method>\S+)\s+(?P<url>\S+)\s+\S+"\s+(?P<status>\d+)')
    
    with open(dvwa_path, 'r') as file:
        for line in file:
            match = apache_regex.search(line)
            if match:
                url_raw = match.group("url")
                # URL Decode the SQL injection so it looks readable in the CSV
                url_decoded = urllib.parse.unquote(url_raw)
                
                # Check if it was part of our SQLi attack
                event_type = "web.sqli.attempt" if "OR 1=1" in url_decoded or "DROP" in url_decoded or "login.php" in url_decoded else "web.traffic"

                parsed_data.append({
                    "timestamp": match.group("time").replace(":", " ", 1), # Quick fix for Pandas datetime
                    "target_service": "HTTP_WEB",
                    "event_type": event_type,
                    "source_ip": match.group("ip"),
                    "username": "N/A", 
                    "password": "N/A",
                    "payload_or_command": url_decoded # This captures the SQL payload!
                })

# ==========================================
# 4. FUSE & EXPORT TO DATAFRAME
# ==========================================
df = pd.DataFrame(parsed_data)

# Normalize all timestamps into a standard format so ML algorithms can read them chronologically
df['timestamp'] = pd.to_datetime(df['timestamp'], format='mixed', utc=True)
df = df.sort_values(by='timestamp').reset_index(drop=True)

print("\n[+] Multi-Vector Dataset Successfully Fused!")
print(f"Total Rows (Events): {len(df)}")
print(f"Total Columns (Features): {len(df.columns)}")

# Show a breakdown of the attacks
print("\n[+] Attack Vector Breakdown:")
print(df['target_service'].value_counts())

output_csv = "master_honeynet_dataset.csv"
df.to_csv(output_csv, index=False)
print(f"\n[+] Master CSV saved to: {output_csv}")