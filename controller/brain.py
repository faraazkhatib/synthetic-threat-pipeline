import requests
import time
import json
from datetime import datetime

# CONFIGURATION
LOKI_URL = "http://localhost:3100"  # Or "http://loki:3100" if running inside Docker
QUERY_WINDOW = 30  # Look back 30 seconds
ALERT_WEBHOOK = "" # Optional: Discord/Slack Webhook URL

# THE "BRAIN" LOGIC (Simplified GHMM)
# We define "Stages" based on what we see in the logs.
STAGES = {
    "RECON": {"threshold": 5, "keywords": ["failed", "404"]},
    "EXPLOIT": {"threshold": 1, "keywords": ["login attempt [b'root'/b'123456'] succeeded", "whoami", "wget", "curl"]},
    "LATERAL": {"threshold": 1, "keywords": ["192.168.0.", "172.18.0."]} # Internal IPs
}

def query_loki():
    # Calculate time window (nanoseconds)
    now = int(time.time() * 1e9)
    start = now - (QUERY_WINDOW * 1e9)
    
    # Query ALL honeypots
    query = '{job=~"cowrie|dvwa|vsftpd|sar2html"}'
    
    params = {
        'query': query,
        'start': str(int(start)),
        'end': str(now),
        'limit': 1000
    }
    
    try:
        # Talk to Loki
        r = requests.get(f"{LOKI_URL}/loki/api/v1/query_range", params=params)
        data = r.json()
        return data['data']['result']
    except Exception as e:
        print(f"Error connecting to Loki: {e}")
        return []

def analyze_logs(streams):
    recon_count = 0
    
    for stream in streams:
        for value in stream['values']:
            log_line = value[1] # The raw log text
            
            # --- STAGE 2: EXPLOITATION CHECK (High Priority) ---
            for keyword in STAGES["EXPLOIT"]["keywords"]:
                if keyword in log_line:
                    trigger_soar("EXPLOIT DETECTED", log_line, "CRITICAL")
                    return # Stop analyzing, we found a breach

            # --- STAGE 1: RECON CHECK (Volume based) ---
            for keyword in STAGES["RECON"]["keywords"]:
                if keyword in log_line:
                    recon_count += 1

    # If we see too much noise, it's a Recon attack
    if recon_count > STAGES["RECON"]["threshold"]:
        trigger_soar("RECONNAISSANCE SCAN", f"Detected {recon_count} failed attempts", "WARNING")

def trigger_soar(alert_type, message, severity):
    print(f"\n[SOAR ACTION] 🚨 {alert_type} ({severity})")
    print(f"Details: {message}")
    
    # HERE IS WHERE YOU ADD AUTOMATION
    # Example: Send to Discord
    # requests.post(ALERT_WEBHOOK, json={"content": f"🚨 {alert_type}: {message}"})
    
    # Example: Block IP (Future)
    # os.system(f"iptables -A INPUT -s {ip} -j DROP")

# MAIN LOOP
print("🧠 Deception Controller Started... Watching Loki...")
while True:
    logs = query_loki()
    if logs:
        analyze_logs(logs)
    time.sleep(10) # Check every 10 seconds