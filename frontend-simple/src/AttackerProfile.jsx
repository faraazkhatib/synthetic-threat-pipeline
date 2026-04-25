import React, { useEffect, useState } from 'react';

const LOKI_URL = import.meta.env.VITE_LOKI_URL || 'http://localhost:3200';

export default function AttackerProfile({ ip, onClose }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!ip) return;
    fetchData();
  }, [ip]);

  const fetchData = async () => {
    setLoading(true);
    
    // FIX 1: Use a simple text filter instead of "| json"
    // This finds any log line containing the IP address
    const query = `{job="cowrie"} |= "${ip}"`;
    
    // Look back 24 hours
    const end = Date.now() * 1000000;
    const start = end - (24 * 60 * 60 * 1000000000); 

    try {
      const url = `${LOKI_URL}/loki/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&limit=1000`;
      const res = await fetch(url);
      const data = await res.json();
      processStats(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setLoading(false);
    }
  };

  const processStats = (lokiData) => {
    if (!lokiData.data || !lokiData.data.result) {
      setStats(null);
      setLoading(false);
      return;
    }

    const usernames = new Set();
    const passwords = new Set();
    const timestamps = [];

    // FIX 2: Parse Raw Text Logs
    // Example Log: ... login attempt [b'root'/b'123456'] failed
    const regex = /login attempt \[b'(.+?)'\/b'(.+?)'\]/;

    lokiData.data.result.forEach(stream => {
      stream.values.forEach(entry => {
        const logLine = entry[1];
        const ts = entry[0];
        
        // Extract Creds using Regex
        const match = logLine.match(regex);
        if (match) {
          usernames.add(match[1]); // Username
          passwords.add(match[2]); // Password
        }
        
        // Add timestamp
        timestamps.push(new Date(parseInt(ts) / 1000000));
      });
    });

    if (timestamps.length === 0) {
      setStats({ totalAttacks: 0 }); 
      setLoading(false);
      return;
    }

    timestamps.sort((a, b) => a - b);
    
    setStats({
      totalAttacks: timestamps.length,
      usernames: Array.from(usernames),
      passwords: Array.from(passwords),
      firstSeen: timestamps[0].toLocaleString(),
      lastSeen: timestamps[timestamps.length - 1].toLocaleString(),
      duration: timestamps.length > 1 
        ? ((timestamps[timestamps.length-1] - timestamps[0]) / 1000 / 60).toFixed(1) + " mins" 
        : "Instant"
    });
    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2>🚨 Attacker Profile: {ip}</h2>
          <button onClick={onClose} style={styles.closeBtn}>X</button>
        </div>

        {loading ? (
          <p>Analyzing Traffic...</p>
        ) : stats && stats.totalAttacks > 0 ? (
          <div style={styles.body}>
            <div style={styles.statRow}>
              <div style={styles.statBox}>
                <h3>Total Attacks</h3>
                <p style={styles.bigNumber}>{stats.totalAttacks}</p>
              </div>
              <div style={styles.statBox}>
                <h3>Activity Window</h3>
                <p>{stats.duration}</p>
                <small>{stats.firstSeen} — {stats.lastSeen}</small>
              </div>
            </div>

            <div style={styles.section}>
              <h3>Usernames Tried ({stats.usernames.length})</h3>
              <div style={styles.tagContainer}>
                {stats.usernames.map(u => <span key={u} style={styles.tag}>{u}</span>)}
              </div>
            </div>

            <div style={styles.section}>
              <h3>Passwords Tried ({stats.passwords.length})</h3>
              <div style={styles.tagContainer}>
                {stats.passwords.map(p => <span key={p} style={styles.tagRed}>{p}</span>)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <h3>No Login Attempts Found</h3>
            <p>This IP might have scanned the server but didn't try to login yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// (Keep your styles the same as before)
const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  card: { backgroundColor: '#1a1a1a', color: '#fff', padding: '20px', borderRadius: '8px', width: '500px', maxWidth: '90%', border: '1px solid #444', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' },
  body: { marginTop: '20px' },
  statRow: { display: 'flex', gap: '20px', marginBottom: '20px' },
  statBox: { flex: 1, background: '#252525', padding: '15px', borderRadius: '5px' },
  bigNumber: { fontSize: '2rem', fontWeight: 'bold', color: '#00d0ff', margin: '5px 0' },
  section: { marginBottom: '15px' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '100px', overflowY: 'auto' },
  tag: { background: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' },
  tagRed: { background: '#5a2a2a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', color: '#ffadad' }
};