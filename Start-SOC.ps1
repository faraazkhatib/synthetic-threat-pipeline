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

# ==========================================
# 7. AUTOMATED WAZUH AGENT RECOVERY
# ==========================================
Write-Host "`n[+] Curing Docker Amnesia: Installing Wazuh Agent cleanly on victim-laptop..." -ForegroundColor Yellow
docker exec -it victim-laptop bash -c "apt-get update && apt-get install -y curl && curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.7.3-1_amd64.deb && WAZUH_MANAGER='wazuh.manager' apt-get install -y ./wazuh-agent.deb"

Write-Host "[+] Injecting the 4-Vector Master Route XML..." -ForegroundColor Yellow
$agentConfig = @"
<ossec_config>
  <localfile>
    <log_format>json</log_format>
    <location>/var/log/shared_logs/cowrie/cowrie.json</location>
  </localfile>
  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/shared_logs/dvwa/access.log</location>
  </localfile>
  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/shared_logs/dvwa/error.log</location>
  </localfile>
  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/shared_logs/sar2html/access.log</location>
  </localfile>
  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/shared_logs/sar2html/error.log</location>
  </localfile>
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/shared_logs/vsftpd/vsftpd.log</location>
  </localfile>
</ossec_config>
"@
Set-Content -Path ".\master_logs.xml" -Value $agentConfig
docker cp .\master_logs.xml victim-laptop:/tmp/master_logs.xml

Write-Host "[+] Wiping old config, writing Master Route, and restarting Wazuh Agent..." -ForegroundColor Yellow
docker exec victim-laptop bash -c "sed -i '/<localfile>/,/<\/localfile>/d' /var/ossec/etc/ossec.conf && cat /tmp/master_logs.xml >> /var/ossec/etc/ossec.conf && service wazuh-agent restart"
Remove-Item -Path ".\master_logs.xml"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   LAB is ONLINE and STABLE.            " -ForegroundColor Green
Write-Host "   4-VECTOR ROUTE: ACTIVE               " -ForegroundColor Green
Write-Host "   Access UI at: https://localhost      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green