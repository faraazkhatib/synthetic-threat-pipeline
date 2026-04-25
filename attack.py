import requests
import time

# The target URL of your honeypot
url = "http://localhost:5000/login"
target_user = "admin"

print(f"[*] Initiating brute force attack on {url}...")

# Fire 50 rapid login attempts
for i in range(1, 51):
    payload = {
        "username": target_user,
        "password": f"fake_password_{i}"
    }
    
    try:
        # Send the POST request exactly like a browser would
        response = requests.post(url, data=payload)
        print(f"[-] Attempt {i} | User: {target_user} | Pass: {payload['password']} | Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[!] Connection failed: {e}")
        break
        
    # Tiny 0.1s delay so we don't completely crash the small Docker container
    time.sleep(0.1)

print("[+] Attack complete. Check the Wazuh Dashboard!")