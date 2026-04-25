import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt

print("\n========================================")
print("   [*] INITIATING ML TRAINING MODEL [*]")
print("========================================")

# 1. Load the Honeypot Data (100% Malicious)
print("[+] Loading real honeypot attack data...")
df_attacks = pd.read_csv("master_honeynet_dataset.csv")
df_attacks['label'] = 1  # 1 = Attack

# 2. Generate Realistic 'Normal' Traffic
print("[+] Generating realistic 'normal' traffic baseline...")
normal_data = []

# Get the attacker IPs so we can simulate shared networks/VPNs
attacker_ips = df_attacks['source_ip'].unique()

for i in range(len(df_attacks)):
    # 80% chance of standard internal IP, 20% chance of sharing an "attacker" IP
    if np.random.rand() > 0.2:
        ip = f"192.168.1.{np.random.randint(2, 50)}"
    else:
        ip = np.random.choice(attacker_ips)

    # 90% chance of normal traffic, 10% chance of a "safe" typo/failed login
    if np.random.rand() > 0.1:
        event = "normal.traffic"
        service = np.random.choice(["HTTP_WEB", "SSH"])
    else:
        event = "failed.login.typo" # The model has to distinguish this from brute-force!
        service = "SSH"

    normal_data.append({
        "timestamp": "2026-04-24 10:00:00",
        "target_service": service,
        "event_type": event,
        "source_ip": ip,
        "username": "N/A",
        "password": "N/A",
        "payload_or_command": "N/A"
    })

df_normal = pd.DataFrame(normal_data)
df_normal['label'] = 0  # 0 = Normal/Safe

# Combine them into one master dataset
df_master = pd.concat([df_attacks, df_normal], ignore_index=True)

# 3. Feature Engineering
print("[+] Performing Feature Engineering...")
le_service = LabelEncoder()
df_master['service_code'] = le_service.fit_transform(df_master['target_service'])

le_event = LabelEncoder()
df_master['event_code'] = le_event.fit_transform(df_master['event_type'])

ip_frequencies = df_master['source_ip'].value_counts().to_dict()
df_master['ip_freq_score'] = df_master['source_ip'].map(ip_frequencies)

X = df_master[['service_code', 'event_code', 'ip_freq_score']]
y = df_master['label']

# 4. Train / Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Train the Random Forest Model
print("\n[+] Training Random Forest Classifier (Realistic Mode)...")
# We restrict the max_depth so the AI is forced to generalize, not memorize!
rf_model = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
rf_model.fit(X_train, y_train)

# 6. Evaluate the Model
print("[+] Model Training Complete! Generating Report...\n")
predictions = rf_model.predict(X_test)

print("========================================")
print("          ML PERFORMANCE REPORT         ")
print("========================================")
print(classification_report(y_test, predictions, target_names=["Normal (0)", "Attack (1)"]))

print("Confusion Matrix:")
print(confusion_matrix(y_test, predictions))
print("========================================")


importance = rf_model.feature_importances_
features = X.columns
plt.bar(features, importance, color=['#4CAF50', '#2196F3', '#FFC107'])
plt.title("Random Forest: Feature Importance for Threat Detection")
plt.ylabel("Importance Score")
plt.show()