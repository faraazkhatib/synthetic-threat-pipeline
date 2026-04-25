import React, { useEffect, useState, useRef } from "react";
import AlertToast from "./components/AlertToast";
import AttackerProfile from "./AttackerProfile"; 
import WorldMap from "./WorldMap"; 
import "./styles.css";

const LOKI_BASE = import.meta.env.VITE_LOKI_URL || "http://localhost:3100";
const ALERT_THRESHOLD = parseInt(import.meta.env.VITE_ALERT_THRESHOLD || "30", 10);
const ALERT_WINDOW_MINUTES = parseInt(import.meta.env.VITE_ALERT_WINDOW_MINUTES || "5", 10);

// Query to get ALL relevant containers
const LOGQL = '{job=~"cowrie|dvwa|vsftpd|sar2html|suricata"}';

export default function App() {
  const [logs, setLogs] = useState([]);      
  const [count, setCount] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null);
  const pollingRef = useRef(null);

  // --- HELPER 1: Extract IP Address ---
  function getIpFromLog(line) {
    if (!line) return null;
    try {
      // 1. JSON check
      const data = JSON.parse(line);
      if (data.src_ip) return data.src_ip;
    } catch (e) { /* Not JSON */ }

    // 2. Regex for standard IP patterns
    const match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    return match ? match[0] : null;
  }

  // --- HELPER 2: Clean Up The Message (The "Messy" Fix) ---
  function formatLogMessage(line, job) {
    if (!line) return "Empty Log";

    // A. COWRIE (JSON Logs)
    if (job.includes("COWRIE")) {
      try {
        const data = JSON.parse(line);
        // Turn "cowrie.login.failed" -> "Login Failed"
        const event = data.eventid ? data.eventid.split('.').pop().replace(/_/g, ' ') : "Event";
        
        if (data.username && data.password) {
          return `Login attempt: User '${data.username}' / Pass '${data.password}'`;
        }
        if (data.message) return data.message;
        return `Event: ${event}`; 
      } catch (e) { return line; }
    }

    // B. WEB LOGS (DVWA / SAR2HTML) - Apache Format
    if (job.includes("DVWA") || job.includes("SAR2HTML")) {
      // Look for "GET /something HTTP/1.1"
      const reqMatch = line.match(/"(GET|POST|PUT|HEAD) (.*?) HTTP/);
      if (reqMatch) {
        return `Web Request: ${reqMatch[1]} ${reqMatch[2]}`;
      }
    }

    // C. VSFTPD (FTP Logs)
    if (job.includes("VSFTPD")) {
        // Clean up standard FTP logs
        if (line.includes("CONNECT:")) return "New FTP Connection";
        if (line.includes("FAIL LOGIN")) return "FTP Login Failed";
        return line.substring(line.indexOf("]") + 2) || line;
    }

    // D. Fallback: Truncate really long lines
    return line.length > 100 ? line.substring(0, 100) + "..." : line;
  }

  // --- FETCHING LOGIC ---
  function buildUrl(windowMinutes = ALERT_WINDOW_MINUTES) {
    const end = BigInt(Date.now()) * 1000000n; 
    const start = end - BigInt(windowMinutes) * 60n * 1000000000n;
    const q = encodeURIComponent(LOGQL);
    return `${LOKI_BASE}/loki/api/v1/query_range?query=${q}&limit=500&start=${start.toString()}&end=${end.toString()}`;
  }

  async function fetchLogs() {
    try {
      const url = buildUrl();
      const res = await fetch(url);
      if (!res.ok) return;
      const j = await res.json();
      
      const flattened = [];
      if (j?.data?.result) {
        j.data.result.forEach((stream) => {
          const streamLabel = stream.stream || {};
          // Normalize job name (remove numbers/junk)
          const jobName = (streamLabel.job || "unknown").toUpperCase();

          (stream.values || []).forEach(([ts, line]) => {
            flattened.push({
              ts,
              line, // Raw line for profile
              cleanMsg: formatLogMessage(line, jobName), // Pretty message for UI
              job: jobName,
              ip: getIpFromLog(line) 
            });
          });
        });
      }
      
      flattened.sort((a, b) => (a.ts > b.ts ? -1 : 1));
      setLogs(flattened);
      setCount(flattened.length);
      setAlertOpen(flattened.length >= ALERT_THRESHOLD);

    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  useEffect(() => {
    fetchLogs();
    pollingRef.current = setInterval(fetchLogs, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

  // --- BADGE COLORS ---
  const getBadgeColor = (job) => {
    if (job.includes("COWRIE")) return "#d63384"; // Pink
    if (job.includes("DVWA")) return "#0d6efd";   // Blue
    if (job.includes("SAR2HTML")) return "#fd7e14"; // Orange
    if (job.includes("VSFTPD")) return "#198754"; // Green
    return "#666"; 
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Honeynet — Global Threat Map</h1>
        <div className="meta">
          <span>Window: {ALERT_WINDOW_MINUTES}m</span>
          <span>Active Threats: {count}</span>
        </div>
      </header>

      <main>
        <WorldMap logs={logs} />

        <h3 style={{ marginTop: '20px', marginLeft: '10px', color: '#ccc' }}>Live Attack Feed</h3>
        <div className="logs-list">
          {logs.map((item, idx) => (
            <div key={idx} className="log-row" style={{ 
                padding: '10px', 
                borderBottom: '1px solid #333', 
                fontSize: '0.9rem', 
                display: 'flex', 
                alignItems: 'center',
                gap: '15px',
                fontFamily: 'monospace' 
            }}>
              
              {/* 1. Time */}
              <span style={{ color: '#666', minWidth: '80px', fontSize: '0.8rem' }}>
                {new Date(parseInt(item.ts) / 1000000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
              </span>

              {/* 2. Service Badge */}
              <span style={{ 
                backgroundColor: getBadgeColor(item.job), 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '0.7rem',
                minWidth: '80px',
                textAlign: 'center',
                fontWeight: 'bold',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)'
              }}>
                {item.job}
              </span>

              {/* 3. Attacker IP (Clickable) */}
              {item.ip ? (
                 <span 
                   style={{ color: '#00d0ff', cursor: 'pointer', fontWeight: 'bold', minWidth: '120px' }}
                   onClick={() => setSelectedIp(item.ip)}
                   title="View Attacker Profile"
                 >
                   {item.ip}
                 </span>
              ) : (
                 <span style={{ color: '#444', minWidth: '120px' }}>-</span>
              )}

              {/* 4. The Clean Message */}
              <span style={{ color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.cleanMsg}
              </span>

            </div>
          ))}
          
          {logs.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No active threats detected in the last {ALERT_WINDOW_MINUTES} minutes.
            </div>
          )}
        </div>
      </main>

      <AlertToast 
        open={alertOpen} 
        onClose={() => setAlertOpen(false)}
        count={count} 
        threshold={ALERT_THRESHOLD} 
      />

      {selectedIp && (
        <AttackerProfile 
          ip={selectedIp} 
          onClose={() => setSelectedIp(null)} 
        />
      )}
    </div>
  );
}