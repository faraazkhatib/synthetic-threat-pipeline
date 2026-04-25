Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Faraaz's Complete Lab...    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Boot the Victim/Generator Network FIRST
Write-Host "`n[+] Spinning up Victim & Generator containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.gen.yml up -d

# 2. Boot the SOC Core
Write-Host "[+] Spinning up Wazuh SOC core..." -ForegroundColor Yellow
docker-compose -f docker-compose.soc.yml up -d

# 3. Wait for the heavy Java apps to boot (Crucial!)
Write-Host "[+] Waiting 45 seconds for Wazuh Engine to boot up..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# 4. Inject the missing Filebeat Template
Write-Host "[+] Injecting Filebeat Template..." -ForegroundColor Yellow
docker exec -it wazuh.manager bash -c "curl -so /etc/filebeat/wazuh-template.json https://raw.githubusercontent.com/wazuh/wazuh/4.7/extensions/elasticsearch/7.x/wazuh-template.json && chmod go+r /etc/filebeat/wazuh-template.json"

# 5. Unlock the Database (Bulletproof File Method)
Write-Host "[+] Unlocking OpenSearch Database..." -ForegroundColor Yellow
Set-Content -Path ".\unlock.json" -Value '{"index.blocks.read_only_allow_delete": null}'
docker cp .\unlock.json wazuh.manager:/tmp/unlock.json
docker exec wazuh.manager curl -s -k -X PUT "https://wazuh.indexer:9200/_all/_settings" -u admin:admin -H "Content-Type: application/json" -d "@/tmp/unlock.json"
Remove-Item -Path ".\unlock.json"
Write-Host "" # Just for a clean new line

# 6. Restart Services
Write-Host "[+] Restarting Data Pipeline & Dashboard..." -ForegroundColor Yellow
docker exec -it wazuh.manager /etc/init.d/filebeat restart
docker restart wazuh.dashboard

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   LAB is ONLINE and STABLE.            " -ForegroundColor Green
Write-Host "   Access UI at: https://localhost      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green